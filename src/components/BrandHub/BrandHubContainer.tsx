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

type UiTabKey =
  | "strategy"
  | "positioning"
  | "visual_identity"
  | "voice_content";

type HubMap = Record<string, string | null | undefined>;

const BACKEND_TAB_FOR_UI: Record<UiTabKey, string> = {
  strategy: "essence",
  positioning: "positioning",
  visual_identity: "visual_identity",
  voice_content: "expression",
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
];

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
  });
  const [tabLoading, setTabLoading] = useState<Record<UiTabKey, boolean>>({
    strategy: false,
    positioning: false,
    visual_identity: false,
    voice_content: false,
  });
  const [tabError, setTabError] = useState<Record<UiTabKey, string | null>>({
    strategy: null,
    positioning: null,
    visual_identity: null,
    voice_content: null,
  });
  const [hasAnyContent, setHasAnyContent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProgressing, setIsProgressing] = useState(false);

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
      });
      setHasAnyContent(false);
      await loadTab(activeTab);
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

  useEffect(() => {
    if (brandId) {
      loadTab(activeTab, { allowGenerate: true });
    }
  }, [brandId, activeTab]);

  if (brandLoading || !currentBrand || !brandId || isGenerating) {
    return (
      <div className="loader-container">
        <BrandicianLoader />
      </div>
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
            {currentTabLoading && (
              <div className="flex items-center text-neutral-600 text-sm">
                <Loader className="h-4 w-4 animate-spin mr-2" />
                Loading Brand Hub content...
              </div>
            )}

            {currentTabConfig.properties.map((prop) => {
              const value = (currentHub && currentHub[prop.key]) || "";
              const hasContent =
                typeof value === "string" && value.trim().length > 0;

              return (
                <div
                  key={prop.key}
                  className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5"
                >
                  <div className="flex flex-wrap gap-3 items-start justify-between mb-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-neutral-800">
                        {prop.title}
                      </h2>
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
                      This section hasn’t been populated yet.
                    </p>
                  )}
                </div>
              );
            })}
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
