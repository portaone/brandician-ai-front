import {
  AlertCircle,
  ArrowRight,
  Check,
  ClipboardCopy,
  Copy,
  Loader,
  RefreshCw,
  Download,
  Linkedin,
  Share2,
  Star,
  Twitter,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import axios, { AxiosInstance } from "axios";
import { useSearchParams } from "react-router-dom";
import MarkdownPreviewer from "../common/MarkDownPreviewer";
import PaletteSample from "../common/PaletteSample";
import { useNavigate, useParams } from "react-router-dom";
import { UiTabKey, BACKEND_TAB_FOR_UI, UiTabConfig, TAB_CONFIGS } from "./hub-tab-config";
import { API_URL, brands } from "../../lib/api";
import { navigateAfterProgress } from "../../lib/navigation";
import { useBrandStore } from "../../store/brand";
import BrandicianLoader from "../common/BrandicianLoader";
import Button from "../common/Button";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import DownloadAllButton from "../common/DownloadAllButton";
import ShareLinkModal from "../common/ShareLinkModal";
import { LOADER_CONFIGS } from "../../lib/loader-constants";

type HubMap = Record<string, string | Record<string, string> | null | undefined>;

// --- Gaps support ---

interface Gap {
  property: string;
  name?: string;
  description: string;
  impact?: string;
  quick_fix_question?: string;
  survey_questions?: string[];
  workaround?: string;
  validation_method?: string;
  priority: string; // "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
}

interface PropertyConfidence {
  level: string; // "HIGH" | "MEDIUM" | "LOW"
  reasoning?: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800",
  HIGH: "bg-orange-100 text-orange-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-green-100 text-green-800",
};

const CONFIDENCE_STYLES: Record<string, string> = {
  HIGH: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-red-100 text-red-800",
};

/** Look up confidence for a property using flexible key matching. */
function findConfidence(
  propKey: string,
  propTitle: string,
  levels: Record<string, PropertyConfidence>,
): PropertyConfidence | null {
  if (levels[propKey]) return levels[propKey];
  if (levels[propTitle]) return levels[propTitle];
  const lowerKey = propKey.toLowerCase();
  const lowerTitle = propTitle.toLowerCase();
  for (const [k, v] of Object.entries(levels)) {
    const lk = k.toLowerCase();
    if (lk === lowerKey || lk === lowerTitle) return v;
  }
  return null;
}

/** Count gaps whose property field matches a given property key or title. */
function countGapsForProperty(
  propKey: string,
  propTitle: string,
  gaps: Gap[],
): number {
  const lk = propKey.toLowerCase();
  const lt = propTitle.toLowerCase();
  return gaps.filter((g) => {
    const gp = (g.property || "").toLowerCase();
    return gp === lk || gp === lt || gp.includes(lt) || lt.includes(gp);
  }).length;
}

const BrandHubContainer: React.FC<{ isComplete?: boolean }> = ({
  isComplete = false,
}) => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const {
    currentBrand,
    selectBrand,
    isLoading: brandLoading,
    progressBrandStatus,
  } = useBrandStore();

  const [activeTab, setActiveTab] = useState<UiTabKey>("strategy");
  const [tabData, setTabData] = useState<Record<UiTabKey, HubMap>>({
    strategy: {},
    positioning: {},
    visual_identity: {},
    voice_content: {},
    gaps: {},
  });
  const [tabLoading, setTabLoading] = useState<Record<UiTabKey, boolean>>({
    strategy: false,
    positioning: false,
    visual_identity: false,
    voice_content: false,
    gaps: false,
  });
  const [tabError, setTabError] = useState<Record<UiTabKey, string | null>>({
    strategy: null,
    positioning: null,
    visual_identity: null,
    voice_content: null,
    gaps: null,
  });
  const [hasAnyContent, setHasAnyContent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProgressing, setIsProgressing] = useState(false);
  const [gapsData, setGapsData] = useState<Gap[]>([]);
  const [confidenceLevels, setConfidenceLevels] = useState<
    Record<string, PropertyConfidence>
  >({});
  const [gapsLoading, setGapsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // --- Download card state (copied from CompletedContainer) ---
  const [searchParams] = useSearchParams();
  const [assets, setAssets] = useState<any[]>([]);
  const [assetContents, setAssetContents] = useState<{ [key: string]: any }>(
    {},
  );
  const [downloadLinks, setDownloadLinks] = useState<{ [key: string]: string }>(
    {},
  );
  const [testimonialData, setTestimonialData] = useState<any>(null);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const token = searchParams.get("token") ?? "";

  let guestApi: AxiosInstance | undefined;

  const extractBrandIdFromToken = (jwtToken: string): string | null => {
    try {
      const parts = jwtToken.split(".");
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload.brand_id || null;
    } catch {
      return null;
    }
  };

  if (token) {
    guestApi = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  }

  useEffect(() => {
    // Load testimonial data from localStorage if available
    if (brandId) {
      const storedTestimonial = localStorage.getItem(`testimonial_${brandId}`);
      if (storedTestimonial) {
        try {
          setTestimonialData(JSON.parse(storedTestimonial));
        } catch (error) {
          console.error("Failed to parse testimonial data:", error);
        }
      }
    }
  }, [brandId]);

  useEffect(() => {
    const loadAssets = async () => {
      if (!brandId) return;

      try {
        setIsLoadingAssets(true);
        const response = token
          ? await brands.listAssets(brandId, guestApi)
          : await brands.produceAssets(brandId);
        setAssets(response.assets);

        const contents: { [key: string]: any } = {};
        const links: { [key: string]: string } = {};

        for (const asset of response.assets) {
          try {
            const fullAsset = await brands.getAsset(
              brandId,
              asset.id,
              guestApi,
            );
            contents[asset.type] = fullAsset;

            if (fullAsset.content) {
              const blob = new Blob([fullAsset.content], {
                type: "text/plain",
              });
              links[asset.type] = URL.createObjectURL(blob);
            }
          } catch (error) {
            console.error(`Failed to load asset ${asset.type}:`, error);
          }
        }

        setAssetContents(contents);
        setDownloadLinks(links);
      } catch (error) {
        console.error("Failed to load assets:", error);
      } finally {
        setIsLoadingAssets(false);
      }
    };

    if (brandId) {
      loadAssets();
    }

    return () => {
      Object.values(downloadLinks).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [brandId]);

  const handleDownload = (assetType: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${currentBrand?.name || "brand"}-${assetType}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  useEffect(() => {
    if (!brandId) return;
    if (!currentBrand || currentBrand.id !== brandId) {
      selectBrand(brandId);
    }
  }, [brandId, currentBrand, selectBrand]);

  const loadTab = async (
    tabKey: UiTabKey,
    opts?: { allowGenerate?: boolean; force?: boolean },
  ) => {
    if (!brandId) return;

    // Avoid refetching if we already have data for this tab
    // (skip check when force=true, e.g. after regeneration, to avoid stale closure)
    if (!opts?.force && Object.keys(tabData[tabKey] || {}).length > 0) {
      return;
    }

    setTabLoading((prev) => ({ ...prev, [tabKey]: true }));
    setTabError((prev) => ({ ...prev, [tabKey]: null }));

    try {
      const backendTab = BACKEND_TAB_FOR_UI[tabKey];
      const response = await brands.getBrandHubTab(brandId, backendTab);
      const properties: HubMap = response?.properties || {};

      if (
        opts?.allowGenerate &&
        (!properties || Object.keys(properties).length === 0)
      ) {
        await generateHub();
        return;
      }

      setTabData((prev) => {
        const updated = { ...prev, [tabKey]: properties || {} };
        const anyContent = Object.values(updated).some((map) =>
          Object.values(map || {}).some(
            (v) =>
              (typeof v === "string" && v.trim().length > 0) ||
              (v && typeof v === "object" && Object.keys(v).length > 0),
          ),
        );
        setHasAnyContent(anyContent);
        return updated;
      });
    } catch (e: any) {
      console.error("Failed to load Brand Hub tab:", e);
      setTabError((prev) => ({
        ...prev,
        [tabKey]:
          e?.response?.data?.detail ||
          "Failed to load this Brand Hub tab. Please try again.",
      }));
    } finally {
      setTabLoading((prev) => ({ ...prev, [tabKey]: false }));
    }
  };

  const loadGaps = async () => {
    if (!brandId) return;
    setGapsLoading(true);
    try {
      const response = await brands.getBrandHubTab(brandId, "gaps");
      const gapsObj = response?.properties?.gaps;

      if (gapsObj && typeof gapsObj === "object" && !Array.isArray(gapsObj)) {
        // gaps is a map: { confidence_levels: {...}, gap_list: [...] }
        if (Array.isArray(gapsObj.gap_list)) {
          setGapsData(gapsObj.gap_list);
        }
        if (
          gapsObj.confidence_levels &&
          typeof gapsObj.confidence_levels === "object"
        ) {
          setConfidenceLevels(gapsObj.confidence_levels);
        }
      } else if (Array.isArray(gapsObj)) {
        // Fallback: gaps is directly an array
        setGapsData(gapsObj);
      }
    } catch {
      // Gaps loading is best-effort
    } finally {
      setGapsLoading(false);
    }
  };

  const generateHub = async () => {
    if (!brandId) return;
    setIsGenerating(true);
    try {
      await brands.generateBrandHub(brandId);
      // Clear cached tab data and reload current tab
      setTabData({
        strategy: {},
        positioning: {},
        visual_identity: {},
        voice_content: {},
        gaps: {},
      });
      setHasAnyContent(false);
      setGapsData([]);
      setConfidenceLevels({});
      await loadTab(activeTab, { force: true });
      await loadGaps();
    } catch (e: any) {
      console.error("Failed to generate Brand Hub:", e);
      setTabError((prev) => ({
        ...prev,
        [activeTab]:
          e?.response?.data?.detail ||
          "Failed to generate Brand Hub. Please try again.",
      }));
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
      console.error("Failed to progress from Brand Hub:", e);
      setTabError((prev) => ({
        ...prev,
        [activeTab]:
          e?.response?.data?.detail ||
          "Failed to move to the next step. Please try again.",
      }));
    } finally {
      setIsProgressing(false);
    }
  };

  // Load gaps data eagerly so badges appear on all tabs
  useEffect(() => {
    if (brandId) {
      loadGaps();
    }
  }, [brandId]);

  useEffect(() => {
    if (brandId && activeTab !== "gaps") {
      loadTab(activeTab, { allowGenerate: true });
    }
  }, [brandId, activeTab]);

  if (brandLoading || !currentBrand || !brandId || isGenerating) {
    return (
      <BrandicianLoader config={LOADER_CONFIGS.brandHub} isComplete={false} />
    );
  }

  const currentTabConfig = TAB_CONFIGS.find((t) => t.key === activeTab)!;
  const currentTabError = tabError[activeTab];
  const currentTabLoading = tabLoading[activeTab];
  const currentHub = tabData[activeTab] || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex justify-between flex-wrap gap-3 items-center mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-neutral-800">
                Brand Hub:{" "}
                <span className="text-3xl sm:text-4xl font-display font-bold text-primary-700">
                  {currentBrand.brand_name || currentBrand.name}
                </span>
              </h1>
              <p className="text-neutral-600 mt-1 text-sm sm:text-base">
                A single place to explore your brand’s strategy, positioning,
                visual identity, and voice.
              </p>
            </div>
            <div className="flex items-center flex-wrap gap-3">
              <HistoryButton brandId={brandId} size="md" />
              <GetHelpButton variant="secondary" size="md" />
            </div>
          </div>

          {/* Generation state / errors */}
          {currentTabError && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{currentTabError}</span>
            </div>
          )}

          {!hasAnyContent && !tabLoading[activeTab] && (
            <div className="mb-6 rounded-lg border border-dashed border-neutral-300 bg-white p-5 text-center">
              <p className="text-neutral-700 mb-3">
                Your Brand Hub hasn’t been generated yet.
              </p>
              <Button
                onClick={generateHub}
                size="md"
                variant="primary"
                loading={isGenerating}
                leftIcon={
                  !isGenerating ? (
                    <Copy className="h-4 w-4" />
                  ) : (
                    <Loader className="h-4 w-4 animate-spin" />
                  )
                }
              >
                {isGenerating
                  ? "Generating Brand Hub..."
                  : "Generate Brand Hub"}
              </Button>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 flex flex-wrap gap-2 border-b">
            {TAB_CONFIGS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-primary-600 text-primary-700"
                    : "border-transparent text-gray-600 hover:text-primary-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab description */}
          <p className="mb-4 text-sm text-neutral-600">
            {currentTabConfig.description}
          </p>

          {/* Content */}
          <div className="space-y-4 mb-10">
            {(activeTab === "gaps" ? gapsLoading : currentTabLoading) && (
              <div className="flex items-center text-neutral-600 text-sm">
                <Loader className="h-4 w-4 animate-spin mr-2" />
                Loading Brand Hub content...
              </div>
            )}

            {activeTab === "gaps" ? (
              /* ── Gaps tab: structured list ── */
              gapsData.length > 0 ? (
                gapsData.map((gap, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap gap-2 items-start justify-between mb-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <h3 className="text-lg font-semibold text-neutral-800">
                          {gap.name || gap.property}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[gap.priority.toUpperCase()] || "bg-neutral-100 text-neutral-600"}`}
                        >
                          {gap.priority}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const parts = [
                            gap.name || gap.property,
                            gap.description,
                          ];
                          if (gap.impact) parts.push(`Impact: ${gap.impact}`);
                          if (gap.quick_fix_question)
                            parts.push(`Quick fix: ${gap.quick_fix_question}`);
                          if (gap.workaround)
                            parts.push(`Workaround: ${gap.workaround}`);
                          handleCopy(parts.join("\n"), `gap-${index}`);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 transition-colors flex-shrink-0"
                        title="Copy gap to clipboard"
                      >
                        {copiedKey === `gap-${index}` ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-green-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <ClipboardCopy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    {gap.property && gap.name && (
                      <p className="text-xs text-neutral-500 mb-1">
                        {gap.property}
                      </p>
                    )}
                    <p className="text-sm text-neutral-700">
                      {gap.description}
                    </p>
                    {gap.impact && (
                      <p className="text-sm text-neutral-600 mt-1">
                        <span className="font-medium">Impact:</span>{" "}
                        {gap.impact}
                      </p>
                    )}
                    {gap.quick_fix_question && (
                      <p className="text-sm text-primary-700 mt-2 italic">
                        Quick fix: {gap.quick_fix_question}
                      </p>
                    )}
                    {gap.workaround && (
                      <p className="text-xs text-neutral-500 mt-1">
                        Workaround: {gap.workaround}
                      </p>
                    )}
                  </div>
                ))
              ) : !gapsLoading ? (
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 text-center">
                  <p className="text-sm text-neutral-400 italic">
                    No gaps detected. Your brand hub looks complete!
                  </p>
                </div>
              ) : null
            ) : (
              /* ── Other tabs: properties with confidence & gap badges ── */
              currentTabConfig.properties.map((prop) => {
                const value = currentHub && currentHub[prop.key];
                const hasContent =
                  prop.key === "palette"
                    ? value && typeof value === "object" && Object.keys(value).length > 0
                    : typeof value === "string" && value.trim().length > 0;
                const conf = findConfidence(
                  prop.key,
                  prop.title,
                  confidenceLevels,
                );
                const gapCount = countGapsForProperty(
                  prop.key,
                  prop.title,
                  gapsData,
                );

                return (
                  <div
                    key={prop.key}
                    className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap gap-3 items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg sm:text-xl font-semibold text-neutral-800">
                            {prop.title}
                          </h2>
                          {conf && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONFIDENCE_STYLES[conf.level.toUpperCase()] || "bg-neutral-100 text-neutral-600"}`}
                              title={conf.reasoning || undefined}
                            >
                              Confidence: {conf.level}
                            </span>
                          )}
                          {gapCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-medium">
                              {gapCount} gap
                              {gapCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        {prop.helper && (
                          <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl">
                            {prop.helper}
                          </p>
                        )}
                      </div>
                      {hasContent && prop.key !== "palette" && (
                        <button
                          onClick={() => handleCopy(value as string, prop.key)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 transition-colors flex-shrink-0"
                          title={`Copy ${prop.title} to clipboard`}
                        >
                          {copiedKey === prop.key ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-green-600" />
                              <span className="text-green-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <ClipboardCopy className="h-3.5 w-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {prop.key === "palette" && hasContent ? (
                      <PaletteSample content={JSON.stringify([value])} brandId={brandId} mode="draft" />
                    ) : hasContent ? (
                      <div className="prose prose-sm max-w-none text-neutral-700">
                        <MarkdownPreviewer markdown={value as string} />
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-400 italic">
                        This section hasn't been populated yet.
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Regenerate Hub Button (always available once there is any content) */}
          {hasAnyContent && (
            <div className="mb-6 flex justify-center">
              <Button
                onClick={generateHub}
                disabled={isGenerating}
                variant="secondary"
                size="lg"
                loading={isGenerating}
                leftIcon={!isGenerating && <RefreshCw className="h-5 w-5" />}
                title="Regenerate the Brand Hub from the latest strategy data"
              >
                {isGenerating
                  ? "Regenerating Brand Hub..."
                  : "Regenerate Brand Hub"}
              </Button>
            </div>
          )}

          {/* Proceed to next workflow step (testimonial / payment) */}
          {!isComplete && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-neutral-800 mb-3">
                  Ready for the next step?
                </h3>
                <p className="text-neutral-600 mb-6">
                  Once you’re happy with your Brand Hub, continue to share
                  feedback and complete the journey.
                </p>
                <Button
                  onClick={handleProceedToNext}
                  disabled={isProgressing}
                  variant="primary"
                  size="lg"
                  loading={isProgressing}
                  rightIcon={
                    !isProgressing && <ArrowRight className="h-5 w-5" />
                  }
                >
                  {isProgressing ? "Processing..." : "Continue to Next Step"}
                </Button>
              </div>
            </div>
          )}

          {isComplete && (
            <div className="bg-white rounded-lg shadow-lg p-4 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-neutral-800">
                  Download Your Brand Assets
                </h2>
                <div className="flex items-center flex-wrap gap-3">
                  {!token && null}
                  {!token && null}
                  <button
                    onClick={() => setShareModalOpen(true)}
                    className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assets.map((asset, index) => {
                  const fullAsset = assetContents[asset.type];
                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <h3 className="font-medium text-gray-900 mb-2 capitalize">
                        {asset.type.replace(/_/g, " ")}
                      </h3>
                      {fullAsset?.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {fullAsset.description}
                        </p>
                      )}
                      {fullAsset?.content && (
                        <button
                          onClick={() =>
                            handleDownload(asset.type, fullAsset.content)
                          }
                          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </button>
                      )}
                      {fullAsset?.url && (
                        <a
                          href={fullAsset.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium ml-4"
                        >
                          View Online
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                {brandId && (
                  <DownloadAllButton
                    brandId={brandId}
                    brandName={currentBrand?.brand_name || currentBrand?.name || "brand"}
                    variant="button"
                    guestApi={guestApi}
                  />
                )}
              </div>
            </div>
          )}

          {brandId && (
            <ShareLinkModal
              isOpen={shareModalOpen}
              onClose={() => setShareModalOpen(false)}
              brandId={brandId}
              brandName={currentBrand?.brand_name || currentBrand?.name}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandHubContainer;
