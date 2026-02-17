import { ArrowRight, Loader } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { scrollToTop } from "../../lib/utils";
import { useBrandStore } from "../../store/brand";
import Button from "../common/Button";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import MarkdownPreviewer from "../common/MarkDownPreviewer";
import BrandicianLoader from "../common/BrandicianLoader";
import { useAutoFocus } from "../../hooks/useAutoFocus";
import BrandNameDisplay from "../BrandName/BrandNameDisplay";
import { LOADER_CONFIGS } from "../../lib/loader-constants";

const BrandSummary: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    currentBrand,
    selectBrand,
    updateBrandSummary,
    generateBrandSummary,
    loadSummary,
    isLoading,
    error: _error,
  } = useBrandStore();
  const [summary, setSummary] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorState, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"generation" | "save" | null>(
    null,
  );
  const hasInitialized = useRef(false);

  useEffect(() => {
    const initializeSummary = async () => {
      if (!brandId) return;
      if (hasInitialized.current) return;
      hasInitialized.current = true;

      try {
        console.log("🔄 Initializing summary for brand:", brandId);
        await selectBrand(brandId);

        // If regenerate=1, always generate a new summary
        if (searchParams.get("regenerate") === "1") {
          console.log("📝 Regenerating summary due to query param...");
          await generateBrandSummary(brandId);
          setIsGenerating(false);
          return;
        }
        // Try to load existing summary first
        try {
          const existingSummary = await loadSummary(brandId);
          if (existingSummary) {
            console.log("📝 Using existing summary");
            setSummary(existingSummary);
            setIsGenerating(false);
            return;
          }
        } catch (error) {
          console.log("No existing summary found, will generate new one");
        }
        // Only generate summary if we haven't tried before
        if (!hasAttemptedGeneration) {
          console.log("📝 Generating new summary...");
          setHasAttemptedGeneration(true);
          await generateBrandSummary(brandId);
        }
      } catch (error) {
        console.error("❌ Failed to initialize summary:", error);
        setError("Failed to generate summary. Please try again.");
        setErrorType("generation");
      } finally {
        setIsGenerating(false);
      }
    };

    initializeSummary();
  }, [brandId, selectBrand, generateBrandSummary, loadSummary, searchParams]);

  useEffect(() => {
    if (currentBrand?.summary) {
      setSummary(currentBrand.summary);
    }
  }, [currentBrand]);

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSummary(e.target.value);
  };

  useAutoFocus([isEditing]);

  const handleProceed = async () => {
    if (!brandId || !summary || !summary.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setErrorType(null);
    try {
      await updateBrandSummary(brandId, summary);
      // Also progress the brand status to ensure backend is ready for JTBD
      try {
        await useBrandStore.getState().progressBrandStatus(brandId);
      } catch (error) {
        // If status progression fails, still navigate (might already be at correct status)
        console.log("Status progression skipped:", error);
      }
      navigate(`/brands/${brandId}/jtbd`);
    } catch (error) {
      console.error("Failed to update summary:", error);
      setError("Failed to save summary. Please try again.");
      setErrorType("save");
    } finally {
      setIsSubmitting(false);
    }

    scrollToTop();
  };

  if (isGenerating) {
    return (
      <BrandicianLoader
        config={LOADER_CONFIGS.brandSummary}
        isComplete={false}
      />
    );
  }

  if (errorState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-600 mb-4">{errorState}</div>
        <div className="flex space-x-4">
          <Button
            onClick={async () => {
              setError(null);
              setErrorType(null);

              if (errorType === "save") {
                // Retry saving the current summary
                setIsSubmitting(true);
                try {
                  await updateBrandSummary(brandId!, summary);
                  navigate(`/brands/${brandId}/jtbd`);
                } catch (error) {
                  console.error("Failed to update summary:", error);
                  setError("Failed to save summary. Please try again.");
                  setErrorType("save");
                } finally {
                  setIsSubmitting(false);
                }
              } else {
                // Retry generating a new summary
                setIsGenerating(true);
                setHasAttemptedGeneration(false);
                try {
                  if (brandId) {
                    await generateBrandSummary(brandId);
                  }
                } catch (error) {
                  console.error("Failed to generate summary:", error);
                  setError("Failed to generate summary. Please try again.");
                  setErrorType("generation");
                } finally {
                  setIsGenerating(false);
                }
              }
            }}
            disabled={isSubmitting}
            size="md"
          >
            {isSubmitting ? "Saving..." : "Try again"}
          </Button>
          <Button
            onClick={() => navigate("/brands")}
            variant="secondary"
            size="md"
          >
            Exit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center flex-wrap gap-2 mb-6">
            <h1 className="text-3xl font-display font-bold text-neutral-800">
              <BrandNameDisplay brand={currentBrand!} />
              Brand Summary
            </h1>
            <div className="flex items-center gap-3">
              {brandId && <HistoryButton brandId={brandId} size="md" />}
              <GetHelpButton variant="secondary" size="md" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-2 sm:p-6">
            <p className="text-neutral-600 mb-6">
              We've analyzed your responses and generated a summary of your
              brand. Please review and make any necessary adjustments.
            </p>

            <div className="mb-6">
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                <label
                  htmlFor="summary"
                  className="block text-sm font-medium text-neutral-700"
                >
                  Brand Summary
                </label>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setIsEditing((v) => !v)}
                  disabled={isSubmitting}
                >
                  {isEditing ? "Preview" : "Edit"}
                </Button>
              </div>

              {isEditing ? (
                <textarea
                  id="summary"
                  value={summary}
                  onChange={handleSummaryChange}
                  className="w-full min-h-[300px] p-4 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Write your brand summary (Markdown supported)..."
                />
              ) : (
                <div className="w-full min-h-[300px] p-4 border border-neutral-200 rounded-lg bg-neutral-50">
                  {summary && summary.trim() ? (
                    <MarkdownPreviewer markdown={summary} />
                  ) : (
                    <div className="text-neutral-500 italic">
                      No summary yet. Click Edit to add one.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center gap-3 flex-wrap">
              <Button
                onClick={() =>
                  navigate(`/brands/${brandId}/questionnaire?summary=1`)
                }
                variant="secondary"
                size="lg"
              >
                Change my answers
              </Button>
              <Button
                onClick={handleProceed}
                disabled={isSubmitting || !summary || !summary.trim()}
                size="lg"
              >
                {isSubmitting ? (
                  <Loader className="animate-spin h-5 w-5 mr-2 inline" />
                ) : null}
                Proceed to Jobs to be Done
                <ArrowRight className="ml-2 h-5 w-5 inline" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandSummary;
