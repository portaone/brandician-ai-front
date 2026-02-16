import { ArrowRight, Loader, RefreshCw } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import { navigateAfterProgress } from "../../lib/navigation";
import { useBrandStore } from "../../store/brand";
import { BrandAsset, BrandAssetsListResponse } from "../../types";
import AssetContent from "../common/AssetContent";
import Button from "../common/Button";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import BrandicianLoader from "../common/BrandicianLoader";
import BrandNameDisplay from "../BrandName/BrandNameDisplay";
import { LOADER_CONFIGS } from "../../lib/loader-constants";

type VisualAssetsState = {
  visualStyle: BrandAsset | null;
  palette: BrandAsset | null;
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

  const [assetsList, setAssetsList] = useState<BrandAssetsListResponse | null>(
    null,
  );
  const [visualAssets, setVisualAssets] = useState<VisualAssetsState>({
    visualStyle: null,
    palette: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProgressing, setIsProgressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!brandId) return;
    if (!currentBrand || currentBrand.id !== brandId) {
      selectBrand(brandId);
    }
  }, [brandId, currentBrand, selectBrand]);

  const loadVisualAssets = async (opts?: { allowGenerate?: boolean }) => {
    if (!brandId) return;
    setIsLoading(true);
    setError(null);

    try {
      // First, list existing assets
      let listResponse: BrandAssetsListResponse =
        await brands.listAssets(brandId);

      // If no visual assets yet and generation is allowed, trigger visual-only generation
      const hasVisual =
        listResponse.assets?.some((a) => a.type === "visual_style") ?? false;

      if (opts?.allowGenerate && !hasVisual) {
        setIsGenerating(true);
        await brands.produceAssets(brandId, "visual_style");
        // Re-list after generation
        listResponse = await brands.listAssets(brandId);
      }

      setAssetsList(listResponse);

      // Fetch the full visual_style and palette assets if present
      let visualStyle: BrandAsset | null = null;
      let palette: BrandAsset | null = null;

      for (const summary of listResponse.assets || []) {
        if (summary.type === "visual_style" || summary.type === "palette") {
          const fullAsset = await brands.getAsset(brandId, summary.id);
          if (fullAsset.type === "visual_style") {
            visualStyle = fullAsset;
          } else if (fullAsset.type === "palette") {
            palette = fullAsset;
          }
        }
      }

      setVisualAssets({ visualStyle, palette });
    } catch (e: any) {
      console.error("Failed to load visual identity assets:", e);
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
      loadVisualAssets({ allowGenerate: true });
    }
  }, [brandId]);

  const handleRegenerateVisuals = async () => {
    if (!brandId || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      await brands.produceAssets(brandId, "visual_style");
      await loadVisualAssets();
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
    }
  };

  const hasAnyVisual =
    !!visualAssets.visualStyle || !!visualAssets.palette || !!assetsList;

  const brandLabel = useMemo(
    () => currentBrand?.brand_name || currentBrand?.name || "",
    [currentBrand],
  );

  if (!brandId || brandLoading || !currentBrand || !hasAnyVisual) {
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

          {/* Visual Style Overview (main markdown content) */}
          {visualAssets.visualStyle && (
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
              <h2 className="text-xl font-semibold text-neutral-800 mb-3">
                1. Visual Identity Overview & Strategy
              </h2>
              <p className="text-sm text-neutral-500 mb-3">
                Based on your brand summary and archetype, this section explains
                the strategic context behind the visual decisions.
              </p>
              <div className="prose prose-sm max-w-none text-neutral-700">
                <AssetContent asset={visualAssets.visualStyle} />
              </div>
            </div>
          )}

          {/* Palette Sample */}
          {visualAssets.palette && (
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
              <h2 className="text-xl font-semibold text-neutral-800 mb-3">
                2. Color Palette
              </h2>
              <p className="text-sm text-neutral-500 mb-3">
                Key colors derived from the visual identity, including main,
                supporting, accent, and body text colors.
              </p>
              <AssetContent asset={visualAssets.palette} />
            </div>
          )}

          {!visualAssets.visualStyle && !visualAssets.palette && (
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
              onClick={handleRegenerateVisuals}
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
              <p className="text-neutral-600 mb-6">
                Continue to generate the full Brand Hub that brings all strategy
                and visuals together.
              </p>
              <Button
                onClick={handleProceedToNext}
                disabled={isProgressing}
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
