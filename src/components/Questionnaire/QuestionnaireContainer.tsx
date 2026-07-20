import { ArrowRight, Brain } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { navigateAfterProgress } from "../../lib/navigation";
import { useBrandStore } from "../../store/brand";
import Button from "../common/Button";
import QuestionnaireHeader from "./QuestionnaireHeader";
import QuestionnaireItem from "./QuestionnaireItem";
import QuestionnaireSummary from "./QuestionnaireSummary";
import BrandicianLoader from "../common/BrandicianLoader";
import { LOADER_CONFIGS } from "../../lib/loader-constants";
import { useAutoFocus } from "../../hooks/useAutoFocus";
import ErrorScreen from "../common/ErrorScreen";
import { getAppError } from "../../lib/errors";

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
    realignment,
    realignmentLoading,
    loadRealignment,
    applyRealignment,
  } = useBrandStore();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1); // Start at -1 for intro screen
  const [showSummary, setShowSummary] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const questionContainerRef = useRef<HTMLDivElement>(null);
  const currentDraftAnswerRef = useRef<string>("");

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

  useEffect(() => {
    console.log("🔄 Loading brand data for brandId:", brandId);
    if (brandId) {
      // Reset state when switching brands
      setCurrentQuestionIndex(-1);
      setShowSummary(false);
      setDataLoaded(false);

      const loadAllData = async () => {
        try {
          await Promise.all([
            selectBrand(brandId),
            loadQuestions(brandId),
            loadAnswers(brandId),
          ]);
          setDataLoaded(true);
          // Non-blocking: the realignment check can hit a slow LLM call on the
          // backend, so it must NOT gate the initial render (otherwise the user
          // is stuck on the intro screen while it runs). When it resolves, the
          // dedicated effect below surfaces the review if one is needed.
          loadRealignment(brandId);
        } catch (error) {
          console.error("Failed to load brand data:", error);
        }
      };

      loadAllData();
    }
  }, [brandId, selectBrand, loadQuestions, loadAnswers, loadRealignment]);

  // Surface the realignment review whenever a proposal says it's needed —
  // independent of the normal first-unanswered navigation, and robust to the
  // proposal arriving after the initial render (it's loaded non-blocking).
  useEffect(() => {
    if (dataLoaded && realignment?.needs_realignment) {
      setShowSummary(true);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 300);
    }
  }, [dataLoaded, realignment]);

  useEffect(() => {
    console.log("🔍 Checking navigation logic:", {
      questionsLength: questions.length,
      answersExists: !!answers,
      answersLength: answers?.length || 0,
      currentQuestionIndex,
      summaryParam: searchParams.get("summary"),
    });

    if (
      questions.length > 0 &&
      dataLoaded &&
      currentQuestionIndex === -1
    ) {
      if (searchParams.get("summary") === "1") {
        console.log("📄 Showing summary due to URL parameter");
        setShowSummary(true);
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 300);
        return;
      }

      // Find first unanswered question in original order
      const firstUnansweredIndex = questions.findIndex(
        (q) => !answeredQuestionIds.has(q.id),
      );
      console.log("🎯 First unanswered question index:", firstUnansweredIndex);

      if (firstUnansweredIndex === -1) {
        // All questions are answered
        console.log("✅ All questions answered, showing summary");
        setShowSummary(true);
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 300);
      } else {
        console.log(
          "📝 Setting current question index to:",
          firstUnansweredIndex,
        );
        setCurrentQuestionIndex(firstUnansweredIndex);
      }
    }
  }, [
    questions,
    dataLoaded,
    currentQuestionIndex,
    searchParams,
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

  if (error) {
    return (
      <ErrorScreen
        error={{ message: error, isNetworkError: false }}
      />
    );
  }

  // Initial load (incl. the blocking, LLM-backed GET /questions) — show a
  // descriptive loader instead of a bare header + empty question area.
  if (!dataLoaded) {
    return (
      <div className="loader-container">
        <BrandicianLoader config={LOADER_CONFIGS.questionnaire} />
      </div>
    );
  }

  // Other in-flight transitions (e.g. progressing to the next step) keep the
  // existing plain loader.
  if (isLoading) {
    return (
      <div className="loader-container">
        <BrandicianLoader />
      </div>
    );
  }

  if (!currentBrand || !brandId) {
    return (
      <ErrorScreen
        error={{ message: "Brand not found", isNetworkError: false }}
      />
    );
  }

  const submitAnswerIfChanged = async (
    answer: string,
  ): Promise<"submitted" | "skipped" | "failed"> => {
    const currentQuestion = questions[currentQuestionIndex];
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
        getAppError(error, "Failed to submit answer. Please try again.").message,
      );
      return "failed";
    }
  };

  const handleNext = async (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const submitResult = await submitAnswerIfChanged(answer);
    if (submitResult === "failed") return;

    // Build the post-submit answered set
    const answeredAfter = new Set(answeredQuestionIds);
    if (submitResult === "submitted") answeredAfter.add(currentQuestion.id);

    // Find next unanswered question after current position
    const nextUnansweredIndex = questions.findIndex(
      (q, i) => i > currentQuestionIndex && !answeredAfter.has(q.id),
    );

    if (nextUnansweredIndex === -1) {
      // No more unanswered questions — show summary
      setShowSummary(true);
      return;
    }

    setCurrentQuestionIndex(nextUnansweredIndex);
  };

  const handleRetrySubmit = () => {
    setSubmitError(null);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleEditAnswer = (questionId: string) => {
    const index = questions.findIndex((q) => q.id === questionId);
    if (index !== -1) {
      setShowSummary(false);
      setCurrentQuestionIndex(index);
    }
  };

  const handleSubmitAndShowSummary = async (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const submitResult = await submitAnswerIfChanged(answer);
    if (submitResult === "failed") return;

    setShowSummary(true);
  };

  const handleComplete = async () => {
    if (!currentBrand.current_status || !brandId) return;

    try {
      console.log("🔄 Starting brand progress...");
      console.log("Current brand status:", currentBrand.current_status);

      const statusUpdate = await progressBrandStatus(brandId);
      console.log("✅ Brand status progressed");

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
    // Save the current draft answer if it differs from the stored answer
    if (currentQuestion && currentQuestionIndex !== -1) {
      const draftAnswer = currentDraftAnswerRef.current;
      const storedAnswer = currentAnswerObj?.answer ?? "";
      if (draftAnswer.trim() !== "" && draftAnswer.trim() !== storedAnswer.trim()) {
        await submitAnswer(
          brandId,
          currentQuestion.id,
          draftAnswer,
          currentQuestion.text,
        );
      }
    }
    navigate("/brands");
  };

  const progress =
    currentQuestionIndex === -1 || questions.length === 0
      ? 0
      : ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentQuestion = questions[currentQuestionIndex];
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
                realignmentLoading ? (
                  <BrandicianLoader
                    config={{
                      loadingText: "Realigning your answers…",
                      steps: [
                        "Checking them against the current questionnaire",
                        "Re-matching where the questions changed",
                        "Please wait — don’t edit your answers until this finishes",
                      ],
                    }}
                  />
                ) : (
                  <QuestionnaireSummary
                    questions={questions}
                    answers={answers}
                    realignment={realignment}
                    onApplyRealignment={(rebuilt) =>
                      applyRealignment(brandId!, rebuilt)
                    }
                    onEditAnswer={handleEditAnswer}
                    onComplete={handleComplete}
                  />
                )
              ) : currentQuestion ? (
                <QuestionnaireItem
                  question={currentQuestion.text}
                  hint={currentQuestion.hint}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={questions.length}
                  isLastQuestion={
                    !questions.some(
                      (q, i) => i > currentQuestionIndex && !answeredQuestionIds.has(q.id),
                    )
                  }
                  currentAnswer={currentAnswerObj?.answer}
                  brandId={brandId}
                  answerId={currentQuestion.id}
                  submitError={submitError}
                  onRetrySubmit={handleRetrySubmit}
                  onShowSummary={handleSubmitAndShowSummary}
                  onAnswerDraftChange={(text) => { currentDraftAnswerRef.current = text; }}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireContainer;
