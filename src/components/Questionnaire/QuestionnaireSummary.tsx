import { AlertTriangle, ArrowRight, Edit2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Answer, Question, RealignmentProposal } from "../../types";
import Button from "../common/Button";
import { InlineMarkdown } from "../common/MarkDownPreviewer";

interface QuestionnaireSummaryProps {
  questions: Question[];
  answers: Answer[];
  realignment: RealignmentProposal | null;
  onApplyRealignment: (
    answers: Record<string, { id: string; question: string; answer: string }>,
  ) => Promise<void>;
  onEditAnswer: (questionId: string) => void;
  onComplete: () => Promise<void>;
}

const QuestionnaireSummary: React.FC<QuestionnaireSummaryProps> = ({
  questions,
  answers,
  realignment,
  onApplyRealignment,
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

  // Completion is content-based: every live question must have a non-empty
  // answer. A raw count comparison (questions.length === answers.length) breaks
  // whenever the answer set drifts from the question set (e.g. orphaned answers
  // from a regenerated questionnaire), leaving the user unable to proceed.
  const allQuestionsAnswered = useMemo(
    () =>
      questions.length > 0 &&
      questions.every((q) => {
        const a = answers.find((x) => x.question === q.id);
        return (a?.answer ?? "").toString().trim().length > 0;
      }),
    [questions, answers],
  );

  // ── Realignment review state ───────────────────────────────────────────
  // When the backend reports the saved answers no longer line up with the
  // current questions, it returns a proposed re-mapping (built from the
  // original question text stored on each answer). We let the user review and
  // edit it before anything is saved. All hooks are declared unconditionally
  // (before any early return) to keep hook order stable across renders.
  const needsRealignment = !!realignment?.needs_realignment;
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    if (needsRealignment && realignment) {
      const init: Record<string, string> = {};
      realignment.mapping.forEach((m) => {
        init[m.question_id] = m.answer ?? "";
      });
      setEdited(init);
    }
  }, [realignment, needsRealignment]);

  // Scroll to top when component mounts
  useEffect(() => {
    // Add a delay to ensure DOM is fully rendered
    const scrollTimeout = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 200);

    return () => clearTimeout(scrollTimeout);
  }, []);

  // ── Realignment review mode ────────────────────────────────────────────
  // Active repair path for drifted brands: show each current question with its
  // proposed answer (editable), plus any answers that couldn't be matched, and
  // save the confirmed mapping re-keyed to the current questions.
  if (needsRealignment && realignment) {
    // Enable confirmation as long as there is at least one question and at
    // least one non-empty answer. We deliberately do NOT require every field
    // (the user may fill the rest via the normal edit flow afterwards), and we
    // never allow saving an empty set — which would wipe all answers.
    const readyToConfirm =
      realignment.mapping.length > 0 &&
      realignment.mapping.some(
        (m) => (edited[m.question_id] ?? "").trim().length > 0,
      );

    const handleConfirm = async () => {
      const rebuilt: Record<
        string,
        { id: string; question: string; answer: string }
      > = {};
      realignment.mapping.forEach((m) => {
        const ans = (edited[m.question_id] ?? "").trim();
        if (ans) {
          rebuilt[m.question_id] = {
            id: m.question_id,
            question: m.question_text,
            answer: ans,
          };
        }
      });
      setApplying(true);
      setApplyError(null);
      try {
        await onApplyRealignment(rebuilt);
      } catch (error) {
        setApplyError("We couldn't save your answers. Please try again.");
        console.error("Failed to apply realignment:", error);
      } finally {
        setApplying(false);
      }
    };

    // Did the AI actually match any previous answer to a current question?
    const anyMatched = realignment.mapping.some(
      (m) => (m.answer ?? "").trim().length > 0,
    );

    return (
      <div className="bg-white rounded-lg shadow p-2 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Review Your Answers
        </h2>

        <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 mb-6">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            {anyMatched ? (
              <>
                Your questionnaire was updated since you last answered it, so we
                re-matched your previous answers to the current questions.
                Please review each one, edit anything that looks off, then
                confirm to save.
              </>
            ) : (
              <>
                Your questionnaire was updated since you last answered it, and we
                couldn’t automatically re-match your previous answers this time.
                Please re-enter each answer below — your earlier answers are
                listed at the bottom to copy from.
              </>
            )}
          </p>
        </div>

        <div className="space-y-6 mb-8">
          {realignment.mapping.map((m) => (
            <div key={m.question_id} className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                <InlineMarkdown text={m.question_text} />
              </h3>
              {m.source_question && (
                <p className="text-xs text-gray-400 mb-2">
                  Matched from your earlier answer to: “{m.source_question}”
                </p>
              )}
              <textarea
                className="w-full min-h-[96px] rounded-md border border-gray-300 p-3 text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={edited[m.question_id] ?? ""}
                placeholder="No previous answer matched this question — add one."
                onChange={(e) =>
                  setEdited((prev) => ({
                    ...prev,
                    [m.question_id]: e.target.value,
                  }))
                }
              />
            </div>
          ))}
        </div>

        {realignment.unmapped.length > 0 && (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4 mb-8">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              These earlier answers don’t match any current question. Copy
              anything useful into the fields above before confirming — they
              won’t be kept otherwise.
            </h4>
            <div className="space-y-4">
              {realignment.unmapped.map((u, i) => (
                <div key={i} className="text-sm">
                  <p className="text-gray-500 italic mb-1">{u.question}</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{u.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {applyError && (
          <p className="text-red-600 text-sm mb-4">{applyError}</p>
        )}

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
            onClick={handleConfirm}
            size="lg"
            tabIndex={-1}
            disabled={!readyToConfirm || applying}
          >
            {applying ? "Saving…" : "Confirm Answers"}
            <ArrowRight className="ml-2 h-5 w-5 inline" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-2 md:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Review Your Answers
      </h2>

      <div className="space-y-6 mb-8">
        {sortedQuestions.map((question) => {
          const answer = answers.find((a) => a.question === question.id);

          return (
            <div key={question.id} className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  <InlineMarkdown text={question.text} />
                </h3>
                <button
                  onClick={() => onEditAnswer(question.id)}
                  className="text-primary-600 hover:text-primary-700 flex items-center"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>
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
          disabled={!allQuestionsAnswered}
        >
          Generate Brand Summary
          <ArrowRight className="ml-2 h-5 w-5 inline" />
        </Button>
      </div>
    </div>
  );
};

export default QuestionnaireSummary;
