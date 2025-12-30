import { ChevronDown, ChevronUp, Copy, Loader, RefreshCw } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import { navigateAfterProgress } from "../../lib/navigation";
import { scrollToTop } from "../../lib/utils";
import { useBrandStore } from "../../store/brand";
import { SurveyQuestion, SurveyStatus } from "../../types";
import {
  BrandAttributeDisplay,
  JTBDDisplay,
  SurveyQuestionsDisplay,
} from "../common/BrandAttributeDisplay";
import Button from "../common/Button";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";

const CollectFeedbackContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { updateBrandStatus, progressBrandStatus } = useBrandStore();

  const [surveyStatus, setSurveyStatus] = useState<SurveyStatus | null>(null);
  const [surveyUrl, setSurveyUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string>("");
  const [summary, setSummary] = useState<string | null>(null);
  const [archetype, setArchetype] = useState<string | null>(null);
  const [jtbd, setJtbd] = useState<any | null>(null);
  const [surveyQuestions, setSurveyQuestions] = useState<
    SurveyQuestion[] | null
  >(null);
  const [loadingStates, setLoadingStates] = useState<{
    summary: boolean;
    archetype: boolean;
    jtbd: boolean;
    questions: boolean;
  }>({
    summary: true,
    archetype: true,
    jtbd: true,
    questions: true,
  });
  const [expandedSections, setExpandedSections] = useState<{
    summary: boolean;
    archetype: boolean;
    jtbd: boolean;
    questions: boolean;
  }>({
    summary: false,
    archetype: false,
    jtbd: false,
    questions: false,
  });

  const loadSurveyData = async () => {
    if (!brandId) return;

    setIsLoading(true);
    try {
      // Load survey status
      const status = await brands.getSurveyStatus(brandId);
      setSurveyStatus(status);

      // Load survey to get URL
      const survey = await brands.getSurvey(brandId);
      if (survey?.results?.url) {
        setSurveyUrl(survey.results.url);
      }

      // Load individual brand attributes using their own endpoints
      console.log("🔍 Loading brand attributes for:", brandId);

      // Load summary
      brands
        .getSummary(brandId)
        .then((summaryData) => {
          setSummary(summaryData.summary || summaryData);
          console.log("📝 Summary loaded");
        })
        .catch((error) => {
          console.error("Failed to load summary:", error);
        })
        .finally(() => {
          setLoadingStates((prev) => ({ ...prev, summary: false }));
        });

      // Load archetype
      brands
        .getArchetype(brandId)
        .then((archetypeData) => {
          setArchetype(archetypeData.archetype || archetypeData);
          console.log("🎭 Archetype loaded");
        })
        .catch((error) => {
          console.error("Failed to load archetype:", error);
        })
        .finally(() => {
          setLoadingStates((prev) => ({ ...prev, archetype: false }));
        });

      // Load JTBD
      brands
        .getJTBD(brandId)
        .then((jtbdData) => {
          setJtbd(jtbdData);
          console.log("🎯 JTBD loaded");
        })
        .catch((error) => {
          console.error("Failed to load JTBD:", error);
        })
        .finally(() => {
          setLoadingStates((prev) => ({ ...prev, jtbd: false }));
        });

      // Load survey questions
      brands
        .getSurveyQuestions(brandId)
        .then((questions) => {
          setSurveyQuestions(questions.questions || questions);
          console.log("📋 Survey questions loaded");
        })
        .catch((error) => {
          console.error("Failed to load survey questions:", error);
        })
        .finally(() => {
          setLoadingStates((prev) => ({ ...prev, questions: false }));
        });
    } catch (error) {
      console.error("Failed to load survey data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (
    section: "summary" | "archetype" | "jtbd" | "questions"
  ) => {
    console.log("🔄 Toggling section:", section);
    console.log("📋 Current expanded state:", expandedSections);

    setExpandedSections((prev) => {
      const newState = {
        ...prev,
        [section]: !prev[section],
      };
      console.log("✅ New expanded state:", newState);
      return newState;
    });
  };

  useEffect(() => {
    loadSurveyData();
  }, [brandId]);

  const handleCopyUrl = async () => {
    if (!surveyUrl) return;

    try {
      await navigator.clipboard.writeText(surveyUrl);
      setCopyFeedback("Copied!");
      setTimeout(() => setCopyFeedback(""), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
      setCopyFeedback("Failed to copy");
      setTimeout(() => setCopyFeedback(""), 2000);
    }
  };

  const handleProceed = async () => {
    if (!brandId) return;

    try {
      // Use proper progress endpoint instead of manual status setting
      const statusUpdate = await progressBrandStatus(brandId);
      // Navigate based on backend response
      navigateAfterProgress(navigate, brandId, statusUpdate);
    } catch (error) {
      console.error("Failed to progress brand status:", error);
    }

    scrollToTop();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="bg-white rounded-lg shadow-lg p-2 sm:p-8 max-w-2xl w-full">
        <div className="flex flex-wrap gap-2 justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            Survey Collection
          </h2>
          <div className="flex items-center flex-wrap gap-3">
            {brandId && (
              <HistoryButton brandId={brandId} variant="outline" size="md" />
            )}
            <GetHelpButton variant="secondary" size="md" />
          </div>
        </div>

        {/* Survey Status */}
        {isLoading ? (
          <div className="flex items-center justify-center mb-6">
            <Loader className="animate-spin h-6 w-6 mr-2 text-primary-600" />
            <span className="text-gray-600">Loading survey status...</span>
          </div>
        ) : surveyStatus ? (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-center mb-4">
              <p className="text-lg text-gray-700">
                <span className="font-semibold text-primary-600 text-2xl">
                  {surveyStatus.number_of_responses}
                </span>{" "}
                people have completed your survey!
              </p>
              {surveyStatus.last_response_date && (
                <p className="text-green-600 text-sm mt-2">
                  Last response:{" "}
                  {new Date(surveyStatus.last_response_date).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-center text-gray-600">
              Unable to load survey status
            </p>
          </div>
        )}

        {/* Survey Purpose Explanation */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-gray-700 mb-4">
            We have launched a survey to validate how the:
          </p>

          <div className="space-y-3">
            {/* Executive Summary */}
            <div className="border border-gray-200 rounded-lg bg-white">
              <button
                onClick={() => toggleSection("summary")}
                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-primary-600 cursor-pointer hover:text-primary-700">
                  Executive summary
                </span>
                {expandedSections.summary ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              {expandedSections.summary && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-3">
                    {loadingStates.summary ? (
                      <div className="text-gray-500 italic text-sm">
                        Loading...
                      </div>
                    ) : (
                      <BrandAttributeDisplay
                        title=""
                        content={summary}
                        className=""
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Archetype */}
            <div className="border border-gray-200 rounded-lg bg-white">
              <button
                onClick={() => toggleSection("archetype")}
                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-primary-600 cursor-pointer hover:text-primary-700">
                  Archetype
                </span>
                {expandedSections.archetype ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              {expandedSections.archetype && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-3">
                    {loadingStates.archetype ? (
                      <div className="text-gray-500 italic text-sm">
                        Loading...
                      </div>
                    ) : (
                      <BrandAttributeDisplay
                        title=""
                        content={archetype}
                        className="font-semibold"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Jobs-To-Be-Done */}
            <div className="border border-gray-200 rounded-lg bg-white">
              <button
                onClick={() => toggleSection("jtbd")}
                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-primary-600 cursor-pointer hover:text-primary-700">
                  Jobs-To-Be-Done personas and drivers
                </span>
                {expandedSections.jtbd ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              {expandedSections.jtbd && (
                <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100">
                  <div className="pt-3">
                    {loadingStates.jtbd ? (
                      <div className="text-gray-500 italic">Loading...</div>
                    ) : (
                      <JTBDDisplay jtbd={jtbd} />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Survey Questions */}
            <div className="border border-gray-200 rounded-lg bg-white">
              <button
                onClick={() => toggleSection("questions")}
                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-primary-600 cursor-pointer hover:text-primary-700">
                  Survey questions
                </span>
                {expandedSections.questions ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              {expandedSections.questions && (
                <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100">
                  <div className="pt-3">
                    {loadingStates.questions ? (
                      <div className="text-gray-500 italic">Loading...</div>
                    ) : (
                      <SurveyQuestionsDisplay questions={surveyQuestions} />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-gray-700 mt-4">
            match the expectations and needs of the people whom you consider to
            be your potential customers.
          </p>
        </div>

        {/* Survey URL */}
        {surveyUrl && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Survey URL
            </label>
            <div className="flex">
              <input
                type="text"
                readOnly
                value={surveyUrl}
                className="flex-1 w-full p-3 border border-r-0 border-gray-300 rounded-l-md bg-gray-50 text-sm"
              />
              <button
                onClick={handleCopyUrl}
                className="px-4 py-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 transition-colors"
              >
                {copyFeedback ? (
                  <span className="text-xs font-medium text-green-600">
                    {copyFeedback}
                  </span>
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          {surveyStatus &&
            surveyStatus.number_of_responses <
              (surveyStatus.min_responses_required || 20) && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm font-medium mb-2">
                  Minimum responses required
                </p>
                <p className="text-yellow-700 text-sm">
                  We need at least {surveyStatus.min_responses_required || 20}{" "}
                  survey responses to generate meaningful feedback analysis. You
                  currently have {surveyStatus.number_of_responses} response
                  {surveyStatus.number_of_responses !== 1 ? "s" : ""}. Please
                  continue sharing your survey to collect more responses.
                </p>
              </div>
            )}

          <div className="flex justify-center gap-4 mb-6">
            <Button
              onClick={loadSurveyData}
              disabled={isLoading}
              variant="secondary"
              size="md"
            >
              {isLoading ? (
                <Loader className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh survey status
            </Button>
          </div>

          <Button
            onClick={handleProceed}
            disabled={
              isLoading ||
              !surveyStatus ||
              surveyStatus.number_of_responses <
                (surveyStatus.min_responses_required || 20)
            }
            size="lg"
          >
            {isLoading
              ? "Loading survey status..."
              : "Close the survey and analyze the results"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CollectFeedbackContainer;
