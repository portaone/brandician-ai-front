import { ArrowRight } from "lucide-react";
import React, { useEffect, useRef } from "react";
import Button from "../common/Button";

interface PaymentAmountStepProps {
  brandName: string;
  paymentAmount: string;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPresetSelect: (amount: number) => void;
  onContinue: () => void;
  onSkipContribution: () => void;
  isZeroAmount: boolean;
  errors: Record<string, string>;
  paymentError: string | null;
}

const PaymentAmountStep: React.FC<PaymentAmountStepProps> = ({
  brandName,
  paymentAmount,
  onAmountChange,
  onPresetSelect,
  onContinue,
  onSkipContribution,
  isZeroAmount,
  errors,
  paymentError,
}) => {
  const amountInputRef = useRef<HTMLInputElement>(null);
  const parsedAmount = parseInt(paymentAmount) || 0;

  useEffect(() => {
    if (amountInputRef.current) {
      amountInputRef.current.focus();
    }
  }, []);

  const helperText = isZeroAmount
    ? "You'll be asked to share Brandician with your network"
    : paymentAmount !== ""
      ? `Next: Choose payment method for $${parsedAmount}`
      : "";

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
          {/* Desktop padding override */}
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
              <span
                style={{
                  color: "var(--color-primary)",
                  fontWeight: 600,
                }}
              >
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

            {/* Intro text */}
            <p
              className="text-center mb-8"
              style={{
                fontSize: "var(--fs-base)",
                color: "var(--color-text)",
                lineHeight: 1.7,
              }}
            >
              Your contribution helps us keep building tools that make strategic
              branding accessible to founders everywhere.
            </p>

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
                  background: "var(--color-bg)",
                }}
              />
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: "32px",
                    height: "32px",
                    background: "var(--color-bg)",
                    color: "var(--color-light)",
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
                    color: "var(--color-light)",
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
                <p
                  style={{
                    color: "var(--color-text)",
                    fontSize: "var(--fs-sm)",
                  }}
                >
                  {paymentError}
                </p>
              </div>
            )}

            {/* Amount Section */}
            <div className="mb-10">
              <h2
                className="mb-4"
                style={{
                  fontFamily: "'Bitter', serif",
                  fontSize: "var(--fs-xl)",
                  fontWeight: 600,
                  color: "var(--color-text)",
                }}
              >
                Choose your contribution
              </h2>
              <p
                className="mb-6"
                style={{
                  fontSize: "var(--fs-sm)",
                  color: "var(--color-secondary)",
                  lineHeight: 1.6,
                }}
              >
                Any amount helps. You can also contribute $0 and share
                Brandician with your network instead.
              </p>

              {/* Amount input */}
              <div className="relative mb-5">
                <span
                  className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    left: "20px",
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontWeight: 600,
                    color: "var(--color-text)",
                  }}
                >
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={paymentAmount}
                  onChange={onAmountChange}
                  placeholder="25"
                  ref={amountInputRef}
                  className="w-full outline-none"
                  style={{
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontWeight: 600,
                    color: "var(--color-text)",
                    background: "var(--color-bg)",
                    border: `2px solid ${errors.payment ? "var(--color-primary)" : "var(--color-light)"}`,
                    borderRadius: "12px",
                    padding: "16px 20px 16px 44px",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => {
                    if (!errors.payment) {
                      e.target.style.borderColor = "var(--color-secondary)";
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.payment) {
                      e.target.style.borderColor = "var(--color-light)";
                    }
                  }}
                />
              </div>
              {errors.payment && (
                <p
                  className="-mt-3 mb-4"
                  style={{
                    fontSize: "var(--fs-sm)",
                    color: "var(--color-primary)",
                  }}
                >
                  {errors.payment}
                </p>
              )}

              {/* Preset amounts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[10, 25, 50, 100].map((amount) => {
                  const isSelected = paymentAmount === amount.toString();
                  return (
                    <button
                      key={amount}
                      onClick={() => onPresetSelect(amount)}
                      className="transition-all"
                      style={{
                        padding: "12px 16px",
                        background: isSelected
                          ? "rgba(253, 97, 94, 0.05)"
                          : "var(--color-white)",
                        border: `2px solid ${isSelected ? "var(--color-primary)" : "var(--color-bg)"}`,
                        borderRadius: "12px",
                        fontFamily: "'Source Sans 3', sans-serif",
                        fontWeight: 600,
                        color: isSelected
                          ? "var(--color-primary)"
                          : "var(--color-text)",
                        cursor: "pointer",
                      }}
                    >
                      ${amount}
                    </button>
                  );
                })}
              </div>

              {/* $0 note box */}
              {isZeroAmount && (
                <div
                  className="mb-8 p-4"
                  style={{
                    background: "rgba(127, 89, 113, 0.05)",
                    borderLeft: "4px solid var(--color-secondary)",
                    borderRadius: "8px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "var(--fs-sm)",
                      color: "var(--color-text)",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    <strong>$0 contribution?</strong> No problem. We'll ask you
                    to share Brandician on your network — that helps us reach
                    founders who need strategic branding tools.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={onContinue}
                variant="primary"
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="w-full"
              >
                Continue
              </Button>
              <Button
                onClick={onSkipContribution}
                variant="tertiary"
                className="w-full"
              >
                Skip contribution
              </Button>
            </div>

            {/* Helper text */}
            {helperText && (
              <p
                className="text-center mt-4"
                style={{
                  fontSize: "var(--fs-sm)",
                  color: "var(--color-light)",
                  fontFamily: "'Source Sans 3', sans-serif",
                }}
              >
                {helperText}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentAmountStep;
