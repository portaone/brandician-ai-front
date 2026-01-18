import { useCallback, useEffect, useState } from "react";

// Google Pay types
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
  environment: "TEST" | "PRODUCTION";
}

interface GooglePayClient {
  isReadyToPay(request: IsReadyToPayRequest): Promise<{ result: boolean }>;
  loadPaymentData(request: PaymentDataRequest): Promise<PaymentData>;
}

interface IsReadyToPayRequest {
  apiVersion: number;
  apiVersionMinor: number;
  allowedPaymentMethods: PaymentMethod[];
}

interface PaymentMethod {
  type: string;
  parameters: {
    allowedAuthMethods: string[];
    allowedCardNetworks: string[];
  };
  tokenizationSpecification?: {
    type: string;
    parameters: {
      gateway: string;
      "stripe:version": string;
      "stripe:publishableKey": string;
    };
  };
}

interface PaymentDataRequest extends IsReadyToPayRequest {
  merchantInfo: {
    merchantId?: string;
    merchantName: string;
  };
  transactionInfo: {
    totalPriceStatus: string;
    totalPrice: string;
    currencyCode: string;
    countryCode: string;
  };
}

interface PaymentData {
  paymentMethodData: {
    tokenizationData: {
      token: string;
    };
  };
}

interface UseGooglePayProps {
  stripePublishableKey: string | null;
  merchantId: string | null;  // Required for PRODUCTION, optional for TEST
  merchantName?: string;
  environment?: "TEST" | "PRODUCTION";
}

interface UseGooglePayResult {
  isAvailable: boolean;
  isLoading: boolean;
  requestPayment: (amount: number, currencyCode?: string) => Promise<string | null>;
}

const baseCardPaymentMethod: PaymentMethod = {
  type: "CARD",
  parameters: {
    allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
    allowedCardNetworks: ["AMEX", "DISCOVER", "JCB", "MASTERCARD", "VISA"],
  },
};

export function useGooglePay({
  stripePublishableKey,
  merchantId,
  merchantName = "Brandician.AI",
  environment = "TEST",
}: UseGooglePayProps): UseGooglePayResult {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentsClient, setPaymentsClient] = useState<GooglePayClient | null>(null);

  // Initialize Google Pay client
  useEffect(() => {
    if (!stripePublishableKey) {
      setIsLoading(false);
      return;
    }

    const initGooglePay = async () => {
      // Wait for Google Pay script to load
      let attempts = 0;
      while (!window.google?.payments?.api && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.google?.payments?.api) {
        console.warn("Google Pay script not loaded");
        setIsLoading(false);
        return;
      }

      try {
        const client = new window.google.payments.api.PaymentsClient({
          environment,
        });

        const isReadyToPayRequest: IsReadyToPayRequest = {
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: [baseCardPaymentMethod],
        };

        const response = await client.isReadyToPay(isReadyToPayRequest);
        setIsAvailable(response.result);
        setPaymentsClient(client);
      } catch (error) {
        console.error("Error initializing Google Pay:", error);
        setIsAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    initGooglePay();
  }, [stripePublishableKey, environment]);

  const requestPayment = useCallback(
    async (amount: number, currencyCode = "USD"): Promise<string | null> => {
      if (!paymentsClient || !stripePublishableKey) {
        console.error("Google Pay not initialized");
        return null;
      }

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
          // merchantId is required for PRODUCTION, optional for TEST
          ...(environment === "PRODUCTION" && merchantId ? { merchantId } : {}),
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
        const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
        // The token is a JSON string containing the Stripe token
        return paymentData.paymentMethodData.tokenizationData.token;
      } catch (error: any) {
        if (error.statusCode === "CANCELED") {
          console.log("User cancelled Google Pay");
          return null;
        }
        console.error("Error processing Google Pay:", error);
        throw error;
      }
    },
    [paymentsClient, stripePublishableKey, merchantId, merchantName, environment]
  );

  return {
    isAvailable,
    isLoading,
    requestPayment,
  };
}
