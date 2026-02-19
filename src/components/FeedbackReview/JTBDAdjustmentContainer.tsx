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
}

const PersonaWidget: React.FC<PersonaWidgetProps> = ({
  adjustment,
  index,
  choice,
  onChoiceChange,
  rankingOverride,
  onRankingChange,
}) => {
  const [oldPersona, newPersona] = adjustment;
  const isNewPersona = oldPersona === null;
  const effectiveRanking = rankingOverride ?? newPersona.ranking;

  return (
    <div
      className={`border rounded-lg p-2 sm:p-6 ${
        isNewPersona
          ? "border-green-300 bg-green-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 p-2 sm:p-0">
          {isNewPersona
            ? "New Suggested Persona"
            : `Persona: ${oldPersona?.name || `#${index + 1}`}`}
        </h3>
        {isNewPersona && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
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
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[120px]">
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
              isNewPersona
                ? "bg-green-50 border-green-200"
                : "bg-blue-50 border-blue-200"
            }`}
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
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
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
        <div className="flex flex-wrap gap-3">
          {!isNewPersona && (
            <button
              onClick={() => onChoiceChange("original")}
              className={`btn-selection sm:px-4 sm:py-2 p-3 rounded-lg font-medium transition-all text-sm ${
                choice === "original" ? "selected" : ""
              }`}
            >
              Keep Original
            </button>
          )}
          {isNewPersona ? (
            <>
              <button
                onClick={() => onChoiceChange("include")}
                className={`sm:px-4 sm:py-2 p-3 rounded-lg font-medium text-sm transition-colors ${
                  choice === "include"
                    ? "bg-green-600 text-white"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                Add the new persona
              </button>
              <button
                onClick={() => onChoiceChange("original")}
                className={`sm:px-4 sm:py-2 p-3 rounded-lg font-medium text-sm transition-colors ${
                  choice === "original"
                    ? "bg-red-600 text-white"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                Discard the new persona
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onChoiceChange("adjusted")}
                className={`sm:px-4 sm:py-2 p-3 rounded-lg font-medium text-sm transition-colors ${
                  choice === "adjusted"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
              >
                Accept Adjusted
              </button>
              <button
                onClick={() => onChoiceChange("remove")}
                className={`sm:px-4 sm:py-2 p-3 rounded-lg font-medium text-sm transition-colors ${
                  choice === "remove"
                    ? "bg-red-600 text-white"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                Remove Persona
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Drivers diff component (unchanged from old format - drivers still use AdjustObject)
interface DriversDiffProps {
  driversAdjustment: AdjustObject;
  onChangeClick: (id: string) => void;
  explanationRefs: React.MutableRefObject<{
    [id: string]: HTMLDivElement | null;
  }>;
  choice: "original" | "adjusted" | null;
  onChoiceChange: (choice: "original" | "adjusted") => void;
}

const DriversDiff: React.FC<DriversDiffProps> = ({
  driversAdjustment,
  onChangeClick,
  explanationRefs,
  choice,
  onChoiceChange,
}) => {
  const driversScope = "drivers";
  const makeSuggestionKey = (id: string) => `${driversScope}-${id}`;

  function renderChanges() {
    if (!driversAdjustment.changes || driversAdjustment.changes.length === 0) {
      return driversAdjustment.new_text ? (
        <MarkdownBlock text={driversAdjustment.new_text} />
      ) : (
        <em>No changes were suggested.</em>
      );
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
          <a
            key={i}
            style={style}
            className="inline-block cursor-pointer margin-null rounded transition-colors hover:bg-yellow-100"
            title="Click to see the explanation of the suggestion"
            onClick={() => seg.id && onChangeClick(makeSuggestionKey(seg.id))}
          >
            <MarkdownInline text={seg.content} />
          </a>
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
          <div className="bg-gray-50 border border-gray-200 rounded-lg sm:p-4 min-h-[200px]">
            <MarkdownBlock text={driversAdjustment.old_text} />
          </div>
        </div>

        {/* Proposed Drivers */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-4">Proposed</h4>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 min-h-[200px]">
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed markdown-preview">
              {renderChanges()}
            </div>
          </div>
        </div>
      </div>

      {/* Footnotes for drivers */}
      {driversAdjustment.footnotes &&
        driversAdjustment.footnotes.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-lg font-medium text-gray-800 mb-4">
              Drivers Changes Explained
            </h4>
            <div className="space-y-3">
              {driversAdjustment.footnotes.map((note) => (
                <div
                  key={note.id}
                  ref={(el) =>
                    (explanationRefs.current[makeSuggestionKey(note.id)] = el)
                  }
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 transition-all"
                >
                  <p className="text-gray-700 font-semibold">
                    Suggestion {note.id}
                  </p>
                  <MarkdownBlock text={note.text} />
                  {note.url && (
                    <a
                      href={note.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
                    >
                      View source
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
          </button>
          <button
            onClick={() => onChoiceChange("adjusted")}
            className={`sm:px-6 sm:py-3 p-3 rounded-lg font-medium text-sm transition-colors ${
              choice === "adjusted"
                ? "bg-blue-600 text-white"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}
          >
            Accept Adjusted Customer Needs
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
  const explanationRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});

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
                  />
                ))}
              </div>
            )}

            {/* New Personas */}
            {newPersonas.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-600" />
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
              onChangeClick={handleChangeClick}
              explanationRefs={explanationRefs}
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
