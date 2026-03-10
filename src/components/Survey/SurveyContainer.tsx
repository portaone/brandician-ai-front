import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Edit2,
  GripVertical,
  Loader,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import { scrollToTop } from "../../lib/utils";
import { useBrandStore } from "../../store/brand";
import { Survey, SurveyQuestion } from "../../types";
import Button from "../common/Button";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import BrandicianLoader from "../common/BrandicianLoader";
import { useAutoFocus } from "../../hooks/useAutoFocus";
import BrandNameDisplay from "../BrandName/BrandNameDisplay";
import SurveyUrlBar from "../common/SurveyUrlBar";

import { LOADER_CONFIGS } from "../../lib/loader-constants";

const SurveyContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const {
    currentBrand,
    selectBrand,
    isLoading: isBrandLoading,
    error: brandError,
  } = useBrandStore();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSurvey, setIsLoadingSurvey] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  const [surveyError, setSurveyError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"load" | "save" | null>(null);
  const [surveyUrl, setSurveyUrl] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [draggedQuestion, setDraggedQuestion] = useState<number | null>(null);
  const [draftSaveStatus, setDraftSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const initialLoadDone = useRef(false);


  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!brandId || isLoadingSurvey) return;

      try {
        setIsLoadingSurvey(true);
        setSurveyError(null);
        setErrorType(null);
        await selectBrand(brandId);

        if (isMounted) {
          // First try to get existing saved survey
          try {
            const existingSurvey = await brands.getSurvey(brandId);
            // If we get a survey with results, show success screen
            if (existingSurvey?.results?.url) {
              setSurvey(existingSurvey);
              setSurveyUrl(existingSurvey.results.url);
              setShowSuccess(true);
              return;
            }
          } catch (existingSurveyError) {
            // Survey doesn't exist or no results, continue to draft
            console.log("No existing survey found, loading draft...");
          }

          // If no existing survey or no results, get draft for editing
          const draftSurvey = await brands.getSurveyDraft(brandId);

          // Ensure all questions have sequential numeric IDs
          if (draftSurvey?.questions) {
            draftSurvey.questions = draftSurvey.questions.map(
              (question: SurveyQuestion, index: number) => ({
                ...question,
                id: question.id || String(index + 1),
              }),
            );
          }

          setSurvey(draftSurvey);
        }
      } catch (error: any) {
        if (isMounted) {
          console.error("Failed to load survey data:", error);
          setSurveyError(
            error?.response?.data?.message ||
              "Failed to load survey. Please try again.",
          );
          setErrorType("load");
        }
      } finally {
        if (isMounted) {
          setIsLoadingSurvey(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [brandId]);

  useAutoFocus([editingQuestion]);

  useEffect(() => {
    const scrolledFromTop = window.scrollY;
    document.body.style.overflow = editingQuestion ? "hidden" : "auto";
    document.body.style.position = editingQuestion ? "fixed" : "static";
    document.body.style.inset = "0";

    return () => {
      document.body.style.overflow = "auto";
      document.body.style.position = "static";
      window.scrollTo(0, scrolledFromTop);
    };
  }, [editingQuestion]);

  // Auto-save draft on every edit (debounced)
  useEffect(() => {
    if (!initialLoadDone.current) {
      // Mark initial load done once we have a survey loaded
      if (survey && !isLoadingSurvey && !isRegenerating) {
        initialLoadDone.current = true;
      }
      return;
    }

    if (!survey || !brandId || isLoadingSurvey || isRegenerating || showSuccess) return;

    const timer = setTimeout(async () => {
      try {
        setDraftSaveStatus("saving");
        await brands.saveSurveyDraft(brandId, survey);
        setDraftSaveStatus("saved");
        setTimeout(() => setDraftSaveStatus((s) => (s === "saved" ? "idle" : s)), 2000);
      } catch (err) {
        console.error("Auto-save draft failed:", err);
        setDraftSaveStatus("error");
        setTimeout(() => setDraftSaveStatus((s) => (s === "error" ? "idle" : s)), 3000);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [survey]);

  // Reset initialLoadDone when regenerating so we skip the auto-save on new data
  useEffect(() => {
    if (isRegenerating) {
      initialLoadDone.current = false;
    }
  }, [isRegenerating]);

  const handleAddQuestion = () => {
    // Get the next sequential ID
    const maxId = Math.max(
      0,
      ...(survey?.questions.map((q) => parseInt(q.id || "0") || 0) || [0]),
    );
    setEditingQuestion({
      id: String(maxId + 1),
      type: "text",
      text: "",
    });
  };

  const handleEditQuestion = (question: SurveyQuestion) => {
    setEditingQuestion({
      ...question,
      options: Array.isArray(question.options)
        ? [...question.options]
        : undefined,
    });
  };

  const handleDeleteQuestion = (index: number) => {
    if (!survey) return;

    const newQuestions = [...survey.questions];
    newQuestions.splice(index, 1);
    setSurvey({ ...survey, questions: newQuestions });
  };

  const handleSaveQuestion = (question: SurveyQuestion) => {
    if (!survey) return;

    const newQuestions = [...survey.questions];

    // Check if we're editing an existing question
    const existingIndex = editingQuestion?.id
      ? newQuestions.findIndex((q) => q.id === editingQuestion.id)
      : -1;

    if (existingIndex !== -1 && editingQuestion?.id) {
      // Update existing question
      question.options = question.options?.map((o) => o.trim()).filter(Boolean);
      newQuestions[existingIndex] = { ...question, id: editingQuestion.id };
    } else {
      // This shouldn't happen with our new flow, but handle it gracefully
      const maxId = Math.max(
        0,
        ...newQuestions.map((q) => parseInt(q.id || "0") || 0),
      );
      newQuestions.push({
        ...question,
        id: String(maxId + 1),
      });
    }

    setSurvey({ ...survey, questions: newQuestions });
    setEditingQuestion(null);
  };

  const handleMoveQuestion = (fromIndex: number, toIndex: number) => {
    if (!survey || fromIndex === toIndex) return;

    const newQuestions = [...survey.questions];
    const [movedQuestion] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, movedQuestion);

    setSurvey({ ...survey, questions: newQuestions });
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      handleMoveQuestion(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (survey && index < survey.questions.length - 1) {
      handleMoveQuestion(index, index + 1);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedQuestion(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedQuestion !== null && draggedQuestion !== dropIndex) {
      handleMoveQuestion(draggedQuestion, dropIndex);
    }
    setDraggedQuestion(null);
  };

  const handleDragEnd = () => {
    setDraggedQuestion(null);
  };

  const handleSaveSurvey = async () => {
    if (!survey || !brandId) return;

    setIsSubmitting(true);
    try {
      const response = await brands.saveSurvey(brandId, survey);

      // Extract URL from SubmissionLink object
      if (response && response.url) {
        console.log(
          "✅ Survey saved successfully, URL received:",
          response.url,
        );
        setSurveyUrl(response.url);
      } else {
        console.warn(
          "⚠️ No URL found in response, using fallback. Response:",
          response,
        );
        setSurveyUrl(`${window.location.origin}/survey/${brandId}`);
      }

      setShowSuccess(true);
      setSurveyError(null);
      setErrorType(null);
    } catch (error: any) {
      console.error("Failed to save survey:", error);
      setSurveyError(
        error?.response?.data?.message ||
          "Failed to save survey. Please try again.",
      );
      setErrorType("save");
    } finally {
      setIsSubmitting(false);
      scrollToTop();
    }
  };

  const handleCheckStatus = () => {
    if (!brandId) return;
    navigate(`/brands/${brandId}/collect-feedback`);
  };

  const handleRetry = () => {
    if (errorType === "save") {
      // Retry saving the current survey data
      handleSaveSurvey();
    } else {
      // Retry loading survey from server
      const loadData = async () => {
        if (!brandId || isLoadingSurvey) return;

        try {
          setIsLoadingSurvey(true);
          setSurveyError(null);
          setErrorType(null);
          await selectBrand(brandId);
          const draftSurvey = await brands.getSurveyDraft(brandId);

          // Ensure all questions have sequential numeric IDs
          if (draftSurvey?.questions) {
            draftSurvey.questions = draftSurvey.questions.map(
              (question: SurveyQuestion, index: number) => ({
                ...question,
                id: question.id || String(index + 1),
              }),
            );
          }

          setSurvey(draftSurvey);
        } catch (error: any) {
          console.error("Failed to load survey data:", error);
          setSurveyError(
            error?.response?.data?.message ||
              "Failed to load survey. Please try again.",
          );
          setErrorType("load");
        } finally {
          setIsLoadingSurvey(false);
        }
      };

      loadData();
    }
  };

  const handleRegenerate = async () => {
    if (!brandId || isRegenerating) return;
    setShowRegenerateConfirm(false);
    setIsRegenerating(true);
    setIsLoadingSurvey(true);
    setSurvey(null);
    setSurveyError(null);
    setErrorType(null);
    try {
      const draftSurvey = await brands.regenerateSurveyDraft(brandId);
      if (draftSurvey?.questions) {
        draftSurvey.questions = draftSurvey.questions.map(
          (question: SurveyQuestion, index: number) => ({
            ...question,
            id: question.id || String(index + 1),
          }),
        );
      }
      setSurvey(draftSurvey);
      scrollToTop();
    } catch (error: any) {
      console.error("Failed to regenerate survey:", error);
      setSurveyError(
        error?.response?.data?.detail ||
          "Failed to regenerate survey. Please try again.",
      );
      setErrorType("load");
    } finally {
      setIsRegenerating(false);
      setIsLoadingSurvey(false);
    }
  };

  if (isBrandLoading || (isLoadingSurvey && !surveyError)) {
    return (
      <BrandicianLoader config={LOADER_CONFIGS.survey} isComplete={false} />
    );
  }

  if (isSubmitting) {
    return (
      <BrandicianLoader config={LOADER_CONFIGS.surveySubmit} isComplete={false} />
    );
  }

  if (brandError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {brandError}
      </div>
    );
  }

  if (surveyError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{surveyError}</p>
        <div className="flex space-x-4">
          <Button
            onClick={handleRetry}
            disabled={isSubmitting || isLoadingSurvey}
            size="md"
          >
            {(isSubmitting || isLoadingSurvey) && (
              <Loader className="animate-spin h-5 w-5 mr-2 inline" />
            )}
            <RefreshCw className="h-5 w-5 mr-2 inline" />
            {errorType === "save" ? "Retry Save" : "Try Again"}
          </Button>
          <Button
            onClick={() => navigate("/brands")}
            variant="secondary"
            size="md"
          >
            Exit
          </Button>
        </div>
      </div>
    );
  }

  if (!currentBrand) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Brand not found
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto sm:px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between sm:px-0 px-4 items-center flex-wrap gap-2 mb-6">
            <h1 className="text-3xl font-display font-bold text-neutral-800">
              <BrandNameDisplay brand={currentBrand!} />
              Create Customer Survey
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              {draftSaveStatus === "saving" && (
                <span className="text-sm text-neutral-400 animate-pulse">Saving...</span>
              )}
              {draftSaveStatus === "saved" && (
                <span className="text-sm text-green-500">Draft saved</span>
              )}
              {draftSaveStatus === "error" && (
                <span className="text-sm text-red-400">Save failed</span>
              )}
              {brandId && <HistoryButton brandId={brandId} size="md" />}
              <GetHelpButton variant="secondary" size="md" />
            </div>
          </div>

          {!showSuccess ? (
            <>
              {/* Opening message */}
              <div className="bg-white rounded-lg shadow-lg p-2 sm:p-6 mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Opening Message
                </label>
                <textarea
                  value={survey?.opening_message || ""}
                  onChange={(e) => {
                    if (!survey) return;
                    setSurvey({ ...survey, opening_message: e.target.value });
                  }}
                  className="w-full p-3 border border-neutral-300 rounded-md min-h-[140px] text-neutral-700 leading-relaxed"
                  placeholder="Write an introductory message for your survey respondents..."
                />
              </div>

              <div className="bg-white rounded-lg shadow-lg p-2 sm:p-6 mb-8">
                <div className="space-y-6">
                  {survey?.questions.map((question, index) => (
                    <div
                      key={question.id || index}
                      className={`border border-neutral-200 rounded-lg p-2 sm:p-4 transition-all ${
                        draggedQuestion === index ? "opacity-50" : ""
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-start gap-3">
                        {/* Drag handle and reorder controls */}
                        <div className="flex flex-col items-center gap-1 pt-1">
                          <GripVertical className="h-5 w-5 text-neutral-400 cursor-move" />
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                              className="text-neutral-400 hover:text-primary-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleMoveDown(index)}
                              disabled={
                                !survey || index === survey.questions.length - 1
                              }
                              className="text-neutral-400 hover:text-primary-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Question content */}
                        <div className="flex-1">
                          <div className="flex justify-between gap-2 items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-neutral-500">
                                  Question {index + 1}
                                </span>
                              </div>
                              <div className="text-lg font-medium text-neutral-800 whitespace-pre-wrap">
                                {question.text}
                              </div>
                              <p className="text-sm text-neutral-500 mt-1">
                                Type: {question.type}
                                {question.options &&
                                  ` • ${question.options.length} options`}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleEditQuestion(question)}
                                className="text-neutral-400 hover:text-primary-600 transition-colors"
                              >
                                <Edit2 className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(index)}
                                className="text-neutral-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>

                          {question.options && (
                            <div className="space-y-2">
                              {question.options.map((option, optionIndex) => (
                                <div
                                  key={optionIndex}
                                  className="text-neutral-600 pl-4"
                                >
                                  • {option}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleAddQuestion}
                    className="w-full py-4 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-600 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Question
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button
                  onClick={() => setShowRegenerateConfirm(true)}
                  disabled={isRegenerating || isSubmitting}
                  variant="secondary"
                  size="lg"
                  loading={isRegenerating}
                  leftIcon={!isRegenerating && <RefreshCw className="h-5 w-5" />}
                >
                  {isRegenerating
                    ? "Regenerating survey..."
                    : "Regenerate Survey"}
                </Button>
                <Button
                  onClick={handleSaveSurvey}
                  disabled={isSubmitting || isRegenerating || !survey?.questions.length}
                  size="lg"
                  loading={isSubmitting}
                >
                  Save Survey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-2 sm:p-6">
              <h2 className="text-xl font-medium text-neutral-800 mb-4">
                Survey Created Successfully!
              </h2>

              <div className="mb-6">
                <SurveyUrlBar url={surveyUrl} />
              </div>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  Please copy the survey URL to clipboard and send it to your
                  potential customers to complete. Try to have as many people
                  engaged as possible, since the more feedback we receive, the
                  better we will understand the potential customer perception of
                  your brand and can make necessary adjustments.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleCheckStatus}
                  size="lg"
                >
                  Wait for survey results
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {editingQuestion && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl p-2 sm:p-4 md:p-6 max-w-lg w-full overflow-auto max-h-[90vh]">
                <h3 className="text-xl font-medium text-neutral-800 mb-4">
                  {editingQuestion.id ? "Edit Question" : "Add Question"}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Question Type
                    </label>
                    <select
                      value={editingQuestion.type}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          type: e.target.value as SurveyQuestion["type"],
                        })
                      }
                      className="w-full p-2 border border-neutral-300 rounded-md"
                    >
                      <option value="text">Text</option>
                      <option value="single_choice">Single Choice</option>
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="rating">Rating</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Question Text
                    </label>
                    <textarea
                      value={editingQuestion.text}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          text: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-neutral-300 rounded-md min-h-[100px]"
                      placeholder="Enter your question"
                    />
                  </div>

                  {(editingQuestion.type === "single_choice" ||
                    editingQuestion.type === "multiple_choice") && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Options (one per line)
                      </label>
                      <textarea
                        value={editingQuestion.options?.join("\n") || ""}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            options: e.target.value.split("\n"),
                          })
                        }
                        className="w-full p-2 border border-neutral-300 rounded-md min-h-[100px]"
                        placeholder="Enter options, one per line:
    - Option 1
    - Option 2
    - Option 3"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    onClick={() => setEditingQuestion(null)}
                    variant="secondary"
                    size="md"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleSaveQuestion(editingQuestion)}
                    disabled={!editingQuestion.text.trim()}
                    size="md"
                  >
                    Save Question
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

          {showRegenerateConfirm && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                <h3 className="text-lg font-medium text-neutral-800 mb-3">
                  Regenerate Survey?
                </h3>
                <p className="text-neutral-600 mb-6">
                  This will discard your current survey questions and generate a
                  completely new set using AI. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={() => setShowRegenerateConfirm(false)}
                    variant="secondary"
                    size="md"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRegenerate}
                    size="md"
                  >
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default SurveyContainer;
