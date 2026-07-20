import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Edit2,
  Loader,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import { navigateAfterProgress } from "../../lib/navigation";
import { scrollToTop } from "../../lib/utils";
import { useBrandStore } from "../../store/brand";

/** Generate a UUID v4 string using the Web Crypto API */
function generateUUID(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Set version to 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Set variant to RFC 4122
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

import {
  SuggestedPersona,
  JTBDImportance,
  JTBD_IMPORTANCE_LABELS,
  IMPORTANCE_TO_RANKING,
  RANKING_TO_IMPORTANCE,
  JTBDPersonaIn,
  PersonaInfo,
  PersonaTier,
} from "../../types";
import Button from "../common/Button";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import MarkdownPreviewer from "../common/MarkDownPreviewer";
import BrandicianLoader from "../common/BrandicianLoader";
import { useAutoFocus } from "../../hooks/useAutoFocus";
import BrandNameDisplay from "../BrandName/BrandNameDisplay";
import { LOADER_CONFIGS } from "../../lib/loader-constants";
import RegenerateButton from "../common/RegenerateButton";
import ErrorScreen from "../common/ErrorScreen";
import { getAppError } from "../../lib/errors";

type Step = "rating" | "editing" | "drivers";

const PERSONA_INFO_LABELS: Record<string, string> = {
  narrative: "Narrative",
  demographics: "Demographics",
  psychographics: "Psychographics",
  jobs_to_be_done: "Jobs to be done / Customer Needs",
  context_triggers: "Context & Triggers",
  desired_outcomes: "Desired Outcomes",
  current_struggles: "Current Struggles",
  connection_to_brand: "Connection to Brand",
};

/** Render structured PersonaInfo fields as labeled markdown sections */
const renderPersonaInfo = (info: PersonaInfo) => {
  const fields = Object.entries(PERSONA_INFO_LABELS);
  const rendered = fields
    .filter(
      ([key]) =>
        info[key as keyof PersonaInfo] &&
        typeof info[key as keyof PersonaInfo] === "string",
    )
    .map(([key, label]) => (
      <div key={key} className="mb-3 last:mb-0">
        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
          {label}
        </h4>

        <MarkdownPreviewer
          markdown={info[key as keyof PersonaInfo] as string}
        />
      </div>
    ));
  return rendered.length > 0 ? rendered : null;
};

/** Get the display content for a persona - prefers info fields, falls back to description */
const getPersonaDisplayContent = (persona: PersonaItem): React.ReactNode => {
  if (persona.info) {
    const infoContent = renderPersonaInfo(persona.info);
    if (infoContent) return infoContent;
  }
  if (persona.description) {
    return persona.description.split("\n").map((paragraph, index) => (
      <p key={index} className="text-neutral-600 mb-2 last:mb-0">
        {paragraph.trim()}
      </p>
    ));
  }
  return <p className="text-neutral-400 italic">No description available</p>;
};

/** Check if persona has meaningful content (info or description) */
const hasPersonaContent = (persona: PersonaItem): boolean => {
  if (persona.info) {
    const hasInfoContent = Object.entries(PERSONA_INFO_LABELS).some(([key]) => {
      const val = persona.info?.[key as keyof PersonaInfo];
      return typeof val === "string" && val.trim().length > 0;
    });
    if (hasInfoContent) return true;
  }
  return !!(persona.description && persona.description.trim().length > 0);
};

/**
 * Local display type for the component.
 * - `_key` is always present (for React key and internal lookups)
 * - `id` is set only for personas already persisted in the database
 *   (undefined for suggested-but-not-yet-saved personas)
 */
interface PersonaItem {
  _key: string;
  id?: string;
  name: string;
  description?: string;
  info?: PersonaInfo;
  ranking?: number;
  survey_prevalence?: number;
  confidence?: string;
  importance?: JTBDImportance;
  tier?: PersonaTier;
}

/** Display order for tiers — primary first, then secondary, contextual, untiered last */
const TIER_ORDER: Record<PersonaTier, number> = {
  primary: 0,
  secondary: 1,
  contextual: 2,
};

/**
 * Pre-assigned (user-overridable) importance rating per suggested tier.
 * Primary → Important, Secondary → Somewhat important, Contextual → Rarely important.
 */
const TIER_DEFAULT_IMPORTANCE: Record<PersonaTier, JTBDImportance> = {
  primary: "important",
  secondary: "somewhat_important",
  contextual: "rarely_important",
};

/**
 * Persona cards are expanded by default regardless of tier, so the definition
 * of each persona is visible immediately without the user having to discover
 * the expand toggle. Users can still collapse any card manually.
 */
function tierExpandedByDefault(_tier?: PersonaTier): boolean {
  return true;
}

/**
 * Reformat a drivers string that was stored collapsed onto a single line
 * (legacy data: `**Header** - item. - item. **Header** - item.`) into proper
 * multi-line markdown so it reads well in both the editor and the preview.
 *
 * Only runs when the text contains no newlines — already-formatted (multi-line)
 * drivers are returned unchanged.
 */
function normalizeDriversText(text: string): string {
  if (!text) return text;
  if (text.includes("\n")) return text; // already formatted — leave as-is

  let t = text.trim();
  // Put each bold section header on its own line, with a blank line before it
  t = t.replace(/\s*(\*\*[^*]+\*\*)\s*/g, "\n\n$1\n");
  // Break before each " - " bullet separator
  t = t.replace(/\s+-\s+/g, "\n- ");
  // Collapse any runs of 3+ newlines down to a blank-line separator
  return t.replace(/\n{3,}/g, "\n\n").trim();
}

/** Stable sort by tier (primary → secondary → contextual → untiered) */
function sortPersonasByTier(items: PersonaItem[]): PersonaItem[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const rankA = a.item.tier !== undefined ? TIER_ORDER[a.item.tier] : 99;
      const rankB = b.item.tier !== undefined ? TIER_ORDER[b.item.tier] : 99;
      return rankA - rankB || a.index - b.index;
    })
    .map(({ item }) => item);
}

/** Convert a suggested persona (from the backend) to a PersonaItem without id */
function toSuggestedPersonaItem(data: SuggestedPersona): PersonaItem {
  let key: string = "";
  try {
    key = crypto.randomUUID();
  } catch (err) {
    key = generateUUID();
  }
  return {
    _key: key,
    name: data.name,
    description: data.description,
    info: data.info,
    tier: data.tier,
    // Pre-assign an importance rating from the tier (user-overridable)
    importance: data.tier ? TIER_DEFAULT_IMPORTANCE[data.tier] : undefined,
    // id intentionally absent — not yet persisted
  };
}

function toJTBDPersonaIn(persona: PersonaItem): JTBDPersonaIn {
  return {
    name: persona.name,
    info: persona.info,
    ranking:
      persona.ranking ??
      (persona.importance
        ? IMPORTANCE_TO_RANKING[persona.importance]
        : undefined),
    survey_prevalence: persona.survey_prevalence,
    tier: persona.tier,
  };
}

const JTBDContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const {
    currentBrand,
    selectBrand,
    loadJTBD,
    progressBrandStatus,
    isLoading,
  } = useBrandStore();
  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [drivers, setDrivers] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("rating");
  const [editingPersona, setEditingPersona] = useState<PersonaItem | null>(
    null,
  );
  const [pendingRemovalKey, setPendingRemovalKey] = useState<string | null>(
    null,
  );
  const [isRegenerating, setIsRegenerating] = useState(false);
  // Local error for the blocking mount-time persona generation. Kept separate
  // from the shared store `error` so a non-blocking Continue/progress failure
  // (store error, content present) never triggers the full-screen ErrorScreen.
  const [suggestError, setSuggestError] = useState<string | null>(null);
  // Inline (non-blocking) error for the Continue/save action — content is on
  // screen, so this must NOT take over the page.
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isEditingDrivers, setIsEditingDrivers] = useState(false);
  // Explicit expand/collapse overrides per persona; absence falls back to the tier default
  const [expandedOverrides, setExpandedOverrides] = useState<
    Record<string, boolean>
  >({});
  const isRegeneratingRef = useRef<boolean>(false);
  const hasInitialized = useRef(false);

  useAutoFocus([editingPersona, isEditingDrivers]);

  const loadPersonas = useCallback(async () => {
    if (!brandId) return;
    // Mark initialized so the mount effect won't re-fire under StrictMode's
    // double-invoke. onRetry calls this callback directly, so a retry always
    // re-runs the full sequence regardless of this guard.
    hasInitialized.current = true;
    // Clear BOTH error channels before re-running: the local suggest error and
    // the shared store error (selectBrand/loadJTBD failures live there).
    setSuggestError(null);
    useBrandStore.setState({ error: null });

    try {
      await selectBrand(brandId);
      await loadJTBD(brandId);

      // After loadJTBD completes, check if we have persisted data
      const state = useBrandStore.getState();
      const jtbd = state.currentBrand?.jtbd;

      if (jtbd?.personas && Object.keys(jtbd.personas).length > 0) {
        // Persisted personas — have real IDs
        const personasArray: PersonaItem[] = Object.entries(jtbd.personas).map(
          ([key, data]) => ({
            ...data,
            _key: data.id || key,
            id: data.id || key,
            importance:
              data.importance ??
              (data.ranking !== undefined
                ? RANKING_TO_IMPORTANCE[data.ranking]
                : undefined),
          }),
        );
        setPersonas(personasArray);
        setDrivers(normalizeDriversText(jtbd.drivers || ""));
      } else {
        // No persisted JTBD — suggest initial personas
        setIsRegenerating(true);
        try {
          const suggestedData = await brands.suggestJTBD(brandId);
          if (suggestedData?.personas?.length) {
            setPersonas(suggestedData.personas.map(toSuggestedPersonaItem));
          }
          if (suggestedData?.drivers) {
            setDrivers(normalizeDriversText(suggestedData.drivers));
          }
          if (suggestedData?.reasoning) {
            setReasoning(suggestedData.reasoning);
          }
        } catch (err) {
          console.error("Failed to suggest JTBD:", err);
          setSuggestError(
            getAppError(
              err,
              "We couldn't generate your personas. The AI service may be temporarily unavailable — please try again.",
            ).message,
          );
        } finally {
          setIsRegenerating(false);
        }
      }
    } catch (err) {
      // selectBrand / loadJTBD failed — surface it as the blocking load error
      // (local, so a non-blocking Continue failure can never trigger it).
      console.error("Failed to load JTBD data:", err);
      setSuggestError(
        getAppError(err, "We couldn't load your personas. Please try again.")
          .message,
      );
    }
  }, [brandId, selectBrand, loadJTBD]);

  useEffect(() => {
    if (hasInitialized.current) return;
    loadPersonas();
  }, [loadPersonas]);

  // Scroll the editing form into view only when editing STARTS for a persona.
  // Depend on the persona's key (not the object) so per-keystroke
  // setEditingPersona() updates don't re-trigger the scroll and yank the view
  // away from the field being edited.
  const editingKey = editingPersona?._key;
  useEffect(() => {
    if (editingKey) {
      setTimeout(() => {
        const scrollElement = document.querySelector(".scroll-object");
        scrollElement?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    }
  }, [editingKey]);

  const handleImportanceChange = (key: string, importance: JTBDImportance) => {
    if (importance === "not_applicable") {
      setPendingRemovalKey(key);
    } else {
      setPersonas((prev) =>
        prev.map((p) => (p._key === key ? { ...p, importance } : p)),
      );
    }
  };

  const handleRemovePersona = (key: string) => {
    setPersonas((prev) => prev.filter((p) => p._key !== key));
  };

  const isPersonaExpanded = (persona: PersonaItem): boolean =>
    expandedOverrides[persona._key] ?? tierExpandedByDefault(persona.tier);

  const togglePersonaExpanded = (persona: PersonaItem) => {
    const current = isPersonaExpanded(persona);
    setExpandedOverrides((prev) => ({ ...prev, [persona._key]: !current }));
  };

  const handleEditPersona = (persona: PersonaItem) => {
    setEditingPersona(persona);
  };

  const handleSavePersona = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPersona) return;

    setPersonas((prev) =>
      prev.map((p) => (p._key === editingPersona._key ? editingPersona : p)),
    );
    setEditingPersona(null);
  };

  const handleEditingInfoFieldChange = (
    field: keyof PersonaInfo,
    value: string,
  ) => {
    if (!editingPersona) return;
    setEditingPersona({
      ...editingPersona,
      info: {
        ...editingPersona.info,
        [field]: value,
      },
    });
  };

  const handleDriversChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDrivers(e.target.value);
  };

  const getSelectedPersonas = () => {
    return personas
      .filter((p) => p.importance && p.importance !== "not_applicable")
      .sort((a, b) => {
        const importanceOrder = {
          very_important: 5,
          important: 4,
          somewhat_important: 3,
          rarely_important: 2,
          not_important: 1,
          not_applicable: 0,
        };
        return (
          (importanceOrder[b.importance!] || 0) -
          (importanceOrder[a.importance!] || 0)
        );
      })
      .slice(0, 3);
  };

  const canProceedFromRating = getSelectedPersonas().length >= 3;
  const canProceedFromEditing = getSelectedPersonas().every(hasPersonaContent);
  const canProceedFromDrivers = drivers.trim().length > 0;

  const handleProceed = async () => {
    if (currentStep === "rating" && canProceedFromRating) {
      setCurrentStep("editing");
    } else if (currentStep === "editing" && canProceedFromEditing) {
      setCurrentStep("drivers");
    } else if (currentStep === "drivers" && canProceedFromDrivers && brandId) {
      setIsSubmitting(true);
      try {
        const selectedPersonas = getSelectedPersonas();

        // Save each persona: POST for new (no id), PUT for existing (has id)
        await Promise.all([
          ...selectedPersonas.map((persona) =>
            persona.id
              ? brands.updateJTBDPersona(
                  brandId,
                  persona.id,
                  toJTBDPersonaIn(persona),
                )
              : brands.createJTBDPersona(brandId, toJTBDPersonaIn(persona)),
          ),
          brands.updateJTBDDrivers(brandId, drivers),
        ]);

        const statusUpdate = await progressBrandStatus(brandId);
        navigateAfterProgress(navigate, brandId, statusUpdate);
      } catch (error) {
        console.error("Failed to update JTBD:", error);
        setSubmitError(
          getAppError(error, "Couldn't save your changes. Please try again.")
            .message,
        );
      } finally {
        setIsSubmitting(false);
      }
    }

    scrollToTop();
  };

  const handleRegeneratePersonas = async () => {
    if (!brandId) return;
    if (isRegeneratingRef.current) return;
    isRegeneratingRef.current = true;
    setIsRegenerating(true);
    try {
      const suggestedData = await brands.suggestJTBD(brandId);
      if (suggestedData?.personas?.length) {
        const newPersonas: PersonaItem[] = suggestedData.personas.map(
          toSuggestedPersonaItem,
        );
        // Merge: keep existing personas, add new ones by name deduplication
        setPersonas((prev) => {
          const existingNames = new Set(prev.map((p) => p.name.toLowerCase()));
          const toAdd = newPersonas.filter(
            (p) => !existingNames.has(p.name.toLowerCase()),
          );
          return [...prev, ...toAdd];
        });
      }
      if (suggestedData?.reasoning) {
        setReasoning(suggestedData.reasoning);
      }
    } catch (error) {
      // Optionally show error
    } finally {
      setIsRegenerating(false);
      isRegeneratingRef.current = false;
    }

    scrollToTop();
  };

  // Blocking failure: a mount-time load/generation failed AND we have no
  // personas to show. Non-blocking failures (e.g. a Continue/progress error
  // that sets the store `error` while personas are present) fall through and
  // stay inline.
  if (suggestError && personas.length === 0) {
    return (
      <ErrorScreen
        error={{ message: suggestError, isNetworkError: false }}
        title="Generation Failed"
        onRetry={loadPersonas}
        onGoToDashboard={() => navigate("/brands")}
      />
    );
  }

  if (isLoading || (isRegenerating && personas.length === 0)) {
    return (
      <BrandicianLoader
        config={LOADER_CONFIGS.jtbdSuggest}
        isComplete={false}
      />
    );
  }

  /** Render the editing form - shows per-field textareas if info is present, otherwise single description textarea */
  const renderEditingForm = () => {
    if (!editingPersona) return null;

    const hasInfo =
      editingPersona.info &&
      Object.entries(PERSONA_INFO_LABELS).some(([key]) => {
        const val = editingPersona.info?.[key as keyof PersonaInfo];
        return typeof val === "string" && val.trim().length > 0;
      });

    return (
      <form onSubmit={handleSavePersona} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Persona Name
          </label>
          <input
            type="text"
            value={editingPersona.name}
            onChange={(e) =>
              setEditingPersona({
                ...editingPersona,
                name: e.target.value,
              })
            }
            className="w-full p-2 border border-neutral-300 rounded-md"
          />
        </div>

        {hasInfo ? (
          // Structured PersonaInfo editing with per-field textareas
          Object.entries(PERSONA_INFO_LABELS)
            .filter(([key]) => {
              const val = editingPersona.info?.[key as keyof PersonaInfo];
              return typeof val === "string" && val.trim().length > 0;
            })
            .map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  {label}
                </label>
                <textarea
                  value={
                    (editingPersona.info?.[
                      key as keyof PersonaInfo
                    ] as string) || ""
                  }
                  onChange={(e) =>
                    handleEditingInfoFieldChange(
                      key as keyof PersonaInfo,
                      e.target.value,
                    )
                  }
                  className="w-full min-h-[100px] p-2 border border-neutral-300 rounded-md"
                />
              </div>
            ))
        ) : (
          // Legacy description editing
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Description
            </label>
            <textarea
              value={editingPersona.description || ""}
              onChange={(e) =>
                setEditingPersona({
                  ...editingPersona,
                  description: e.target.value,
                })
              }
              className="w-full min-h-[150px] p-2 border border-neutral-300 rounded-md"
              placeholder="Enter description with each section on a new line..."
            />
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            onClick={() => setEditingPersona(null)}
            variant="secondary"
            size="md"
          >
            Cancel
          </Button>
          <Button type="submit" size="md">
            Save Changes
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between flex-wrap gap-3 items-center mb-6">
            <h1 className="text-3xl font-display font-bold text-neutral-800">
              <BrandNameDisplay brand={currentBrand!} />
              Jobs to be done / Customer Needs Analysis
            </h1>
            <div className="flex items-center flex-wrap gap-3">
              {brandId && <HistoryButton brandId={brandId} size="md" />}
              <GetHelpButton variant="secondary" size="md" />
            </div>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center flex-wrap gap-x-6 gap-y-4">
              <div
                className={`flex items-center ${
                  currentStep === "rating"
                    ? "text-primary-600"
                    : "text-neutral-400"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep === "rating"
                      ? "border-primary-600 bg-primary-50"
                      : "border-neutral-300"
                  }`}
                >
                  1
                </div>
                <span className="ml-2 font-medium">Rate Personas</span>
              </div>
              <div className="hidden md:block h-px w-8 bg-neutral-300" />
              <div
                className={`flex items-center ${
                  currentStep === "editing"
                    ? "text-primary-600"
                    : "text-neutral-400"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep === "editing"
                      ? "border-primary-600 bg-primary-50"
                      : "border-neutral-300"
                  }`}
                >
                  2
                </div>
                <span className="ml-2 font-medium">Edit Descriptions</span>
              </div>
              <div className="hidden md:block h-px w-8 bg-neutral-300" />
              <div
                className={`flex items-center ${
                  currentStep === "drivers"
                    ? "text-primary-600"
                    : "text-neutral-400"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep === "drivers"
                      ? "border-primary-600 bg-primary-50"
                      : "border-neutral-300"
                  }`}
                >
                  3
                </div>
                <span className="ml-2 font-medium">Motivational Drivers</span>
              </div>
            </div>
          </div>

          {currentStep === "rating" && (
            <div className="bg-white rounded-lg shadow-lg p-2 sm:p-6 mb-8">
              <p className="text-neutral-600 mb-6">
                Rate the importance of each persona for your business. You need
                to rate at least 3 personas to proceed. If some things are not
                correct about the persona - do not worry, you will have a chance
                to edit the persona later. Remove any personas that are not
                applicable to your business.
              </p>

              <div className="space-y-6">
                {sortPersonasByTier(personas).map((persona) => {
                  const expanded = isPersonaExpanded(persona);
                  const isPrimary = persona.tier === "primary";
                  return (
                    <div
                      key={persona._key}
                      className={`border rounded-lg p-2 ${
                        isPrimary
                          ? "border-primary-300 bg-primary-50/30"
                          : "border-neutral-200"
                      }`}
                    >
                      {/* Header: name + tier badges + expand/collapse toggle */}
                      <button
                        type="button"
                        onClick={() => togglePersonaExpanded(persona)}
                        aria-expanded={expanded}
                        className="w-full flex justify-between items-start gap-3 text-left"
                      >
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <h3 className="text-lg font-medium text-neutral-800">
                              {persona.name}
                            </h3>
                            {isPrimary && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-600 text-white">
                                Suggested primary
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-neutral-400 mt-1 shrink-0">
                          {expanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </span>
                      </button>

                      {/* Reasoning callout — shown on the primary card */}
                      {isPrimary && reasoning && (
                        <div className="mt-3 p-3 rounded-md bg-primary-50 border border-primary-200">
                          <h4 className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-1">
                            Why we suggest this as your primary persona
                          </h4>
                          <div className="text-sm text-neutral-700">
                            <MarkdownPreviewer markdown={reasoning} />
                          </div>
                        </div>
                      )}

                      {/* Expanded persona detail */}
                      {expanded && (
                        <div className="mt-3">
                          {getPersonaDisplayContent(persona)}
                        </div>
                      )}

                      {/* Rating / removal — always visible, even when collapsed */}
                      <div className="mt-4">
                        {pendingRemovalKey === persona._key ? (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-4">
                            <span className="text-2xl">⚠️</span>
                            <div className="flex-1">
                              <p className="text-gray-800 font-medium">
                                Remove this persona? This cannot be undone.
                              </p>
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setPendingRemovalKey(null)}
                                className="btn btn-ghost"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  handleRemovePersona(persona._key);
                                  setPendingRemovalKey(null);
                                }}
                                className="btn btn-warning"
                              >
                                Remove Persona
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {Object.entries(JTBD_IMPORTANCE_LABELS).map(
                              ([value, label]) => (
                                <button
                                  key={value}
                                  onClick={() =>
                                    handleImportanceChange(
                                      persona._key,
                                      value as JTBDImportance,
                                    )
                                  }
                                  className={`btn-selection p-2 text-sm rounded-md ${persona.importance === value ? "selected" : ""}`}
                                >
                                  {label}
                                </button>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center mt-8">
                <RegenerateButton
                  type="button"
                  variant="selection"
                  size="md"
                  onClick={handleRegeneratePersonas}
                  loading={isRegenerating}
                  disabled={isRegenerating || isLoading}
                >
                  Suggest new personas
                </RegenerateButton>
              </div>
            </div>
          )}

          {currentStep === "editing" && (
            <div className="bg-white rounded-lg shadow-lg p-2 sm:p-6 mb-8 scroll-object">
              <p className="text-neutral-600 mb-6">
                Edit the descriptions of your top 3 selected personas to better
                match your business context.
              </p>

              {editingPersona ? (
                renderEditingForm()
              ) : (
                <div className="space-y-4">
                  {getSelectedPersonas().map((persona) => (
                    <div
                      key={persona._key}
                      className="border border-neutral-200 rounded-lg p-2 sm:p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-neutral-800">
                            {persona.name}
                          </h3>
                          <div className="mt-2">
                            {getPersonaDisplayContent(persona)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditPersona(persona)}
                          className="text-neutral-400 hover:text-primary-600 transition-colors ml-4"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === "drivers" && (
            <div className="bg-white rounded-lg shadow-lg p-2 sm:p-6 mb-8">
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                <h2 className="text-xl font-medium text-neutral-800">
                  Functional, Emotional and Social Drivers
                </h2>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setIsEditingDrivers((v) => !v)}
                  disabled={isSubmitting}
                >
                  {isEditingDrivers ? "Preview" : "Edit"}
                </Button>
              </div>
              <p className="text-neutral-600 mb-6">
                Review the factors that motivate your personas to engage with
                your brand. Did we get everything right? Did we miss something
                important?
              </p>
              {isEditingDrivers ? (
                <textarea
                  value={drivers}
                  onChange={handleDriversChange}
                  className="w-full min-h-[300px] p-4 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your functional drivers (Markdown supported)..."
                />
              ) : (
                <div className="w-full min-h-[300px] p-4 border border-neutral-200 rounded-lg bg-neutral-50">
                  {drivers && drivers.trim() ? (
                    <MarkdownPreviewer markdown={drivers} />
                  ) : (
                    <div className="text-neutral-500 italic">
                      No drivers yet. Click Edit to add them.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center flex-wrap gap-2">
            {currentStep === "rating" && (
              <p className="text-sm text-neutral-500">
                {canProceedFromRating
                  ? "You can now proceed to edit persona descriptions"
                  : `Rate at least ${
                      3 - getSelectedPersonas().length
                    } more personas to proceed`}
              </p>
            )}
            {currentStep === "editing" && (
              <p className="text-sm text-neutral-500">
                {canProceedFromEditing
                  ? "You can now proceed to define functional drivers"
                  : "Please edit all persona descriptions before proceeding"}
              </p>
            )}
            {currentStep === "drivers" && (
              <p className="text-sm text-neutral-500">
                {canProceedFromDrivers
                  ? "You can now proceed to the brand archetype"
                  : "Please describe your functional drivers before proceeding"}
              </p>
            )}

            {submitError && (
              <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {submitError}
              </div>
            )}
            <Button
              onClick={handleProceed}
              disabled={
                (currentStep === "rating" && !canProceedFromRating) ||
                (currentStep === "editing" && !canProceedFromEditing) ||
                (currentStep === "drivers" && !canProceedFromDrivers) ||
                isSubmitting ||
                !!editingPersona
              }
              size="lg"
            >
              {isSubmitting && (
                <Loader className="animate-spin h-5 w-5 mr-2 inline" />
              )}
              {currentStep === "rating" && "Continue to Edit Personas"}
              {currentStep === "editing" &&
                "Continue to Review Motivational Drivers"}
              {currentStep === "drivers" && "Continue to Archetype"}
              <ArrowRight className="ml-2 h-5 w-5 inline" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JTBDContainer;
