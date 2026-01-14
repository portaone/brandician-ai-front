import { ChevronDown, ChevronUp, Loader, Share2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { brands, backendConfig } from "../../lib/api";
import { getRouteForStatus } from "../../lib/navigation";
import { useBrandStore } from "../../store/brand";
import { BrandAsset, BrandAssetSummary } from "../../types";
import AssetContent from "../common/AssetContent";
import { JTBDDisplay } from "../common/BrandAttributeDisplay";
import CopyButton from "../common/CopyButton";
import DownloadAllButton from "../common/DownloadAllButton";
import GetHelpButton from "../common/GetHelpButton";
import ShareLinkModal from "../common/ShareLinkModal";

interface HistoryStep {
  number: number;
  name: string;
  description: string;
  status: "completed" | "current" | "pending";
  dataLoader: () => Promise<any>;
}

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
    {}
  );
  const [revertModalOpen, setRevertModalOpen] = useState(false);
  const [revertTargetStep, setRevertTargetStep] = useState<number | null>(null);
  const [isReverting, setIsReverting] = useState(false);

  // State for expandable assets in step 10
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

  // Dev mode state
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    // Always reload brand data when entering history page to ensure we have the latest status
    if (brandId) {
      selectBrand(brandId);
    }
  }, [brandId, selectBrand]);

  // Fetch dev mode config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configData = await backendConfig.getConfig();
        setDevMode(configData.dev_mode);
      } catch (error) {
        console.error("Failed to fetch config:", error);
      }
    };
    fetchConfig();
  }, []);

  // Map brand status to current step number (the step being worked on)
  const getCurrentStepNumber = (status: string): number => {
    const statusMap: { [key: string]: number } = {
      new_brand: 0,
      questionnaire: 1,
      summary: 2,
      jtbd: 3,
      create_survey: 4,
      collect_feedback: 5,
      feedback_review_summary: 6,
      feedback_review_jtbd: 7,
      feedback_review_archetype: 8,
      pick_name: 9,
      create_assets: 10,
      testimonial: 11,
      payment: devMode ? 12 : 11, // Show as step 12 in dev mode
      completed: devMode ? 13 : 11, // After payment in dev mode
    };
    return statusMap[status] || 0;
  };

  // Map step number to brand status
  const getStatusFromStepNumber = (stepNumber: number): string => {
    const stepStatusMap: { [key: number]: string } = {
      1: "questionnaire",
      2: "summary",
      3: "jtbd",
      4: "create_survey",
      5: "collect_feedback",
      6: "feedback_review_summary",
      7: "feedback_review_jtbd",
      8: "feedback_review_archetype",
      9: "pick_name",
      10: "create_assets",
      11: "testimonial",
      12: "payment",
    };
    return stepStatusMap[stepNumber] || "questionnaire";
  };

  // Map step number to route
  const getRouteFromStepNumber = (stepNumber: number): string => {
    const routeMap: { [key: number]: string } = {
      1: "/questionnaire",
      2: "/summary",
      3: "/jtbd",
      4: "/survey",
      5: "/collect-feedback",
      6: "/feedback-review/summary",
      7: "/feedback-review/jtbd",
      8: "/feedback-review/archetype",
      9: "/pick-name",
      10: "/create-assets",
      11: "/testimonial",
      12: "/payment",
    };
    return routeMap[stepNumber] || "/questionnaire";
  };

  const currentStepNumber = currentBrand
    ? getCurrentStepNumber(currentBrand.current_status || "")
    : 0;

  const steps: HistoryStep[] = [
    {
      number: 1,
      name: "Questionnaire",
      description: "Brand questionnaire responses",
      status: "completed",
      dataLoader: async () => {
        if (!brandId) return null;
        const questionsResponse = await brands.getQuestions(brandId);
        const answersResponse = await brands.getAnswers(brandId);

        // Handle both array responses and object-wrapped responses
        const questions = Array.isArray(questionsResponse)
          ? questionsResponse
          : questionsResponse?.questions || [];

        // Answers might be returned as an object/dictionary with question IDs as keys
        let answers = answersResponse;
        if (answersResponse?.answers) {
          answers = answersResponse.answers;
        }

        return { type: "questionnaire", questions, answers };
      },
    },
    {
      number: 2,
      name: "Summary Generation",
      description: "Initial brand summary",
      status: "completed",
      dataLoader: async () => {
        if (!brandId) return null;
        const summary = await brands.getSummary(brandId);
        return { type: "summary", data: summary };
      },
    },
    {
      number: 3,
      name: "Jobs-to-be-Done",
      description: "JTBD analysis results",
      status: "completed",
      dataLoader: async () => {
        if (!brandId) return null;
        const jtbd = await brands.getJTBD(brandId);
        return { type: "jtbd", data: jtbd };
      },
    },
    {
      number: 4,
      name: "Survey Creation",
      description: "Customer survey questions",
      status: "completed",
      dataLoader: async () => {
        if (!brandId) return null;
        const survey = await brands.getSurvey(brandId);
        return { type: "survey", data: survey };
      },
    },
    {
      number: 5,
      name: "Feedback Collection",
      description: "Survey responses and feedback",
      status: "completed",
      dataLoader: async () => {
        if (!brandId) return null;
        const surveyStatus = await brands.getSurveyStatus(brandId);
        const survey = await brands.getSurvey(brandId);
        return { type: "feedback", data: surveyStatus, survey };
      },
    },
    {
      number: 6,
      name: "Feedback Review - Summary",
      description: "Updated summary based on feedback",
      status: "completed",
      dataLoader: async () => {
        if (!brandId) return null;
        const summary = await brands.getSummary(brandId);
        return { type: "summary", data: summary };
      },
    },
    {
      number: 7,
      name: "Feedback Review - JTBD",
      description: "Updated JTBD based on feedback",
      status: "completed",
      dataLoader: async () => {
        if (!brandId) return null;
        const jtbd = await brands.getJTBD(brandId);
        return { type: "jtbd", data: jtbd };
      },
    },
    {
      number: 8,
      name: "Feedback Review - Archetype",
      description: "Brand archetype determination",
      status: "completed",
      dataLoader: async () => {
        if (!brandId) return null;
        const archetype = await brands.getArchetype(brandId);
        return { type: "archetype", data: archetype };
      },
    },
    {
      number: 9,
      name: "Name Selection",
      description: "Brand name selection and domain registration",
      status: "completed",
      dataLoader: async () => {
        if (!brandId) return null;
        // TODO: Load name selection data and domain registration info
        return { type: "name_selection", brandName: currentBrand?.brand_name };
      },
    },
    {
      number: 10,
      name: "Asset Creation",
      description: "Brand assets (logos, colors, etc.)",
      status: "completed",
      dataLoader: async () => {
        if (!brandId) return null;
        const response = await brands.listAssets(brandId);
        return { type: "assets", data: response };
      },
    },
    {
      number: 11,
      name: "Testimonial",
      description: "User feedback and testimonial",
      status: "completed",
      dataLoader: async () => {
        if (!brandId) return null;
        return { type: "testimonial", data: currentBrand?.feedback };
      },
    },
    // Payment step - only shown in dev mode (filtered below)
    {
      number: 12,
      name: "Payment",
      description: "Payment processing (Dev Mode)",
      status: "completed",
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
  ];

  // Filter steps based on dev mode - hide payment step in production
  const visibleSteps = devMode ? steps : steps.filter((s) => s.number !== 12);

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
      console.log(`🔄 Reverting brand ${brandId} to step ${revertTargetStep}`);
      const targetStatus = getStatusFromStepNumber(revertTargetStep);
      console.log(`🔄 Target status: ${targetStatus}`);

      await brands.revertToStatus(brandId, targetStatus as any);
      console.log(`✅ Brand reverted successfully to ${targetStatus}`);

      // Reload brand data
      await selectBrand(brandId);
      console.log(`✅ Brand data reloaded`);

      // Navigate to the target step
      const route = getRouteFromStepNumber(revertTargetStep);
      console.log(`🚀 Navigating to ${route}`);
      navigate(`/brands/${brandId}${route}`);
    } catch (error: any) {
      console.error("❌ Failed to revert brand:", error);
      alert(
        `Failed to revert: ${
          error.response?.data?.message || error.message || "Unknown error"
        }`
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
      case "questionnaire":
        // Format Q&A for copying
        const formatQuestionnaire = () => {
          if (!data.questions || !Array.isArray(data.questions)) return "";

          return data.questions
            .map((q: any, idx: number) => {
              let answer = null;
              if (data.answers) {
                if (Array.isArray(data.answers)) {
                  answer = data.answers.find(
                    (a: any) =>
                      a.question_id === q.id ||
                      a.question_id === q.question_id ||
                      a.id === q.id
                  );
                } else {
                  answer = data.answers[q.id] || data.answers[q.question_id];
                }
              }
              const questionText = q.text || q.question_text || q.question;
              const answerText = answer
                ? answer.answer || answer.answer_text || "No answer provided"
                : "No answer recorded";
              return `${idx + 1}. ${questionText}\n${answerText}`;
            })
            .join("\n\n");
        };

        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">
                Questions & Answers:
              </h4>
              <CopyButton text={formatQuestionnaire()} />
            </div>
            {data.questions && Array.isArray(data.questions) ? (
              <ol className="space-y-4 list-none">
                {data.questions.map((q: any, idx: number) => {
                  // Answers can be an object (dictionary) with question IDs as keys or an array
                  let answer = null;

                  if (data.answers) {
                    if (Array.isArray(data.answers)) {
                      // Array format
                      answer = data.answers.find(
                        (a: any) =>
                          a.question_id === q.id ||
                          a.question_id === q.question_id ||
                          a.id === q.id
                      );
                    } else {
                      // Object/dictionary format - answers[questionId]
                      answer =
                        data.answers[q.id] || data.answers[q.question_id];
                    }
                  }

                  return (
                    <li
                      key={idx}
                      className="border-l-4 border-primary-300 pl-4 py-3"
                    >
                      <div className="flex gap-3">
                        <span className="font-bold text-primary-600 flex-shrink-0">
                          {idx + 1}.
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-2">
                            {q.text || q.question_text || q.question}
                          </p>
                          {answer ? (
                            <p className="text-gray-700 bg-gray-50 p-3 rounded">
                              {answer.answer ||
                                answer.answer_text ||
                                "No answer provided"}
                            </p>
                          ) : (
                            <p className="text-gray-500 italic text-sm">
                              No answer recorded
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="bg-gray-50 p-4 rounded">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {JSON.stringify(
                    { questions: data.questions, answers: data.answers },
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </div>
        );

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
              }
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
              <h4 className="font-semibold text-gray-900">Jobs-To-Be-Done:</h4>
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
                  {data.archetype?.archetype ||
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
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-700 whitespace-pre-wrap">{summaryText}</p>
            </div>
          </div>
        );

      case "archetype":
        const archetypeText =
          data.data?.archetype || data.data || "No archetype available";
        return (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">Brand Archetype:</h4>
              <CopyButton text={archetypeText} />
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-700 whitespace-pre-wrap">
                {archetypeText}
              </p>
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
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">Brand Assets:</h4>
              {brandId && (
                <div className="flex items-center gap-3">
                  <DownloadAllButton
                    brandId={brandId}
                    brandName={currentBrand?.name || "brand"}
                    variant="link"
                  />
                  <button
                    onClick={() => setShareModalOpen(true)}
                    className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </button>
                </div>
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
                                    loadedAsset.created_at
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
            <h4 className="font-semibold text-gray-900 mb-2">Payment Status:</h4>
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

  if (brandLoading || !currentBrand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-primary-600 text-2xl">⟳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-display font-bold text-neutral-800">
                Brand Creation History
              </h1>
              <p className="text-lg text-neutral-600 mt-1">
                {currentBrand.name}
              </p>
            </div>
            <GetHelpButton variant="secondary" size="md" />
          </div>

          <div className="mb-8">
            <p className="text-gray-600">
              Review all steps and documents from your brand creation journey
            </p>
          </div>

          {/* Steps List */}
          <div className="space-y-4">
            {visibleSteps.map((step) => {
              const isCompleted = step.number < currentStepNumber;
              const isActive = step.number === currentStepNumber;

              return (
                <div
                  key={step.number}
                  className={`bg-white rounded-lg shadow-md overflow-hidden ${
                    !isCompleted && !isActive ? "opacity-60" : ""
                  }`}
                >
                  {/* Step Header */}
                  <button
                    onClick={() => isCompleted && toggleStep(step.number)}
                    disabled={!isCompleted && !isActive}
                    className={`w-full flex items-center justify-between p-6 transition-colors ${
                      isCompleted
                        ? "hover:bg-gray-50 cursor-pointer"
                        : isActive
                        ? "cursor-default"
                        : "cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-2 w-24">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            isCompleted
                              ? "bg-primary-600 text-white"
                              : isActive
                              ? "bg-yellow-500 text-white"
                              : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          {step.number}
                        </div>
                        {isCompleted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRevertClick(step.number);
                            }}
                            className="text-xs px-2 py-1 rounded-md font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors whitespace-nowrap"
                          >
                            Revert to this step
                          </button>
                        )}
                        {isActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (currentBrand && brandId) {
                                console.log(
                                  "🔵 History Continue button clicked"
                                );
                                console.log("Brand ID:", brandId);
                                console.log(
                                  "Current status:",
                                  currentBrand.current_status
                                );
                                let route = getRouteForStatus(
                                  brandId,
                                  currentBrand.current_status as any
                                );
                                // For questionnaire step, navigate directly to summary view
                                if (
                                  step.number === 1 &&
                                  currentBrand.current_status ===
                                    "questionnaire"
                                ) {
                                  route = `/brands/${brandId}/questionnaire?summary=1`;
                                }
                                console.log("Navigating to:", route);
                                navigate(route);
                              } else {
                                console.error(
                                  "❌ Missing currentBrand or brandId:",
                                  { currentBrand, brandId }
                                );
                              }
                            }}
                            className="text-xs px-2 py-1 rounded-md font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors whitespace-nowrap"
                          >
                            Continue
                          </button>
                        )}
                      </div>
                      <div className="text-left flex-1">
                        <h3
                          className={`text-lg font-semibold ${
                            isCompleted || isActive
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        >
                          {step.name}
                        </h3>
                        <p
                          className={`text-sm ${
                            isCompleted || isActive
                              ? "text-gray-500"
                              : "text-gray-400"
                          }`}
                        >
                          {step.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isCompleted && (
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-medium ${
                            isActive
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {isActive ? "in progress" : "pending"}
                        </span>
                      )}
                      {isCompleted &&
                        (expandedSteps[step.number] ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ))}
                    </div>
                  </button>

                  {/* Step Content */}
                  {isCompleted && expandedSteps[step.number] && (
                    <div className="border-t border-gray-200">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Confirm Revert
            </h2>
            <p className="text-gray-700 mb-6">
              All assets and documents generated after this step will be lost.
              Are you sure you want to revert to step {revertTargetStep}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleRevertCancel}
                disabled={isReverting}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleRevertConfirm}
                disabled={isReverting}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isReverting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Reverting...
                  </>
                ) : (
                  "Revert"
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
