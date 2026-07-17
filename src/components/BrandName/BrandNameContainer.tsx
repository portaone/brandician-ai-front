import { ArrowRight, RefreshCw } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { brands } from "../../lib/api";
import { navigateAfterProgress } from "../../lib/navigation";
import { useBrandStore } from "../../store/brand";
import BrandAssets from "../BrandAssets/BrandAssets";
import Button from "../common/Button";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import BrandicianLoader from "../common/BrandicianLoader";
import MarkdownPreviewer from "../common/MarkDownPreviewer";
import { LOADER_CONFIGS } from "../../lib/loader-constants";
import { messageOr } from "../../lib/errors";

interface BrandNameSuggestion {
  name: string;
  rationale?: string;
  domains_available?: string[];
  score: number;
}

interface BrandName {
  name: string;
  description: string;
  domains_available: string[];
  score?: number;
}

type SelectionOption = "keep" | "generate" | "custom" | null;

const BrandNameContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { selectBrand, updateBrandName, progressBrandStatus } = useBrandStore();
  const customInputRef = useRef<HTMLInputElement>(null);

  const [suggestions, setSuggestions] = useState<BrandNameSuggestion[]>([]);
  const [selectedName, setSelectedName] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");
  const [activeCard, setActiveCard] = useState<SelectionOption>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAssets, setShowAssets] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<BrandName | null>(null);

  useEffect(() => {
    const loadBrand = async () => {
      if (!brandId) return;

      setIsLoading(true);
      try {
        await selectBrand(brandId);
        const nameOptions = await brands.pickName(brandId);
        setCurrentDraft(nameOptions.draft || null);
      } catch (error) {
        setError(
          messageOr(error, "We couldn't load brand name suggestions right now. Please try again."),
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadBrand();
  }, [brandId]);

  const handleCardSelect = (option: SelectionOption) => {
    setActiveCard(option);

    if (option === "keep" && currentDraft) {
      setSelectedName(currentDraft.name);
      setCustomName("");
    } else if (option === "generate") {
      if (selectedName === currentDraft?.name) {
        setSelectedName("");
      }
      setCustomName("");
    } else if (option === "custom") {
      setSelectedName("");
      setCustomName("");
      setTimeout(() => customInputRef.current?.focus(), 100);
    }
  };

  const handleSelectName = (name: string) => {
    setSelectedName(name);
    setCustomName("");
    setActiveCard("generate");
  };

  const handleCustomNameSubmit = () => {
    if (customName.trim()) {
      setSelectedName(customName.trim());
    }
  };

  const handleProceedToVisualIdentity = async () => {
    const nameToSubmit =
      activeCard === "custom" && customName.trim()
        ? customName.trim()
        : selectedName;
    if (!brandId || !nameToSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const statusUpdate = await progressBrandStatus(brandId);
      await updateBrandName(brandId, nameToSubmit);
      navigateAfterProgress(navigate, brandId, statusUpdate);
    } catch (error) {
      console.error("Failed to proceed to asset creation:", error);
      setError(messageOr(error, "Failed to progress to asset creation. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateNewSuggestions = async () => {
    if (!brandId || isGenerating) return;

    setIsGenerating(true);
    try {
      const nameOptions = await brands.pickName(brandId);

      const newSuggestions = Array.isArray(nameOptions.alt_options)
        ? nameOptions.alt_options.map((opt: BrandName) => ({
            name: opt.name,
            rationale: opt.description,
            domains_available: opt.domains_available || [],
            score: opt.score,
          }))
        : [];
      setSuggestions(newSuggestions);
    } catch (error) {
      setError(messageOr(error, "We couldn't generate new suggestions right now. Please try again."));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDomainClick = (domain: string) => {
    window.open(
      `https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(domain)}`,
      "_blank",
    );
  };

  if (isLoading) {
    return (
      <BrandicianLoader config={LOADER_CONFIGS.brandName} isComplete={false} />
    );
  }

  if (showAssets && brandId) {
    return <BrandAssets brandId={brandId} />;
  }

  const renderRadioButton = (isActive: boolean) => (
    <div
      className="flex-shrink-0 flex items-center justify-center transition-all"
      style={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        border: `2px solid ${isActive ? "var(--color-primary)" : "var(--color-light)"}`,
      }}
    >
      <div
        className="rounded-full transition-all"
        style={{
          width: 12,
          height: 12,
          background: "var(--color-primary)",
          opacity: isActive ? 1 : 0,
          transform: isActive ? "scale(1)" : "scale(0)",
        }}
      />
    </div>
  );

  const renderDomainTags = (domains: string[]) => {
    const validDomains = domains.filter((d) => d.includes("."));
    if (validDomains.length === 0) return null;

    return (
      <>
        <span className="sublabel" style={{ marginTop: 8 }}>
          Domains available
        </span>
        <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 8 }}>
          {validDomains.map((domain, i) => (
            <span
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                handleDomainClick(domain);
              }}
              className="cursor-pointer font-menu transition-colors hover:opacity-80"
              style={{
                background: "rgba(127, 89, 113, 0.1)",
                color: "var(--color-secondary)",
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: "0.85rem",
                fontWeight: 500,
              }}
            >
              {domain}
            </span>
          ))}
        </div>
        <p
          className="font-serif"
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--color-secondary)",
            fontStyle: "italic",
          }}
        >
          Click domain name to purchase
        </p>
      </>
    );
  };

  const cardStyle = (isActive: boolean): React.CSSProperties => ({
    background: isActive ? "rgba(253, 97, 94, 0.03)" : "var(--color-white)",
    border: `2px solid ${isActive ? "var(--color-primary)" : "var(--color-bg)"}`,
    borderRadius: 16,
    padding: "24px 28px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  });

  return (
    <div className="min-h-screen" style={{ padding: "32px 0" }}>
      <div className="mx-auto" style={{ maxWidth: 1200, padding: "0 40px" }}>
        {/* Page Header */}
        <div
          className="flex justify-between items-start flex-wrap"
          style={{ marginBottom: 40, gap: 16 }}
        >
          <h1
            className="font-serif font-bold"
            style={{
              fontSize: "var(--fs-xl)",
              color: "var(--color-text)",
              lineHeight: 1.2,
            }}
          >
            Pick Your Brand Name
          </h1>
          <div className="flex" style={{ gap: 12 }}>
            {brandId && <HistoryButton brandId={brandId} size="md" />}
            <GetHelpButton variant="secondary" size="md" />
          </div>
        </div>

        {/* Label */}
        <p className="label" style={{ marginBottom: 12 }}>
          Choose an option to continue
        </p>

        {/* Selection Cards */}
        <div className="flex flex-col" style={{ gap: 16, marginBottom: 40 }}>
          {/* Card 1: Keep Current Name */}
          {currentDraft && (
            <div
              onClick={() => handleCardSelect("keep")}
              style={cardStyle(activeCard === "keep")}
            >
              <div
                className="flex items-center"
                style={{ gap: 16, marginBottom: 12 }}
              >
                {renderRadioButton(activeCard === "keep")}
                <h3
                  className="font-serif font-semibold"
                  style={{
                    fontSize: "var(--fs-md)",
                    color: "var(--color-text)",
                    margin: 0,
                  }}
                >
                  Keep Current Name
                </h3>
              </div>
              <div style={{ marginLeft: 40, marginTop: 12 }}>
                <p
                  className="font-serif font-semibold"
                  style={{
                    fontSize: "var(--fs-lg)",
                    color: "var(--color-text)",
                    marginBottom: 12,
                  }}
                >
                  {currentDraft.name}
                </p>
                {Array.isArray(currentDraft.domains_available) &&
                  renderDomainTags(currentDraft.domains_available)}
              </div>
            </div>
          )}

          {/* Card 2: Generate New Suggestions */}
          <div
            onClick={() => handleCardSelect("generate")}
            style={cardStyle(activeCard === "generate")}
          >
            <div
              className="flex items-center"
              style={{ gap: 16, marginBottom: 12 }}
            >
              {renderRadioButton(activeCard === "generate")}
              <h3
                className="font-serif font-semibold"
                style={{
                  fontSize: "var(--fs-md)",
                  color: "var(--color-text)",
                  margin: 0,
                }}
              >
                Generate New Suggestions
              </h3>
            </div>
            <p
              className="font-serif"
              style={{
                fontSize: "var(--fs-base)",
                color: "var(--color-text)",
                marginTop: 4,
                marginLeft: 40,
              }}
            >
              Get AI-powered name ideas based on your brand strategy
            </p>

            <AnimatePresence>
              {activeCard === "generate" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div style={{ marginLeft: 40, marginTop: 16 }}>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateNewSuggestions();
                      }}
                      disabled={isGenerating}
                      loading={isGenerating}
                      variant="primary"
                      size="sm"
                      leftIcon={
                        !isGenerating ? (
                          <RefreshCw style={{ width: 14, height: 14 }} />
                        ) : undefined
                      }
                    >
                      Generate Suggestions
                    </Button>

                    {suggestions.length === 0 && !isGenerating && (
                      <p
                        className="font-serif"
                        style={{
                          fontSize: "var(--fs-sm)",
                          color: "var(--color-light)",
                          marginTop: 16,
                        }}
                      >
                        Click the button above to generate name suggestions
                      </p>
                    )}

                    {suggestions.length > 0 && (
                      <div
                        className="grid grid-cols-1 md:grid-cols-2"
                        style={{ gap: 12, marginTop: 16 }}
                      >
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectName(suggestion.name);
                            }}
                            className="cursor-pointer transition-all"
                            style={{
                              padding: "16px 20px",
                              borderRadius: 12,
                              border: `2px solid ${
                                selectedName === suggestion.name
                                  ? "var(--color-primary)"
                                  : "var(--color-bg)"
                              }`,
                              background:
                                selectedName === suggestion.name
                                  ? "rgba(253, 97, 94, 0.03)"
                                  : "var(--color-white)",
                            }}
                          >
                            <div
                              className="font-serif font-semibold"
                              style={{
                                fontSize: "var(--fs-base)",
                                color: "var(--color-text)",
                                marginBottom: 4,
                              }}
                            >
                              {suggestion.name}
                            </div>
                            {suggestion.rationale && (
                              <div style={{ marginBottom: 8 }}>
                                <MarkdownPreviewer
                                  markdown={suggestion.rationale}
                                />
                              </div>
                            )}
                            {Array.isArray(suggestion.domains_available) &&
                              renderDomainTags(suggestion.domains_available)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Card 3: Enter Custom Name */}
          <div
            onClick={() => handleCardSelect("custom")}
            style={cardStyle(activeCard === "custom")}
          >
            <div
              className="flex items-center"
              style={{ gap: 16, marginBottom: 12 }}
            >
              {renderRadioButton(activeCard === "custom")}
              <h3
                className="font-serif font-semibold"
                style={{
                  fontSize: "var(--fs-md)",
                  color: "var(--color-text)",
                  margin: 0,
                }}
              >
                Enter Custom Name
              </h3>
            </div>
            <p
              className="font-serif"
              style={{
                fontSize: "var(--fs-base)",
                color: "var(--color-text)",
                marginTop: 4,
                marginLeft: 40,
              }}
            >
              Already have a name in mind? Enter it here
            </p>

            <AnimatePresence>
              {activeCard === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div style={{ marginLeft: 40, marginTop: 16 }}>
                    <input
                      ref={customInputRef}
                      type="text"
                      value={customName}
                      onChange={(e) => {
                        setCustomName(e.target.value);
                        if (selectedName && activeCard === "custom") {
                          setSelectedName("");
                        }
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCustomNameSubmit()
                      }
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Enter your brand name..."
                      className="w-full font-serif outline-none transition-colors"
                      style={{
                        fontSize: "var(--fs-md)",
                        color: "var(--color-text)",
                        background: "var(--color-white)",
                        border: "2px solid var(--color-light)",
                        borderRadius: 12,
                        padding: "14px 16px",
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = "var(--color-secondary)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "var(--color-light)")
                      }
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div
            style={{
              marginBottom: 24,
              padding: 16,
              background: "rgba(244, 195, 67, 0.1)",
              border: "2px solid var(--color-warning)",
              borderRadius: 12,
            }}
          >
            <p
              className="font-serif"
              style={{
                fontSize: "var(--fs-base)",
                color: "var(--color-text)",
              }}
            >
              {error}
            </p>
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-end" style={{ marginTop: 32 }}>
          <Button
            onClick={handleProceedToVisualIdentity}
            disabled={
              (!(activeCard === "custom" && customName.trim()) &&
                !selectedName) ||
              isSubmitting
            }
            loading={isSubmitting}
            size="lg"
            rightIcon={
              !isSubmitting ? (
                <ArrowRight style={{ width: 16, height: 16 }} />
              ) : undefined
            }
          >
            Continue to Next Step
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BrandNameContainer;
