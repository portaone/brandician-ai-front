import { ArrowRight, Loader, RefreshCw } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { brands } from "../../lib/api";
import { navigateAfterProgress } from "../../lib/navigation";
import { useBrandStore } from "../../store/brand";
import {
  BrandAsset,
  BrandAssetSummary,
  BrandAssetsListResponse,
} from "../../types";
import AssetContent from "../common/AssetContent";
import Button from "../common/Button";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import BrandicianLoader from "../common/BrandicianLoader";

interface BrandAssetsProps {
  brandId: string;
}

interface LoadedAsset extends BrandAssetSummary {
  asset: BrandAsset | null;
  loading: boolean;
  error: string | null;
}

const BrandAssets: React.FC<BrandAssetsProps> = ({ brandId }) => {
  const navigate = useNavigate();
  const { progressBrandStatus } = useBrandStore();
  const [assetSummaries, setAssetSummaries] = useState<BrandAssetSummary[]>([]);
  const [loadedAssets, setLoadedAssets] = useState<Record<string, LoadedAsset>>(
    {}
  );
  const [activeTab, setActiveTab] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProgressing, setIsProgressing] = useState(false);
  const [isGeneratingAssets, setIsGeneratingAssets] = useState(false);

  // Add refs to prevent duplicate calls
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const isGeneratingRef = useRef(false);
  const pollingTimeoutRef = useRef<any | null>(null);

  // Function to start asset generation (regenerate all assets)
  const startAssetGeneration = async () => {
    if (isGeneratingRef.current) {
      console.log("🛑 Asset generation already in progress");
      return;
    }

    isGeneratingRef.current = true;
    setIsGeneratingAssets(true);
    setError(null);

    try {
      console.log("🗑️ Deleting all existing assets for brand:", brandId);
      await brands.deleteAllAssets(brandId);
      console.log("✅ All assets deleted");

      console.log("🎨 Starting asset generation for brand:", brandId);
      const response = await brands.produceAssets(brandId);
      console.log("✅ Asset generation started:", response);

      // After starting generation, periodically check for assets
      setTimeout(() => {
        pollForAssets();
      }, 3000);
    } catch (error: any) {
      console.error("❌ Failed to regenerate assets:", error);
      setError("Failed to regenerate assets. Please try again.");
      setIsGeneratingAssets(false);
      isGeneratingRef.current = false;
    }
  };

  // Function to poll for assets until they're ready
  const pollForAssets = async () => {
    try {
      console.log("🔄 Polling for generated assets...");
      const response: BrandAssetsListResponse = await brands.listAssets(
        brandId
      );

      if (response.assets.length > 0) {
        console.log("✅ Assets are ready!");
        // Reset state and reload the component with assets
        setAssetSummaries(response.assets);
        setActiveTab(response.assets[0].type);
        setIsGeneratingAssets(false);
        isGeneratingRef.current = false;

        // Initialize loaded assets state
        const initialLoadedAssets: Record<string, LoadedAsset> = {};
        response.assets.forEach((summary) => {
          initialLoadedAssets[summary.id] = {
            ...summary,
            asset: null,
            loading: false,
            error: null,
          };
        });
        setLoadedAssets(initialLoadedAssets);
      } else {
        // Assets not ready yet, poll again in a few seconds
        console.log("⏳ Assets not ready yet, polling again...");
        pollingTimeoutRef.current = setTimeout(() => {
          pollForAssets();
        }, 5000);
      }
    } catch (error) {
      console.error("❌ Error polling for assets:", error);
      // Continue polling despite error - assets might still be generating
      pollingTimeoutRef.current = setTimeout(() => {
        pollForAssets();
      }, 10000);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchAssetsList = async () => {
      // Prevent duplicate calls
      if (isLoadingRef.current || hasLoadedRef.current) {
        console.log("⏸️ Skipping duplicate assets list fetch");
        return;
      }

      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        console.log("🔄 Fetching brand assets list for:", brandId);
        const response: BrandAssetsListResponse = await brands.listAssets(
          brandId
        );

        if (isMounted) {
          setAssetSummaries(response.assets);

          // If no assets exist, automatically start generation
          if (response.assets.length === 0) {
            console.log("🎨 No assets found, starting automatic generation...");
            startAssetGeneration();
          } else {
            setActiveTab(response.assets[0].type);

            // Clear any existing loaded assets to force fresh load
            setLoadedAssets({});

            // Initialize loaded assets state
            const initialLoadedAssets: Record<string, LoadedAsset> = {};
            response.assets.forEach((summary) => {
              initialLoadedAssets[summary.id] = {
                ...summary,
                asset: null,
                loading: false,
                error: null,
              };
            });
            setLoadedAssets(initialLoadedAssets);
          }

          hasLoadedRef.current = true;
        }
      } catch (e) {
        if (isMounted) {
          console.error("❌ Failed to load brand assets list:", e);
          setError(
            "Failed to load brand assets. They may not be generated yet."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
        isLoadingRef.current = false;
      }
    };

    // Small delay to help prevent React StrictMode duplicates
    const timeoutId = setTimeout(fetchAssetsList, 50);

    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
      isLoadingRef.current = false;
    };
  }, [brandId]);

  // Function to load individual asset details
  const loadAssetDetails = async (
    assetId: string,
    forceReload: boolean = false
  ) => {
    if (
      !forceReload &&
      (loadedAssets[assetId]?.asset || loadedAssets[assetId]?.loading)
    ) {
      return; // Already loaded or loading
    }

    setLoadedAssets((prev) => ({
      ...prev,
      [assetId]: {
        ...prev[assetId],
        loading: true,
        error: null,
      },
    }));

    try {
      console.log("🔄 Loading asset details for:", assetId);
      const asset: BrandAsset = await brands.getAsset(brandId, assetId);

      setLoadedAssets((prev) => ({
        ...prev,
        [assetId]: {
          ...prev[assetId],
          asset,
          loading: false,
          error: null,
        },
      }));
    } catch (e) {
      console.error("❌ Failed to load asset details:", e);
      setLoadedAssets((prev) => ({
        ...prev,
        [assetId]: {
          ...prev[assetId],
          asset: null,
          loading: false,
          error: "Failed to load asset details",
        },
      }));
    }
  };

  // Load asset details when tab changes
  useEffect(() => {
    if (activeTab) {
      const assetsOfType = assetSummaries.filter((s) => s.type === activeTab);
      assetsOfType.forEach((summary) => {
        loadAssetDetails(summary.id);
      });
    }
  }, [activeTab, assetSummaries]);

  const assetTypes = useMemo(
    () => Array.from(new Set(assetSummaries.map((a) => a.type))),
    [assetSummaries]
  );

  const handleProceedToPayment = async () => {
    if (!brandId || isProgressing) return;

    setIsProgressing(true);
    try {
      const statusUpdate = await progressBrandStatus(brandId);
      navigateAfterProgress(navigate, brandId, statusUpdate);
    } catch (error) {
      console.error("Failed to progress to payment:", error);
    } finally {
      setIsProgressing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Brand Assets...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-600 mb-4">{error}</div>
        <div className="flex gap-4">
          {!isGeneratingAssets && (
            <Button
              onClick={startAssetGeneration}
              variant="primary"
              size="md"
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Start Asset Generation
            </Button>
          )}
          <Button
            onClick={() => window.location.reload()}
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  if (assetSummaries.length === 0) {
    if (isGeneratingAssets) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="mb-6 flex flex-col justify-center items-center gap-2">
                  <BrandicianLoader />
                  <h2 className="text-2xl font-bold text-neutral-800 mb-2">
                    Creating Your Brand Assets
                  </h2>
                  <p className="text-neutral-600">
                    We're generating your personalized brand assets based on
                    your brand profile. This usually takes a few minutes.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    What we're creating for you:
                  </h3>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Custom logo design</li>
                    <li>• Brand tagline</li>
                    <li>• Visual style guide</li>
                    <li>• Content writing prompts</li>
                    <li>• Complete brand book</li>
                  </ul>
                </div>
                <p className="text-neutral-500 text-sm mt-4">
                  This page will automatically refresh when your assets are
                  ready.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-neutral-600 mb-4">
          No assets found. Starting generation...
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="primary"
          size="md"
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between flex-wrap gap-2 items-center mb-6">
            <h1 className="text-3xl font-display font-bold text-neutral-800">
              Brand Assets
            </h1>
            <div className="flex items-center flex-wrap gap-3">
              <HistoryButton brandId={brandId} variant="outline" size="lg" />
              <GetHelpButton variant="secondary" size="lg" />
            </div>
          </div>
          <div className="mb-6 flex flex-wrap gap-2 border-b">
            {assetTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === type
                    ? "border-primary-600 text-primary-700"
                    : "border-transparent text-gray-600 hover:text-primary-600"
                }`}
              >
                {type
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
          </div>
          <div className="mb-8">
            {Object.values(loadedAssets)
              .filter((loaded) => loaded.type === activeTab)
              .map((loaded) => {
                console.log(
                  "🎯 Rendering asset:",
                  loaded.id,
                  loaded.type,
                  !!loaded.asset
                );
                return (
                  <div
                    key={loaded.id}
                    className="mb-6 p-2 sm:p-4 bg-white border border-gray-200 rounded-lg"
                  >
                    <h2 className="text-xl font-semibold mb-2">
                      {loaded.type
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </h2>

                    {loaded.loading && (
                      <div className="flex items-center text-neutral-600">
                        <Loader className="animate-spin h-4 w-4 mr-2" />
                        Loading asset details...
                      </div>
                    )}

                    {loaded.error && (
                      <div className="text-red-600 text-sm">{loaded.error}</div>
                    )}

                    {loaded.asset && (
                      <>
                        {loaded.asset.description && (
                          <div className="mb-4">
                            <h3 className="font-medium text-neutral-700 mb-1">
                              Description:
                            </h3>
                            <p className="text-neutral-600 text-sm">
                              {loaded.asset.description}
                            </p>
                          </div>
                        )}
                        {loaded.asset && (
                          <div className="mb-4">
                            <AssetContent
                              key={loaded.id}
                              asset={loaded.asset}
                            />
                          </div>
                        )}
                        {loaded.asset.url && (
                          <div className="mb-4">
                            <h3 className="font-medium text-neutral-700 mb-1">
                              URL:
                            </h3>
                            <a
                              href={loaded.asset.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700 underline text-sm break-all"
                            >
                              {loaded.asset.url}
                            </a>
                          </div>
                        )}
                        {loaded.asset.created_at && (
                          <div className="text-xs text-neutral-500">
                            Created:{" "}
                            {new Date(loaded.asset.created_at).toLocaleString()}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Regenerate Assets Button */}
          <div className="mb-6 flex justify-center">
            <Button
              onClick={startAssetGeneration}
              disabled={isGeneratingAssets}
              variant="primary"
              size="lg"
              loading={isGeneratingAssets}
              leftIcon={
                !isGeneratingAssets && <RefreshCw className="h-5 w-5" />
              }
              title="Regenerate all brand assets"
            >
              {isGeneratingAssets ? "Regenerating..." : "Regenerate Assets"}
            </Button>
          </div>

          {/* Proceed to Payment Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">
                Love what you see?
              </h3>
              <p className="text-neutral-600 mb-6">
                These brand assets are ready to help your business succeed. You
                will be able to download them on the final step, or anytime in
                the future.
              </p>
              <Button
                onClick={handleProceedToPayment}
                disabled={isProgressing}
                variant="primary"
                size="lg"
                loading={isProgressing}
                rightIcon={!isProgressing && <ArrowRight className="h-5 w-5" />}
              >
                {isProgressing ? "Processing..." : "Continue to Next Step"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandAssets;
