import { ChevronDown, Loader, Share2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import MarkdownPreviewer from "../common/MarkDownPreviewer";
import { useNavigate, useParams } from "react-router-dom";
import { brands, backendConfig } from "../../lib/api";
import { getRouteForStatus } from "../../lib/navigation";
import { useBrandStore } from "../../store/brand";
import { BrandAsset, BrandAssetSummary } from "../../types";
import AssetContent from "../common/AssetContent";
import { JTBDDisplay } from "../common/BrandAttributeDisplay";
import CopyButton from "../common/CopyButton";
import GetHelpButton from "../common/GetHelpButton";
import ShareLinkModal from "../common/ShareLinkModal";
import BrandicianLoader from "../common/BrandicianLoader";

interface HistoryStep {
  number: number;
  statusKey: string;
  name: string;
  description: string;
  status: "completed" | "current" | "pending";
  dataLoader: () => Promise<any>;
}

// Route suffix map keyed by status string
const STATUS_ROUTE_MAP: Record<string, string> = {
  questionnaire: "/questionnaire",
  summary: "/summary",
  jtbd: "/jtbd",
  archetype: "/archetype",
  create_survey: "/survey",
  collect_feedback: "/collect-feedback",
  feedback_review_summary: "/feedback-review/summary",
  feedback_review_jtbd: "/feedback-review/jtbd",
  primary_persona_selection: "/feedback-review/primary-persona",
  feedback_review_archetype: "/feedback-review/archetype",
  pick_name: "/pick-name",
  create_visual_identity: "/create-visual-identity",
  create_hub: "/create-hub",
  create_assets: "/create-assets",
  testimonial: "/testimonial",
  payment: "/payment",
};

const HistoryContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const {
    currentBrand,
    selectBrand,
    isLoading: brandLoading,
  } = useBrandStore();

  const [expandedSteps, setExpandedSteps] = useState<{
    [key: number]: boolean;
  }>({});
  const [stepData, setStepData] = useState<{ [key: number]: any }>({});
  const [loadingSteps, setLoadingSteps] = useState<{ [key: number]: boolean }>(
    {},
  );
  const [revertModalOpen, setRevertModalOpen] = useState(false);
  const [revertTargetStep, setRevertTargetStep] = useState<number | null>(null);
  const [isReverting, setIsReverting] = useState(false);

  // State for expandable assets
  const [expandedAssets, setExpandedAssets] = useState<{
    [key: string]: boolean;
  }>({});
  const [loadedAssets, setLoadedAssets] = useState<{
    [key: string]: BrandAsset;
  }>({});
  const [loadingAssets, setLoadingAssets] = useState<{
    [key: string]: boolean;
  }>({});

  // State for share modal
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Config state
  const [devMode, setDevMode] = useState(false);
  const [statusSequence, setStatusSequence] = useState<
    Array<{ status: string; description: string }>
  >([]);

  useEffect(() => {
    // Always reload brand data when entering history page to ensure we have the latest status
    if (brandId) {
      selectBrand(brandId);
    }
  }, [brandId, selectBrand]);

  // Fetch config (dev mode + status sequence)
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configData = await backendConfig.getConfig();
        setDevMode(configData.dev_mode);
        setStatusSequence(configData.status_sequence);
      } catch (error) {
        console.error("Failed to fetch config:", error);
      }
    };
    fetchConfig();
  }, []);

  // Get current step index from the status sequence
  const getCurrentStepNumber = (status: string): number => {
    const index = statusSequence.findIndex((s) => s.status === status);
    return index >= 0 ? index : 0;
  };

  // Get status string from step number (sequence index)
  const getStatusFromStepNumber = (stepNumber: number): string => {
    return statusSequence[stepNumber]?.status || "questionnaire";
  };

  // Get route suffix from step number
  const getRouteFromStepNumber = (stepNumber: number): string => {
    const status = getStatusFromStepNumber(stepNumber);
    return STATUS_ROUTE_MAP[status] || "/questionnaire";
  };

  // Step configuration map keyed by status string
  const STEP_CONFIG: Record<
    string,
    { name: string; description: string; dataLoader: () => Promise<any> }
  > = useMemo(
    () => ({
      questionnaire: {
        name: "Questionnaire",
        description: "Brand questionnaire responses",
        dataLoader: async () => {
          if (!brandId) return null;
          const answersResponse = await brands.getAnswers(brandId);
          let answers = answersResponse;
          if (answersResponse?.answers) {
            answers = answersResponse.answers;
          }
          return { type: "questionnaire", answers };
        },
      },
      summary: {
        name: "Summary Generation",
        description: "Initial brand summary",
        dataLoader: async () => {
          if (!brandId) return null;
          const summary = await brands.getSummary(brandId);
          return { type: "summary", data: summary };
        },
      },
      jtbd: {
        name: "Jobs to be done / Customer Needs",
        description: "JTBD / Customer Needs analysis results",
        dataLoader: async () => {
          if (!brandId) return null;
          const jtbd = await brands.getJTBD(brandId);
          return { type: "jtbd", data: jtbd };
        },
      },
      archetype: {
        name: "Brand Archetype",
        description: "Brand Archetype analysis",
        dataLoader: async () => {
          if (!brandId) return null;
          const archetype = await brands.getArchetype(brandId);
          return { type: "archetype", data: archetype };
        },
      },
      create_survey: {
        name: "Survey Creation",
        description: "Customer survey questions",
        dataLoader: async () => {
          if (!brandId) return null;
          const survey = await brands.getSurvey(brandId);
          return { type: "survey", data: survey };
        },
      },
      collect_feedback: {
        name: "Feedback Collection",
        description: "Survey responses and feedback",
        dataLoader: async () => {
          if (!brandId) return null;
          const surveyStatus = await brands.getSurveyStatus(brandId);
          const survey = await brands.getSurvey(brandId);
          return { type: "feedback", data: surveyStatus, survey };
        },
      },
      feedback_review_summary: {
        name: "Feedback Review - Summary",
        description: "Updated summary based on feedback",
        dataLoader: async () => {
          if (!brandId) return null;
          const summary = await brands.getSummary(brandId);
          return { type: "summary", data: summary };
        },
      },
      feedback_review_jtbd: {
        name: "Feedback Review - JTBD / Customer Needs",
        description: "Updated JTBD / Customer Needs based on feedback",
        dataLoader: async () => {
          if (!brandId) return null;
          const jtbd = await brands.getJTBD(brandId);
          return { type: "jtbd", data: jtbd };
        },
      },
      primary_persona_selection: {
        name: "Primary Persona Selection",
        description: "Selecting and enriching the primary persona",
        dataLoader: async () => {
          if (!brandId) return null;
          const persona = await brands.getPrimaryPersona(brandId);
          return { type: "jtbd", data: { personas: { primary: persona } } };
        },
      },
      feedback_review_archetype: {
        name: "Feedback Review - Archetype",
        description: "Brand archetype determination",
        dataLoader: async () => {
          if (!brandId) return null;
          const archetype = await brands.getArchetype(brandId);
          return { type: "archetype", data: archetype };
        },
      },
      pick_name: {
        name: "Name Selection",
        description: "Brand name selection and domain registration",
        dataLoader: async () => {
          if (!brandId) return null;
          return {
            type: "name_selection",
            brandName: currentBrand?.brand_name,
          };
        },
      },
      create_visual_identity: {
        name: "Visual Identity",
        description: "Visual Identity section",
        dataLoader: async () => {
          if (!brandId) return null;
          const response = await brands.getBrandHubTab(
            brandId,
            "visual_identity",
          );
          return { type: "visual_identity", data: response };
        },
      },
      create_hub: {
        name: "Brand Hub",
        description: "Brand Hub",
        dataLoader: async () => {
          if (!brandId) return null;
          const response = await brands.getBrandHubTab(brandId, "essence");
          return { type: "brand_hub", data: response };
        },
      },
      create_assets: {
        name: "Asset Creation",
        description: "Brand assets (logos, colors, etc.)",
        dataLoader: async () => {
          if (!brandId) return null;
          const response = await brands.listAssets(brandId);
          return { type: "assets", data: response };
        },
      },
      testimonial: {
        name: "Testimonial",
        description: "User feedback and testimonial",
        dataLoader: async () => {
          if (!brandId) return null;
          return { type: "testimonial", data: currentBrand?.feedback };
        },
      },
      payment: {
        name: "Payment",
        description: "Payment processing (Dev Mode)",
        dataLoader: async () => {
          if (!brandId) return null;
          return {
            type: "payment",
            data: {
              payment_complete: currentBrand?.payment_complete,
            },
          };
        },
      },
    }),
    [brandId, currentBrand],
  );

  const currentStepNumber = currentBrand
    ? getCurrentStepNumber(currentBrand.current_status || "")
    : 0;

  // Build steps dynamically from statusSequence, filtering out new_brand and completed
  const steps: HistoryStep[] = useMemo(() => {
    return statusSequence
      .map((seqItem, index) => ({ ...seqItem, index }))
      .filter(
        (seqItem) =>
          seqItem.status !== "new_brand" && seqItem.status !== "completed",
      )
      .map((seqItem) => {
        const config = STEP_CONFIG[seqItem.status];
        return {
          number: seqItem.index,
          statusKey: seqItem.status,
          name: config?.name || seqItem.status.replace(/_/g, " "),
          description: config?.description || seqItem.description,
          status: "completed" as const,
          dataLoader: config?.dataLoader || (async () => null),
        };
      });
  }, [statusSequence, STEP_CONFIG]);

  // Filter steps: hide testimonial and payment in production mode
  const visibleSteps = devMode
    ? steps
    : steps.filter(
        (s) => s.statusKey !== "testimonial" && s.statusKey !== "payment",
      );

  const toggleStep = async (stepNumber: number) => {
    const isCurrentlyExpanded = expandedSteps[stepNumber];

    // Toggle expansion
    setExpandedSteps((prev) => ({
      ...prev,
      [stepNumber]: !isCurrentlyExpanded,
    }));

    // Load data if expanding and not already loaded
    if (!isCurrentlyExpanded && !stepData[stepNumber]) {
      setLoadingSteps((prev) => ({ ...prev, [stepNumber]: true }));
      try {
        const step = visibleSteps.find((s) => s.number === stepNumber);
        if (step) {
          const data = await step.dataLoader();
          setStepData((prev) => ({ ...prev, [stepNumber]: data }));
        }
      } catch (error) {
        console.error(`Failed to load data for step ${stepNumber}:`, error);
        setStepData((prev) => ({
          ...prev,
          [stepNumber]: { error: "Failed to load data" },
        }));
      } finally {
        setLoadingSteps((prev) => ({ ...prev, [stepNumber]: false }));
      }
    }
  };

  const handleRevertClick = (stepNumber: number) => {
    setRevertTargetStep(stepNumber);
    setRevertModalOpen(true);
  };

  const handleRevertConfirm = async () => {
    if (!brandId || !revertTargetStep) return;

    setIsReverting(true);
    try {
      console.log(`Reverting brand ${brandId} to step ${revertTargetStep}`);
      const targetStatus = getStatusFromStepNumber(revertTargetStep);
      console.log(`Target status: ${targetStatus}`);

      await brands.revertToStatus(brandId, targetStatus as any);
      console.log(`Brand reverted successfully to ${targetStatus}`);

      // Reload brand data
      await selectBrand(brandId);
      console.log(`Brand data reloaded`);

      // Navigate to the target step
      const route = getRouteFromStepNumber(revertTargetStep);
      console.log(`Navigating to ${route}`);
      navigate(`/brands/${brandId}${route}`);
    } catch (error: any) {
      console.error("Failed to revert brand:", error);
      alert(
        `Failed to revert: ${
          error.response?.data?.message || error.message || "Unknown error"
        }`,
      );
    } finally {
      setIsReverting(false);
      setRevertModalOpen(false);
      setRevertTargetStep(null);
    }
  };

  const handleRevertCancel = () => {
    setRevertModalOpen(false);
    setRevertTargetStep(null);
  };

  // Toggle and load individual assets
  const toggleAsset = async (assetId: string) => {
    const isCurrentlyExpanded = expandedAssets[assetId];

    // Toggle expansion
    setExpandedAssets((prev) => ({
      ...prev,
      [assetId]: !isCurrentlyExpanded,
    }));

    // Load asset details if expanding and not already loaded
    if (!isCurrentlyExpanded && !loadedAssets[assetId] && brandId) {
      setLoadingAssets((prev) => ({ ...prev, [assetId]: true }));
      try {
        const asset = await brands.getAsset(brandId, assetId);
        setLoadedAssets((prev) => ({ ...prev, [assetId]: asset }));
      } catch (error) {
        console.error(`Failed to load asset ${assetId}:`, error);
      } finally {
        setLoadingAssets((prev) => ({ ...prev, [assetId]: false }));
      }
    }
  };

  const renderStepContent = (stepNumber: number) => {
    const data = stepData[stepNumber];
    const isLoading = loadingSteps[stepNumber];

    if (isLoading) {
      return (
        <div className="p-4 text-center">
          <div className="animate-spin text-primary-600 text-xl inline-block">
            ⟳
          </div>
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      );
    }

    if (!data) {
      return null;
    }

    if (data.error) {
      return (
        <div className="p-4 bg-red-50 text-red-600 rounded">{data.error}</div>
      );
    }

    // Render based on data type
    switch (data.type) {
      case "questionnaire": {
        // Normalize answers into an ordered list. Each Answer record carries
        // the question text that was shown at answer time — render that
        // rather than re-joining against the live questionnaire, which can
        // drift (e.g. when the BRAND_QUESTIONNAIRE prompt is updated).
        const answerList: Array<{
          id?: string;
          question?: string;
          answer?: string;
        }> = Array.isArray(data.answers)
          ? data.answers
          : data.answers
            ? Object.values(data.answers)
            : [];
        const orderedAnswers = [...answerList].sort((a, b) => {
          const na = parseInt(a.id ?? "", 10);
          const nb = parseInt(b.id ?? "", 10);
          if (!isNaN(na) && !isNaN(nb)) return na - nb;
          return (a.id ?? "").localeCompare(b.id ?? "");
        });

        const formatQuestionnaire = () =>
          orderedAnswers
            .map((a, idx) => {
              const questionText = a.question || "(question text not stored)";
              const answerText = a.answer || "No answer recorded";
              return `${idx + 1}. ${questionText}\n${answerText}`;
            })
            .join("\n\n");

        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">
                Questions & Answers:
              </h4>
              <CopyButton text={formatQuestionnaire()} />
            </div>
            {orderedAnswers.length > 0 ? (
              <ol className="space-y-4 list-none">
                {orderedAnswers.map((a, idx) => (
                  <li
                    key={a.id ?? idx}
                    className="border-l-4 border-primary-300 pl-4 py-3"
                  >
                    <div className="flex gap-3">
                      <span className="font-bold text-primary-600 flex-shrink-0">
                        {idx + 1}.
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">
                          {a.question || "(question text not stored)"}
                        </p>
                        {a.answer ? (
                          <p className="text-gray-700 bg-gray-50 p-3 rounded">
                            {a.answer}
                          </p>
                        ) : (
                          <p className="text-gray-500 italic text-sm">
                            No answer recorded
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-500 italic">No answers recorded</p>
            )}
          </div>
        );
      }

      case "jtbd":
        // Format JTBD for copying
        const formatJTBD = () => {
          if (!data.data) return "";

          let text = "";

          // Add personas
          if (
            data.data.personas &&
            Object.keys(data.data.personas).length > 0
          ) {
            text += "PERSONAS:\n\n";
            Object.entries(data.data.personas).forEach(
              ([_, persona]: [string, any]) => {
                text += `${persona.name}\n${persona.description}\n\n`;
              },
            );
          }

          // Add drivers
          if (data.data.drivers) {
            text += "DRIVERS:\n\n";
            text += data.data.drivers;
          }

          return text.trim();
        };

        return (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">
                Jobs to be done / Customer Needs:
              </h4>
              <CopyButton text={formatJTBD()} />
            </div>
            <JTBDDisplay jtbd={data.data} />
          </div>
        );

      case "survey":
        // Handle different survey data structures
        const surveyQuestions =
          data.data?.results?.questions ||
          data.data?.questions ||
          data.questions ||
          [];
        const surveyUrl = data.data?.results?.url;

        // Format survey questions for copying
        const formatSurveyQuestions = () => {
          if (surveyQuestions.length === 0) return "";

          return surveyQuestions
            .map((q: any, idx: number) => {
              let text = `${idx + 1}. ${
                q.text || q.question || "Question"
              }\nType: ${q.type || "text"}`;
              if (q.options && q.options.length > 0) {
                text += "\nOptions:\n";
                q.options.forEach((opt: any) => {
                  const optionText =
                    typeof opt === "string" ? opt : opt.text || opt.value;
                  text += `  - ${optionText}\n`;
                });
              }
              return text.trimEnd();
            })
            .join("\n\n");
        };

        return (
          <div className="p-4 space-y-3">
            {surveyUrl && (
              <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Survey URL:
                </h4>
                <a
                  href={surveyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline break-all text-sm"
                >
                  {surveyUrl}
                </a>
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">Survey Questions:</h4>
              <CopyButton text={formatSurveyQuestions()} />
            </div>
            {surveyQuestions.length > 0 ? (
              <div className="space-y-2">
                {surveyQuestions.map((q: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded">
                    <p className="font-medium text-gray-800">
                      {q.text || q.question || "Question"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Type: {q.type || "text"}
                    </p>
                    {q.options && q.options.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Options:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                          {q.options.map((opt: any, optIdx: number) => (
                            <li key={optIdx}>
                              {typeof opt === "string"
                                ? opt
                                : opt.text || opt.value}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-gray-500">No survey questions available</p>
                {data.data && (
                  <pre className="text-xs text-gray-400 mt-2 overflow-auto max-h-60">
                    {JSON.stringify(data.data, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        );

      case "feedback":
        const handleDownloadCsv = async () => {
          if (!brandId) return;
          try {
            const blob = await brands.downloadSurveyResponsesCsv(brandId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${
              currentBrand?.name || "brand"
            }_survey_responses.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          } catch (error) {
            console.error("Failed to download CSV:", error);
            alert("Failed to download survey responses");
          }
        };

        return (
          <div className="p-4 space-y-3">
            <h4 className="font-semibold text-gray-900">Feedback Status:</h4>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-700">
                Responses: {data.data?.number_of_responses || 0} /{" "}
                {data.data?.min_responses_required || 0}
              </p>
              <p className="text-gray-700 mt-2">
                Status: {data.data?.status || "N/A"}
              </p>
              {(data.data?.number_of_responses || 0) > 0 && (
                <p className="text-gray-700 mt-2">
                  <button
                    onClick={handleDownloadCsv}
                    className="text-primary-600 hover:text-primary-700 underline cursor-pointer bg-transparent border-none p-0"
                  >
                    Download CSV with responses
                  </button>
                </p>
              )}
            </div>
          </div>
        );

      case "feedback_review":
        return (
          <div className="p-4 space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Summary:</h4>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {data.summary?.summary ||
                    data.summary ||
                    "No summary available"}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Archetype:</h4>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-gray-700">
                  {[
                    data.archetype?.primary,
                    data.archetype?.secondary,
                    data.archetype?.combined_expression,
                  ]
                    .filter(Boolean)
                    .join("\n\n") ||
                    data.archetype ||
                    "No archetype available"}
                </p>
              </div>
            </div>
          </div>
        );

      case "summary":
        const summaryText =
          data.data?.summary || data.data || "No summary available";
        return (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">Brand Summary:</h4>
              <CopyButton text={summaryText} />
            </div>
            <div className="bg-gray-50 p-4 rounded prose prose-sm max-w-none text-gray-700">
              <MarkdownPreviewer markdown={summaryText} />
            </div>
          </div>
        );

      case "archetype":
        const archetypeText =
          [
            data.data?.primary,
            data.data?.secondary,
            data.data?.combined_expression,
          ]
            .filter(Boolean)
            .join("\n\n") ||
          data.data ||
          "No archetype available";
        return (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">Brand Archetype:</h4>
              <CopyButton text={archetypeText} />
            </div>
            <div className="bg-gray-50 p-4 rounded prose prose-sm max-w-none text-gray-700">
              <MarkdownPreviewer markdown={archetypeText} />
            </div>
          </div>
        );

      case "name_selection":
        return (
          <div className="p-4 space-y-3">
            <h4 className="font-semibold text-gray-900">
              Selected Brand Name:
            </h4>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-2xl font-bold text-primary-600">
                {data.brandName || "N/A"}
              </p>
            </div>
          </div>
        );

      case "assets":
        return (
          <div className="p-4 space-y-3">
            <div className="flex items-center flex-wrap gap-2 justify-between mb-2">
              <h4 className="font-semibold text-gray-900">Brand Assets:</h4>
              {brandId && (
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </button>
              )}
            </div>
            {data.data?.assets && Array.isArray(data.data.assets) ? (
              <div className="space-y-3">
                {data.data.assets.map((assetSummary: BrandAssetSummary) => {
                  const isExpanded = expandedAssets[assetSummary.id];
                  const isLoading = loadingAssets[assetSummary.id];
                  const loadedAsset = loadedAssets[assetSummary.id];

                  return (
                    <div
                      key={assetSummary.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Asset Header - Always visible, clickable */}
                      <button
                        onClick={() => toggleAsset(assetSummary.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          >
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          </div>
                          <h5 className="font-medium text-gray-800 capitalize text-left">
                            {assetSummary.type.replace(/_/g, " ")}
                          </h5>
                        </div>
                      </button>

                      {/* Asset Content - Expandable */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-gray-100">
                          {isLoading && (
                            <div className="flex items-center justify-center py-8 text-gray-600">
                              <Loader className="animate-spin h-5 w-5 mr-2" />
                              Loading asset details...
                            </div>
                          )}

                          {!isLoading && loadedAsset && (
                            <div className="pt-4 space-y-4">
                              {loadedAsset.description && (
                                <div>
                                  <h6 className="font-medium text-gray-700 mb-1">
                                    Description:
                                  </h6>
                                  <p className="text-gray-600 text-sm">
                                    {loadedAsset.description}
                                  </p>
                                </div>
                              )}

                              {loadedAsset.content && (
                                <div>
                                  <h6 className="font-medium text-gray-700 mb-2">
                                    Content:
                                  </h6>
                                  <AssetContent asset={loadedAsset} />
                                </div>
                              )}

                              {loadedAsset.url && (
                                <div>
                                  <h6 className="font-medium text-gray-700 mb-1">
                                    URL:
                                  </h6>
                                  <a
                                    href={loadedAsset.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-600 hover:text-primary-700 underline text-sm break-all"
                                  >
                                    {loadedAsset.url}
                                  </a>
                                </div>
                              )}

                              {loadedAsset.created_at && (
                                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                                  Created:{" "}
                                  {new Date(
                                    loadedAsset.created_at,
                                  ).toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}

                          {!isLoading && !loadedAsset && (
                            <div className="py-4 text-center text-red-600">
                              Failed to load asset details
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-gray-500">No assets available</p>
              </div>
            )}
          </div>
        );

      case "testimonial":
        return (
          <div className="p-4 space-y-3">
            <h4 className="font-semibold text-gray-900 mb-2">
              User Testimonial:
            </h4>
            {data.data ? (
              <div className="bg-gray-50 p-4 rounded space-y-3">
                {data.data.rating && (
                  <div>
                    <p className="text-sm text-gray-600">Rating:</p>
                    <p className="text-yellow-500 text-xl">
                      {"★".repeat(data.data.rating)}
                      {"☆".repeat(5 - data.data.rating)}
                    </p>
                  </div>
                )}
                {data.data.testimonial && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Public Testimonial:
                    </p>
                    <p className="text-gray-700">{data.data.testimonial}</p>
                  </div>
                )}
                {data.data.feedback && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Internal Feedback:
                    </p>
                    <p className="text-gray-700">{data.data.feedback}</p>
                  </div>
                )}
                {data.data.amount && (
                  <div>
                    <p className="text-sm text-gray-600">
                      Contribution Amount:
                    </p>
                    <p className="text-gray-700 font-medium">
                      ${data.data.amount}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-gray-500">No testimonial available</p>
              </div>
            )}
          </div>
        );

      case "payment":
        return (
          <div className="p-4 space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
              <p className="text-amber-800 text-sm font-medium">
                Dev Mode Only - This step is hidden in production
              </p>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Payment Status:
            </h4>
            <div className="bg-gray-50 p-4 rounded">
              {data.data?.payment_complete !== null &&
              data.data?.payment_complete !== undefined ? (
                <div>
                  <p className="text-sm text-gray-600">Amount Paid:</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${data.data.payment_complete}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">No payment recorded</p>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-gray-50 rounded">
            <pre className="whitespace-pre-wrap text-sm text-gray-700">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  if (brandLoading || !currentBrand || statusSequence.length === 0) {
    return (
      <div className="loader-container">
        <BrandicianLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-[32px]">
      <div className="container mx-auto px-[27px]">
        <div className="mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-[27px]">
            <div>
              <p className="text-[length:var(--fs-base)] text-[var(--color-secondary)] mb-[3px]">
                {currentBrand.brand_name || currentBrand.name}
              </p>
              <h1
                className="font-bold leading-[1.15] text-[var(--color-text)] mb-[3px]"
                style={{
                  fontFamily: "var(--title-font-family)",
                  fontSize: "var(--fs-xxl)",
                }}
              >
                Brand creation history
              </h1>
              <p className="text-[length:var(--fs-base)] text-[var(--color-light)]">
                Review all steps and documents from your brand creation journey
              </p>
            </div>
            <GetHelpButton variant="secondary" size="md" />
          </div>

          {/* Steps List */}
          <div className="flex flex-col gap-[7px]">
            {visibleSteps.map((step) => {
              const isCompleted = step.number < currentStepNumber;
              const isActive = step.number === currentStepNumber;
              const isPending = !isCompleted && !isActive;

              return (
                <div
                  key={step.number}
                  className="bg-[var(--color-white)] rounded-[9px] overflow-hidden"
                >
                  {/* Step Header */}
                  <div
                    onClick={() => isCompleted && toggleStep(step.number)}
                    className={`grid grid-cols-[43px_1fr_auto] items-start py-[13px] gap-4 px-[16px] select-none ${
                      isCompleted ? "cursor-pointer group" : "cursor-default"
                    }`}
                  >
                    {/* Number circle */}
                    <div
                      className={`w-[44px] h-[44px] rounded-full flex items-center justify-center font-bold text-[0.73rem] mt-[1px] shrink-0 ${
                        isCompleted
                          ? "bg-[var(--color-primary)] text-[var(--color-white)]"
                          : isActive
                            ? "bg-[var(--color-warning)] text-[var(--color-text)]"
                            : "border-2 border-[var(--color-light)] text-[var(--color-light)]"
                      }`}
                      style={{ fontFamily: "var(--title-font-family)" }}
                    >
                      {step.number}
                    </div>

                    {/* Step meta */}
                    <div className="pr-[11px]">
                      <div
                        className={`font-bold text-[length:var(--fs-base)] leading-[1.3] transition-colors duration-150 ${
                          isPending
                            ? "text-[var(--color-light)]"
                            : "text-[var(--color-text)]"
                        } ${isCompleted ? "group-hover:text-[var(--color-primary)]" : ""}`}
                        style={{ fontFamily: "var(--title-font-family)" }}
                      >
                        {step.name}
                      </div>
                      <div className="text-[length:var(--fs-sm)] text-[var(--color-light)] mt-[1px]">
                        {step.description}
                      </div>
                      {isCompleted && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRevertClick(step.number);
                          }}
                          style={{
                            lineHeight: 1.6,
                          }}
                          className="mt-[7px] inline-block text-[0.47rem] font-semibold tracking-[0.03em] text-[var(--color-primary)] bg-[rgba(253,97,94,0.07)] border border-[rgba(253,97,94,0.2)] rounded-[4px] px-[7px] py-[3px] cursor-pointer transition-colors duration-200 hover:bg-[rgba(253,97,94,0.14)]"
                        >
                          Revert to this step
                        </button>
                      )}
                      {isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentBrand && brandId) {
                              let route = getRouteForStatus(
                                brandId,
                                currentBrand.current_status as any,
                              );
                              if (
                                currentBrand.current_status === "questionnaire"
                              ) {
                                route = `/brands/${brandId}/questionnaire?summary=1`;
                              }
                              navigate(route);
                            }
                          }}
                          className="mt-[10px] inline-flex items-center gap-[6px] text-[0.52rem] font-semibold tracking-[0.05em] uppercase text-[var(--color-white)] bg-[var(--color-primary)] border-none rounded-[8px] px-[17px] py-[5px] cursor-pointer transition-colors duration-200 hover:bg-[#fc4945]"
                          style={{
                            lineHeight: 1.6,
                            fontFamily: "'Source Sans 3', sans-serif",
                          }}
                        >
                          Continue
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 14 14"
                            fill="none"
                          >
                            <path
                              d="M3 7h8M8 4l3 3-3 3"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Right column: badges + chevron */}
                    <div className="flex items-center pt-[8px] gap-[8px] shrink-0">
                      {isActive && (
                        <span
                          className="text-[0.47rem] font-semibold tracking-[0.05em] uppercase px-[7px] py-[3px] rounded-[13px] bg-[rgba(244,195,67,0.15)] text-[#8a6800] border border-[rgba(244,195,67,0.4)]"
                          style={{ lineHeight: 1.6 }}
                        >
                          In progress
                        </span>
                      )}
                      {isPending && (
                        <span className="text-[0.47rem] font-semibold tracking-[0.05em] uppercase px-[7px] py-[3px] rounded-[13px] bg-[var(--color-bg)] text-[var(--color-light)] border border-[var(--color-light)]">
                          Pending
                        </span>
                      )}
                      {isCompleted && (
                        <ChevronDown
                          className={`w-[12px] h-[12px] text-[var(--color-light)] transition-transform duration-[250ms] ease-in-out shrink-0 ${
                            expandedSteps[step.number] ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Step Content */}
                  {isCompleted && expandedSteps[step.number] && (
                    <div className="border-t border-[var(--color-bg)]">
                      {renderStepContent(step.number)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Revert Confirmation Modal */}
      {revertModalOpen && (
        <div
          className="fixed inset-0 bg-[rgba(56,50,54,0.4)] flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isReverting)
              handleRevertCancel();
          }}
        >
          <div className="bg-[var(--color-white)] rounded-[11px] p-[32px_36px] max-w-[420px] w-[calc(100%-27px)] shadow-[0_5px_21px_rgba(56,50,54,0.18)]">
            <p
              className="font-bold text-[length:var(--fs-md)] text-[var(--color-text)] mb-[8px]"
              style={{ fontFamily: "var(--title-font-family)" }}
            >
              Revert to this step?
            </p>
            <p className="text-[length:var(--fs-sm)] text-[var(--color-text)] leading-[1.6] mb-[19px]">
              All assets and documents generated after this step will be lost.
              <br />
              <br />
              Are you sure you want to revert to{" "}
              <strong className="font-bold text-[var(--color-primary)]">
                Step {revertTargetStep}
              </strong>
              ?
            </p>
            <div className="flex gap-[8px] justify-end">
              <button
                onClick={handleRevertCancel}
                disabled={isReverting}
                className="text-[0.53rem] font-semibold tracking-[0.05em] uppercase text-[var(--color-secondary)] bg-transparent border-2 border-[var(--color-secondary)] rounded-[5px] px-[18px] py-[9px] cursor-pointer transition-all duration-200 hover:bg-[var(--color-secondary)] hover:text-[var(--color-white)] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "'Source Sans 3', sans-serif",
                  lineHeight: 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRevertConfirm}
                disabled={isReverting}
                className="text-[0.53rem] font-semibold tracking-[0.05em] uppercase text-[var(--color-white)] bg-[var(--color-primary)] border-none rounded-[8px] px-[18px] py-[9px] cursor-pointer transition-colors duration-200 hover:bg-[#fc4945] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-[5px]"
                style={{
                  fontFamily: "'Source Sans 3', sans-serif",
                  lineHeight: 1,
                }}
              >
                {isReverting ? (
                  <>
                    <div className="animate-spin h-[11px] w-[11px] border-2 border-white border-t-transparent rounded-full"></div>
                    Reverting...
                  </>
                ) : (
                  "Yes, revert"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Link Modal */}
      {brandId && (
        <ShareLinkModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          brandId={brandId}
          brandName={currentBrand?.brand_name || currentBrand?.name}
        />
      )}
    </div>
  );
};

export default HistoryContainer;
