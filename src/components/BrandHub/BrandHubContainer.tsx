import { AlertCircle, ArrowRight, Copy, Loader, RefreshCw } from "lucide-react";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate, useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import { navigateAfterProgress } from "../../lib/navigation";
import { useBrandStore } from "../../store/brand";
import BrandicianLoader from "../common/BrandicianLoader";
import Button from "../common/Button";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import { LOADER_CONFIGS } from "../../lib/loader-constants";

type UiTabKey =
  | "strategy"
  | "positioning"
  | "visual_identity"
  | "voice_content"
  | "gaps";

type HubMap = Record<string, string | null | undefined>;

const BACKEND_TAB_FOR_UI: Record<UiTabKey, string> = {
  strategy: "essence",
  positioning: "positioning",
  visual_identity: "visual_identity",
  voice_content: "expression",
  gaps: "gaps",
};

interface UiTabConfig {
  key: UiTabKey;
  label: string;
  description: string;
  properties: {
    key: string;
    title: string;
    helper?: string;
  }[];
}

const TAB_CONFIGS: UiTabConfig[] = [
  {
    key: "strategy",
    label: "Strategy",
    description:
      "Define the brand’s foundation, personality, and intent – why it exists and what it stands for.",
    properties: [
      {
        key: "mission",
        title: "Mission",
        helper: "Why the brand exists and the change it aims to create.",
      },
      {
        key: "vision",
        title: "Vision",
        helper: "The future the brand is working toward.",
      },
      {
        key: "core_values",
        title: "Brand Values",
        helper: "The beliefs that guide decisions, behaviour, and culture.",
      },
      {
        key: "brand_archetypes",
        title: "Brand Archetypes",
        helper: "The psychological foundation for your personality and style.",
      },
      {
        key: "jobs_to_be_done",
        title: "Jobs-to-Be-Done (JTBD) Summary",
        helper:
          "The functional, emotional, and social needs your brand helps your audience solve.",
      },
    ],
  },
  {
    key: "positioning",
    label: "Positioning",
    description:
      "Clarify who you serve, how you’re different, and why your brand is the obvious choice.",
    properties: [
      {
        key: "target_audience",
        title: "Target Audience Overview",
        helper: "Who the brand is designed to serve, with the right context.",
      },
      {
        key: "ideal_persona",
        title: "Ideal Persona",
        helper:
          "A composite profile of your most valuable customer based on JTBD segments.",
      },
      {
        key: "competitive_snapshot",
        title: "Competitive Snapshot",
        helper:
          "How competitors talk, look, and behave – and where you should differentiate.",
      },
      {
        key: "unique_value_proposition",
        title: "Unique Value Proposition (UVP)",
        helper: "The core promise that clearly sets you apart.",
      },
      {
        key: "messaging_pillars",
        title: "Messaging Pillars",
        helper: "Core narrative anchors that express your UVP across channels.",
      },
    ],
  },
  {
    key: "visual_identity",
    label: "Visual Identity",
    description:
      "Make the brand recognisable, coherent, and emotionally aligned across all visual touchpoints.",
    properties: [
      {
        key: "logo_and_mark_system",
        title: "Logo & Mark System",
        helper:
          "How your logo family works together and how to use it consistently.",
      },
      {
        key: "color_palette",
        title: "Color Palette",
        helper:
          "Core colours, roles, and usage guidelines derived from your archetype and positioning.",
      },
      {
        key: "typography",
        title: "Typography",
        helper:
          "Primary and secondary typefaces, hierarchy, and usage recommendations.",
      },
      {
        key: "imagery_guidelines",
        title: "Imagery Guidelines",
        helper:
          "Photography and illustration styles that match your brand’s tone.",
      },
      {
        key: "iconography",
        title: "Iconography",
        helper:
          "Recommended icon style and behaviour so your UI feels coherent.",
      },
    ],
  },
  {
    key: "voice_content",
    label: "Voice & Content",
    description:
      "Ensure everything you write sounds like you and connects with your audience.",
    properties: [
      {
        key: "tone_of_voice",
        title: "Voice Overview & Tone of Voice",
        helper:
          "A concise definition of how your brand should sound in different contexts.",
      },
      {
        key: "language_guidelines",
        title: "Language Do’s and Don’ts",
        helper:
          "Concrete tips on word choice, formality, and style to keep writing on-brand.",
      },
      {
        key: "messaging_themes",
        title: "Messaging Themes & Framing",
        helper:
          "Recurring storylines and angles to use in headlines, intros, and calls-to-action.",
      },
    ],
  },
  {
    key: "gaps",
    label: "Gaps",
    description:
      "Identify market opportunities and competitive gaps where your brand can stand out.",
    properties: [
      {
        key: "gap_list",
        title: "Market & Competitive Gaps",
        helper:
          "Underserved needs, unmet expectations, and whitespace opportunities your brand can own.",
      },
    ],
  },
];

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

const BrandHubContainer: React.FC = () => {
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

  useEffect(() => {
    if (!brandId) return;
    if (!currentBrand || currentBrand.id !== brandId) {
      selectBrand(brandId);
    }
  }, [brandId, currentBrand, selectBrand]);

  const loadTab = async (
    tabKey: UiTabKey,
    opts?: { allowGenerate?: boolean },
  ) => {
    if (!brandId) return;

    // Avoid refetching if we already have data for this tab
    if (Object.keys(tabData[tabKey] || {}).length > 0) {
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
            (v) => typeof v === "string" && v.trim().length > 0,
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
      const gapList = response?.properties?.gap_list;

      if (gapList && typeof gapList === "object" && !Array.isArray(gapList)) {
        // gap_list is a map: { confidence_levels: {...}, gaps: [...] }
        if (Array.isArray(gapList.gaps)) {
          setGapsData(gapList.gaps);
        }
        if (
          gapList.confidence_levels &&
          typeof gapList.confidence_levels === "object"
        ) {
          setConfidenceLevels(gapList.confidence_levels);
        }
      } else if (Array.isArray(gapList)) {
        // Fallback: gap_list is directly an array
        setGapsData(gapList);
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
      await loadTab(activeTab);
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
              <HistoryButton brandId={brandId} variant="outline" size="md" />
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
                    <div className="flex flex-wrap gap-2 items-center mb-2">
                      <h3 className="text-lg font-semibold text-neutral-800">
                        {gap.name || gap.property}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[gap.priority.toUpperCase()] || "bg-neutral-100 text-neutral-600"}`}
                      >
                        {gap.priority}
                      </span>
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
                const value = (currentHub && currentHub[prop.key]) || "";
                const hasContent =
                  typeof value === "string" && value.trim().length > 0;
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
                    </div>

                    {hasContent ? (
                      <div className="prose prose-sm max-w-none text-neutral-700">
                        <ReactMarkdown>{value as string}</ReactMarkdown>
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
                variant="primary"
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

export default BrandHubContainer;
