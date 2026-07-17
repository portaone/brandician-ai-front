import { ChevronDown } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import {
  ParsedArchetype,
  parseArchetypeResponse,
} from "../../lib/archetype-utils";
import { scrollToTop } from "../../lib/utils";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import MarkdownPreviewer, { parseMarkdown } from "../common/MarkDownPreviewer";
import BrandicianLoader from "../common/BrandicianLoader";
import BrandNameDisplay from "../BrandName/BrandNameDisplay";
import { useBrandStore } from "../../store/brand";
import { LOADER_CONFIGS } from "../../lib/loader-constants";
import ErrorScreen from "../common/ErrorScreen";
import { getAppError } from "../../lib/errors";
import {
  ArchetypeAdjustmentResponse,
  ArchetypeChangeSegment,
  FootNote,
} from "../../types";

/* ── Shared inline style constants ── */

const labelStyle: React.CSSProperties = {
  fontFamily: "'Source Sans 3', sans-serif",
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--color-secondary)",
  marginBottom: "20px",
};

const sublabelStyle: React.CSSProperties = {
  fontFamily: "'Source Sans 3', sans-serif",
  fontSize: "0.7rem",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--color-light)",
  marginBottom: "4px",
};

const archetypeNameStyle: React.CSSProperties = {
  fontFamily: "'Bitter', serif",
  fontSize: "var(--fs-md)",
  fontWeight: 600,
  color: "var(--color-text)",
};

const dividerStyle: React.CSSProperties = {
  border: 0,
  borderTop: "1px solid rgba(127, 89, 113, 0.2)",
  margin: "16px 0",
};

/* ── Component ── */

interface ArchetypeAdjustmentContainerProps {
  onComplete: () => void;
  onError: (error: string) => void;
}

const ArchetypeAdjustmentContainer: React.FC<
  ArchetypeAdjustmentContainerProps
> = ({ onComplete, onError }) => {
  const { brandId } = useParams<{ brandId: string }>();
  const { currentBrand } = useBrandStore();

  const [adjustment, setAdjustment] =
    useState<ArchetypeAdjustmentResponse | null>(null);
  const [currentArchetype, setCurrentArchetype] =
    useState<ParsedArchetype | null>(null);
  const [showDetails, setShowDetails] = useState(false);
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

  /* ── Markdown helpers ── */

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

  /* ── Data fetching ── */

  useEffect(() => {
    let isMounted = true;
    if (isLoadingRef.current) {
      console.log("🛑 Prevented duplicate archetype adjustment call");
      return;
    }
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    const fetchData = async () => {
      if (!brandId) {
        isLoadingRef.current = false;
        return;
      }
      try {
        const [adjustData, archetypeData] = await Promise.all([
          brands.suggestArchetypeAdjustment(brandId),
          brands.getArchetype(brandId).catch(() => null),
        ]);

        if (isMounted) {
          setAdjustment(adjustData);
          if (archetypeData) {
            setCurrentArchetype(parseArchetypeResponse(archetypeData));
          }
          setError(null);
        }
      } catch (error: any) {
        if (isMounted) {
          const errorMessage = getAppError(
            error,
            "Failed to load archetype adjustment. Please try again.",
          ).message;
          setError(errorMessage);
          onError(errorMessage);
        }
      } finally {
        if (isMounted) setIsLoading(false);
        isLoadingRef.current = false;
      }
    };

    fetchData();
    return () => {
      isMounted = false;
      isLoadingRef.current = false;
    };
  }, [brandId, onError, reloadFlag]);

  /* ── Handlers ── */

  const handleRetry = () => {
    setError(null);
    setAdjustment(null);
    setCurrentArchetype(null);
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
    if (!brandId || !adjustment) return;
    if (!adjustment.new_text) {
      setError(
        "No proposed archetype found. Please try reloading or re-evaluating.",
      );
      onError(
        "No proposed archetype found. Please try reloading or re-evaluating.",
      );
      return;
    }
    try {
      await brands.updateArchetype(brandId, adjustment.new_text);
      onComplete();
    } catch (error: any) {
      const errorMessage = getAppError(
        error,
        "Failed to update archetype. Please try again.",
      ).message;
      setError(errorMessage);
      onError(errorMessage);
    }
    scrollToTop();
  };

  const handleReject = () => {
    onComplete();
    scrollToTop();
  };

  /* ── Change segment renderer ── */

  function renderChangeSegments(
    segments: ArchetypeChangeSegment[],
    footnotesMap: Record<string, FootNote>,
  ) {
    return segments?.map((seg, i) => {
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
                  {isExpanded ? "Hide explanation" : "Why this change?"}
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

  /* ── Build footnotes map ── */

  const footnotesMap: Record<string, FootNote> = {};
  if (adjustment?.footnotes) {
    adjustment.footnotes.forEach((note) => {
      footnotesMap[note.id] = note;
    });
  }

  /* ── Loading state ── */

  if (isLoading) {
    return (
      <BrandicianLoader
        config={LOADER_CONFIGS.feedbackArchetype}
        isComplete={false}
      />
    );
  }

  /* ── Error state ── */

  if (error) {
    return (
      <ErrorScreen
        error={{ message: error, isNetworkError: false }}
        title="Analysis Failed"
        onRetry={handleRetry}
      />
    );
  }

  if (!adjustment) {
    return null;
  }

  /* ── Main render ── */

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <div className="flex justify-between items-center flex-wrap gap-2 mb-6">
            <div>
              <BrandNameDisplay brand={currentBrand!} />
              <h1
                style={{
                  fontFamily: "'Bitter', serif",
                  fontSize: "var(--fs-xxl)",
                  color: "var(--color-text)",
                  fontWeight: 700,
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Review Brand Archetype
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {brandId && <HistoryButton brandId={brandId} size="md" />}
              <GetHelpButton variant="secondary" size="md" />
            </div>
          </div>

          {/* ── Current Archetype Card ── */}
          {currentArchetype && (
            <div
              style={{
                background: "var(--color-bg)",
                border: "2px solid var(--color-light)",
                borderRadius: "16px",
                padding: "24px 32px",
                marginBottom: "24px",
              }}
            >
              <p style={labelStyle}>Current Archetype</p>

              {/* Two-column archetype names */}
              <div
                className="archetype-pair"
                style={{
                  display: "flex",
                  gap: "48px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={sublabelStyle}>Primary</p>
                  <p style={archetypeNameStyle}>
                    {currentArchetype.primaryName ? (
                      <MarkdownPreviewer
                        markdown={currentArchetype.primaryName}
                      />
                    ) : (
                      "Not yet generated"
                    )}
                  </p>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={sublabelStyle}>Secondary</p>
                  <p style={archetypeNameStyle}>
                    {currentArchetype.secondaryName ? (
                      <MarkdownPreviewer
                        markdown={currentArchetype.secondaryName}
                      />
                    ) : (
                      "Not yet generated"
                    )}
                  </p>
                </div>
              </div>

              <hr style={dividerStyle} />

              {/* Toggle button */}
              <button
                onClick={() => setShowDetails((v) => !v)}
                style={{
                  fontFamily: "'Source Sans 3', sans-serif",
                  fontSize: "0.85rem",
                  color: "var(--color-secondary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 0",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {showDetails ? "Hide details" : "Show details"}
                <ChevronDown
                  size={14}
                  style={{
                    transition: "transform 0.2s",
                    transform: showDetails ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>

              {/* Collapsible details */}
              {showDetails && (
                <div
                  style={{
                    marginTop: "24px",
                    paddingTop: "24px",
                    borderTop: "1px solid rgba(127, 89, 113, 0.2)",
                  }}
                >
                  <div
                    className="archetype-content"
                    style={{
                      display: "flex",
                      gap: "32px",
                      marginBottom: "32px",
                    }}
                  >
                    {/* Primary column */}
                    <div style={{ flex: 1 }}>
                      <p style={{ ...sublabelStyle, marginBottom: "8px" }}>
                        Primary
                      </p>
                      <MarkdownBlock text={currentArchetype.primaryContent} />
                    </div>

                    {/* Secondary column */}
                    {currentArchetype.secondaryContent && (
                      <div style={{ flex: 1 }}>
                        <p style={{ ...sublabelStyle, marginBottom: "8px" }}>
                          Secondary
                        </p>
                        <MarkdownBlock
                          text={currentArchetype.secondaryContent}
                        />
                      </div>
                    )}
                  </div>

                  {/* Combined Expression */}
                  {currentArchetype.combinedExpression && (
                    <>
                      <h3
                        style={{
                          fontFamily: "'Bitter', serif",
                          fontSize: "var(--fs-md)",
                          fontWeight: 600,
                          color: "var(--color-text)",
                          marginTop: "0.5em",
                          marginBottom: "0.5em",
                        }}
                      >
                        Combined Expression
                      </h3>
                      <MarkdownBlock
                        text={currentArchetype.combinedExpression}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Proposed Archetype Card ── */}
          <div
            style={{
              background: "var(--color-white)",
              border: "1px solid var(--color-bg)",
              borderRadius: "16px",
              padding: "32px",
              marginBottom: "32px",
            }}
          >
            {/* Header with badge */}
            <p style={labelStyle}>
              Proposed Archetype
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(244, 195, 67, 0.15)",
                  color: "var(--color-text)",
                  padding: "4px 12px",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  marginLeft: "8px",
                  textTransform: "none",
                  letterSpacing: "normal",
                }}
              >
                ✨ AI-refined
              </span>
            </p>

            {/* Archetype names row */}
            <div
              className="archetype-pair"
              style={{
                display: "flex",
                gap: "48px",
                marginBottom: "16px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={sublabelStyle}>Primary</p>
                <p style={archetypeNameStyle}>{adjustment.primary_name}</p>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={sublabelStyle}>Secondary</p>
                <p style={archetypeNameStyle}>{adjustment.secondary_name}</p>
              </div>
            </div>

            <hr style={dividerStyle} />

            {/* Two-column content */}
            <div
              className="archetype-content"
              style={{
                display: "flex",
                gap: "32px",
                marginBottom: "32px",
              }}
            >
              {/* Primary column */}
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    ...sublabelStyle,
                    marginTop: "0.5em",
                    marginBottom: "0.5em",
                  }}
                >
                  Primary
                </p>
                <div className="text-neutral-700 leading-relaxed markdown-preview">
                  {renderChangeSegments(adjustment.primary, footnotesMap)}
                </div>
              </div>

              {/* Secondary column */}
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    ...sublabelStyle,
                    marginTop: "0.5em",
                    marginBottom: "0.5em",
                  }}
                >
                  Secondary
                </p>
                <div className="text-neutral-700 leading-relaxed markdown-preview">
                  {renderChangeSegments(adjustment.secondary, footnotesMap)}
                </div>
              </div>
            </div>

            {/* Combined Expression */}
            <h3
              style={{
                fontFamily: "'Bitter', serif",
                fontSize: "var(--fs-md)",
                fontWeight: 600,
                color: "var(--color-text)",
                marginTop: "0.5em",
                marginBottom: "0.5em",
              }}
            >
              Combined Expression
            </h3>
            <div className="text-neutral-700 leading-relaxed markdown-preview">
              {renderChangeSegments(adjustment.combined, footnotesMap)}
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div
            style={{
              marginTop: "32px",
              paddingTop: "24px",
              borderTop: "1px solid var(--color-bg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleReevaluate}
                disabled={isLoading}
                className="btn btn-tertiary"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13.5 8a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M8 4v4l3 2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Re-evaluate
              </button>
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={handleReject} className="btn btn-secondary">
                  Keep Current Archetype
                </button>
                <button onClick={handleAccept} className="btn btn-primary">
                  Accept New Archetype
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 3L11 8L6 13"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchetypeAdjustmentContainer;
