import { AlertCircle, Plus } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import { scrollToTop } from "../../lib/utils";
import {
  JTBD,
  JTBDList,
  JTBDPersonaAdjustment,
  JTBDPersonaIn,
  PersonaInfo,
  AdjustObject,
  RANKING_TO_IMPORTANCE_LABEL,
  IMPORTANCE_TO_RANKING,
  JTBDImportance,
} from "../../types";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import MarkdownPreviewer, { parseMarkdown } from "../common/MarkDownPreviewer";
import BrandicianLoader from "../common/BrandicianLoader";
import BrandNameDisplay from "../BrandName/BrandNameDisplay";
import { useBrandStore } from "../../store/brand";
import { LOADER_CONFIGS } from "../../lib/loader-constants";

const PERSONA_INFO_LABELS: Record<string, string> = {
  narrative: "Narrative",
  demographics: "Demographics",
  psychographics: "Psychographics",
  jobs_to_be_done: "Jobs to be Done",
  context_triggers: "Context & Triggers",
  desired_outcomes: "Desired Outcomes",
  current_struggles: "Current Struggles",
  connection_to_brand: "Connection to Brand",
};

function toJTBDPersonaIn(persona: JTBD): JTBDPersonaIn {
  return {
    name: persona.name,
    info: persona.info,
    ranking: persona.ranking,
    survey_prevalence: persona.survey_prevalence,
    confidence: persona.confidence,
  };
}

// Global cache to prevent duplicate API calls across component instances
const adjustmentCache = new Map<
  string,
  {
    loading: boolean;
    personasData?: JTBDPersonaAdjustment[];
    driversData?: AdjustObject;
    error?: string;
  }
>();

interface JTBDAdjustmentContainerProps {
  onComplete: () => void;
  onError: (error: string) => void;
}

const MarkdownBlock: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
      <MarkdownPreviewer markdown={text} />
    </div>
  );
};

const MarkdownInline: React.FC<{ text: string }> = ({ text }) => {
  const html = parseMarkdown(text || "");
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

/** Check if a PersonaInfo field value is substantive (not empty or "N/A") */
const isSubstantiveValue = (val: unknown): val is string => {
  if (typeof val !== "string") return false;
  const trimmed = val.trim().toLowerCase();
  return (
    trimmed.length > 0 &&
    trimmed !== "n/a" &&
    trimmed !== "na" &&
    trimmed !== "none" &&
    trimmed !== "-"
  );
};

/** Render structured PersonaInfo fields */
const renderPersonaInfoFields = (info: PersonaInfo | undefined) => {
  if (!info) return <p className="text-gray-400 italic">No data</p>;

  const fields = Object.entries(PERSONA_INFO_LABELS).filter(([key]) =>
    isSubstantiveValue(info[key as keyof PersonaInfo]),
  );

  if (fields.length === 0) {
    // Show LLM comment if available, explaining why data is empty
    if (info.comment && Object.keys(info.comment).length > 0) {
      const commentText = Object.values(info.comment).filter(Boolean).join(" ");
      if (commentText) {
        return (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm italic">{commentText}</p>
          </div>
        );
      }
    }
    return <p className="text-gray-400 italic">No data available</p>;
  }

  return fields.map(([key, label]) => (
    <div key={key} className="mb-3 last:mb-0">
      <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </h5>
      <div className="prose prose-sm max-w-none text-gray-700">
        <MarkdownPreviewer
          markdown={info[key as keyof PersonaInfo] as string}
        />
      </div>
    </div>
  ));
};

/** Get display content for a JTBD persona - prefers info, falls back to description */
const getPersonaDisplayContent = (persona: JTBD): React.ReactNode => {
  if (persona.info) {
    const hasSubstantiveFields = Object.entries(PERSONA_INFO_LABELS).some(
      ([key]) => isSubstantiveValue(persona.info?.[key as keyof PersonaInfo]),
    );
    if (hasSubstantiveFields) return renderPersonaInfoFields(persona.info);
    // Even if no substantive fields, show comment if available
    if (persona.info.comment && Object.keys(persona.info.comment).length > 0) {
      return renderPersonaInfoFields(persona.info);
    }
  }
  if (persona.description) {
    return <MarkdownBlock text={persona.description} />;
  }
  return <p className="text-gray-400 italic">No description available</p>;
};

// Single persona widget component for [old, new] tuple format
type PersonaChoice = "original" | "adjusted" | "include" | "remove";

interface PersonaWidgetProps {
  adjustment: JTBDPersonaAdjustment;
  index: number;
  choice: PersonaChoice | null;
  onChoiceChange: (choice: PersonaChoice) => void;
  rankingOverride?: number;
  onRankingChange: (ranking: number) => void;
  onRemove: (index: number) => void;
}

const PersonaWidget: React.FC<PersonaWidgetProps> = ({
  adjustment,
  index,
  choice,
  onChoiceChange,
  rankingOverride,
  onRankingChange,
  onRemove,
}) => {
  const [oldPersona, newPersona] = adjustment;
  const isNewPersona = oldPersona === null;
  const effectiveRanking = rankingOverride ?? newPersona.ranking;
  const [showRemovalConfirmation, setShowRemovalConfirmation] = useState(false);

  return (
    <div
      className={`border rounded-lg p-2 sm:p-6 ${
        isNewPersona ? "border-gray-200 bg-white" : "border-gray-200 bg-white"
      }`}
      style={
        isNewPersona
          ? {
              borderColor: "rgba(244, 195, 67, 0.3)",
              backgroundColor: "rgba(244, 195, 67, 0.08)",
            }
          : {}
      }
    >
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 p-2 sm:p-0">
          {isNewPersona
            ? "New Suggested Persona"
            : `Persona: ${oldPersona?.name || `#${index + 1}`}`}
        </h3>
        {isNewPersona && (
          <div
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
            style={{
              backgroundColor: "rgba(244, 195, 67, 0.15)",
              color: "#b26a00",
            }}
          >
            <Plus className="h-3 w-3" />
            New
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Current/Original */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 px-2 sm:px-0 mb-2">
            {isNewPersona ? "Additional Persona" : "Current"}
          </h4>
          <div
            className="border rounded-lg p-4 min-h-[120px]"
            style={{ backgroundColor: "#f4f2f2" }}
          >
            {isNewPersona ? (
              <p className="text-gray-500 italic text-sm">
                This is a newly suggested persona based on feedback analysis.
              </p>
            ) : (
              <div>
                <h5 className="font-medium text-gray-800 mb-2">
                  {oldPersona!.name}
                </h5>
                {getPersonaDisplayContent(oldPersona!)}
              </div>
            )}
          </div>
        </div>

        {/* Proposed/New */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 px-2 sm:px-0 mb-2">
            {isNewPersona ? "Suggested Content" : "Proposed"}
          </h4>
          <div
            className={`border rounded-lg p-2 sm:p-4 min-h-[120px] ${
              isNewPersona ? "bg-green-50 border-green-200" : "border-gray-200"
            }`}
            style={
              isNewPersona
                ? {}
                : { backgroundColor: "rgba(244, 195, 67, 0.08)" }
            }
          >
            <h5 className="font-medium text-gray-800 mb-2">
              {newPersona.name}
            </h5>
            {getPersonaDisplayContent(newPersona)}
          </div>
        </div>
      </div>

      {/* Metadata: confidence, ranking, survey_prevalence */}
      {(newPersona.confidence ||
        newPersona.ranking !== undefined ||
        newPersona.survey_prevalence !== undefined) && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {newPersona.confidence && (
            <span
              className={`px-2 py-1 rounded-full font-medium ${
                newPersona.confidence === "HIGH"
                  ? "bg-green-100 text-green-800"
                  : newPersona.confidence === "MEDIUM"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              Confidence: {newPersona.confidence}
            </span>
          )}
          {newPersona.survey_prevalence !== undefined &&
            newPersona.survey_prevalence !== null && (
              <span
                className="px-2 py-1 rounded-full font-medium text-xs"
                style={{ backgroundColor: "#7f5971", color: "#ffffff" }}
              >
                Matches {newPersona.survey_prevalence}% of survey responders
              </span>
            )}
          {effectiveRanking !== undefined && effectiveRanking !== null && (
            <select
              value={effectiveRanking}
              onChange={(e) => onRankingChange(Number(e.target.value))}
              className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 font-medium border-none cursor-pointer text-xs appearance-auto"
            >
              {Object.entries(IMPORTANCE_TO_RANKING).map(([key, rank]) => (
                <option key={rank} value={rank}>
                  {RANKING_TO_IMPORTANCE_LABEL[rank]}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Choice Controls */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          {isNewPersona
            ? "What would you like to do with this new persona?"
            : "Which version do you prefer?"}
        </h4>
        {!showRemovalConfirmation ? (
          <div className="flex flex-wrap gap-3">
            {!isNewPersona && (
              <button
                onClick={() => onChoiceChange("original")}
                className={`btn-selection sm:px-4 sm:py-2 p-3 rounded-lg font-medium transition-all text-sm ${
                  choice === "original" ? "selected" : ""
                }`}
              >
                Keep Original
                {choice === "original" && <span className="ml-2">✓</span>}
              </button>
            )}
            {isNewPersona ? (
              <>
                <button
                  onClick={() => onChoiceChange("include")}
                  className={`sm:px-4 sm:py-2 p-3 rounded-lg font-medium text-sm transition-colors ${
                    choice === "include"
                      ? "btn-primary selected"
                      : "btn-primary"
                  }`}
                >
                  Add the new persona
                </button>
                <button
                  onClick={() => onChoiceChange("original")}
                  className={`btn-selection sm:px-4 sm:py-2 p-3 rounded-lg font-medium text-sm transition-colors ${
                    choice === "original" ? "selected" : ""
                  }`}
                >
                  Discard the new persona
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onChoiceChange("adjusted")}
                  className={`sm:px-4 sm:py-2 p-3 rounded-lg font-medium text-sm  ${
                    choice === "adjusted"
                      ? "btn-primary selected"
                      : "btn-primary"
                  }`}
                >
                  Accept Adjusted
                  {choice === "adjusted" && <span className="ml-2">✓</span>}
                </button>
                <button
                  onClick={() => setShowRemovalConfirmation(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-red-600"
                  title="Remove persona"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 5h14M8 5V3h4v2m-5 0v10m4-10v10M7 5h6l1 10H6l1-10z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-4">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="text-gray-800 font-medium">
                Remove this persona? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRemovalConfirmation(false)}
                className="px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRemove(index);
                  setShowRemovalConfirmation(false);
                }}
                className="px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-red-600 text-white hover:bg-red-700"
              >
                Remove Persona
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Drivers diff component (updated with inline explanations design)
interface DriversDiffProps {
  driversAdjustment: AdjustObject;
  choice: "original" | "adjusted" | null;
  onChoiceChange: (choice: "original" | "adjusted") => void;
}

const DriversDiff: React.FC<DriversDiffProps> = ({
  driversAdjustment,
  choice,
  onChoiceChange,
}) => {
  const [expandedExplanations, setExpandedExplanations] = useState<
    Record<string, boolean>
  >({});

  const toggleExplanation = (id: string) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  function renderChanges() {
    if (!driversAdjustment.changes || driversAdjustment.changes.length === 0) {
      return driversAdjustment.new_text ? (
        <MarkdownBlock text={driversAdjustment.new_text} />
      ) : (
        <em>No changes were suggested.</em>
      );
    }

    // Build a map of footnotes for quick lookup
    const footnotesMap: Record<
      string,
      { id: string; text: string; url?: string }
    > = {};
    if (driversAdjustment.footnotes) {
      driversAdjustment.footnotes.forEach((note) => {
        footnotesMap[note.id] = note;
      });
    }

    // Render changes with proper markdown support for block elements
    return driversAdjustment.changes.map((seg, i) => {
      if (seg.type === "text") {
        // Parse text content as markdown to preserve block structure
        const html = parseMarkdown(seg.content);
        return (
          <div
            key={i}
            dangerouslySetInnerHTML={{ __html: html }}
            className="inline-block margin-null"
          />
        );
      }
      if (seg.type === "change" && seg.id) {
        const footnote = footnotesMap[seg.id];
        const explanationId = `explanation-drivers-${seg.id}`;
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
              <>
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
                    ((e.target as HTMLElement).style.color = "#fd615e")
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLElement).style.color = "#7f5971")
                  }
                >
                  Why this change?{" "}
                  <span
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
                    className="inline-explanation"
                    style={{
                      display: "block",
                      marginTop: "12px",
                      paddingTop: "12px",
                      borderTop: "1px solid rgba(127, 89, 113, 0.2)",
                      fontSize: "0.95rem",
                      lineHeight: 1.6,
                      color: "#7f5971",
                    }}
                  >
                    <MarkdownBlock text={footnote.text} />
                    {footnote.url && (
                      <a
                        href={footnote.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
                      >
                        View source
                      </a>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      }
      return null;
    });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        Customer Needs
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Current Drivers */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-4">Current</h4>
          <div
            className="border border-gray-200 rounded-lg sm:p-4 min-h-[200px]"
            style={{ backgroundColor: "#f4f2f2" }}
          >
            <MarkdownBlock text={driversAdjustment.old_text} />
          </div>
        </div>

        {/* Proposed Drivers */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-4">Proposed</h4>
          <div
            className="border border-gray-200 rounded-lg p-4 min-h-[200px]"
            style={{ backgroundColor: "rgba(244, 195, 67, 0.08)" }}
          >
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed markdown-preview">
              {renderChanges()}
            </div>
          </div>
        </div>
      </div>

      {/* Choice Controls for Drivers */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-lg font-medium text-gray-800 mb-4">
          Which drivers version do you prefer?
        </h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onChoiceChange("original")}
            className={`btn-selection sm:px-6 sm:py-3 p-3 rounded-lg font-medium text-sm  ${
              choice === "original" ? "selected" : ""
            }`}
          >
            Keep Original Customer Needs
            {choice === "original" && <span className="ml-2">✓</span>}
          </button>
          <button
            onClick={() => onChoiceChange("adjusted")}
            className={`sm:px-6 sm:py-3 p-3 rounded-lg font-medium text-sm transition-colors ${
              choice === "adjusted" ? "btn-primary selected" : "btn-primary"
            }`}
          >
            Accept Adjusted Customer Needs
            {choice === "adjusted" && <span className="ml-2">✓</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

const JTBDAdjustmentContainer: React.FC<JTBDAdjustmentContainerProps> = ({
  onComplete,
  onError,
}) => {
  const { brandId } = useParams<{ brandId: string }>();
  const [personasAdjustments, setPersonasAdjustments] = useState<
    JTBDPersonaAdjustment[] | null
  >(null);
  const { currentBrand, updateJTBDPersona } = useBrandStore();
  const [driversAdjustment, setDriversAdjustment] =
    useState<AdjustObject | null>(null);
  const [currentJTBD, setCurrentJTBD] = useState<JTBDList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track user choices for each persona and drivers
  const [personaChoices, setPersonaChoices] = useState<
    Record<number, PersonaChoice>
  >({});
  const [rankingOverrides, setRankingOverrides] = useState<
    Record<number, number>
  >({});
  const [driversChoice, setDriversChoice] = useState<
    "original" | "adjusted" | null
  >(null);

  // Prevent duplicate API calls
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  // Helper to clear cache and refs for this brand
  const clearAdjustmentCache = () => {
    if (brandId) {
      const cacheKey = `jtbd-adjustment-${brandId}`;
      adjustmentCache.delete(cacheKey);
    }
    isLoadingRef.current = false;
    hasLoadedRef.current = false;
  };

  // Choice change handlers
  const handlePersonaChoiceChange = (index: number, choice: PersonaChoice) => {
    setPersonaChoices((prev) => ({
      ...prev,
      [index]: choice,
    }));
  };

  const handleRankingChange = (index: number, ranking: number) => {
    setRankingOverrides((prev) => ({
      ...prev,
      [index]: ranking,
    }));
  };

  const handleDriversChoiceChange = (choice: "original" | "adjusted") => {
    setDriversChoice(choice);
  };

  // Reset choices when data changes
  const resetChoices = () => {
    setPersonaChoices({});
    setRankingOverrides({});
    setDriversChoice(null);
  };

  // Handle persona removal
  const handlePersonaRemove = (indexToRemove: number) => {
    if (personasAdjustments) {
      const updatedAdjustments = personasAdjustments.filter(
        (_, idx) => idx !== indexToRemove,
      );
      setPersonasAdjustments(updatedAdjustments);

      // Clean up choices and ranking overrides for removed persona and adjust indices
      setPersonaChoices((prev) => {
        const newChoices: Record<number, PersonaChoice> = {};
        Object.entries(prev).forEach(([idx, choice]) => {
          const numIdx = Number(idx);
          if (numIdx < indexToRemove) {
            newChoices[numIdx] = choice;
          } else if (numIdx > indexToRemove) {
            newChoices[numIdx - 1] = choice;
          }
        });
        return newChoices;
      });

      setRankingOverrides((prev) => {
        const newOverrides: Record<number, number> = {};
        Object.entries(prev).forEach(([idx, ranking]) => {
          const numIdx = Number(idx);
          if (numIdx < indexToRemove) {
            newOverrides[numIdx] = ranking;
          } else if (numIdx > indexToRemove) {
            newOverrides[numIdx - 1] = ranking;
          }
        });
        return newOverrides;
      });
    }
  };

  // Retry handler
  const handleRetry = () => {
    setError(null);
    setPersonasAdjustments(null);
    setDriversAdjustment(null);
    setCurrentJTBD(null);
    resetChoices();
    clearAdjustmentCache();
    setIsLoading(true);
    setReloadFlag((flag) => !flag);
  };
  const [reloadFlag, setReloadFlag] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadAdjustments = async () => {
      if (!brandId || !isMounted) return;

      // Robust guard against duplicate/racing API calls
      const cacheKey = `jtbd-adjustment-${brandId}`;
      const cached = adjustmentCache.get(cacheKey);
      if (hasLoadedRef.current || isLoadingRef.current) {
        console.log("Prevented duplicate JTBD adjustment call");
        return;
      }
      if (cached?.loading) {
        setIsLoading(true);
        return;
      }
      if (cached?.personasData && cached?.driversData) {
        console.log("Using cached JTBD adjustment data");
        setPersonasAdjustments(cached.personasData);
        setDriversAdjustment(cached.driversData);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      isLoadingRef.current = true;
      adjustmentCache.set(cacheKey, { loading: true });

      try {
        console.log("Loading JTBD adjustments for brand:", brandId);

        // First get current JTBD data
        const jtbdData = await brands.getJTBD(brandId);
        if (isMounted) {
          setCurrentJTBD(jtbdData);
        }

        // Load both personas and drivers adjustments in parallel
        const [personasData, driversData] = await Promise.all([
          brands.adjustJTBDPersonas(brandId),
          brands.adjustJTBDDrivers(brandId),
        ]);

        if (isMounted) {
          setPersonasAdjustments(personasData);
          setDriversAdjustment(driversData);
          resetChoices();
          hasLoadedRef.current = true;
          adjustmentCache.set(cacheKey, {
            loading: false,
            personasData,
            driversData,
          });
        }
      } catch (error: any) {
        if (isMounted) {
          console.error("Failed to load JTBD adjustments:", error);
          let errorMessage =
            "Failed to load JTBD adjustments. Please try again.";
          if (error?.response?.status === 500) {
            errorMessage =
              "Server error occurred while analyzing the JTBD. Please try again later.";
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
            personasData: currentCache.personasData,
            driversData: currentCache.driversData,
          });
        }
      }
    };

    const timeoutId = setTimeout(loadAdjustments, 50);
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      isLoadingRef.current = false;
    };
  }, [brandId, onError, reloadFlag]);

  const handleAccept = async () => {
    if (!brandId || !currentJTBD || !personasAdjustments || !driversAdjustment)
      return;
    try {
      console.log(
        "[DEBUG] JTBDAdjustment: Updating JTBD personas individually...",
      );

      // Process each persona adjustment based on user choices
      for (let i = 0; i < personasAdjustments.length; i++) {
        const [oldPersona, newPersona] = personasAdjustments[i];
        const choice = personaChoices[i];
        const isNew = oldPersona === null;
        const personaWithRanking =
          rankingOverrides[i] !== undefined
            ? { ...newPersona, ranking: rankingOverrides[i] }
            : newPersona;

        if (isNew && choice === "include") {
          // Create new persona
          await brands.createJTBDPersona(
            brandId,
            toJTBDPersonaIn(personaWithRanking),
          );
        } else if (!isNew && choice === "adjusted") {
          // Update existing persona with new version
          await brands.updateJTBDPersona(
            brandId,
            newPersona.id,
            toJTBDPersonaIn(personaWithRanking),
          );
        } else if (
          !isNew &&
          choice === "original" &&
          rankingOverrides[i] !== undefined
        ) {
          // Keep original text but update ranking if user changed it
          await brands.updateJTBDPersona(
            brandId,
            oldPersona!.id,
            toJTBDPersonaIn({ ...oldPersona!, ranking: rankingOverrides[i] }),
          );
        } else if (!isNew && choice === "remove") {
          // Delete existing persona
          await brands.deleteJTBDPersona(brandId, oldPersona!.id);
        }
        // "original" means keep as-is (no API call needed)
      }

      // Update drivers if user chose adjusted
      if (driversChoice === "adjusted") {
        await brands.updateJTBDDrivers(
          brandId,
          driversAdjustment.new_text || currentJTBD.drivers || "",
        );
      }

      console.log(
        "[DEBUG] JTBDAdjustment: JTBD updated, calling onComplete...",
      );

      const cacheKey = `jtbd-adjustment-${brandId}`;
      adjustmentCache.delete(cacheKey);
      onComplete();
    } catch (error: any) {
      console.error("Failed to update JTBD:", error);
      let errorMessage = "Failed to update JTBD. Please try again.";
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
      const cacheKey = `jtbd-adjustment-${brandId}`;
      adjustmentCache.delete(cacheKey);
    }
    onComplete();
    scrollToTop();
  };

  const handleReevaluate = () => {
    clearAdjustmentCache();
    setPersonasAdjustments(null);
    setDriversAdjustment(null);
    setCurrentJTBD(null);
    resetChoices();
    setError(null);
    setIsLoading(true);
    setTimeout(() => setReloadFlag((flag) => !flag), 0);
    scrollToTop();
  };

  if (isLoading) {
    return (
      <BrandicianLoader
        config={LOADER_CONFIGS.feedbackNeeds}
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

  if (!personasAdjustments || !driversAdjustment) {
    return null;
  }

  // Separate existing personas and new suggestions
  const existingPersonas = personasAdjustments.filter(([old]) => old !== null);
  const newPersonas = personasAdjustments.filter(([old]) => old === null);

  // Check if all choices are made
  const totalPersonas = personasAdjustments.length;
  const personaChoicesMade = Object.keys(personaChoices).length;
  const allChoicesMade =
    personaChoicesMade === totalPersonas && driversChoice !== null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between flex-wrap gap-2 items-center mb-6">
            <h1 className="text-3xl font-display font-bold text-neutral-800">
              <BrandNameDisplay brand={currentBrand!} />
              Review Customer Needs
            </h1>
            <div className="flex items-center flex-wrap gap-3">
              {brandId && <HistoryButton brandId={brandId} size="md" />}
              <GetHelpButton variant="secondary" size="md" />
            </div>
          </div>

          {/* Personas Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Persona Adjustments
            </h2>

            {/* Existing Personas */}
            {existingPersonas.length > 0 && (
              <div className="space-y-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800">
                  Updated Personas
                </h3>
                {existingPersonas.map((adjustment, index) => (
                  <PersonaWidget
                    key={`existing-${index}`}
                    adjustment={adjustment}
                    index={index}
                    choice={personaChoices[index] || null}
                    onChoiceChange={(choice) =>
                      handlePersonaChoiceChange(index, choice)
                    }
                    rankingOverride={rankingOverrides[index]}
                    onRankingChange={(ranking) =>
                      handleRankingChange(index, ranking)
                    }
                    onRemove={handlePersonaRemove}
                  />
                ))}
              </div>
            )}

            {/* New Personas */}
            {newPersonas.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Plus className="h-5 w-5" style={{ color: "#F4C343" }} />
                  Newly Suggested Personas
                </h3>
                {newPersonas.map((adjustment, index) => {
                  const personaIndex = existingPersonas.length + index;
                  return (
                    <PersonaWidget
                      key={`new-${index}`}
                      adjustment={adjustment}
                      index={personaIndex}
                      choice={personaChoices[personaIndex] || null}
                      onChoiceChange={(choice) =>
                        handlePersonaChoiceChange(personaIndex, choice)
                      }
                      rankingOverride={rankingOverrides[personaIndex]}
                      onRankingChange={(ranking) =>
                        handleRankingChange(personaIndex, ranking)
                      }
                      onRemove={handlePersonaRemove}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Drivers Section */}
          <div className="mb-8">
            <DriversDiff
              driversAdjustment={driversAdjustment}
              choice={driversChoice}
              onChoiceChange={handleDriversChoiceChange}
            />
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-lg p-2 sm:p-6">
            {/* Progress Indicator */}
            {!allChoicesMade && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="text-amber-800 font-medium mb-2">
                  Please make choices for all items
                </h4>
                <div className="text-amber-700 text-sm">
                  <p>
                    Persona choices: {personaChoicesMade}/{totalPersonas}
                  </p>
                  <p>Drivers choice: {driversChoice ? "done" : "pending"}</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-between gap-2 items-center">
              <div className="text-sm text-gray-600">
                {allChoicesMade ? (
                  <span className="text-green-600 font-medium">
                    All choices made - ready to proceed
                  </span>
                ) : (
                  <span className="text-amber-600">
                    Make choices for all personas and drivers to proceed
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={handleReject} className="btn btn-confirm">
                  Keep Current Customer Needs
                </button>
                <button
                  onClick={handleReevaluate}
                  disabled={isLoading}
                  className="btn btn-secondary"
                >
                  Re-evaluate
                </button>
                <button
                  onClick={handleAccept}
                  disabled={!allChoicesMade}
                  className={`btn btn-primary`}
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JTBDAdjustmentContainer;
