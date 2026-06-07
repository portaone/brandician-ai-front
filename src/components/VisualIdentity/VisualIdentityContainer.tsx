import { ArrowRight } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import { navigateAfterProgress } from "../../lib/navigation";
import { useBrandStore } from "../../store/brand";
import AssetContent from "../common/AssetContent";
import Button from "../common/Button";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import RegenerateButton from "../common/RegenerateButton";
import BrandicianLoader from "../common/BrandicianLoader";
import BrandNameDisplay from "../BrandName/BrandNameDisplay";
import { LOADER_CONFIGS } from "../../lib/loader-constants";
import { scrollToTop } from "../../lib/utils";
import VisualSystemSelector, {
  type BackendPaletteColors,
  type Palette,
  transformPalette,
} from "./VisualSystemSelector";
import type { FontSystemV3 } from "../../lib/fontSystem";

// Default font systems — used when the backend returns no font data.
// v3 shape; System 3 is the archetype system. Keep in sync with
// _DEFAULT_FONT_SETS in the backend (modules/brand_hub.py).
const DEFAULT_FONT_SETS: FontSystemV3[] = [
  {
    id: 1,
    primary_font: "Bitter",
    primary_weights: "400,700,800",
    secondary_font: "Source Sans 3",
    secondary_weights: "400,600",
    accent_font: "Playfair Display",
    accent_weights: "700",
    archetype_fit: "Editorial, grounded",
    notes:
      "Sturdy serif headings with a humanist sans body for trustworthy, readable long-form copy.",
  },
  {
    id: 2,
    primary_font: "DM Serif Display",
    primary_weights: "400",
    secondary_font: "DM Sans",
    secondary_weights: "400,500,700",
    accent_font: "DM Sans",
    accent_weights: "500,700",
    archetype_fit: "Modern, refined",
    notes:
      "High-contrast display serif paired with a clean geometric sans for a contemporary, confident tone.",
  },
  {
    id: 3,
    primary_font: "Cormorant Garamond",
    primary_weights: "600,700",
    secondary_font: "Karla",
    secondary_weights: "400,700",
    accent_font: "Cormorant Infant",
    accent_weights: "500",
    archetype_fit: "Premium, classical",
    notes:
      "Classical serif headings over a clean grotesque body — an elegant, archetype-leaning system.",
  },
];

type VisualOptions = {
  rawMarkdown: string;
  palettes: BackendPaletteColors[];
  fontSets: FontSystemV3[];
};

const VisualIdentityContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const {
    currentBrand,
    selectBrand,
    isLoading: brandLoading,
    progressBrandStatus,
  } = useBrandStore();

  const [visualOptions, setVisualOptions] = useState<VisualOptions | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProgressing, setIsProgressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Previous palette reuse
  const [previousPalette, setPreviousPalette] =
    useState<BackendPaletteColors | null>(null);
  const [usePreviousPalette, setUsePreviousPalette] = useState(false);

  // Track current selector indices so "Save and proceed" can read them
  const selectionRef = useRef({ paletteIndex: 0, fontIndex: 0 });

  useEffect(() => {
    if (!brandId) return;
    if (!currentBrand || currentBrand.id !== brandId) {
      selectBrand(brandId);
    }
  }, [brandId, currentBrand, selectBrand]);

  // Fetch previous palette asset (if any) so the user can opt to reuse it
  useEffect(() => {
    if (!brandId) return;
    let cancelled = false;
    (async () => {
      try {
        const resp = await brands.listAssets(brandId);
        const assetList = resp?.assets ?? resp;
        const paletteAsset = (assetList as any[]).find(
          (a: any) => a.type === "palette",
        );
        if (!paletteAsset || cancelled) return;
        const full = await brands.getAsset(brandId, paletteAsset.id);
        if (cancelled) return;
        const content = full.content;
        if (!content) return;
        const parsed =
          typeof content === "string" ? JSON.parse(content) : content;
        // Only use it if it's a single palette object (already selected),
        // not the multi-variant { palettes: [...] } format
        if (parsed && !parsed.palettes) {
          setPreviousPalette(parsed as BackendPaletteColors);
        }
      } catch {
        // Silently ignore — this is a best-effort lookup
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brandId]);

  const applyResponse = (data: {
    raw_markdown: string;
    palettes: BackendPaletteColors[];
    font_sets: FontSystemV3[];
  }) => {
    setVisualOptions({
      rawMarkdown: data.raw_markdown,
      palettes: data.palettes || [],
      fontSets: data.font_sets?.length ? data.font_sets : DEFAULT_FONT_SETS,
    });
  };

  const loadVisualIdentity = async (opts?: { allowGenerate?: boolean }) => {
    if (!brandId) return;
    setIsLoading(true);
    setError(null);
    try {
      // Try to get existing options first
      try {
        const existing = await brands.getVisualIdentityOptions(brandId);
        applyResponse(existing);
        return;
      } catch (e: any) {
        // 404 means no options generated yet
        if (e?.response?.status !== 404) throw e;
      }

      // Auto-generate if allowed
      if (opts?.allowGenerate) {
        setIsGenerating(true);
        const generated = await brands.suggestVisualIdentity(brandId);
        applyResponse(generated);
      }
    } catch (e: any) {
      console.error("Failed to load visual identity:", e);
      setError(
        e?.response?.data?.detail ||
          "Failed to load visual identity. Please try again.",
      );
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (brandId) {
      loadVisualIdentity({ allowGenerate: true });
    }
  }, [brandId]);

  const handleRegenerate = async () => {
    if (!brandId || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      const generated = await brands.suggestVisualIdentity(brandId);
      applyResponse(generated);
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

  const handleSaveAndProceed = async () => {
    if (!brandId || isProgressing) return;
    setIsProgressing(true);
    setError(null);
    try {
      // Save palette & font selection to hub
      if (paletteNeedsSelection) {
        if (usePreviousPalette && previousPalette) {
          await brands.saveVisualIdentitySelection(
            brandId,
            -1,
            selectionRef.current.fontIndex,
            previousPalette as Record<string, string>,
          );
        } else {
          await brands.saveVisualIdentitySelection(
            brandId,
            selectionRef.current.paletteIndex,
            selectionRef.current.fontIndex,
          );
        }
      }
      const statusUpdate = await progressBrandStatus(brandId);
      navigateAfterProgress(navigate, brandId, statusUpdate);
    } catch (e: any) {
      console.error("Failed to save and progress from Visual Identity:", e);
      setError(
        e?.response?.data?.detail ||
          "Failed to save and proceed. Please try again.",
      );
    } finally {
      setIsProgressing(false);
      scrollToTop();
    }
  };

  const handleSelectionChange = useCallback(
    (paletteIndex: number, fontIndex: number) => {
      selectionRef.current = { paletteIndex, fontIndex };
    },
    [],
  );

  // Transform palettes and font sets from visual options
  const { paletteNeedsSelection, parsedPalettes, fontSets } = useMemo(() => {
    if (!visualOptions || !visualOptions.palettes.length) {
      return { paletteNeedsSelection: false, parsedPalettes: [], fontSets: [] };
    }
    const palettes: Palette[] = visualOptions.palettes.map(
      (raw: BackendPaletteColors, i: number) => transformPalette(raw, i),
    );
    return {
      paletteNeedsSelection: palettes.length > 1,
      parsedPalettes: palettes,
      fontSets: visualOptions.fontSets,
    };
  }, [visualOptions]);

  const hasAnyVisual = !!visualOptions;

  const brandLabel = useMemo(
    () => currentBrand?.brand_name || currentBrand?.name || "",
    [currentBrand],
  );

  // Extract only the Overview section from raw markdown for the Strategy Details panel
  const overviewAsset = useMemo(() => {
    if (!visualOptions?.rawMarkdown) return null;
    const content = visualOptions.rawMarkdown;
    // Find where the second ## heading starts (after Overview)
    const secondHeading = content.indexOf("\n## ", content.indexOf("## ") + 3);
    const trimmed =
      secondHeading > 0 ? content.slice(0, secondHeading).trim() : content;
    return { content: trimmed, type: "visual_style" as const };
  }, [visualOptions?.rawMarkdown]);

  if (!brandId || brandLoading || !currentBrand || !hasAnyVisual) {
    return (
      <BrandicianLoader
        config={LOADER_CONFIGS.visualIdentity}
        isComplete={false}
      />
    );
  }

  return (
    <div className="min-h-screen py-8">
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

          {/* Strategy Details — always visible */}
          {overviewAsset && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
              <div className="px-4 sm:px-6 py-6 prose prose-sm max-w-none text-neutral-700">
                <AssetContent asset={overviewAsset} />
              </div>
            </div>
          )}

          {/* Use previous palette banner */}
          {previousPalette && paletteNeedsSelection && (
            <div className="mb-6 bg-white rounded-lg shadow-lg px-4 sm:px-6 py-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={usePreviousPalette}
                  onChange={(e) => setUsePreviousPalette(e.target.checked)}
                  className="h-4 w-4 rounded-md"
                  style={{ accentColor: "var(--color-primary)" }}
                />
                <span className="text-sm text-neutral-600">
                  Use my previous color palette instead of choosing a new one
                </span>
              </label>
            </div>
          )}

          {/* Visual System Selector — shown when palette has multiple variants */}
          {paletteNeedsSelection &&
            parsedPalettes.length > 0 &&
            fontSets.length > 0 && (
              <VisualSystemSelector
                palettes={parsedPalettes}
                fontSets={fontSets}
                onSelectionChange={handleSelectionChange}
                paletteDisabled={usePreviousPalette}
                overridePalette={
                  usePreviousPalette && previousPalette
                    ? transformPalette(previousPalette, 0)
                    : undefined
                }
              />
            )}

          {/* Selected palette — shown after selection is confirmed (single variant) */}
          {!paletteNeedsSelection && parsedPalettes.length === 1 && (
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
              <h2 className="text-xl font-semibold text-neutral-800 mb-3">
                Selected Color Palette
              </h2>
              <p className="text-sm text-neutral-500 mb-3">
                Your chosen color palette for the brand.
              </p>
              <VisualSystemSelector
                palettes={parsedPalettes}
                fontSets={fontSets}
                onSelectionChange={handleSelectionChange}
              />
            </div>
          )}

          {!visualOptions && (
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
              <p className="text-neutral-600">
                Visual identity content is not available yet. You can regenerate
                it using the button below.
              </p>
            </div>
          )}

          {/* Regenerate Visual Identity */}
          <div className="mb-6 flex justify-center">
            <RegenerateButton
              onClick={handleRegenerate}
              disabled={isGenerating}
              loading={isGenerating}
              title="Regenerate the visual identity strategy for this brand"
            >
              {isGenerating
                ? "Regenerating visuals..."
                : "Regenerate Visual Identity"}
            </RegenerateButton>
          </div>

          {/* Save and proceed */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">
                Happy with your visuals?
              </h3>
              <p className="text-neutral-600 mb-6">
                Save your selection and continue to generate the full Brand Hub.
              </p>
              <Button
                onClick={handleSaveAndProceed}
                disabled={isProgressing}
                variant="primary"
                size="lg"
                loading={isProgressing}
                rightIcon={!isProgressing && <ArrowRight className="h-5 w-5" />}
              >
                {isProgressing ? "Saving..." : "Save and Proceed"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualIdentityContainer;
