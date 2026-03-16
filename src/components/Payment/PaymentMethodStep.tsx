import { ArrowLeft, CreditCard } from "lucide-react";
import React from "react";
import Button from "../common/Button";
import BrandicianLoader from "../common/BrandicianLoader";
import GooglePayButton from "./GooglePayButton";

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface PaymentMethodStepProps {
  brandName: string;
  paymentAmount: string;
  availablePaymentMethods: PaymentMethod[];
  selectedPaymentMethod: string;
  onSelectPaymentMethod: (id: string) => void;
  onBackToAmount: () => void;
  onSubmitPayment: () => void;
  isProcessingPayment: boolean;
  isLoadingMethods: boolean;
  isGooglePayAvailable: boolean;
  createGooglePayButton: (onClick: () => void) => HTMLElement | null;
  paymentError: string | null;
  errors: Record<string, string>;
}

const PaymentMethodStep: React.FC<PaymentMethodStepProps> = ({
  brandName,
  paymentAmount,
  availablePaymentMethods,
  selectedPaymentMethod,
  onSelectPaymentMethod,
  onBackToAmount,
  onSubmitPayment,
  isProcessingPayment,
  isLoadingMethods,
  isGooglePayAvailable,
  createGooglePayButton,
  paymentError,
  errors,
}) => {
  const formattedAmount = parseFloat(paymentAmount).toFixed(2);

  return (
    <div className="min-h-screen py-8 sm:py-16">
      <div className="px-4 sm:px-10">
        <div
          className="mx-auto w-full"
          style={{
            maxWidth: "700px",
            background: "var(--color-white)",
            borderRadius: "16px",
            padding: "32px 24px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div className="sm:px-8">
            {/* Brand label */}
            <p
              className="text-center mb-2"
              style={{
                fontFamily: "'Bitter', serif",
                fontSize: "var(--fs-base)",
                color: "var(--color-text)",
              }}
            >
              Brand:{" "}
              <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                {brandName}
              </span>
            </p>

            {/* Title */}
            <h1
              className="text-center mb-5"
              style={{
                fontFamily: "'Bitter', serif",
                fontSize: "var(--fs-xxl)",
                fontWeight: 700,
                lineHeight: 1.2,
                color: "var(--color-text)",
              }}
            >
              Support Brandician
            </h1>

            {/* Step Progress */}
            <div className="flex items-center justify-center gap-4 mb-10 flex-wrap">
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: "32px",
                    height: "32px",
                    background: "var(--color-primary)",
                    color: "var(--color-white)",
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontSize: "var(--fs-base)",
                    fontWeight: 600,
                  }}
                >
                  1
                </div>
                <span
                  style={{
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontSize: "var(--fs-base)",
                    fontWeight: 500,
                    color: "var(--color-text)",
                  }}
                >
                  Choose Amount
                </span>
              </div>
              <div
                style={{
                  width: "40px",
                  height: "2px",
                  background: "var(--color-primary)",
                }}
              />
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: "32px",
                    height: "32px",
                    background: "var(--color-primary)",
                    color: "var(--color-white)",
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontSize: "var(--fs-base)",
                    fontWeight: 600,
                  }}
                >
                  2
                </div>
                <span
                  style={{
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontSize: "var(--fs-base)",
                    fontWeight: 500,
                    color: "var(--color-text)",
                  }}
                >
                  Payment
                </span>
              </div>
            </div>

            {/* Payment Error Alert */}
            {paymentError && (
              <div
                className="mb-6 p-4 rounded-lg"
                style={{
                  background: "rgba(244, 195, 67, 0.1)",
                  border: "1px solid rgba(244, 195, 67, 0.3)",
                }}
              >
                <p style={{ color: "var(--color-text)", fontSize: "var(--fs-sm)" }}>
                  {paymentError}
                </p>
              </div>
            )}

            {/* Amount Summary */}
            <div
              className="mb-8 p-4 rounded-xl flex items-center justify-between"
              style={{
                background: "rgba(253, 97, 94, 0.05)",
                border: "1px solid rgba(253, 97, 94, 0.2)",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "var(--fs-sm)",
                    color: "var(--color-secondary)",
                    margin: 0,
                  }}
                >
                  Your contribution amount
                </p>
                <p
                  style={{
                    fontSize: "var(--fs-xl)",
                    fontWeight: 700,
                    color: "var(--color-primary)",
                    margin: 0,
                    fontFamily: "'Source Sans 3', sans-serif",
                  }}
                >
                  ${formattedAmount}
                </p>
              </div>
              <button
                onClick={onBackToAmount}
                style={{
                  fontSize: "var(--fs-sm)",
                  color: "var(--color-secondary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontFamily: "'Source Sans 3', sans-serif",
                }}
              >
                Change amount
              </button>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-8">
              <h2
                className="mb-4"
                style={{
                  fontFamily: "'Bitter', serif",
                  fontSize: "var(--fs-xl)",
                  fontWeight: 600,
                  color: "var(--color-text)",
                }}
              >
                Select Payment Method
              </h2>

              {isLoadingMethods ? (
                <div className="flex items-center justify-center py-4 gap-3">
                  <BrandicianLoader />
                  <span
                    style={{
                      color: "var(--color-light)",
                      fontSize: "var(--fs-sm)",
                    }}
                  >
                    Loading payment methods...
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {availablePaymentMethods.map((method) => {
                    const isSelected = selectedPaymentMethod === method.id;
                    return (
                      <label
                        key={method.id}
                        className="flex items-center cursor-pointer transition-all"
                        style={{
                          padding: "16px",
                          background: isSelected
                            ? "rgba(253, 97, 94, 0.05)"
                            : "var(--color-white)",
                          border: `2px solid ${
                            !method.enabled
                              ? "var(--color-bg)"
                              : isSelected
                                ? "var(--color-primary)"
                                : "var(--color-bg)"
                          }`,
                          borderRadius: "12px",
                          opacity: method.enabled ? 1 : 0.6,
                          cursor: method.enabled
                            ? "pointer"
                            : "not-allowed",
                        }}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={isSelected}
                          onChange={(e) =>
                            onSelectPaymentMethod(e.target.value)
                          }
                          disabled={!method.enabled}
                          className="sr-only"
                        />
                        <div className="flex items-center">
                          {method.icon}
                          <span
                            className="ml-3"
                            style={{
                              fontFamily: "'Source Sans 3', sans-serif",
                              fontWeight: 500,
                              fontSize: "var(--fs-md)",
                              color: "var(--color-text)",
                            }}
                          >
                            {method.name}
                          </span>
                          {!method.enabled && (
                            <span
                              className="ml-2"
                              style={{
                                fontSize: "var(--fs-sm)",
                                color: "var(--color-light)",
                              }}
                            >
                              (Not available)
                            </span>
                          )}
                        </div>
                        {isSelected && method.enabled && (
                          <div className="ml-auto">
                            <div
                              className="flex items-center justify-center rounded-full"
                              style={{
                                width: "16px",
                                height: "16px",
                                background: "var(--color-primary)",
                              }}
                            >
                              <div
                                className="rounded-full"
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  background: "var(--color-white)",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </label>
                    );
                  })}
                  {errors.paymentMethod && (
                    <p
                      style={{
                        fontSize: "var(--fs-sm)",
                        color: "var(--color-primary)",
                        marginTop: "4px",
                      }}
                    >
                      {errors.paymentMethod}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <Button
                  onClick={onBackToAmount}
                  variant="secondary"
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                  className="flex-1"
                >
                  Back
                </Button>

                {selectedPaymentMethod === "google_pay" &&
                isGooglePayAvailable ? (
                  <GooglePayButton
                    createButton={createGooglePayButton}
                    onPaymentSubmit={onSubmitPayment}
                    isAvailable={isGooglePayAvailable}
                  />
                ) : (
                  <Button
                    onClick={onSubmitPayment}
                    disabled={isProcessingPayment || !selectedPaymentMethod}
                    loading={isProcessingPayment}
                    leftIcon={
                      !isProcessingPayment ? (
                        <CreditCard className="h-4 w-4" />
                      ) : undefined
                    }
                    className="flex-1"
                  >
                    {isProcessingPayment
                      ? "Processing..."
                      : `Pay $${formattedAmount}`}
                  </Button>
                )}
              </div>

              <p
                className="text-center"
                style={{
                  fontSize: "var(--fs-sm)",
                  color: "var(--color-light)",
                  fontFamily: "'Source Sans 3', sans-serif",
                  marginTop: "8px",
                }}
              >
                Secure payment processing &bull; Your download will be available
                immediately after payment
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodStep;
