/**
 * useGooglePay — React hook for Google Pay integration via Stripe.
 *
 * This hook manages the complete Google Pay lifecycle:
 *
 * 1. INITIALIZATION
 *    - Waits for the pay.js script to load (loaded via <script> in index.html)
 *    - Creates a single PaymentsClient instance
 *    - Calls isReadyToPay() to check device/browser support
 *
 * 2. AVAILABILITY CHECK
 *    - Returns isAvailable=true if Google Pay is supported
 *    - Used by PaymentContainer to show/hide Google Pay in the method list
 *
 * 3. PAYMENT PROCESSING (requestPayment)
 *    - Builds a PaymentDataRequest with Stripe tokenization config
 *    - Calls loadPaymentData() which opens Google's payment sheet
 *    - User selects/confirms card inside Google's UI
 *    - Returns a Stripe token (JSON string) on success, null on cancel
 *
 * 4. NATIVE BUTTON (createGooglePayButton)
 *    - Uses PaymentsClient.createButton() to render Google's official button
 *    - Button shows Google branding + saved card info (Visa ****1234) in PRODUCTION
 *    - Returns an HTMLElement that must be mounted imperatively via ref
 *
 * Important: Only ONE PaymentsClient instance should exist at a time.
 * The @google-pay/button-react package creates its own client internally,
 * which conflicts with this hook. That's why we use createButton() instead.
 *
 * Google Pay API reference:
 * https://developers.google.com/pay/api/web/reference/request-objects
 *
 * Stripe tokenization reference:
 * https://developers.google.com/pay/api/web/guides/tutorial#stripe
 */

import { useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Type declarations for Google Pay JS API (window.google.payments.api)
// The pay.js script is loaded externally and attaches to window.google.
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    google?: {
      payments: {
        api: {
          PaymentsClient: new (config: GooglePayConfig) => GooglePayClient;
        };
      };
    };
  }
}

interface GooglePayConfig {
  /** TEST = sandbox (no real charges), PRODUCTION = live payments */
  environment: "TEST" | "PRODUCTION";
}

/** Options for PaymentsClient.createButton() */
interface GooglePayButtonOptions {
  onClick: () => void;
  allowedPaymentMethods: PaymentMethod[];
  buttonColor?: "default" | "black" | "white";
  buttonType?:
    | "book"
    | "buy"
    | "checkout"
    | "donate"
    | "order"
    | "pay"
    | "plain"
    | "subscribe";
  buttonRadius?: number;
  buttonSizeMode?: "static" | "fill";
}

interface GooglePayClient {
  /** Check if Google Pay is available on this device/browser */
  isReadyToPay(request: IsReadyToPayRequest): Promise<{ result: boolean }>;
  /** Open Google's payment sheet and return tokenized payment data */
  loadPaymentData(request: PaymentDataRequest): Promise<PaymentData>;
  /** Create Google's official branded button as a raw DOM element */
  createButton(options: GooglePayButtonOptions): HTMLElement;
}

interface IsReadyToPayRequest {
  apiVersion: number;
  apiVersionMinor: number;
  allowedPaymentMethods: PaymentMethod[];
}

/**
 * Describes an allowed payment method (CARD for Google Pay).
 * tokenizationSpecification is required for loadPaymentData but
 * NOT for isReadyToPay (Google docs recommend omitting it there).
 */
interface PaymentMethod {
  type: string;
  parameters: {
    /** PAN_ONLY = card number, CRYPTOGRAM_3DS = device token (Android) */
    allowedAuthMethods: string[];
    allowedCardNetworks: string[];
  };
  tokenizationSpecification?: {
    type: string;
    /** Gateway-specific params (Stripe: gateway, stripe:version, stripe:publishableKey) */
    parameters: Record<string, string>;
  };
}

interface PaymentDataRequest extends IsReadyToPayRequest {
  merchantInfo: {
    /** Required for PRODUCTION, optional for TEST */
    merchantId?: string;
    merchantName: string;
  };
  transactionInfo: {
    totalPriceStatus: string;
    /** Amount as string, e.g. "10.00" */
    totalPrice: string;
    currencyCode: string;
    countryCode: string;
  };
}

/** Response from loadPaymentData after user confirms payment */
interface PaymentData {
  paymentMethodData: {
    tokenizationData: {
      /**
       * JSON string containing the Stripe token.
       * Parse with JSON.parse() to get { id: "tok_...", type: "card", card: {...} }
       * Send this to the backend's /payments/google-pay endpoint.
       */
      token: string;
    };
  };
}

// ---------------------------------------------------------------------------
// Hook interface
// ---------------------------------------------------------------------------

interface UseGooglePayProps {
  /** Stripe publishable key (pk_test_... or pk_live_...) from backend config */
  stripePublishableKey: string | null;
  /** Google Pay merchant ID from Google Pay Business Console (required for PRODUCTION) */
  merchantId: string | null;
  /** Display name shown in Google's payment sheet (default: "Brandician.AI") */
  merchantName?: string;
  /** Google Pay environment (default: "TEST") */
  environment?: "TEST" | "PRODUCTION";
}

interface UseGooglePayResult {
  /** Whether Google Pay is available on this device/browser */
  isAvailable: boolean;
  /** Whether the availability check is still in progress */
  isLoading: boolean;
  /**
   * Opens Google's payment sheet for the given amount.
   * Returns a Stripe token string on success, null if user cancels.
   * Throws on unexpected errors.
   */
  requestPayment: (
    amount: number,
    currencyCode?: string,
  ) => Promise<string | null>;
  /**
   * Creates Google's official native Pay button as a raw HTMLElement.
   * Must be mounted via ref (not JSX). Shows Google branding and
   * saved card info (e.g. "Visa ****1234") in PRODUCTION.
   * Returns null if PaymentsClient is not yet initialized.
   */
  createGooglePayButton: (onClick: () => void) => HTMLElement | null;
}

// ---------------------------------------------------------------------------
// Shared card payment method config (used for both isReadyToPay and payment)
// ---------------------------------------------------------------------------

/**
 * Base card payment method — shared between isReadyToPay and loadPaymentData.
 * Note: tokenizationSpecification is intentionally omitted here.
 * It's added only in requestPayment() where it's needed.
 * Google recommends NOT including it in isReadyToPay requests.
 */
const baseCardPaymentMethod: PaymentMethod = {
  type: "CARD",
  parameters: {
    allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
    allowedCardNetworks: ["AMEX", "DISCOVER", "JCB", "MASTERCARD", "VISA"],
  },
};

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

export function useGooglePay({
  stripePublishableKey,
  merchantId,
  merchantName = "Brandician.AI",
  environment = "TEST",
}: UseGooglePayProps): UseGooglePayResult {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentsClient, setPaymentsClient] =
    useState<GooglePayClient | null>(null);

  // ---------------------------------------------------------------------------
  // Step 1: Initialize PaymentsClient and check availability
  //
  // Runs once when stripePublishableKey and environment are set.
  // The pay.js script is loaded asynchronously in index.html, so we poll
  // for window.google.payments.api (up to 5 seconds) before giving up.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!stripePublishableKey) {
      setIsLoading(false);
      return;
    }

    const initGooglePay = async () => {
      // Poll for the pay.js script to finish loading
      let attempts = 0;
      while (!window.google?.payments?.api && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.google?.payments?.api) {
        console.warn("[GooglePay] pay.js script not loaded after 5s");
        setIsLoading(false);
        return;
      }

      try {
        // Create the single PaymentsClient instance for this session
        const client = new window.google.payments.api.PaymentsClient({
          environment,
        });

        // Check if Google Pay is available on this device/browser.
        // This does NOT require tokenizationSpecification.
        const isReadyToPayRequest: IsReadyToPayRequest = {
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: [baseCardPaymentMethod],
        };

        const response = await client.isReadyToPay(isReadyToPayRequest);
        console.log(
          `[GooglePay] isReadyToPay: ${response.result} (env: ${environment})`,
        );
        setIsAvailable(response.result);
        setPaymentsClient(client);
      } catch (error) {
        console.error("[GooglePay] Initialization error:", error);
        setIsAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    initGooglePay();
  }, [stripePublishableKey, environment]);

  // ---------------------------------------------------------------------------
  // Step 2: requestPayment — opens Google's payment sheet
  //
  // Flow:
  // 1. Build PaymentDataRequest with Stripe tokenization config
  // 2. Call loadPaymentData() → Google shows its payment UI
  // 3. User selects card and confirms in Google's popup
  // 4. Google returns PaymentData with a Stripe token
  // 5. We extract and return the token string
  //
  // The token is a JSON string like:
  //   { "id": "tok_xxx", "type": "card", "card": { "brand": "visa", ... } }
  //
  // This is sent to POST /api/v1.0/payments/google-pay on the backend,
  // which parses it and creates a Stripe PaymentIntent.
  //
  // Note on OR_BIBED_08 errors in TEST mode:
  // Google Pay's TEST environment is known to be flaky — the first attempt
  // may fail with OR_BIBED_08 but subsequent retries succeed. This does not
  // occur in PRODUCTION with a properly registered merchant.
  // ---------------------------------------------------------------------------
  const requestPayment = useCallback(
    async (amount: number, currencyCode = "USD"): Promise<string | null> => {
      if (!paymentsClient || !stripePublishableKey) {
        console.error("[GooglePay] Cannot request payment: client not initialized");
        return null;
      }

      console.log(
        `[GooglePay] Requesting payment: $${amount.toFixed(2)} ${currencyCode}`,
      );

      // Add Stripe tokenization to the base card method.
      // This tells Google to tokenize the card via Stripe's gateway.
      const cardPaymentMethod: PaymentMethod = {
        ...baseCardPaymentMethod,
        tokenizationSpecification: {
          type: "PAYMENT_GATEWAY",
          parameters: {
            gateway: "stripe",
            "stripe:version": "2023-10-16",
            "stripe:publishableKey": stripePublishableKey,
          },
        },
      };

      const paymentDataRequest: PaymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [cardPaymentMethod],
        merchantInfo: {
          // merchantId is required for PRODUCTION. In TEST, Google ignores it.
          ...(environment === "PRODUCTION" && merchantId
            ? { merchantId }
            : {}),
          merchantName,
        },
        transactionInfo: {
          totalPriceStatus: "FINAL",
          totalPrice: amount.toFixed(2),
          currencyCode,
          countryCode: "US",
        },
      };

      try {
        // This opens Google's payment sheet (popup/overlay).
        // The user selects a card and confirms. Google handles 3DS if needed.
        const paymentData =
          await paymentsClient.loadPaymentData(paymentDataRequest);

        // Extract the Stripe token from Google's response
        const token = paymentData.paymentMethodData.tokenizationData.token;
        console.log("[GooglePay] Payment authorized, token received");
        return token;
      } catch (error: any) {
        // User clicked "Cancel" in Google's payment sheet
        if (error.statusCode === "CANCELED") {
          console.log("[GooglePay] User cancelled payment");
          return null;
        }
        // Unexpected error (network, config, OR_BIBED_*, etc.)
        console.error("[GooglePay] Payment error:", error);
        throw error;
      }
    },
    [
      paymentsClient,
      stripePublishableKey,
      merchantId,
      merchantName,
      environment,
    ],
  );

  // ---------------------------------------------------------------------------
  // Step 3: createGooglePayButton — renders Google's official branded button
  //
  // Uses PaymentsClient.createButton() which returns a raw HTMLElement.
  // This is NOT a React component — it must be mounted via a ref.
  //
  // The button automatically:
  // - Shows Google Pay branding (the "G Pay" logo)
  // - In PRODUCTION: shows the user's default card (e.g. "Visa ****1234")
  // - Handles hover/active states
  // - Respects buttonColor, buttonType, buttonRadius, buttonSizeMode
  //
  // The onClick callback is called when the button is clicked.
  // Important: this callback is bound at creation time, so use a ref
  // to avoid stale closures (see GooglePayButton component).
  // ---------------------------------------------------------------------------
  const createGooglePayButton = useCallback(
    (onClick: () => void): HTMLElement | null => {
      if (!paymentsClient) {
        console.warn("[GooglePay] Cannot create button: client not initialized");
        return null;
      }

      return paymentsClient.createButton({
        onClick,
        allowedPaymentMethods: [baseCardPaymentMethod],
        buttonColor: "black",
        buttonType: "pay",
        buttonRadius: 12, // Matches the app's btn border-radius
        buttonSizeMode: "fill", // Button fills its container width
      });
    },
    [paymentsClient],
  );

  return {
    isAvailable,
    isLoading,
    requestPayment,
    createGooglePayButton,
  };
}
