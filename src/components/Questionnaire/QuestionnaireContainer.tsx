import { ArrowRight, Brain } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { navigateAfterProgress } from "../../lib/navigation";
import { useBrandStore } from "../../store/brand";
import { Question } from "../../types";
import Button from "../common/Button";
import QuestionnaireHeader from "./QuestionnaireHeader";
import QuestionnaireItem from "./QuestionnaireItem";
import QuestionnaireSummary from "./QuestionnaireSummary";
import BrandicianLoader from "../common/BrandicianLoader";
import { useAutoFocus } from "../../hooks/useAutoFocus";

const QuestionnaireContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    currentBrand,
    questions,
    answers,
    selectBrand,
    submitAnswer,
    progressBrandStatus,
    isLoading,
    error,
    loadQuestions,
    loadAnswers,
  } = useBrandStore();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1); // Start at -1 for intro screen
  const [showSummary, setShowSummary] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const questionContainerRef = useRef<HTMLDivElement>(null);

  const typedAnswers: Record<string, any> = useMemo(() => {
    if (!answers) return {};

    const answersMap: Record<string, any> = {};
    answers.forEach((answer) => {
      answersMap[answer.question as string] = answer;
    });
    return answersMap;
  }, [answers]);

  const answeredQuestionIds = useMemo(() => {
    const set = new Set<string>();
    (answers ?? []).forEach((a) => {
      const id = (a.question ?? a.id) as string | undefined;
      if (id) set.add(id);
    });
    return set;
  }, [answers]);

  const sortedQuestions = useMemo(() => {
    return sortQuestionsByAnswered(questions, answeredQuestionIds);
  }, [questions, answeredQuestionIds]);

  useEffect(() => {
    console.log("🔄 Loading brand data for brandId:", brandId);
    if (brandId) {
      // Reset the question index when switching brands
      setCurrentQuestionIndex(-1);
      setShowSummary(false);

      // Create a single async function to handle all loading
      const loadAllData = async () => {
        try {
          await Promise.all([
            selectBrand(brandId),
            loadQuestions(brandId),
            loadAnswers(brandId),
          ]);
        } catch (error) {
          console.error("Failed to load brand data:", error);
        }
      };

      loadAllData();
    }
  }, [brandId, selectBrand, loadQuestions, loadAnswers]); // Include proper dependencies

  useEffect(() => {
    console.log("🔍 Checking navigation logic:", {
      questionsLength: sortedQuestions.length,
      answersExists: !!answers,
      answersLength: answers?.length || 0,
      currentQuestionIndex,
      summaryParam: searchParams.get("summary"),
      typedAnswersKeys: Object.keys(typedAnswers),
    });

    if (
      sortedQuestions.length > 0 &&
      answers !== null &&
      answers !== undefined &&
      currentQuestionIndex === -1
    ) {
      if (searchParams.get("summary") === "1") {
        console.log("📄 Showing summary due to URL parameter");
        setShowSummary(true);
        // Delay scroll to ensure DOM is rendered
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 300);
        return;
      }

      const firstUnansweredIndex = sortedQuestions.findIndex(
        (q) => !answeredQuestionIds.has(q.id),
      );
      console.log("🎯 First unanswered question index:", firstUnansweredIndex);

      if (firstUnansweredIndex === -1) {
        // All questions are answered
        console.log("✅ All questions answered, showing summary");
        setShowSummary(true);
        // Delay scroll to ensure DOM is rendered
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 300);
      } else {
        // Found first unanswered question
        console.log(
          "📝 Setting current question index to:",
          firstUnansweredIndex,
        );
        setCurrentQuestionIndex(firstUnansweredIndex);
      }
    }
  }, [
    sortedQuestions,
    answers,
    currentQuestionIndex,
    searchParams,
    typedAnswers,
    answeredQuestionIds,
  ]);

  useAutoFocus([
    questions,
    answers,
    currentQuestionIndex,
    searchParams,
    typedAnswers,
    brandId,
    selectBrand,
    loadQuestions,
    loadAnswers,
  ]);

  if (isLoading) {
    return (
      <div className="loader-container">
        <BrandicianLoader />
      </div>
    );
  }

  if (error || !currentBrand || !brandId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error || "Brand not found"}</div>
      </div>
    );
  }

  const submitAnswerIfChanged = async (
    answer: string,
  ): Promise<"submitted" | "skipped" | "failed"> => {
    const currentQuestion = sortedQuestions[currentQuestionIndex];
    if (!currentQuestion) return "failed";

    // Clear any previous submit errors
    setSubmitError(null);

    const currentAnswerObj = typedAnswers[currentQuestion.id];
    const previousAnswer = currentAnswerObj?.answer ?? "";

    const shouldSubmit = answer.trim() !== previousAnswer.trim();
    if (!shouldSubmit) return "skipped";

    try {
      await submitAnswer(brandId!, currentQuestion.id, answer, currentQuestion.text);
      return "submitted";
    } catch (error: any) {
      console.error("Failed to submit answer:", error);
      setSubmitError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to submit answer. Please try again.",
      );
      return "failed";
    }
  };

  const handleNext = async (answer: string) => {
    const currentQuestion = sortedQuestions[currentQuestionIndex];
    if (!currentQuestion) return;

    const wasAnsweredBefore = answeredQuestionIds.has(currentQuestion.id);
    const submitResult = await submitAnswerIfChanged(answer);
    if (submitResult === "failed") return;
    const didSubmit = submitResult === "submitted";

    const answeredAfterSet = new Set(answeredQuestionIds);
    if (didSubmit) answeredAfterSet.add(currentQuestion.id);

    const sortedAfter = sortQuestionsByAnswered(questions, answeredAfterSet);
    const hasAnyUnansweredAfter = sortedAfter.some(
      (q) => !answeredAfterSet.has(q.id),
    );
    if (!hasAnyUnansweredAfter) {
      setShowSummary(true);
      return;
    }

    // If the current unanswered question just became answered, it will move to
    // the "answered tail". In that case the next question is the one that now
    // occupies the same index.
    const becameAnswered = !wasAnsweredBefore && didSubmit;
    const nextIndexCandidate = becameAnswered
      ? currentQuestionIndex
      : currentQuestionIndex + 1;

    if (nextIndexCandidate >= sortedAfter.length) {
      setShowSummary(true);
      return;
    }

    setCurrentQuestionIndex(nextIndexCandidate);
  };

  const handleRetrySubmit = () => {
    setSubmitError(null);
    // The user can now try clicking Next again
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleEditAnswer = (questionId: string) => {
    const index = sortedQuestions.findIndex((q) => q.id === questionId);
    if (index !== -1) {
      setShowSummary(false);
      setCurrentQuestionIndex(index);
      // Note: The QuestionnaireItem component will handle scrolling to the question
      // via its useEffect when the question changes
    }
  };

  const handleSubmitAndShowSummary = async (answer: string) => {
    const currentQuestion = sortedQuestions[currentQuestionIndex];
    if (!currentQuestion) return;

    const submitResult = await submitAnswerIfChanged(answer);
    // If we failed to persist, don't switch the UI to the summary.
    if (submitResult === "failed") return;

    setShowSummary(true);
  };

  const handleComplete = async () => {
    if (!currentBrand.current_status || !brandId) return;

    try {
      console.log("🔄 Starting brand progress...");
      console.log("Current brand status:", currentBrand.current_status);

      // Use proper progress endpoint instead of manual status setting
      const statusUpdate = await progressBrandStatus(brandId);
      console.log("✅ Brand status progressed");

      // Navigate based on backend response
      console.log("🚀 Navigating to next step...");
      navigateAfterProgress(navigate, brandId, statusUpdate);
    } catch (error) {
      console.error("❌ Failed to complete questionnaire:", error);
      throw error;
    }
  };

  const handleStartQuestionnaire = () => {
    setCurrentQuestionIndex(0);
  };

  const handleSaveExit = async () => {
    // Save the current answer if it is not empty and has changed
    if (
      currentQuestion &&
      currentAnswerObj &&
      currentAnswerObj.answer !== undefined &&
      currentAnswerObj.answer.trim() !== ""
    ) {
      // Already saved, just exit
      navigate("/brands");
      return;
    }
    if (
      currentQuestion &&
      currentAnswerObj?.answer === undefined &&
      currentQuestionIndex !== -1
    ) {
      // If the answer is not saved yet, save it
      const answerToSave = currentAnswerObj?.answer || "";
      if (answerToSave.trim() !== "") {
        await submitAnswer(
          brandId,
          currentQuestion.id,
          answerToSave,
          currentQuestion.text,
        );
      }
    }
    navigate("/brands");
  };

  const progress =
    currentQuestionIndex === -1
      ? 0
      : ((currentQuestionIndex + 1) / sortedQuestions.length) * 100;
  const currentQuestion = sortedQuestions[currentQuestionIndex];
  const currentAnswerObj = currentQuestion
    ? typedAnswers[currentQuestion.id]
    : undefined;

  return (
    <div className="min-h-screen">
      <QuestionnaireHeader
        progress={progress}
        onSaveExit={handleSaveExit}
        brandId={brandId}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto" ref={questionContainerRef}>
          {currentQuestionIndex === -1 && !showSummary ? (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex justify-center mb-6">
                <Brain className="h-12 w-12 text-primary-600" />
              </div>

              <h2 className="text-2xl font-display font-bold text-center text-neutral-800 mb-4">
                Welcome to Your Brand Discovery Journey
              </h2>

              <div className="space-y-6 text-neutral-600">
                <p>
                  You're about to begin an in-depth exploration of your brand
                  vision. This questionnaire will help us understand:
                </p>

                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">
                      1
                    </span>
                    <span>Your target audience and their needs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">
                      2
                    </span>
                    <span>
                      Your unique value proposition and market position
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">
                      3
                    </span>
                    <span>Your brand's personality and values</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">
                      4
                    </span>
                    <span>Your goals and aspirations for the brand</span>
                  </li>
                </ul>

                <div className="bg-primary-50 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>Tips for best results:</strong>
                  </p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>
                      • Take your time to provide thoughtful, detailed answers
                    </li>
                    <li>• Be honest and authentic in your responses</li>
                    <li>
                      • Consider your long-term vision, not just immediate needs
                    </li>
                    <li>• You can use voice input or type your answers</li>
                  </ul>
                </div>

                <p className="text-sm">
                  The questionnaire takes about 15-20 minutes to complete. Your
                  answers will be used to generate your brand assets and final
                  brand package.
                </p>
              </div>

              <div className="mt-8 flex justify-center">
                <Button
                  onClick={handleStartQuestionnaire}
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  Begin Questionnaire
                </Button>
              </div>
            </div>
          ) : (
            <>
              <header className="mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-2 bg-neutral-200 rounded-full w-full max-w-md">
                    <div
                      className="h-2 bg-primary-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                <h2 className="text-2xl font-display font-bold text-center text-neutral-800 mb-2">
                  {currentBrand.name} - Brand Questionnaire
                </h2>
                <p className="text-center text-neutral-600">
                  Help us understand your brand vision
                </p>
              </header>

              {showSummary ? (
                <QuestionnaireSummary
                  questions={sortedQuestions}
                  answers={answers}
                  onEditAnswer={handleEditAnswer}
                  onComplete={handleComplete}
                />
              ) : currentQuestion ? (
                <QuestionnaireItem
                  question={currentQuestion.text}
                  hint={currentQuestion.hint}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={sortedQuestions.length}
                  isLastQuestion={
                    currentQuestionIndex === sortedQuestions.length - 1
                  }
                  currentAnswer={currentAnswerObj?.answer}
                  brandId={brandId}
                  answerId={currentQuestion.id}
                  submitError={submitError}
                  onRetrySubmit={handleRetrySubmit}
                  onShowSummary={handleSubmitAndShowSummary}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function sortQuestionsByAnswered(
  questions: Question[],
  answeredIds: Set<string>,
): Question[] {
  return questions
    .map((q, idx) => ({ q, idx }))
    .sort((a, b) => {
      const aAnswered = answeredIds.has(a.q.id);
      const bAnswered = answeredIds.has(b.q.id);

      // Unanswered first, answered last. Keep original order within the groups.
      if (aAnswered === bAnswered) return a.idx - b.idx;
      return aAnswered ? 1 : -1;
    })
    .map((x) => x.q);
}

export default QuestionnaireContainer;
