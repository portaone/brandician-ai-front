import { AlertCircle, ArrowRight, Copy, Loader, RefreshCw } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import axios, { AxiosInstance } from "axios";
import { useSearchParams } from "react-router-dom";
import { useNavigate, useParams } from "react-router-dom";
import { UiTabKey, BACKEND_TAB_FOR_UI, TAB_CONFIGS } from "./hub-tab-config";
import { API_URL, brands } from "../../lib/api";
import { navigateAfterProgress } from "../../lib/navigation";
import { useBrandStore } from "../../store/brand";
import BrandicianLoader from "../common/BrandicianLoader";
import Button from "../common/Button";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import ShareLinkModal from "../common/ShareLinkModal";
import { LOADER_CONFIGS } from "../../lib/loader-constants";

import BrandThemeProvider from "./BrandThemeProvider";
import BrandHubTabBar from "./BrandHubTabBar";
import BrandHubTabPanel from "./BrandHubTabPanel";
import BrandHubCard from "./BrandHubCard";
import BrandHubGapsPanel from "./BrandHubGapsPanel";

type HubMap = Record<
  string,
  string | Record<string, string> | null | undefined
>;

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
  priority: string;
}

interface PropertyConfidence {
  level: string;
  reasoning?: string;
}

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

function extractBrandIdFromToken(jwtToken: string): string | undefined {
  try {
    const parts = jwtToken.split(".");
    if (parts.length !== 3) return undefined;

    const payload = JSON.parse(atob(parts[1]));
    return payload.brand_id || undefined;
  } catch {
    return undefined;
  }
}

const BrandHubContainer: React.FC<{ isComplete?: boolean }> = ({
  isComplete = false,
}) => {
  let { brandId } = useParams<{ brandId: string }>();
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
    strategy: true,
    positioning: false,
    visual_identity: true,
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
  const hasAnyContent = useMemo(
    () =>
      Object.values(tabData).some((map) =>
        Object.values(map || {}).some(
          (v) =>
            (typeof v === "string" && v.trim().length > 0) ||
            (v && typeof v === "object" && Object.keys(v).length > 0),
        ),
      ),
    [tabData],
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProgressing, setIsProgressing] = useState(false);
  const [gapsData, setGapsData] = useState<Gap[]>([]);
  const [confidenceLevels, setConfidenceLevels] = useState<
    Record<string, PropertyConfidence>
  >({});
  const [gapsLoading, setGapsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const token = searchParams.get("token") ?? "";
  const isGuest = !!token;

  let guestApi: AxiosInstance | undefined;

  if (token) {
    guestApi = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  }

  brandId ??= extractBrandIdFromToken(token);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
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

  // ── Brand loading ──
  useEffect(() => {
    if (!brandId) return;
    if (!currentBrand || currentBrand.id !== brandId) {
      selectBrand(brandId, guestApi);
    }
  }, [brandId, currentBrand, selectBrand]);

  // ── Tab data loading ──
  const loadTab = async (
    tabKey: UiTabKey,
    opts?: { allowGenerate?: boolean; force?: boolean },
  ) => {
    if (!brandId) return;

    if (!opts?.force && Object.keys(tabData[tabKey] || {}).length > 0) {
      return;
    }

    setTabLoading((prev) => ({ ...prev, [tabKey]: true }));
    setTabError((prev) => ({ ...prev, [tabKey]: null }));

    try {
      const backendTab = BACKEND_TAB_FOR_UI[tabKey];
      const response = await brands.getBrandHubTab(
        brandId,
        backendTab,
        guestApi,
      );
      const properties: HubMap = response?.properties || {};

      if (
        opts?.allowGenerate &&
        !hasAnyContent &&
        (!properties || Object.keys(properties).length === 0)
      ) {
        await generateHub();
        return;
      }

      setTabData((prev) => ({ ...prev, [tabKey]: properties || {} }));
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

  // ── Gaps loading ──
  const loadGaps = async () => {
    if (!brandId || token) return;
    setGapsLoading(true);
    try {
      const response = await brands.getBrandHubTab(brandId, "gaps");
      const gapsObj = response?.properties?.gaps;

      if (gapsObj && typeof gapsObj === "object" && !Array.isArray(gapsObj)) {
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
        setGapsData(gapsObj);
      }
    } catch {
      // Gaps loading is best-effort
    } finally {
      setGapsLoading(false);
    }
  };

  // ── Hub generation ──
  const generateHub = async () => {
    if (!brandId) return;
    setIsGenerating(true);
    try {
      await brands.generateBrandHub(brandId);
      setTabData({
        strategy: {},
        positioning: {},
        visual_identity: {},
        voice_content: {},
        gaps: {},
      });
      setGapsData([]);
      setConfidenceLevels({});
      await loadTab(activeTab, { force: true });
      if ((activeTab as UiTabKey) !== "visual_identity") {
        await loadTab("visual_identity" as UiTabKey, { force: true });
      }
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

  // Load gaps eagerly so badges appear on all tabs
  useEffect(() => {
    if (brandId) {
      loadGaps();
    }
  }, [brandId]);

  // Load visual_identity tab eagerly for theming
  useEffect(() => {
    if (brandId) {
      loadTab("visual_identity" as UiTabKey);
    }
  }, [brandId]);

  // Load active tab content
  useEffect(() => {
    if (brandId && activeTab !== "gaps") {
      loadTab(activeTab, { allowGenerate: true });
    }
  }, [brandId, activeTab]);

  // ── Loading state ──
  if (
    brandLoading ||
    !currentBrand ||
    !brandId ||
    isGenerating ||
    tabLoading.visual_identity ||
    (tabLoading[activeTab] && !hasAnyContent)
  ) {
    return (
      <BrandicianLoader
        config={
          isComplete ? LOADER_CONFIGS.brandHubComplete : LOADER_CONFIGS.brandHub
        }
        isComplete={false}
      />
    );
  }

  const currentTabConfig = TAB_CONFIGS.find((t) => t.key === activeTab)!;
  const currentTabError = tabError[activeTab];
  const currentTabLoading = tabLoading[activeTab];
  const currentHub = tabData[activeTab] || {};

  // Extract theme data from visual_identity tab
  const viData = tabData.visual_identity || {};
  const colorPaletteJson =
    typeof viData.color_palette === "string" ? viData.color_palette : undefined;
  const typographyJson =
    typeof viData.typography === "string" ? viData.typography : undefined;

  return (
    <BrandThemeProvider
      colorPaletteJson={colorPaletteJson}
      typographyJson={typographyJson}
    >
      <div
        className="min-h-screen py-8"
        style={{ background: "var(--brand-light)" }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Header — unchanged Brandician styling */}
            <div className="flex justify-between flex-wrap gap-3 items-center mb-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-neutral-800">
                  Brand Hub:{" "}
                  <span className="text-3xl sm:text-4xl font-display font-bold text-[var(--brand-primary)]">
                    {currentBrand.brand_name || currentBrand.name}
                  </span>
                </h1>
                <p className="text-neutral-600 mt-1 text-sm sm:text-base">
                  A single place to explore your brand's strategy, positioning,
                  visual identity, and voice.
                </p>
              </div>
              <div className="flex items-center flex-wrap gap-3">
                <HistoryButton
                  className="!border-[var(--brand-accent)] text-[var(--brand-accent)] hover:!bg-[var(--brand-accent)]"
                  brandId={brandId}
                  size="md"
                />
                <GetHelpButton
                  className="!border-[var(--brand-accent)] text-[var(--brand-accent)] hover:!bg-[var(--brand-accent)]"
                  variant="secondary"
                  size="md"
                />
                {isComplete && !isGuest && (
                  <Button
                    onClick={() => setShareModalOpen(true)}
                    variant="primary"
                    className="hover:!shadow-[0_4px_12px_var(--brand-accent)]"
                    style={{ backgroundColor: "var(--brand-accent)" }}
                    size="md"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Share hub
                  </Button>
                )}
              </div>
            </div>

            {/* Themed content area */}
            <div>
              {/* Error display */}
              {currentTabError && (
                <div className="bh-error">
                  <AlertCircle
                    style={{
                      width: 16,
                      height: 16,
                      marginTop: 2,
                      flexShrink: 0,
                    }}
                  />
                  <span>{currentTabError}</span>
                </div>
              )}

              {/* Generate prompt */}
              {!hasAnyContent && !tabLoading[activeTab] && (
                <div
                  style={{
                    marginBottom: 24,
                    borderRadius: 12,
                    border: "2px dashed var(--brand-supporting)",
                    background: "#fff",
                    padding: 20,
                    textAlign: "center",
                  }}
                >
                  <p className="bh-card-body" style={{ marginBottom: 12 }}>
                    Your Brand Hub hasn't been generated yet.
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

              {/* Tab bar */}
              <BrandHubTabBar
                tabs={TAB_CONFIGS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isGuest={isGuest}
              />

              {/* Tab panel */}
              <BrandHubTabPanel description={currentTabConfig.description}>
                {/* Loading indicator */}
                {(activeTab === "gaps" ? gapsLoading : currentTabLoading) && (
                  <div className="bh-loading">
                    <Loader
                      className="animate-spin"
                      style={{ width: 16, height: 16, marginRight: 8 }}
                    />
                    Loading Brand Hub content...
                  </div>
                )}

                {activeTab === "gaps" ? (
                  /* ── Gaps tab ── */
                  <BrandHubGapsPanel
                    gaps={gapsData}
                    loading={gapsLoading}
                    copiedKey={copiedKey}
                    onCopy={handleCopy}
                  />
                ) : (
                  /* ── Other tabs: property cards ── */
                  currentTabConfig.properties.map((prop) => {
                    const value = currentHub && currentHub[prop.key];
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
                      <BrandHubCard
                        key={prop.key}
                        title={prop.title}
                        helper={prop.helper}
                        propKey={prop.key}
                        content={value}
                        confidence={conf}
                        gapCount={gapCount}
                        isGuest={isGuest}
                        copiedKey={copiedKey}
                        onCopy={handleCopy}
                        brandId={brandId}
                        colorPaletteJson={colorPaletteJson}
                        typographyJson={typographyJson}
                      />
                    );
                  })
                )}
              </BrandHubTabPanel>

              {/* Regenerate Hub Button */}
              {hasAnyContent && !isComplete && !isGuest && (
                <div
                  style={{
                    marginTop: 24,
                    marginBottom: 24,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Button
                    onClick={generateHub}
                    disabled={isGenerating}
                    variant="secondary"
                    size="lg"
                    className="!border-[var(--brand-accent)] text-[var(--brand-accent)] hover:!bg-[var(--brand-accent)]"
                    loading={isGenerating}
                    leftIcon={
                      !isGenerating && <RefreshCw className="h-5 w-5" />
                    }
                    title="Regenerate the Brand Hub from the latest strategy data"
                  >
                    {isGenerating
                      ? "Regenerating Brand Hub..."
                      : "Regenerate Brand Hub"}
                  </Button>
                </div>
              )}

              {/* Proceed to next step */}
              {!isComplete && !isGuest && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="text-center">
                    <h3
                      className="bh-card-title"
                      style={{ fontSize: "var(--bh-fs-h4)", marginBottom: 12 }}
                    >
                      Ready for the next step?
                    </h3>
                    <p
                      className="bh-card-body"
                      style={{ marginBottom: 24, fontSize: "var(--bh-fs-h4)" }}
                    >
                      Once you're happy with your Brand Hub, continue to share
                      feedback and complete the journey.
                    </p>
                    <Button
                      onClick={handleProceedToNext}
                      disabled={isProgressing}
                      variant="primary"
                      style={{ backgroundColor: "var(--brand-accent)" }}
                      className="hover:!shadow-[0_4px_12px_var(--brand-accent)]"
                      size="lg"
                      loading={isProgressing}
                      rightIcon={
                        !isProgressing && <ArrowRight className="h-5 w-5" />
                      }
                    >
                      {isProgressing
                        ? "Processing..."
                        : "Continue to Next Step"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

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
    </BrandThemeProvider>
  );
};

export default BrandHubContainer;
