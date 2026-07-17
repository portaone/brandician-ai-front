import { ArrowRight, ChevronDown, Loader } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import {
  ParsedArchetype,
  parseArchetypeResponse,
} from "../../lib/archetype-utils";
import { LOADER_CONFIGS } from "../../lib/loader-constants";
import { navigateAfterProgress } from "../../lib/navigation";
import { scrollToTop } from "../../lib/utils";
import { useBrandStore } from "../../store/brand";
import { BrandArchetypeData } from "../../types";
import BrandNameDisplay from "../BrandName/BrandNameDisplay";
import BrandicianLoader from "../common/BrandicianLoader";
import Button from "../common/Button";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import MarkdownPreviewer from "../common/MarkDownPreviewer";
import RegenerateButton from "../common/RegenerateButton";
import ErrorScreen from "../common/ErrorScreen";
import { getAppError, messageOr } from "../../lib/errors";

const BrandArchetype: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { currentBrand, selectBrand, progressBrandStatus } = useBrandStore();

  const [archetypeData, setArchetypeData] = useState<BrandArchetypeData | null>(
    null,
  );
  const [parsed, setParsed] = useState<ParsedArchetype | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isProgressing, setIsProgressing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  const updateArchetype = useCallback((data: BrandArchetypeData) => {
    setArchetypeData(data);
    setParsed(parseArchetypeResponse(data));
  }, []);

  const loadArchetype = useCallback(async () => {
    if (!brandId) return;
    // Mark initialized so the mount effect won't re-fire under StrictMode's
    // double-invoke. onRetry calls this callback directly, so a retry still
    // performs a real re-fetch regardless of this guard.
    hasInitialized.current = true;
    setError(null);
    setIsGenerating(true);
    try {
      await selectBrand(brandId);
      const data = await brands.getArchetype(brandId!);
      updateArchetype(data);
    } catch (e) {
      console.error("Failed to load archetype:", e);
      setError(
        getAppError(e, "Failed to load archetype. Please try again.").message,
      );
    } finally {
      setIsGenerating(false);
    }
  }, [brandId, selectBrand, updateArchetype]);

  useEffect(() => {
    if (hasInitialized.current) return;
    loadArchetype();
  }, [loadArchetype]);

  const handleRegenerate = async () => {
    if (!brandId) return;
    setIsRegenerating(true);
    setError(null);
    try {
      const data = await brands.suggestArchetype(brandId);
      updateArchetype(data);
    } catch (err) {
      console.error("Failed to regenerate archetype:", err);
      setError(messageOr(err, "Failed to regenerate archetype. Please try again."));
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleContinue = async () => {
    if (!brandId) return;
    setIsProgressing(true);
    setError(null);
    try {
      const statusUpdate = await progressBrandStatus(brandId);
      navigateAfterProgress(navigate, brandId, statusUpdate);
    } catch (err) {
      console.error("Failed to progress:", err);
      setError(messageOr(err, "Failed to proceed. Please try again."));
    } finally {
      setIsProgressing(false);
    }
    scrollToTop();
  };

  if (error && !archetypeData) {
    return (
      <ErrorScreen
        error={{ message: error, isNetworkError: false }}
        title="Generation Failed"
        onRetry={loadArchetype}
        onGoToDashboard={() => navigate("/brands")}
      />
    );
  }

  if (isGenerating) {
    return (
      <BrandicianLoader config={LOADER_CONFIGS.archetype} isComplete={false} />
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Page header */}
          <div className="flex justify-between items-center flex-wrap gap-2 mb-6">
            <h1 className="text-3xl font-display font-bold text-neutral-800">
              <BrandNameDisplay brand={currentBrand!} />
              Brand Archetype
            </h1>
            <div className="flex items-center gap-3">
              {brandId && <HistoryButton brandId={brandId} size="md" />}
              <GetHelpButton variant="secondary" size="md" />
            </div>
          </div>

          {/* Current Archetype Card */}
          <div
            style={{
              background: "var(--color-bg)",
              border: "2px solid var(--color-light)",
              borderRadius: "16px",
              padding: "24px 32px",
              marginBottom: "24px",
            }}
          >
            {/* Card title */}
            <p
              style={{
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--color-secondary)",
                marginBottom: "20px",
              }}
            >
              Current Archetype
            </p>

            {/* Two-column archetype names */}
            <div
              className="archetype-pair"
              style={{
                display: "flex",
                gap: "48px",
                marginBottom: "16px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-light)",
                    marginBottom: "4px",
                  }}
                >
                  Primary
                </p>
                <p
                  style={{
                    fontFamily: "'Bitter', serif",
                    fontSize: "var(--fs-md)",
                    fontWeight: 600,
                    color: "var(--color-text)",
                  }}
                >
                  {parsed?.primaryName ? (
                    <MarkdownPreviewer markdown={parsed.primaryName} />
                  ) : (
                    "Not yet generated"
                  )}
                </p>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-light)",
                    marginBottom: "4px",
                  }}
                >
                  Secondary
                </p>
                <p
                  style={{
                    fontFamily: "'Bitter', serif",
                    fontSize: "var(--fs-md)",
                    fontWeight: 600,
                    color: "var(--color-text)",
                  }}
                >
                  {parsed?.secondaryName ? (
                    <MarkdownPreviewer markdown={parsed.secondaryName} />
                  ) : (
                    "Not yet generated"
                  )}
                </p>
              </div>
            </div>

            {/* Divider */}
            <hr
              style={{
                border: 0,
                borderTop: "1px solid rgba(127, 89, 113, 0.2)",
                margin: "16px 0",
              }}
            />

            {/* Toggle button */}
            <button
              onClick={() => setShowDetails((v) => !v)}
              style={{
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: "0.85rem",
                color: "var(--color-secondary)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 0",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {showDetails ? "Hide details" : "Show details"}
              <ChevronDown
                size={14}
                style={{
                  transition: "transform 0.2s",
                  transform: showDetails ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {/* Collapsible details */}
            {showDetails && parsed && (
              <div
                style={{
                  marginTop: "24px",
                  paddingTop: "24px",
                  borderTop: "1px solid rgba(127, 89, 113, 0.2)",
                }}
              >
                <div
                  className="archetype-content"
                  style={{
                    display: "flex",
                    gap: "32px",
                    marginBottom: "32px",
                  }}
                >
                  {/* Primary column */}
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontFamily: "'Source Sans 3', sans-serif",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--color-light)",
                        marginBottom: "8px",
                      }}
                    >
                      Primary
                    </p>
                    <div className="prose prose-sm max-w-none text-neutral-700 leading-relaxed">
                      <MarkdownPreviewer markdown={parsed.primaryContent} />
                    </div>
                  </div>

                  {/* Secondary column */}
                  {parsed.secondaryContent && (
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontFamily: "'Source Sans 3', sans-serif",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--color-light)",
                          marginBottom: "8px",
                        }}
                      >
                        Secondary
                      </p>
                      <div className="prose prose-sm max-w-none text-neutral-700 leading-relaxed">
                        <MarkdownPreviewer markdown={parsed.secondaryContent} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Combined Expression */}
                {parsed.combinedExpression && (
                  <>
                    <h3
                      style={{
                        fontFamily: "'Bitter', serif",
                        fontSize: "var(--fs-md)",
                        fontWeight: 600,
                        color: "var(--color-text)",
                        marginTop: "0.5em",
                        marginBottom: "0.5em",
                      }}
                    >
                      Combined Expression
                    </h3>
                    <div className="prose prose-sm max-w-none text-neutral-700 leading-relaxed">
                      <MarkdownPreviewer markdown={parsed.combinedExpression} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="text-red-600 mb-4 text-center">{error}</div>
          )}

          {/* Action buttons */}
          <div className="flex justify-between items-center gap-3 flex-wrap mt-8">
            <RegenerateButton
              onClick={handleRegenerate}
              loading={isRegenerating}
              disabled={isRegenerating || isProgressing}
            >
              Regenerate
            </RegenerateButton>
            <Button
              onClick={handleContinue}
              disabled={isRegenerating || isProgressing || !archetypeData}
              size="lg"
            >
              {isProgressing ? (
                <Loader className="animate-spin h-5 w-5 mr-2 inline" />
              ) : null}
              Continue
              <ArrowRight className="ml-2 h-5 w-5 inline" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandArchetype;
