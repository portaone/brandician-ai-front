import { AlertTriangle, CheckCircle, Clock, Loader } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import { navigateAfterProgress } from "../../lib/navigation";
import { useBrandStore } from "../../store/brand";

const MAX_RETRY_ATTEMPTS = 10;
const RETRY_DELAY_MS = 3000; // 3 seconds between retries

const PaymentSuccess: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { currentBrand, selectBrand } = useBrandStore();

  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "failed" | "pending" | "processing"
  >("pending");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Use ref to track if verification is already running to prevent duplicate runs
  const isRunningRef = useRef(false);
  const retryCountRef = useRef(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isCancelled = false;

    const verifyPayment = async (): Promise<boolean> => {
      if (!brandId) return false;

      try {
        await selectBrand(brandId);
        const updatedBrand = await brands.completePaymentFlow(brandId);

        if (!isCancelled) {
          setPaymentStatus("success");
          setTimeout(() => {
            navigateAfterProgress(navigate, brandId, updatedBrand);
          }, 2000);
        }
        return true;
      } catch (err: any) {
        console.error(
          `Payment verification attempt ${retryCountRef.current + 1} failed:`,
          err
        );

        if (err.response?.status === 402) {
          return false; // Can retry
        }

        // Final failure
        if (!isCancelled) {
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
      if (!brandId || isCancelled || isRunningRef.current) return;

      isRunningRef.current = true;
      const isDone = await verifyPayment();
      isRunningRef.current = false;

      if (isCancelled) return;

      if (!isDone && retryCountRef.current < MAX_RETRY_ATTEMPTS) {
        setPaymentStatus("processing");
        retryCountRef.current += 1;
        setRetryCount(retryCountRef.current);
        timeoutId = setTimeout(attemptVerification, RETRY_DELAY_MS);
      } else if (!isDone) {
        setPaymentStatus("failed");
        setError(
          "Payment confirmation is taking longer than expected. Please wait a few minutes and refresh this page, or contact support."
        );
        setIsVerifying(false);
      } else {
        setIsVerifying(false);
      }
    };

    attemptVerification();

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [brandId, selectBrand, navigate]);

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
          {paymentStatus === "processing" ? (
            <Clock className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          ) : (
            <Loader className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" />
          )}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {paymentStatus === "processing"
              ? "Waiting for Payment Confirmation"
              : "Verifying Payment"}
          </h2>
          <p className="text-gray-600">
            {paymentStatus === "processing"
              ? "Your payment is being processed. This may take a few moments..."
              : "Please wait while we confirm your payment..."}
          </p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-4">
              Checking payment status... (attempt {retryCount}/
              {MAX_RETRY_ATTEMPTS})
            </p>
          )}
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
