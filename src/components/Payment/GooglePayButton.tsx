/**
 * GooglePayButton — Renders Google's official native Pay button.
 *
 * Architecture overview:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  PaymentContainer (parent)                                     │
 * │    ├── useGooglePay hook (single PaymentsClient instance)      │
 * │    │     ├── isAvailable        → show/hide GPay in method list│
 * │    │     ├── requestPayment()   → opens GPay sheet, returns    │
 * │    │     │                        Stripe token                 │
 * │    │     └── createGooglePayButton() → renders native button   │
 * │    │                                                           │
 * │    └── <GooglePayButton />  (this component)                   │
 * │          ├── Mounts the native button via createGooglePayButton│
 * │          ├── onClick triggers parent's onPaymentSubmit         │
 * │          └── Uses a ref-based callback to avoid stale closures │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Why a native button (createButton) instead of @google-pay/button-react?
 * -----------------------------------------------------------------------
 * The @google-pay/button-react package creates its own PaymentsClient
 * internally, which conflicts with the one from useGooglePay hook.
 * Using createButton() from the hook's client ensures a single client
 * handles both availability checks and payment processing.
 *
 * Why a ref-based callback?
 * -------------------------
 * Google's createButton() accepts an onClick callback at creation time.
 * Since handlePaymentSubmit depends on React state (paymentAmount, brandId,
 * etc.) that changes after the button is created, we use a ref to always
 * point to the latest callback without recreating the button.
 */

import React, { useEffect, useRef } from "react";

interface GooglePayButtonProps {
  /** Function from useGooglePay hook that creates the native Google Pay button element */
  createButton: (onClick: () => void) => HTMLElement | null;
  /** Callback invoked when the Google Pay button is clicked */
  onPaymentSubmit: () => void;
  /** Whether the Google Pay client has confirmed availability */
  isAvailable: boolean;
}

const GooglePayButton: React.FC<GooglePayButtonProps> = ({
  createButton,
  onPaymentSubmit,
  isAvailable,
}) => {
  /**
   * containerRef — DOM node where Google's native button element is mounted.
   * Google's createButton() returns a raw HTMLElement (not a React component),
   * so we must mount it imperatively via ref.
   */
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * callbackRef — Always points to the latest onPaymentSubmit.
   * Google's button is created once and its onClick is bound at creation.
   * Without this ref, the onClick would capture a stale closure and use
   * outdated paymentAmount/brandId values.
   */
  const callbackRef = useRef(onPaymentSubmit);
  callbackRef.current = onPaymentSubmit;

  /**
   * Mount the native Google Pay button when:
   * - The container DOM node is available
   * - The createButton function is ready (PaymentsClient initialized)
   * - Google Pay is confirmed available on this device/browser
   *
   * The button is recreated if createButton or isAvailable changes
   * (e.g., PaymentsClient re-initializes after config change).
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !createButton || !isAvailable) return;

    // Clear any previously mounted button (e.g., from a re-render)
    container.innerHTML = "";

    // Create Google's native button element. The onClick goes through
    // callbackRef so it always uses the latest payment handler.
    const button = createButton(() => {
      callbackRef.current();
    });

    if (button) {
      // Make Google's button fill the container dimensions
      button.style.width = "100%";
      button.style.height = "100%";
      container.appendChild(button);
    }
  }, [createButton, isAvailable]);

  return (
    <div
      ref={containerRef}
      className="flex-1"
      style={{ minHeight: 48 }}
    />
  );
};

export default GooglePayButton;
