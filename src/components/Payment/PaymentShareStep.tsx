import { ArrowRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import { navigateAfterProgress } from "../../lib/navigation";
import { useBrandStore } from "../../store/brand";
import Button from "../common/Button";
import BrandicianLoader from "../common/BrandicianLoader";

const PaymentShareStep: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { currentBrand, selectBrand, isLoading } = useBrandStore();

  const [shareUrl, setShareUrl] = useState("");
  const [isLoadingLink, setIsLoadingLink] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (brandId && (!currentBrand || currentBrand.id !== brandId)) {
      selectBrand(brandId);
    }
  }, [brandId, currentBrand, selectBrand]);

  // Generate guest token for share URL
  useEffect(() => {
    const generateShareLink = async () => {
      if (!brandId) return;
      setIsLoadingLink(true);
      try {
        const data = await brands.getGuestToken(brandId);
        const baseUrl = window.location.origin;
        setShareUrl(`${baseUrl}/completed?token=${data.access_token}`);
      } catch (err) {
        console.error("Failed to generate share link:", err);
        setLinkError("Could not generate share link");
      } finally {
        setIsLoadingLink(false);
      }
    };
    generateShareLink();
  }, [brandId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const input =
        document.querySelector<HTMLInputElement>("#brandHubLinkInput");
      if (input) {
        input.select();
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    }
  };

  const handleShareOn = (platform: string) => {
    const text =
      "I just used Brandician.AI to build my brand strategy. Agency-level thinking, without the agency price. Check it out:";
    const url = "https://brandician.ai";

    let shareUrlTarget: string;
    switch (platform) {
      case "linkedin":
        shareUrlTarget = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case "twitter":
        shareUrlTarget = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case "facebook":
        shareUrlTarget = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      default:
        return;
    }

    window.open(shareUrlTarget, "_blank", "width=600,height=400");
    setShared(true);
    setTimeout(() => setShared(false), 3000);
  };

  const handleProceed = async () => {
    if (!brandId) return;
    setIsProcessing(true);
    try {
      const updatedBrand = await brands.skipPayment(brandId);
      navigateAfterProgress(navigate, brandId, updatedBrand);
    } catch (error) {
      console.error("Failed to skip payment:", error);
      setIsProcessing(false);
    }
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
    <div className="min-h-screen py-8 sm:py-16 flex items-center justify-center">
      <div className="px-4 sm:px-10 w-full">
        <div
          className="mx-auto w-full"
          style={{
            maxWidth: "800px",
            background: "var(--color-white)",
            borderRadius: "16px",
            padding: "32px 24px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div className="sm:px-8">
            {/* Brand label */}
            <p
              className="text-center mb-4"
              style={{
                fontFamily: "'Bitter', serif",
                fontSize: "var(--fs-base)",
                color: "var(--color-text)",
              }}
            >
              Brand:{" "}
              <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                {currentBrand.name}
              </span>
            </p>

            {/* Title */}
            <h1
              className="text-center mb-5"
              style={{
                fontFamily: "'Bitter', serif",
                fontSize: "var(--fs-xl)",
                fontWeight: 700,
                lineHeight: 1.2,
                color: "var(--color-text)",
              }}
            >
              Help others build better brands
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
              Brandician stays accessible so founders and small teams can build
              clear, credible brands without agency budgets.
            </p>

            {/* What you gain */}
            <div
              className="mb-6 p-5 rounded-lg"
              style={{
                background: "rgba(253, 97, 94, 0.05)",
                borderLeft: "4px solid var(--color-primary)",
              }}
            >
              <h2
                className="mb-3"
                style={{
                  fontFamily: "'Bitter', serif",
                  fontSize: "var(--fs-md)",
                  fontWeight: 600,
                  color: "var(--color-text)",
                }}
              >
                What you gain
              </h2>
              <p
                style={{
                  fontSize: "var(--fs-base)",
                  lineHeight: 1.6,
                  color: "var(--color-text)",
                  margin: 0,
                }}
              >
                A live Brand Hub you can share with your team, designers, or
                partners. Always up to date. No scattered files or outdated
                PDFs.
              </p>
            </div>

            {/* How you help */}
            <div
              className="mb-10 p-5 rounded-lg"
              style={{
                background: "rgba(253, 97, 94, 0.05)",
                borderLeft: "4px solid var(--color-primary)",
              }}
            >
              <h2
                className="mb-3"
                style={{
                  fontFamily: "'Bitter', serif",
                  fontSize: "var(--fs-md)",
                  fontWeight: 600,
                  color: "var(--color-text)",
                }}
              >
                How you help
              </h2>
              <p
                style={{
                  fontSize: "var(--fs-base)",
                  lineHeight: 1.6,
                  color: "var(--color-text)",
                  margin: 0,
                }}
              >
                Share your Brand Hub or mention Brandician. It helps other
                founders discover a more thoughtful way to build their brand.
              </p>
            </div>

            {/* Share your Brand Hub */}
            <div className="mb-8">
              <h2
                className="text-center mb-4"
                style={{
                  fontFamily: "'Bitter', serif",
                  fontSize: "var(--fs-md)",
                  fontWeight: 600,
                  color: "var(--color-text)",
                }}
              >
                Share your Brand Hub
              </h2>
              <p
                className="text-center mb-4"
                style={{
                  fontSize: "var(--fs-sm)",
                  color: "var(--color-secondary)",
                  fontFamily: "'Source Sans 3', sans-serif",
                }}
              >
                Your Brand Hub has a shareable link. Anyone with the link can
                view your brand strategy and guidelines.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <input
                  id="brandHubLinkInput"
                  type="text"
                  readOnly
                  value={
                    isLoadingLink ? "Generating link..." : linkError || shareUrl
                  }
                  className="flex-1 outline-none"
                  style={{
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontSize: "var(--fs-md)",
                    color: "var(--color-text)",
                    background: "var(--color-bg)",
                    border: "2px solid var(--color-light)",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--color-secondary)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--color-light)";
                  }}
                />
                <button
                  onClick={handleCopyLink}
                  disabled={isLoadingLink || !!linkError}
                  className="flex items-center justify-center gap-2 transition-all whitespace-nowrap"
                  style={{
                    padding: "12px 20px",
                    background: "var(--color-secondary)",
                    color: "var(--color-white)",
                    border: "none",
                    borderRadius: "12px",
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontSize: "var(--fs-md)",
                    fontWeight: 600,
                    cursor:
                      isLoadingLink || linkError ? "not-allowed" : "pointer",
                    opacity: isLoadingLink || linkError ? 0.6 : 1,
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  Copy Link
                </button>
              </div>

              {copied && (
                <p
                  className="text-center"
                  style={{
                    fontSize: "var(--fs-sm)",
                    color: "var(--color-primary)",
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Link copied!
                </p>
              )}
            </div>

            {/* Share on social */}
            <div className="mb-8">
              <h2
                className="text-center mb-4"
                style={{
                  fontFamily: "'Bitter', serif",
                  fontSize: "var(--fs-md)",
                  fontWeight: 600,
                  color: "var(--color-text)",
                }}
              >
                Or spread the word about Brandician
              </h2>
              <p
                className="text-center mb-4"
                style={{
                  fontSize: "var(--fs-sm)",
                  color: "var(--color-secondary)",
                  fontFamily: "'Source Sans 3', sans-serif",
                }}
              >
                If Brandician helped clarify your brand, a short mention goes a
                long way.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap mb-4">
                {/* LinkedIn */}
                <button
                  onClick={() => handleShareOn("linkedin")}
                  className="inline-flex items-center justify-center gap-2 transition-all"
                  style={{
                    padding: "12px 20px",
                    background: "var(--color-white)",
                    border: "2px solid var(--color-light)",
                    borderRadius: "12px",
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontSize: "var(--fs-md)",
                    fontWeight: 500,
                    color: "var(--color-text)",
                    cursor: "pointer",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                      fill="currentColor"
                    />
                  </svg>
                  Share on LinkedIn
                </button>

                {/* X (Twitter) */}
                <button
                  onClick={() => handleShareOn("twitter")}
                  className="inline-flex items-center justify-center gap-2 transition-all"
                  style={{
                    padding: "12px 20px",
                    background: "var(--color-white)",
                    border: "2px solid var(--color-light)",
                    borderRadius: "12px",
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontSize: "var(--fs-md)",
                    fontWeight: 500,
                    color: "var(--color-text)",
                    cursor: "pointer",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                      fill="currentColor"
                    />
                  </svg>
                  Share on X
                </button>

                {/* Facebook */}
                <button
                  onClick={() => handleShareOn("facebook")}
                  className="inline-flex items-center justify-center gap-2 transition-all"
                  style={{
                    padding: "12px 20px",
                    background: "var(--color-white)",
                    border: "2px solid var(--color-light)",
                    borderRadius: "12px",
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontSize: "var(--fs-md)",
                    fontWeight: 500,
                    color: "var(--color-text)",
                    cursor: "pointer",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                      fill="currentColor"
                    />
                  </svg>
                  Share on Facebook
                </button>
              </div>

              {shared && (
                <p
                  className="text-center"
                  style={{
                    fontSize: "var(--fs-sm)",
                    color: "var(--color-light)",
                    fontFamily: "'Source Sans 3', sans-serif",
                  }}
                >
                  Thank you for sharing!
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleProceed}
                variant="primary"
                disabled={isProcessing}
                loading={isProcessing}
                rightIcon={
                  !isProcessing ? <ArrowRight className="h-4 w-4" /> : undefined
                }
                className="w-full"
              >
                {isProcessing ? "Processing..." : "Open Your Brand Hub"}
              </Button>
              <Button
                onClick={handleProceed}
                variant="tertiary"
                disabled={isProcessing}
                className="w-full"
              >
                Skip for now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentShareStep;
