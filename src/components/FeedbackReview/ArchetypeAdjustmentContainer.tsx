import { AlertCircle } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import { scrollToTop } from "../../lib/utils";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import MarkdownPreviewer, { parseMarkdown } from "../common/MarkDownPreviewer";
import BrandicianLoader from "../common/BrandicianLoader";
import BrandNameDisplay from "../BrandName/BrandNameDisplay";
import { useBrandStore } from "../../store/brand";
import { LOADER_CONFIGS } from "../../lib/loader-constants";

interface ArchetypeAdjustment {
  old_archetype: string;
  new_text: string;
  old_text?: string;
  changes?: { type: string; content: string; id?: string; t?: string }[];
  footnotes?: { id: string; text: string; url?: string | null }[];
}

interface ArchetypeAdjustmentContainerProps {
  onComplete: () => void;
  onError: (error: string) => void;
}

const ArchetypeAdjustmentContainer: React.FC<
  ArchetypeAdjustmentContainerProps
> = ({ onComplete, onError }) => {
  const { brandId } = useParams<{ brandId: string }>();
  const { currentBrand } = useBrandStore();
  const [adjustment, setAdjustment] = useState<ArchetypeAdjustment | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const explanationRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});
  const [reloadFlag, setReloadFlag] = useState(false);
  const [expandedExplanations, setExpandedExplanations] = useState<
    Record<string, boolean>
  >({});
  const isLoadingRef = useRef(false);
  const scope = "archetype";
  const makeSuggestionKey = (id: string) => `${scope}-${id}`;

  const toggleExplanation = (id: string) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const MarkdownBlock: React.FC<{ text: string }> = ({ text }) => (
    <div className="prose prose-sm max-w-none text-neutral-700 leading-relaxed">
      <MarkdownPreviewer markdown={text} />
    </div>
  );

  const MarkdownInline: React.FC<{ text: string }> = ({ text }) => {
    const html = parseMarkdown(text || "");
    const inlineHtml = html.replace(/^<p>([\s\S]*?)<\/p>$/, "$1");
    return (
      <span
        className="markdown-preview"
        dangerouslySetInnerHTML={{ __html: inlineHtml }}
      />
    );
  };

  useEffect(() => {
    let isMounted = true;
    if (isLoadingRef.current) {
      console.log("🛑 Prevented duplicate archetype adjustment call");
      return;
    }
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    const fetchAdjustment = async () => {
      if (!brandId) {
        isLoadingRef.current = false;
        return;
      }
      try {
        // API: POST /api/v1.0/brands/id/adjust/archetype
        const data = await brands.suggestArchetypeAdjustment(brandId);
        if (isMounted) {
          setAdjustment({
            ...data,
            old_archetype: data.old_archetype ?? data.old_text,
            new_text: data.new_text,
          });
          setError(null);
        }
      } catch (error: any) {
        if (isMounted) {
          let errorMessage =
            "Failed to load archetype adjustment. Please try again.";
          if (error?.response?.status === 500) {
            errorMessage =
              "Server error occurred while analyzing the archetype. Please try again later.";
          } else if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
          }
          setError(errorMessage);
          onError(errorMessage);
        }
      } finally {
        if (isMounted) setIsLoading(false);
        isLoadingRef.current = false;
      }
    };
    fetchAdjustment();
    return () => {
      isMounted = false;
      isLoadingRef.current = false;
    };
  }, [brandId, onError, reloadFlag]);

  const handleRetry = () => {
    setError(null);
    setAdjustment(null);
    setIsLoading(true);
    setReloadFlag((flag) => !flag);
  };

  const handleReevaluate = () => {
    setAdjustment(null);
    setError(null);
    setIsLoading(true);
    setExpandedExplanations({});
    setReloadFlag((flag) => !flag);
    scrollToTop();
  };

  const handleAccept = async () => {
    console.log(
      "[DEBUG] handleAccept: brandId =",
      brandId,
      "adjustment =",
      adjustment,
    );
    if (!brandId || !adjustment) {
      console.log("[DEBUG] handleAccept: missing brandId or adjustment");
      return;
    }
    if (!adjustment.new_text) {
      console.log(
        "[DEBUG] handleAccept: missing new_text in adjustment",
        adjustment,
      );
      setError(
        "No proposed archetype found. Please try reloading or re-evaluating.",
      );
      onError(
        "No proposed archetype found. Please try reloading or re-evaluating.",
      );
      return;
    }
    try {
      console.log(
        "[DEBUG] handleAccept: calling updateArchetype with",
        adjustment.new_text,
      );
      await brands.updateArchetype(brandId, adjustment.new_text);
      console.log(
        "[DEBUG] handleAccept: updateArchetype success, calling onComplete",
      );
      onComplete();
    } catch (error: any) {
      let errorMessage = "Failed to update archetype. Please try again.";
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      console.error("[DEBUG] handleAccept: error updating archetype", error);
      setError(errorMessage);
      onError(errorMessage);
    }
    scrollToTop();
  };

  const handleReject = () => {
    onComplete();
    scrollToTop();
  };

  function renderChanges() {
    if (!adjustment?.changes || adjustment.changes.length === 0) {
      return adjustment?.new_text ? (
        <MarkdownBlock text={adjustment.new_text} />
      ) : (
        <em>No changes were suggested.</em>
      );
    }

    // Build a map of footnotes for quick lookup
    const footnotesMap: Record<
      string,
      { id: string; text: string; url?: string | null }
    > = {};
    if (adjustment.footnotes) {
      adjustment.footnotes.forEach((note) => {
        footnotesMap[note.id] = note;
      });
    }

    return adjustment.changes.map((seg, i) => {
      if (seg.type === "text") {
        return <MarkdownInline key={i} text={seg.content} />;
      }
      if (seg.type === "change" && seg.id) {
        const footnote = footnotesMap[seg.id];
        const explanationId = `explanation-archetype-${seg.id}`;
        const isExpanded = expandedExplanations[explanationId];

        return (
          <div
            key={i}
            className="highlight-change"
            style={{
              background: "rgba(244, 195, 67, 0.15)",
              borderRadius: "6px",
              padding: "12px",
              margin: "12px 0",
              position: "relative",
              display: "block",
            }}
          >
            <MarkdownInline text={seg.content} />

            {footnote && (
              <div>
                <button
                  onClick={() => toggleExplanation(explanationId)}
                  className="inline-explanation-toggle"
                  style={{
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontSize: "0.8rem",
                    color: "#7f5971",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 0",
                    marginTop: "8px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#fd615e")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#7f5971")
                  }
                >
                  {isExpanded ? "Hide explanation" : "Show explanation"}
                  <span
                    className="arrow"
                    style={{
                      fontSize: "0.75em",
                      transition: "transform 0.2s",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      display: "inline-block",
                    }}
                  >
                    ▼
                  </span>
                </button>
                {isExpanded && (
                  <div
                    ref={(el) =>
                      (explanationRefs.current[makeSuggestionKey(seg.id!)] = el)
                    }
                    className="inline-explanation"
                    style={{
                      display: "block",
                      marginTop: "12px",
                      paddingTop: "12px",
                      borderTop: "1px solid rgba(127, 89, 113, 0.2)",
                      fontSize: "0.95rem",
                      lineHeight: "1.6",
                      color: "#7f5971",
                    }}
                  >
                    <p style={{ marginBottom: "8px" }}>
                      <strong>Explanation:</strong>
                    </p>
                    <p style={{ marginBottom: 0 }}>
                      <MarkdownInline text={footnote.text} />
                    </p>
                    {footnote.url && (
                      <a
                        href={footnote.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#7d70d5",
                          textDecoration: "none",
                          marginTop: "8px",
                          display: "inline-block",
                          fontSize: "0.9rem",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.textDecoration = "underline")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.textDecoration = "none")
                        }
                      >
                        View source →
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
      return null;
    });
  }

  if (isLoading) {
    return (
      <BrandicianLoader
        config={LOADER_CONFIGS.feedbackArchetype}
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
              Review Brand Archetype
            </h1>
            <div className="flex items-center flex-wrap gap-3">
              {brandId && <HistoryButton brandId={brandId} size="md" />}
              <GetHelpButton variant="secondary" size="md" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-2 py-6 mb-8">
            {/* Old Archetype */}
            <div>
              <h3 className="text-xl font-medium text-neutral-800 p-2 sm:p-0 mb-4">
                Current Archetype
              </h3>
              <div className="prose max-w-none">
                <div
                  className="border border-gray-200 rounded-lg p-2 sm:p-6"
                  style={{ backgroundColor: "#f4f2f2" }}
                >
                  <MarkdownBlock text={adjustment.old_archetype} />
                </div>
              </div>
            </div>
            {/* New Archetype */}
            <div>
              <h3 className="text-xl font-medium text-neutral-800 p-2 sm:p-0 mb-4">
                Proposed Archetype
              </h3>
              <div className="prose max-w-none">
                <div
                  className="border border-gray-200 rounded-lg p-2 sm:p-6"
                  style={{ backgroundColor: "rgba(244, 195, 67, 0.08)" }}
                >
                  <div className="text-neutral-700 leading-relaxed markdown-preview">
                    {renderChanges()}
                  </div>
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex justify-end flex-wrap gap-2">
              <button onClick={handleReject} className="btn btn-confirm">
                Keep Current Archetype
              </button>
              <button
                onClick={handleReevaluate}
                disabled={isLoading}
                className="btn btn-secondary"
              >
                Re-evaluate
              </button>
              <button onClick={handleAccept} className="btn btn-primary">
                Accept New Archetype
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchetypeAdjustmentContainer;
