import { CreditCard } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { backendConfig, brands } from "../../lib/api";
import { useGooglePay } from "../../hooks/useGooglePay";
import { navigateAfterProgress } from "../../lib/navigation";
import { useBrandStore } from "../../store/brand";
import BrandicianLoader from "../common/BrandicianLoader";
import ErrorScreen from "../common/ErrorScreen";
import { getAppError, messageOr } from "../../lib/errors";
import GooglePayMark from "../icons/GooglePayMark";
import PaymentAmountStep from "./PaymentAmountStep";
import PaymentMethodStep from "./PaymentMethodStep";

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
}

const PaymentContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentBrand, selectBrand, isLoading } = useBrandStore();

  // Step state (1 = amount input, 2 = payment method selection)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Payment state
  const [paymentAmount, setPaymentAmount] = useState<string>(
    () => sessionStorage.getItem("paymentAmount") || "25",
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("credit_card");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<
    PaymentMethod[]
  >([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);

  // ---------------------------------------------------------------------------
  // Google Pay configuration
  // ---------------------------------------------------------------------------
  const [stripePublishableKey, setStripePublishableKey] = useState<
    string | null
  >(null);
  const [googlePayMerchantId, setGooglePayMerchantId] = useState<
    string | null
  >(null);
  const [googlePayEnvironment, setGooglePayEnvironment] = useState<
    "TEST" | "PRODUCTION"
  >("PRODUCTION");

  const {
    isAvailable: isGooglePayAvailable,
    isLoading: isGooglePayLoading,
    requestPayment: requestGooglePayPayment,
    createGooglePayButton,
  } = useGooglePay({
    stripePublishableKey,
    merchantId: googlePayMerchantId,
    merchantName: "Brandician.AI",
    environment: googlePayEnvironment,
  });

  // Form validation and error handling
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [paymentError, setPaymentError] = useState<string | null>(null);
  // Blocking error for the initial brand load (distinct from paymentError,
  // which is an inline, retryable-on-the-same-form charge failure).
  const [loadError, setLoadError] = useState<string | null>(null);

  const isZeroAmount = paymentAmount !== "" && parseFloat(paymentAmount) === 0;

  const loadBrand = useCallback(async () => {
    if (!brandId) return;
    setLoadError(null);
    try {
      await selectBrand(brandId);
    } catch (error) {
      console.error("Failed to load brand for payment:", error);
      setLoadError(
        messageOr(
          error,
          "We couldn't load your payment details. Please try again.",
        ),
      );
    }
  }, [brandId]);

  useEffect(() => {
    if (brandId && (!currentBrand || currentBrand.id !== brandId)) {
      loadBrand();
    }
  }, [brandId, currentBrand, loadBrand]);

  // Check for payment error from URL params
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "payment_cancelled") {
      setPaymentError(
        "Your payment was cancelled. Please try a different payment method or try again.",
      );
      if (paymentAmount && !isNaN(parseFloat(paymentAmount))) {
        setCurrentStep(2);
      }
    }
  }, [searchParams]);

  // Persist payment amount to sessionStorage
  useEffect(() => {
    if (paymentAmount) {
      sessionStorage.setItem("paymentAmount", paymentAmount);
    }
  }, [paymentAmount]);

  // Load available payment methods
  useEffect(() => {
    const loadPaymentMethods = async () => {
      // First fetch config to get keys for Google Pay
      try {
        const config = await backendConfig.getConfig();
        setStripePublishableKey(config.stripe_publishable_key);
        setGooglePayMerchantId(config.google_pay_merchant_id);
        setGooglePayEnvironment(config.google_pay_environment);
      } catch (configError) {
        console.error("Failed to fetch config:", configError);
      }

      const processorToMethodId: { [key: string]: string } = {
        stripe: "credit_card",
        paypal: "paypal",
        google_pay: "google_pay",
      };

      try {
        const response = await brands.getPaymentMethods();
        const availableProcessors: string[] = response.processors || [];

        const allPaymentMethods: PaymentMethod[] = [
          {
            id: "credit_card",
            name: "Credit Card",
            icon: <CreditCard className="h-5 w-5" />,
            enabled: response.payment_methods.includes("credit_card"),
          },
          {
            id: "paypal",
            name: "PayPal",
            icon: (
              <div className="h-5 w-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                P
              </div>
            ),
            enabled: response.payment_methods.includes("paypal"),
          },
          {
            id: "google_pay",
            name: "Google Pay",
            icon: <GooglePayMark className="h-5 w-auto" />,
            enabled: response.payment_methods.includes("google_pay"),
          },
        ];

        const allowedMethodIds = availableProcessors.map(
          (p) => processorToMethodId[p.toLowerCase()],
        );
        const paymentMethods = allPaymentMethods.filter((m) =>
          allowedMethodIds.includes(m.id),
        );

        setAvailablePaymentMethods(paymentMethods);

        const firstEnabled = paymentMethods.find((method) => method.enabled);
        if (firstEnabled) {
          setSelectedPaymentMethod(firstEnabled.id);
        }
      } catch (error) {
        console.error("Failed to load payment methods:", error);
        setAvailablePaymentMethods([
          {
            id: "credit_card",
            name: "Credit Card",
            icon: <CreditCard className="h-5 w-5" />,
            enabled: true,
          },
        ]);
        setSelectedPaymentMethod("credit_card");
      } finally {
        setIsLoadingMethods(false);
      }
    };

    loadPaymentMethods();
  }, []);

  // Google Pay availability sync
  useEffect(() => {
    if (!isGooglePayLoading) {
      setAvailablePaymentMethods((prev) =>
        prev.map((method) =>
          method.id === "google_pay"
            ? { ...method, enabled: isGooglePayAvailable }
            : method,
        ),
      );
    }
  }, [isGooglePayAvailable, isGooglePayLoading]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (paymentAmount === "" || isNaN(Number(paymentAmount))) {
      newErrors.payment = "Please enter a payment amount";
    }
    if (!selectedPaymentMethod) {
      newErrors.paymentMethod = "Please select a payment method";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setPaymentAmount(e.target.value);
    setErrors({ ...errors, payment: "" });
  };

  const handleContinue = () => {
    const amount = parseFloat(paymentAmount);
    if (paymentAmount === "" || isNaN(amount)) {
      setErrors({ payment: "Please enter a payment amount" });
      return;
    }
    setErrors({});

    if (amount === 0) {
      navigate(`/brands/${brandId}/payment/share`);
      return;
    }

    setCurrentStep(2);
  };

  const handleSkipContribution = () => {
    setPaymentAmount("0");
    navigate(`/brands/${brandId}/payment/share`);
  };

  const handleBackToAmount = () => {
    setCurrentStep(1);
    setPaymentError(null);
  };

  const handlePaymentSubmit = async () => {
    if (!brandId || !validateForm()) return;
    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      if (isZeroAmount) {
        const updatedBrand = await brands.skipPayment(brandId);
        navigateAfterProgress(navigate, brandId, updatedBrand);
        return;
      }

      // Google Pay flow
      if (selectedPaymentMethod === "google_pay") {
        const amount = parseFloat(paymentAmount);
        const token = await requestGooglePayPayment(amount);

        if (!token) {
          setIsProcessingPayment(false);
          return;
        }

        await brands.processGooglePay(brandId, token, amount, "USD");
        navigate(`/brands/${brandId}/payment/google_pay/success`);
        return;
      }

      // Stripe/PayPal flow
      const paymentSession = await brands.createPaymentSession(
        brandId,
        parseFloat(paymentAmount),
        `Brand creation payment for ${currentBrand?.name || "brand"}`,
        selectedPaymentMethod,
      );
      console.log(
        "Redirecting to payment checkout:",
        paymentSession.checkout_url,
      );

      sessionStorage.setItem("paymentAmount", paymentAmount);
      window.location.href = paymentSession.checkout_url;
    } catch (error: any) {
      console.error("Payment submission failed:", error);
      const errorMessage = getAppError(
        error,
        "Failed to process payment. Please try again.",
      ).message;
      setErrors({ payment: errorMessage });
      setPaymentError(errorMessage);
      setIsProcessingPayment(false);
    }
  };

  if (loadError && !currentBrand) {
    return (
      <ErrorScreen
        error={{ message: loadError, isNetworkError: false }}
        onRetry={loadBrand}
      />
    );
  }

  if (isLoading || !currentBrand) {
    return (
      <div className="loader-container">
        <div className="flex items-center justify-center flex-col">
          <BrandicianLoader />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (currentStep === 1) {
    return (
      <PaymentAmountStep
        brandName={currentBrand.name}
        paymentAmount={paymentAmount}
        onAmountChange={handlePaymentAmountChange}
        onPresetSelect={(amount) => setPaymentAmount(amount.toString())}
        onContinue={handleContinue}
        onSkipContribution={handleSkipContribution}
        isZeroAmount={isZeroAmount}
        errors={errors}
        paymentError={paymentError}
      />
    );
  }

  return (
    <PaymentMethodStep
      brandName={currentBrand.name}
      paymentAmount={paymentAmount}
      availablePaymentMethods={availablePaymentMethods}
      selectedPaymentMethod={selectedPaymentMethod}
      onSelectPaymentMethod={setSelectedPaymentMethod}
      onBackToAmount={handleBackToAmount}
      onSubmitPayment={handlePaymentSubmit}
      isProcessingPayment={isProcessingPayment}
      isLoadingMethods={isLoadingMethods}
      isGooglePayAvailable={isGooglePayAvailable}
      createGooglePayButton={createGooglePayButton}
      paymentError={paymentError}
      errors={errors}
    />
  );
};

export default PaymentContainer;
