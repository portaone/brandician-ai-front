import { AlertTriangle, CheckCircle, Loader } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import { navigateAfterProgress } from "../../lib/navigation";
import { useBrandStore } from "../../store/brand";

const MAX_RETRY_ATTEMPTS = 20;
const RETRY_DELAY_MS = 10000; // 10 seconds between retries (200 seconds total)

const PaymentSuccess: React.FC = () => {
  // processor is part of the URL path (stripe/paypal) but not currently used in this component
  const { brandId } = useParams<{ brandId: string; processor: string }>();
  const navigate = useNavigate();
  const { currentBrand, selectBrand } = useBrandStore();

  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "failed" | "pending" | "processing"
  >("pending");
  const [error, setError] = useState<string | null>(null);

  // Use ref to track if verification is already running to prevent duplicate runs
  const isRunningRef = useRef(false);
  const retryCountRef = useRef(0);
  // Track cancellation via ref so we can reset it properly
  const isCancelledRef = useRef(false);
  // Store timeout ID in ref for cleanup
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  // Store functions in refs to prevent effect re-runs
  const selectBrandRef = useRef(selectBrand);
  const navigateRef = useRef(navigate);
  selectBrandRef.current = selectBrand;
  navigateRef.current = navigate;

  useEffect(() => {
    const verifyPayment = async (): Promise<boolean> => {
      if (!brandId) return false;

      try {
        await selectBrandRef.current(brandId);
        const updatedBrand = await brands.completePaymentFlow(brandId);

        console.log("Payment flow completed, brand data:", updatedBrand);
        console.log("Brand current_status:", updatedBrand?.current_status);
        console.log("Brand payment_complete:", updatedBrand?.payment_complete);

        // Verify payment_complete is set (webhook has been processed)
        if (updatedBrand?.payment_complete === null || updatedBrand?.payment_complete === undefined) {
          console.log("payment_complete not set yet, retrying...");
          return false; // Retry - webhook hasn't been processed yet
        }

        // Update state to show success UI (check cancellation first)
        if (!isCancelledRef.current) {
          setPaymentStatus("success");
          setIsVerifying(false);
        }

        // Navigate after delay to show success message - use window.setTimeout
        // to avoid React cleanup issues
        window.setTimeout(() => {
          console.log("Navigating to completed page");
          navigateAfterProgress(navigateRef.current, brandId, updatedBrand);
        }, 2500);

        return true;
      } catch (err: any) {
        console.error(
          `Payment verification attempt ${retryCountRef.current + 1} failed:`,
          err
        );

        if (err.response?.status === 402) {
          return false; // Can retry
        }

        // Final failure - only update state if not cancelled
        if (!isCancelledRef.current) {
          setPaymentStatus("failed");
          if (err.response?.status === 403) {
            setError(
              "No payment session found. Please complete the payment flow first."
            );
          } else if (err.response?.status === 400) {
            setError(
              err.response?.data?.detail ||
                "Brand is not ready for payment completion."
            );
          } else {
            setError(
              "Failed to verify payment. Please contact support if you completed payment."
            );
          }
        }
        return true; // Stop retrying
      }
    };

    const attemptVerification = async () => {
      console.log(`attemptVerification called: brandId=${brandId}, isCancelled=${isCancelledRef.current}, isRunning=${isRunningRef.current}, retryCount=${retryCountRef.current}`);

      if (!brandId || isCancelledRef.current || isRunningRef.current) {
        console.log("Skipping attempt - conditions not met");
        return;
      }

      isRunningRef.current = true;
      const isDone = await verifyPayment();
      isRunningRef.current = false;

      console.log(`verifyPayment returned: isDone=${isDone}, retryCount=${retryCountRef.current}, max=${MAX_RETRY_ATTEMPTS}, isCancelled=${isCancelledRef.current}`);

      // Don't schedule retry if cancelled (component unmounted)
      if (!isDone && !isCancelledRef.current && retryCountRef.current < MAX_RETRY_ATTEMPTS) {
        if (!isCancelledRef.current) {
          setPaymentStatus("processing");
          retryCountRef.current += 1;
        }
        console.log(`Scheduling retry ${retryCountRef.current} in ${RETRY_DELAY_MS}ms`);
        timeoutIdRef.current = setTimeout(attemptVerification, RETRY_DELAY_MS);
      } else if (!isDone && !isCancelledRef.current) {
        console.log("Max retries reached, failing");
        setPaymentStatus("failed");
        setError(
          "Payment confirmation is taking longer than expected. Please wait a few minutes and refresh this page, or contact support."
        );
        setIsVerifying(false);
      } else if (isDone) {
        console.log("Verification complete");
        if (!isCancelledRef.current) {
          setIsVerifying(false);
        }
      }
    };

    // Reset cancellation flag when effect runs (important for React Strict Mode)
    isCancelledRef.current = false;

    // If already running, don't start another - the existing one will continue
    if (isRunningRef.current) {
      console.log("Verification already running, skipping duplicate start");
      return;
    }

    attemptVerification();

    return () => {
      console.log("Cleanup called - setting isCancelled to true");
      isCancelledRef.current = true;
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  const handleReturnToPayment = () => {
    if (brandId) {
      navigate(`/brands/${brandId}/payment`);
    }
  };

  const handleContactSupport = () => {
    // In a real app, this would open a support chat or redirect to support page
    window.open("mailto:support@brandician.ai?subject=Payment Issue", "_blank");
  };

  if (isVerifying || paymentStatus === "processing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Loader className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verifying Payment
          </h2>
          <p className="text-gray-600">
            Please wait while we confirm your payment...
          </p>
        </div>
      </div>
    );
  }

  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Successful! 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for your contribution! Your brand{" "}
            <strong>{currentBrand?.name}</strong> is now complete.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting you to download your brand assets...
          </p>
          <div className="mt-4">
            <div className="animate-pulse h-2 bg-green-200 rounded-full">
              <div
                className="h-2 bg-green-500 rounded-full"
                style={{ width: "60%" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Payment failed or error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Issue</h2>
        <p className="text-gray-600 mb-6">
          {error || "There was an issue processing your payment."}
        </p>

        <div className="space-y-3">
          <button
            onClick={handleReturnToPayment}
            className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            Try Payment Again
          </button>

          <button
            onClick={handleContactSupport}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Contact Support
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          If you've already paid, please wait a few minutes and refresh this
          page.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
