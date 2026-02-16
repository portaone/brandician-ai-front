import { AlertCircle } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import { scrollToTop } from "../../lib/utils";
import { AdjustObject } from "../../types";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import ReactMarkdown from "react-markdown";
import BrandicianLoader from "../common/BrandicianLoader";
import BrandNameDisplay from "../BrandName/BrandNameDisplay";
import { useBrandStore } from "../../store/brand";
import { LOADER_CONFIGS } from "../../lib/loader-constants";

// Global cache to prevent duplicate API calls across component instances
const adjustmentCache = new Map<
  string,
  { loading: boolean; data?: AdjustObject; error?: string }
>();

interface SummaryAdjustmentContainerProps {
  onComplete: () => void;
  onError: (error: string) => void;
}

// Reusable form for reviewing changes
interface ChangeReviewFormProps {
  oldText: string;
  newText: string;
  changes: { type: string; content: string; id?: string; t?: string }[];
  footnotes: { id: string; text: string; url?: string | null }[];
  onChangeClick: (id: string) => void;
  explanationRefs: React.MutableRefObject<{
    [id: string]: HTMLDivElement | null;
  }>;
  isEditing: boolean;
  editedText: string;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditChange: (value: string) => void;
  onEditSave: () => void;
}

type ChangeSegment = NonNullable<AdjustObject["changes"]>[number];
type Footnote = NonNullable<AdjustObject["footnotes"]>[number];

const reconcileSuggestionsWithEditedSummary = (
  editedText: string,
  previousChanges?: ChangeSegment[],
  previousFootnotes?: Footnote[],
) => {
  const suggestionSegments =
    previousChanges?.filter(
      (segment): segment is ChangeSegment & { id: string } => {
        return (
          segment.type === "change" &&
          Boolean(segment.id) &&
          Boolean(segment.content)
        );
      },
    ) ?? [];

  const occupiedRanges: Array<{ start: number; end: number }> = [];
  const matches: Array<{
    segment: ChangeSegment & { id: string };
    start: number;
    end: number;
  }> = [];

  const findAvailableIndex = (text: string, snippet: string) => {
    let searchIndex = 0;
    const snippetLength = snippet.length;

    while (searchIndex <= text.length - snippetLength) {
      const nextIndex = text.indexOf(snippet, searchIndex);
      if (nextIndex === -1) {
        return -1;
      }

      const overlaps = occupiedRanges.some(
        (range) =>
          nextIndex < range.end && nextIndex + snippetLength > range.start,
      );
      if (!overlaps) {
        occupiedRanges.push({
          start: nextIndex,
          end: nextIndex + snippetLength,
        });
        return nextIndex;
      }

      searchIndex = nextIndex + 1;
    }

    return -1;
  };

  suggestionSegments.forEach((segment) => {
    const content = segment.content ?? "";
    if (!content || !content.trim()) {
      return;
    }

    const index = findAvailableIndex(editedText, content);
    if (index === -1) {
      return;
    }

    matches.push({
      segment,
      start: index,
      end: index + content.length,
    });
  });

  matches.sort((a, b) => a.start - b.start);

  const rebuiltChanges: ChangeSegment[] = [];
  const retainedSuggestionIds = new Set<string>();
  let cursor = 0;

  matches.forEach((match) => {
    if (match.start > cursor) {
      rebuiltChanges.push({
        type: "text",
        content: editedText.slice(cursor, match.start),
      } as ChangeSegment);
    }

    rebuiltChanges.push({ ...match.segment });
    retainedSuggestionIds.add(match.segment.id);
    cursor = match.end;
  });

  if (cursor < editedText.length) {
    rebuiltChanges.push({
      type: "text",
      content: editedText.slice(cursor),
    } as ChangeSegment);
  }

  const filteredFootnotes =
    previousFootnotes?.filter((note) => retainedSuggestionIds.has(note.id)) ??
    [];

  return {
    changes: rebuiltChanges,
    footnotes: filteredFootnotes,
  };
};

const ChangeReviewForm: React.FC<ChangeReviewFormProps> = ({
  oldText,
  newText,
  changes,
  footnotes,
  onChangeClick,
  explanationRefs,
  isEditing,
  editedText,
  onEditStart,
  onEditCancel,
  onEditChange,
  onEditSave,
}) => {
  const MarkdownBlock: React.FC<{ text: string }> = ({ text }) => {
    return (
      <div className="prose prose-sm max-w-none text-neutral-700 leading-relaxed">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    );
  };

  const MarkdownInline: React.FC<{ text: string }> = ({ text }) => {
    return (
      <ReactMarkdown
        components={{
          p({ children }) {
            return <span>{children}</span>;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  function renderChanges() {
    if (!changes || changes.length === 0) {
      return newText ? (
        <MarkdownBlock text={newText} />
      ) : (
        <em>No changes were suggested.</em>
      );
    }
    return changes.map((seg, i) => {
      if (seg.type === "text") {
        return <MarkdownInline key={i} text={seg.content} />;
      }
      if (seg.type === "change") {
        let style = {};
        if (seg.t === "mod")
          style = {
            fontWeight: "bold",
            background: "#f0f6ff",
            color: "#1d4ed8",
          };
        if (seg.t === "del")
          style = {
            textDecoration: "line-through",
            background: "#fef2f2",
            color: "#b91c1c",
          };
        if (seg.t === "ref")
          style = {
            fontStyle: "italic",
            background: "#fef9e7",
            color: "#b26a00",
          };
        return (
          <span
            key={i}
            style={style}
            className="inline cursor-pointer px-1 rounded transition-colors hover:bg-yellow-100"
            title="Click to see the explanation of the suggestion"
            onClick={() => seg.id && onChangeClick(seg.id)}
          >
            <MarkdownInline text={seg.content} />
          </span>
        );
      }
      return null;
    });
  }

  return (
    <>
      {/* Current Summary */}
      <div>
        <h3 className="text-xl font-medium text-neutral-800 mb-4">
          Current Summary
        </h3>
        <div className="prose max-w-none">
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-2 sm:p-6">
            <MarkdownBlock text={oldText} />
          </div>
        </div>
      </div>
      {/* Proposed Summary */}
      <div>
        <div className="flex items-center flex-wrap justify-between mb-4">
          <h3 className="text-xl font-medium text-neutral-800">
            {isEditing ? "Edit Proposed Summary" : "Proposed Summary"}
          </h3>
          {!isEditing && (
            <button
              onClick={onEditStart}
              className="px-4 py-2 mt-2 text-sm font-medium text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
            >
              Edit Summary
            </button>
          )}
        </div>
        {isEditing ? (
          <div className="bg-white border border-primary-200 rounded-lg p-2 sm:p-4 shadow-inner">
            <textarea
              value={editedText}
              onChange={(event) => onEditChange(event.target.value)}
              className="w-full min-h-[220px] border border-neutral-200 rounded-md p-3 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Update the proposed summary..."
            />
            <div className="flex justify-end flex-wrap gap-3 mt-4">
              <button
                onClick={onEditCancel}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onEditSave}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!editedText.trim()}
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="prose max-w-none">
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-6">
              <div className="text-neutral-700 leading-relaxed">
                {renderChanges()}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Footnotes */}
      {!!footnotes.length && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-neutral-800 mb-4">
            Changes Explained
          </h3>
          <div className="space-y-4">
            {footnotes.map((note, index) => (
              <div
                key={note.id}
                ref={(el) => (explanationRefs.current[note.id] = el)}
                className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 transition-all"
              >
                <p className="text-neutral-700 font-semibold">
                  Suggestion {index + 1}
                </p>
                <p className="text-neutral-700">{note.text}</p>
                {note.url && (
                  <a
                    href={note.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
                  >
                    View source →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const SummaryAdjustmentContainer: React.FC<SummaryAdjustmentContainerProps> = ({
  onComplete,
  onError,
}) => {
  const { brandId } = useParams<{ brandId: string }>();
  const { currentBrand } = useBrandStore();
  const [adjustment, setAdjustment] = useState<AdjustObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState("");

  // Prevent duplicate API calls
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const explanationRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});

  // Helper to clear cache and refs for this brand
  const clearAdjustmentCache = () => {
    if (brandId) {
      const cacheKey = `adjustment-${brandId}`;
      adjustmentCache.delete(cacheKey);
    }
    isLoadingRef.current = false;
    hasLoadedRef.current = false;
  };

  // Retry handler
  const handleRetry = () => {
    setError(null);
    setAdjustment(null);
    clearAdjustmentCache();
    setIsLoading(true);
    setIsEditingSummary(false);
    setEditedSummary("");
    setReloadFlag((flag) => !flag);
  };
  const [reloadFlag, setReloadFlag] = useState(false);

  useEffect(() => {
    setEditedSummary(adjustment?.new_text ?? "");
  }, [adjustment?.new_text]);

  useEffect(() => {
    let isMounted = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const loadAdjustment = async () => {
      if (!brandId || !isMounted) return;

      // Robust guard against duplicate/racing API calls
      const cacheKey = `adjustment-${brandId}`;
      const cached = adjustmentCache.get(cacheKey);
      if (hasLoadedRef.current || isLoadingRef.current) {
        console.log("🛑 Prevented duplicate summary adjustment call");
        return;
      }
      if (cached?.loading) {
        // Start polling for data
        pollTimer = setInterval(() => {
          const polled = adjustmentCache.get(cacheKey);
          if (polled?.data && isMounted) {
            setAdjustment(polled.data);
            setIsLoading(false);
            if (pollTimer) clearInterval(pollTimer);
          }
          if (!isMounted && pollTimer) {
            clearInterval(pollTimer);
          }
        }, 100);
        setIsLoading(true);
        return;
      }
      if (cached?.data) {
        console.log("📋 Using cached adjustment data");
        setAdjustment(cached.data);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log("🔄 Loading summary adjustment for brand:", brandId);
        const data = await brands.adjustSummary(brandId);
        if (isMounted) {
          setAdjustment(data);
          hasLoadedRef.current = true;
          adjustmentCache.set(cacheKey, { loading: false, data });
        }
      } catch (error: any) {
        if (isMounted) {
          console.error("❌ Failed to load summary adjustment:", error);
          let errorMessage =
            "Failed to load summary adjustment. Please try again.";
          if (error?.response?.status === 500) {
            errorMessage =
              "Server error occurred while analyzing the summary. Please try again later.";
          } else if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
          }
          setError(errorMessage);
          onError(errorMessage);
          clearAdjustmentCache();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
        isLoadingRef.current = false;
        const currentCache = adjustmentCache.get(cacheKey);
        if (currentCache?.loading) {
          adjustmentCache.set(cacheKey, {
            loading: false,
            data: currentCache.data,
          });
        }
      }
    };

    const timeoutId = setTimeout(loadAdjustment, 50);
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (pollTimer) clearInterval(pollTimer);
      isLoadingRef.current = false;
    };
  }, [brandId, onError, reloadFlag]);

  const handleAccept = async () => {
    if (!brandId || !adjustment) return;
    try {
      console.log("[DEBUG] SummaryAdjustment: Updating summary...");
      await brands.updateSummary(brandId, adjustment.new_text || "");
      console.log(
        "[DEBUG] SummaryAdjustment: Summary updated, calling onComplete...",
      );
      const cacheKey = `adjustment-${brandId}`;
      adjustmentCache.delete(cacheKey);
      onComplete();
      console.log("[DEBUG] SummaryAdjustment: onComplete called");
    } catch (error: any) {
      console.error("Failed to update summary:", error);
      let errorMessage = "Failed to update summary. Please try again.";
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setError(errorMessage);
      onError(errorMessage);
    }

    scrollToTop();
  };

  const handleReject = () => {
    if (brandId) {
      const cacheKey = `adjustment-${brandId}`;
      adjustmentCache.delete(cacheKey);
    }
    setIsEditingSummary(false);
    onComplete();
    scrollToTop();
  };

  const handleReevaluate = () => {
    clearAdjustmentCache();
    setAdjustment(null);
    setError(null);
    setIsLoading(true);
    setIsEditingSummary(false);
    setEditedSummary("");
    setTimeout(() => setReloadFlag((flag) => !flag), 0);
    scrollToTop();
  };

  const handleChangeClick = (id: string) => {
    const ref = explanationRefs.current[id];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "center" });
      ref.classList.add("ring-2", "ring-primary-500");
      setTimeout(
        () => ref.classList.remove("ring-2", "ring-primary-500"),
        1200,
      );
    }
  };

  const handleStartEditing = () => {
    if (!adjustment) return;
    setEditedSummary(adjustment.new_text || "");
    setIsEditingSummary(true);
  };

  const handleCancelEditing = () => {
    setEditedSummary(adjustment?.new_text || "");
    setIsEditingSummary(false);
  };

  const handleEditedSummaryChange = (value: string) => {
    setEditedSummary(value);
  };

  const handleSaveEditedSummary = () => {
    setAdjustment((prev) => {
      if (!prev) return prev;
      const { changes: reconciledChanges, footnotes: reconciledFootnotes } =
        reconcileSuggestionsWithEditedSummary(
          editedSummary,
          prev.changes ?? [],
          prev.footnotes ?? [],
        );

      const updated = {
        ...prev,
        new_text: editedSummary,
        changes: reconciledChanges,
        footnotes: reconciledFootnotes,
      };
      if (brandId) {
        const cacheKey = `adjustment-${brandId}`;
        adjustmentCache.set(cacheKey, { loading: false, data: updated });
      }
      return updated;
    });
    setIsEditingSummary(false);
  };

  if (isLoading) {
    return (
      <BrandicianLoader
        config={LOADER_CONFIGS.feedbackSummary}
        isComplete={false}
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Analysis Failed
          </h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!adjustment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between flex-wrap gap-2 items-center mb-6">
            <h1 className="text-3xl font-display font-bold text-neutral-800">
              <BrandNameDisplay brand={currentBrand!} />
              Review Brand Summary
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              {brandId && <HistoryButton brandId={brandId} size="md" />}
              <GetHelpButton variant="secondary" size="md" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-2 py-6 mb-8">
            {/* Survey Status */}
            {adjustment.survey && (
              <div className="mb-6 p-2 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-medium text-blue-800 mb-2">
                  Survey Status
                </h3>
                <p className="text-blue-700">
                  <span className="font-semibold">
                    {adjustment.survey.number_of_responses}
                  </span>{" "}
                  responses collected
                </p>
                {adjustment.survey.last_response_date && (
                  <p className="text-blue-600 text-sm">
                    Last response:{" "}
                    {new Date(
                      adjustment.survey.last_response_date,
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Use the reusable ChangeReviewForm for summary review */}
            <ChangeReviewForm
              oldText={adjustment.old_text}
              newText={adjustment.new_text}
              changes={adjustment.changes ?? []}
              footnotes={adjustment.footnotes ?? []}
              onChangeClick={handleChangeClick}
              explanationRefs={explanationRefs}
              isEditing={isEditingSummary}
              editedText={editedSummary}
              onEditStart={handleStartEditing}
              onEditCancel={handleCancelEditing}
              onEditChange={handleEditedSummaryChange}
              onEditSave={handleSaveEditedSummary}
            />

            {/* Action Buttons */}
            <div className="flex justify-end flex-wrap gap-3 mt-4">
              <button onClick={handleReject} className="btn btn-confirm">
                Keep Current Summary
              </button>
              <button
                onClick={handleReevaluate}
                disabled={isLoading}
                className="btn btn-secondary"
              >
                Re-evaluate
              </button>
              <button onClick={handleAccept} className="btn btn-primary">
                Accept New Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryAdjustmentContainer;
