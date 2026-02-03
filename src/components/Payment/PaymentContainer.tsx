import { AlertCircle, Copy, CreditCard } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { backendConfig, brands } from "../../lib/api";
import { useGooglePay } from "../../hooks/useGooglePay";
import { navigateAfterProgress } from "../../lib/navigation";
import { useBrandStore } from "../../store/brand";
import Button from "../common/Button";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import BrandicianLoader from "../common/BrandicianLoader";

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

  // Payment state
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("credit_card");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<
    PaymentMethod[]
  >([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);

  // Config state for Google Pay
  const [stripePublishableKey, setStripePublishableKey] = useState<
    string | null
  >(null);
  const [googlePayMerchantId, setGooglePayMerchantId] = useState<string | null>(
    null
  );
  const [googlePayEnvironment, setGooglePayEnvironment] = useState<
    "TEST" | "PRODUCTION"
  >("PRODUCTION");

  // Initialize Google Pay hook
  const {
    isAvailable: isGooglePayAvailable,
    isLoading: isGooglePayLoading,
    requestPayment: requestGooglePayPayment,
  } = useGooglePay({
    stripePublishableKey,
    merchantId: googlePayMerchantId,
    merchantName: "Brandician.AI",
    environment: googlePayEnvironment,
  });

  // Form validation and error handling
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Social sharing state for zero-amount
  const [sharedNetworks, setSharedNetworks] = useState<{
    [key: string]: boolean;
  }>({
    facebook: false,
    linkedin: false,
    twitter: false,
    other: false,
  });
  const shareText =
    "I have just created a branding for my new business idea using Brandician.AI and it was awesome! AI-powered tool analyzes your business idea, suggests the brand archetype, generates brand assets, etc. Visit https://brandician.ai/ to create a brand for your idea!";
  const atLeastOneShared = Object.values(sharedNetworks).some(Boolean);
  const isZeroAmount = paymentAmount !== "" && parseFloat(paymentAmount) === 0;
  // Allow proceeding with zero amount - social sharing is optional, not required
  const canProceed =
    paymentAmount !== "" && !isNaN(parseFloat(paymentAmount)) && parseFloat(paymentAmount) >= 0;

  // Ref for amount input
  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (brandId && (!currentBrand || currentBrand.id !== brandId)) {
      selectBrand(brandId);
    }
  }, [brandId, currentBrand, selectBrand]);

  // Check for payment error from URL params
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "payment_cancelled") {
      setPaymentError(
        "Your payment was cancelled. Please try a different payment method or try again."
      );
    }
  }, [searchParams]);

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

      // Map processor names to payment method IDs
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
            icon: (
              <div className="h-5 w-5 bg-green-500 rounded text-white text-xs flex items-center justify-center font-bold">
                G
              </div>
            ),
            enabled: response.payment_methods.includes("google_pay"),
          },
        ];

        // Filter methods based on available processors from backend
        const allowedMethodIds = availableProcessors.map(
          (p) => processorToMethodId[p.toLowerCase()]
        );
        const paymentMethods = allPaymentMethods.filter((m) =>
          allowedMethodIds.includes(m.id)
        );

        setAvailablePaymentMethods(paymentMethods);

        // Set default to first enabled method
        const firstEnabled = paymentMethods.find((method) => method.enabled);
        if (firstEnabled) {
          setSelectedPaymentMethod(firstEnabled.id);
        }
      } catch (error) {
        console.error("Failed to load payment methods:", error);
        // Fallback to credit card
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

  // Update Google Pay availability when the hook finishes checking
  useEffect(() => {
    if (!isGooglePayLoading) {
      setAvailablePaymentMethods((prev) =>
        prev.map((method) =>
          method.id === "google_pay"
            ? { ...method, enabled: isGooglePayAvailable }
            : method
        )
      );
    }
  }, [isGooglePayAvailable, isGooglePayLoading]);

  useEffect(() => {
    if (amountInputRef.current) {
      amountInputRef.current.focus();
    }
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    // Accept zero as valid
    if (paymentAmount === "" || isNaN(Number(paymentAmount))) {
      newErrors.payment = "Please enter a payment amount";
    }
    if (!selectedPaymentMethod) {
      newErrors.paymentMethod = "Please select a payment method";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentSubmit = async () => {
    if (!brandId || !validateForm()) return;
    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      if (isZeroAmount) {
        // Use dedicated skip-payment endpoint for zero-amount contributions
        // This creates a proper payment record and progresses status securely
        const updatedBrand = await brands.skipPayment(brandId);
        navigateAfterProgress(navigate, brandId, updatedBrand);
        return;
      }

      // Handle Google Pay separately using Google Pay JS API
      if (selectedPaymentMethod === "google_pay") {
        const amount = parseFloat(paymentAmount);
        const token = await requestGooglePayPayment(amount);

        if (!token) {
          // User cancelled Google Pay
          setIsProcessingPayment(false);
          return;
        }

        // Process the Google Pay token on backend
        const updatedBrand = await brands.processGooglePay(
          brandId,
          token,
          amount,
          "USD"
        );
        navigateAfterProgress(navigate, brandId, updatedBrand);
        return;
      }

      // Create payment session with the backend for other payment methods
      const paymentSession = await brands.createPaymentSession(
        brandId,
        parseFloat(paymentAmount),
        `Brand creation payment for ${currentBrand?.name || "brand"}`,
        selectedPaymentMethod
      );
      // Redirect to payment processor checkout (no popup - avoids blocker issues)
      console.log(
        "Redirecting to payment checkout:",
        paymentSession.checkout_url
      );

      // Direct redirect - no popup blockers, cleaner UX
      // PayPal will redirect back to success/cancel URLs configured in backend
      window.location.href = paymentSession.checkout_url;
    } catch (error: any) {
      console.error("Payment submission failed:", error);
      const errorMessage =
        error?.response?.data?.detail ||
        "Failed to process payment. Please try again.";
      setErrors({ payment: errorMessage });
      setPaymentError(errorMessage);
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPaymentAmount(e.target.value);
    setErrors({ ...errors, payment: "" });
  };

  const handleCheckboxChange = (network: string) => {
    setSharedNetworks((prev) => ({ ...prev, [network]: !prev[network] }));
  };

  const handleCopyShareText = () => {
    navigator.clipboard.writeText(shareText);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-2 sm:p-4 md:p-8">
            <div className="text-center mb-8">
              <CreditCard className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <div className="flex sm:justify-between flex-wrap gap-2 items-center mb-4">
                <div className="flex-1 hidden sm:block"></div>
                <h1 className="text-3xl font-display font-bold text-neutral-800 flex-1 text-center">
                  Support Our Mission
                </h1>
                <div className="flex-1 flex flex-wrap sm:justify-end gap-3">
                  {brandId && (
                    <HistoryButton
                      brandId={brandId}
                      variant="outline"
                      size="md"
                    />
                  )}
                  <GetHelpButton variant="secondary" size="md" />
                </div>
              </div>
              <p className="text-lg text-neutral-600 mb-6">
                Your brand <strong>{currentBrand.name}</strong> is ready! We ask
                for a contribution based on the value we've provided.
              </p>
            </div>

            <div className="space-y-8">
              {/* Payment Error Alert */}
              {paymentError && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                    <p className="text-orange-800">{paymentError}</p>
                  </div>
                </div>
              )}

              {/* Payment Method Selection */}
              <div>
                <h2 className="text-xl font-semibold text-neutral-800 mb-4">
                  Payment Method
                </h2>
                {isLoadingMethods ? (
                  <div className="flex items-center justify-center py-4">
                    <BrandicianLoader />
                    <span className="text-gray-600">
                      Loading payment methods...
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availablePaymentMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                          method.enabled
                            ? selectedPaymentMethod === method.id
                              ? "border-primary-500 bg-primary-50"
                              : "border-gray-300 hover:border-gray-400"
                            : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={selectedPaymentMethod === method.id}
                          onChange={(e) =>
                            setSelectedPaymentMethod(e.target.value)
                          }
                          disabled={!method.enabled}
                          className="sr-only"
                        />
                        <div className="flex items-center">
                          {method.icon}
                          <span className="ml-3 font-medium text-gray-900">
                            {method.name}
                          </span>
                          {!method.enabled && (
                            <span className="ml-2 text-xs text-gray-500">
                              (Not available)
                            </span>
                          )}
                        </div>
                        {selectedPaymentMethod === method.id &&
                          method.enabled && (
                            <div className="ml-auto">
                              <div className="h-4 w-4 rounded-full bg-primary-600 flex items-center justify-center">
                                <div className="h-2 w-2 rounded-full bg-white" />
                              </div>
                            </div>
                          )}
                      </label>
                    ))}
                    {errors.paymentMethod && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.paymentMethod}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Amount Section */}
              <div>
                <h2 className="text-xl font-semibold text-neutral-800 mb-4">
                  Choose Your Contribution
                </h2>
                <p className="text-neutral-600 mb-4">
                  We ask for a contribution of <strong>any amount</strong> based
                  on the value we've added to your brand's future success. Your
                  support helps us cover AI costs and continue developing new
                  features for entrepreneurs like you.
                  <br />
                  Yes, the amount can even be zero! If you absolutely cannot
                  contribute now, please enter <strong>0</strong> in the Amount
                  field and spread the word about us in as many as possible of
                  your favorite social networks.
                </p>

                <div className="mb-4">
                  <label
                    htmlFor="payment"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Contribution Amount ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      id="payment"
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentAmount}
                      onChange={handlePaymentAmountChange}
                      className={`w-full pl-8 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.payment ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Enter amount"
                      ref={amountInputRef}
                    />
                  </div>
                  {errors.payment && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.payment}
                    </p>
                  )}
                </div>

                {/* Suggested amounts */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {[10, 25, 50, 100].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setPaymentAmount(amount.toString())}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      ${amount}
                    </button>
                  ))}
                </div>

                {/* Zero-amount sharing flow */}
                {isZeroAmount && (
                  <div className="mb-6 p-6 bg-blue-50 border-2 border-blue-300 rounded-lg text-center">
                    <div className="text-xl font-bold text-blue-900 mb-4">
                      <p>
                        It is ok to pay nothing - sometimes the cash situation
                        is tight. But can you then please do a thing, that will
                        not cost you anything - but will help Brandician and our
                        customers?
                      </p>
                      <p>
                        Please share the text below (or your own wording) on as
                        many as possible of your favorite social networks.
                      </p>
                    </div>
                    <div className="mb-4 mt-4">
                      <div className="font-semibold text-lg mb-2">
                        Yes, I shared it on:
                      </div>
                      <div className="flex flex-wrap justify-center gap-6">
                        <label className="flex items-center gap-2 text-lg">
                          <input
                            type="checkbox"
                            checked={sharedNetworks.facebook}
                            onChange={() => handleCheckboxChange("facebook")}
                          />
                          Facebook
                        </label>
                        <label className="flex items-center gap-2 text-lg">
                          <input
                            type="checkbox"
                            checked={sharedNetworks.linkedin}
                            onChange={() => handleCheckboxChange("linkedin")}
                          />
                          LinkedIn
                        </label>
                        <label className="flex items-center gap-2 text-lg">
                          <input
                            type="checkbox"
                            checked={sharedNetworks.twitter}
                            onChange={() => handleCheckboxChange("twitter")}
                          />
                          Twitter(X)
                        </label>
                        <label className="flex items-center gap-2 text-lg">
                          <input
                            type="checkbox"
                            checked={sharedNetworks.other}
                            onChange={() => handleCheckboxChange("other")}
                          />
                          Other
                        </label>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded p-4 mb-2 text-left max-w-2xl mx-auto">
                      <div className="mb-2 text-gray-700">Share this text:</div>
                      <div className="font-mono text-base text-gray-900 mb-2 whitespace-pre-line">
                        {shareText}
                      </div>
                      <Button
                        onClick={handleCopyShareText}
                        leftIcon={<Copy className="h-4 w-4" />}
                        variant="secondary"
                      >
                        Copy to Clipboard
                      </Button>
                    </div>
                  </div>
                )}

                {/* Always show share text section below suggested amounts, outside zero-amount block */}
                {!isZeroAmount && (
                  <div className="bg-white border border-gray-200 rounded p-4 mb-6 text-left max-w-2xl mx-auto">
                    <div className="mb-2 text-gray-700 font-semibold">
                      Share this text on social networks:
                    </div>
                    <div className="font-mono text-base text-gray-900 mb-2 whitespace-pre-line">
                      {shareText}
                    </div>
                    <Button
                      onClick={handleCopyShareText}
                      leftIcon={<Copy className="h-4 w-4" />}
                    >
                      Copy to Clipboard
                    </Button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="border-t pt-6">
                <Button
                  onClick={handlePaymentSubmit}
                  disabled={isProcessingPayment || !canProceed}
                  loading={isProcessingPayment}
                  leftIcon={
                    !isProcessingPayment ? (
                      <CreditCard className="h-5 w-5" />
                    ) : undefined
                  }
                  className="w-full"
                >
                  {isProcessingPayment
                    ? "Processing..."
                    : isZeroAmount
                    ? "Proceed without payment"
                    : "Proceed to Secure Payment"}
                </Button>

                <p className="text-xs text-gray-500 text-center mt-2">
                  {isZeroAmount
                    ? "Your download will be available immediately"
                    : "Secure payment processing • Your download will be available immediately after payment"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentContainer;
