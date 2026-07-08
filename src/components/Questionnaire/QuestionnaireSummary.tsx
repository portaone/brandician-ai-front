import { ArrowRight, Edit2 } from "lucide-react";
import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Answer, Question } from "../../types";
import Button from "../common/Button";
import { InlineMarkdown } from "../common/MarkDownPreviewer";

interface QuestionnaireSummaryProps {
  questions: Question[];
  answers: Answer[];
  onEditAnswer: (questionId: string) => void;
  onComplete: () => Promise<void>;
}

const QuestionnaireSummary: React.FC<QuestionnaireSummaryProps> = ({
  questions,
  answers,
  onEditAnswer,
  onComplete,
}) => {
  const navigate = useNavigate();

  const sortedQuestions = useMemo(() => {
    // "Unanswered first": questions with non-empty answers appear last.
    const answeredIds = new Set(
      (answers ?? [])
        .filter((a) => (a.answer ?? "").toString().trim().length > 0)
        .map((a) => a.question ?? ""),
    );

    return questions
      .map((q, idx) => ({ q, idx }))
      .sort((a, b) => {
        const aAnswered = answeredIds.has(a.q.id);
        const bAnswered = answeredIds.has(b.q.id);
        if (aAnswered === bAnswered) return a.idx - b.idx;
        return aAnswered ? 1 : -1;
      })
      .map((x) => x.q);
  }, [questions, answers]);

  const liveQuestionIds = useMemo(
    () => new Set(questions.map((q) => q.id)),
    [questions],
  );

  // Answers whose question is no longer in the live set — e.g. the question
  // set was regenerated after these answers were recorded. Surface them (with
  // the question text they were actually given for) so nothing the user typed
  // is silently hidden or mispaired.
  const orphanAnswers = useMemo(
    () =>
      (answers ?? []).filter(
        (a) =>
          (a.answer ?? "").toString().trim().length > 0 &&
          (a.question ? !liveQuestionIds.has(a.question) : true),
      ),
    [answers, liveQuestionIds],
  );

  // True when any displayed answer was recorded against a different question
  // text than the one currently in the live set at that id.
  const hasDrift = useMemo(() => {
    if (orphanAnswers.length > 0) return true;
    return questions.some((q) => {
      const a = answers.find((x) => x.question === q.id);
      const stored = a?.questionText?.trim();
      return !!stored && stored !== q.text.trim();
    });
  }, [questions, answers, orphanAnswers]);

  // Scroll to top when component mounts
  useEffect(() => {
    // Add a delay to ensure DOM is fully rendered
    const scrollTimeout = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 200);

    return () => clearTimeout(scrollTimeout);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-2 md:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Review Your Answers
      </h2>

      {hasDrift && (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Some answers below were recorded against an earlier version of these
          questions. Each answer is shown with the question it was originally
          given for.
        </div>
      )}

      <div className="space-y-6 mb-8">
        {sortedQuestions.map((question) => {
          const answer = answers.find((a) => a.question === question.id);
          const storedText = answer?.questionText?.trim();
          // Show the question the answer was actually given for; fall back to
          // the live question text when nothing was stored (or unanswered).
          const displayText =
            storedText && storedText.length > 0 ? storedText : question.text;
          const drifted = !!storedText && storedText !== question.text.trim();

          return (
            <div key={question.id} className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  <InlineMarkdown text={displayText} />
                </h3>
                <button
                  onClick={() => onEditAnswer(question.id)}
                  className="text-primary-600 hover:text-primary-700 flex items-center"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>
              {drifted && (
                <p className="text-xs text-amber-700 mb-2">
                  Recorded against an earlier version of this question.
                </p>
              )}
              {answer?.answer ? (
                <p className="text-gray-600">{answer.answer}</p>
              ) : (
                <p className="text-primary-600 italic font-medium">
                  No answer provided
                </p>
              )}
            </div>
          );
        })}

        {orphanAnswers.map((answer) => (
          <div
            key={`orphan-${answer.id ?? answer.question}`}
            className="border-b border-gray-200 pb-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              <InlineMarkdown
                text={
                  answer.questionText ||
                  "(question no longer in this questionnaire)"
                }
              />
            </h3>
            <p className="text-xs text-amber-700 mb-2">
              This question is no longer part of the current questionnaire.
            </p>
            <p className="text-gray-600">{answer.answer}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center gap-3 flex-wrap pt-4">
        <Button
          onClick={() => navigate("/brands")}
          variant="secondary"
          size="md"
          tabIndex={-1}
        >
          Save and Exit
        </Button>

        <Button
          onClick={async () => {
            try {
              await onComplete();
            } catch (error) {
              console.error("Failed to complete questionnaire:", error);
            }
          }}
          size="lg"
          tabIndex={-1}
          disabled={!answers.length || questions.length !== answers.length}
        >
          Generate Brand Summary
          <ArrowRight className="ml-2 h-5 w-5 inline" />
        </Button>
      </div>
    </div>
  );
};

export default QuestionnaireSummary;
