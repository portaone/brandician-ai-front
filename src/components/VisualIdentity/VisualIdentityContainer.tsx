import { ArrowRight, Check, RefreshCw } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import { navigateAfterProgress } from "../../lib/navigation";
import { useBrandStore } from "../../store/brand";
import { VisualIdentityDraft } from "../../types";
import { parseMarkdown } from "../common/MarkDownPreviewer";
import PaletteSample from "../common/PaletteSample";
import Button from "../common/Button";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import BrandicianLoader from "../common/BrandicianLoader";
import BrandNameDisplay from "../BrandName/BrandNameDisplay";
import { LOADER_CONFIGS } from "../../lib/loader-constants";
import { scrollToTop } from "../../lib/utils";

/** Render a markdown string with inline color-swatch highlighting. */
function renderMarkdownWithSwatches(md: string) {
  const html = parseMarkdown(md);
  const htmlWithSwatches = html.replace(
    /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/g,
    (m) =>
      `<span style="background:${m};color:#fff;padding:0 0.5em;border-radius:4px;margin-left:0.2em;margin-right:0.2em;font-weight:bold;display:inline-block">${m}</span>`,
  );
  return (
    <div className="brand-markdown prose max-w-none markdown-preview">
      <div dangerouslySetInnerHTML={{ __html: htmlWithSwatches }} />
    </div>
  );
}

const VisualIdentityContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const {
    currentBrand,
    selectBrand,
    isLoading: brandLoading,
    progressBrandStatus,
  } = useBrandStore();

  const [draft, setDraft] = useState<VisualIdentityDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProgressing, setIsProgressing] = useState(false);
  const [isSavingSelection, setIsSavingSelection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!brandId) return;
    if (!currentBrand || currentBrand.id !== brandId) {
      selectBrand(brandId);
    }
  }, [brandId, currentBrand, selectBrand]);

  const loadDraft = async () => {
    if (!brandId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await brands.getOrGenerateVisualIdentityDraft(brandId);
      setDraft(data);
    } catch (e: any) {
      console.error("Failed to load visual identity draft:", e);
      setError(
        e?.response?.data?.detail ||
          "Failed to load visual identity. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (brandId) {
      loadDraft();
    }
  }, [brandId]);

  const handleRegenerate = async () => {
    if (!brandId || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await brands.regenerateVisualIdentityDraft(brandId);
      setDraft(data);
    } catch (e: any) {
      console.error("Failed to regenerate visual identity:", e);
      setError(
        e?.response?.data?.detail ||
          "Failed to regenerate visual identity. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectVariant = async (index: number) => {
    if (!brandId || isSavingSelection) return;
    setIsSavingSelection(true);
    setError(null);
    try {
      await brands.selectVisualIdentityVariant(brandId, index);
      await loadDraft();
    } catch (e: any) {
      console.error("Failed to select variant:", e);
      setError(
        e?.response?.data?.detail ||
          "Failed to select variant. Please try again.",
      );
    } finally {
      setIsSavingSelection(false);
    }
  };

  const handleProceedToNext = async () => {
    if (!brandId || isProgressing) return;
    setIsProgressing(true);
    try {
      const statusUpdate = await progressBrandStatus(brandId);
      navigateAfterProgress(navigate, brandId, statusUpdate);
    } catch (e: any) {
      console.error("Failed to progress from Visual Identity:", e);
      setError(
        e?.response?.data?.detail ||
          "Failed to move to the next step. Please try again.",
      );
    } finally {
      setIsProgressing(false);
      scrollToTop();
    }
  };

  const needsSelection = draft
    ? draft.variants.length > 1 && draft.selected_variant_index == null
    : false;

  const brandLabel = useMemo(
    () => currentBrand?.brand_name || currentBrand?.name || "",
    [currentBrand],
  );

  if (!brandId || brandLoading || !currentBrand || (isLoading && !draft)) {
    return (
      <BrandicianLoader
        config={LOADER_CONFIGS.visualIdentity}
        isComplete={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between flex-wrap gap-2 items-center mb-6">
            <div>
              <h1 className="text-3xl font-display font-bold text-neutral-800">
                <BrandNameDisplay brand={currentBrand!} />
                Visual Identity Strategy
              </h1>
              <p className="text-neutral-600 mt-1 text-sm sm:text-base">
                Generated for{" "}
                <span className="font-semibold">{brandLabel}</span>: overview,
                colors, typography, and visual style.
              </p>
            </div>
            <div className="flex items-center flex-wrap gap-3">
              <HistoryButton brandId={brandId} size="md" />
              <GetHelpButton variant="secondary" size="md" />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
              {error}
            </div>
          )}

          {draft && (
            <>
              {/* 1. Overview section */}
              {draft.overview && (
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
                  <h2 className="text-xl font-semibold text-neutral-800 mb-3">
                    Visual Identity Overview
                  </h2>
                  <div className="prose prose-sm max-w-none text-neutral-700">
                    {renderMarkdownWithSwatches(draft.overview)}
                  </div>
                </div>
              )}

              {/* 2. Variant selection section */}
              {draft.variants.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
                  <h2 className="text-xl font-semibold text-neutral-800 mb-3">
                    {needsSelection
                      ? "Choose Your Visual Identity"
                      : "Selected Visual Identity"}
                  </h2>
                  <p className="text-sm text-neutral-500 mb-4">
                    {needsSelection
                      ? "Select one of the visual identity variants below to continue. Each offers a different creative direction while staying true to the brand archetypes."
                      : "Your chosen visual identity for the brand."}
                  </p>

                  {(() => {
                    const displayedVariants = needsSelection
                      ? draft.variants.map((v, i) => ({ variant: v, originalIndex: i }))
                      : draft.selected_variant_index != null
                        ? [{ variant: draft.variants[draft.selected_variant_index], originalIndex: draft.selected_variant_index }]
                        : draft.variants.map((v, i) => ({ variant: v, originalIndex: i }));

                    return displayedVariants.map(({ variant, originalIndex }, displayIdx) => {
                      // Extract heading from first line of description, or fall back
                      const lines = variant.description.split("\n");
                      const firstLine = lines[0]?.replace(/^#+\s*/, "").trim();
                      const heading = firstLine || `Variant ${originalIndex + 1}`;
                      const restDescription = lines.slice(1).join("\n").trim();

                      return (
                        <div key={originalIndex}>
                          {displayIdx > 0 && (
                            <hr className="my-6 border-neutral-200" />
                          )}

                          <h3 className="text-lg font-semibold text-neutral-700 mb-3">
                            {heading}
                          </h3>

                          {/* Palette preview */}
                          <PaletteSample
                            content={JSON.stringify([variant.palette])}
                            mode="draft"
                            variantIndexOffset={originalIndex}
                          />

                          {/* Variant description (strategic rationale + typography) */}
                          {restDescription && (
                            <div className="mt-4 prose prose-sm max-w-none text-neutral-700">
                              {renderMarkdownWithSwatches(restDescription)}
                            </div>
                          )}

                          {/* Select button */}
                          {needsSelection && (
                            <div className="mt-4">
                              <Button
                                onClick={() => handleSelectVariant(originalIndex)}
                                disabled={isSavingSelection}
                                variant="secondary"
                                size="lg"
                                loading={isSavingSelection}
                                leftIcon={
                                  !isSavingSelection && (
                                    <Check className="h-5 w-5" />
                                  )
                                }
                              >
                                {isSavingSelection
                                  ? "Saving..."
                                  : "Select this variant"}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {/* 3. Summary section */}
              {draft.summary && (
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
                  <h2 className="text-xl font-semibold text-neutral-800 mb-3">
                    Visual Style Summary
                  </h2>
                  <div className="prose prose-sm max-w-none text-neutral-700">
                    {renderMarkdownWithSwatches(draft.summary)}
                  </div>
                </div>
              )}
            </>
          )}

          {!draft && !isLoading && (
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
              <p className="text-neutral-600">
                Visual identity content is not available yet. You can regenerate
                it using the button below.
              </p>
            </div>
          )}

          {/* Regenerate Visual Identity */}
          <div className="mb-6 flex justify-center">
            <Button
              onClick={handleRegenerate}
              disabled={isGenerating}
              variant="secondary"
              size="lg"
              loading={isGenerating}
              leftIcon={!isGenerating && <RefreshCw className="h-5 w-5" />}
              title="Regenerate the visual identity strategy for this brand"
            >
              {isGenerating
                ? "Regenerating visuals..."
                : "Regenerate Visual Identity"}
            </Button>
          </div>

          {/* Proceed to next step (Brand Hub) */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">
                Happy with your visuals?
              </h3>
              {needsSelection ? (
                <p className="text-amber-600 mb-6">
                  Please select a visual identity variant above before
                  continuing.
                </p>
              ) : (
                <p className="text-neutral-600 mb-6">
                  Continue to generate the full Brand Hub that brings all
                  strategy and visuals together.
                </p>
              )}
              <Button
                onClick={handleProceedToNext}
                disabled={isProgressing || needsSelection}
                variant="primary"
                size="lg"
                loading={isProgressing}
                rightIcon={!isProgressing && <ArrowRight className="h-5 w-5" />}
              >
                {isProgressing ? "Processing..." : "Continue to Brand Hub"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualIdentityContainer;
