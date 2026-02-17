import { ArrowRight, Edit2, Loader, RefreshCw, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
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
} from "../../types";
import Button from "../common/Button";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import MarkdownPreviewer from "../common/MarkDownPreviewer";
import BrandicianLoader from "../common/BrandicianLoader";
import { useAutoFocus } from "../../hooks/useAutoFocus";
import BrandNameDisplay from "../BrandName/BrandNameDisplay";
import { LOADER_CONFIGS } from "../../lib/loader-constants";

type Step = "rating" | "editing" | "drivers";

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
    error,
  } = useBrandStore();
  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [drivers, setDrivers] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("rating");
  const [editingPersona, setEditingPersona] = useState<PersonaItem | null>(
    null,
  );
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isEditingDrivers, setIsEditingDrivers] = useState(false);
  const isRegeneratingRef = useRef<boolean>(false);
  const hasInitialized = useRef(false);

  useAutoFocus([editingPersona, isEditingDrivers]);

  useEffect(() => {
    const loadData = async () => {
      if (!brandId || hasInitialized.current) return;
      hasInitialized.current = true;

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
        setDrivers(jtbd.drivers || "");
      } else {
        // No persisted JTBD — suggest initial personas
        setIsRegenerating(true);
        try {
          const suggestedData = await brands.suggestJTBD(brandId);
          if (suggestedData?.personas?.length) {
            setPersonas(suggestedData.personas.map(toSuggestedPersonaItem));
          }
          if (suggestedData?.drivers) {
            setDrivers(suggestedData.drivers);
          }
        } catch (err) {
          console.error("Failed to suggest JTBD:", err);
        } finally {
          setIsRegenerating(false);
        }
      }
    };
    loadData();
  }, [brandId, selectBrand, loadJTBD]);

  useEffect(() => {
    if (editingPersona) {
      setTimeout(() => {
        const scrollElement = document.querySelector(".scroll-object");
        scrollElement?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    }
  }, [editingPersona]);

  const handleImportanceChange = (key: string, importance: JTBDImportance) => {
    if (importance === "not_applicable") {
      handleRemovePersona(key);
    } else {
      setPersonas((prev) =>
        prev.map((p) => (p._key === key ? { ...p, importance } : p)),
      );
    }
  };

  const handleRemovePersona = (key: string) => {
    setPersonas((prev) => prev.filter((p) => p._key !== key));
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
    } catch (error) {
      // Optionally show error
    } finally {
      setIsRegenerating(false);
      isRegeneratingRef.current = false;
    }

    scrollToTop();
  };

  if (isLoading) {
    return (
      <BrandicianLoader
        config={LOADER_CONFIGS.customerNeeds}
        isComplete={false}
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-600 mb-4">{error}</div>
        <div className="flex space-x-4">
          <Button
            onClick={async () => {
              hasInitialized.current = false;
              if (brandId) {
                await selectBrand(brandId);
                await loadJTBD(brandId);
              }
            }}
            size="md"
          >
            Try again
          </Button>
          <Button
            onClick={() => navigate("/brands")}
            variant="secondary"
            size="md"
          >
            Exit
          </Button>
        </div>
      </div>
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
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between flex-wrap gap-3 items-center mb-6">
            <h1 className="text-3xl font-display font-bold text-neutral-800">
              <BrandNameDisplay brand={currentBrand!} />
              Jobs To Be Done Analysis
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
                <span className="ml-2 font-medium">Functional Drivers</span>
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
                {personas.map((persona) => (
                  <div
                    key={persona._key}
                    className="border border-neutral-200 rounded-lg p-2"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-neutral-800">
                          {persona.name}
                        </h3>
                        <div className="mt-2">
                          {getPersonaDisplayContent(persona)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePersona(persona._key)}
                        className="text-neutral-400 hover:text-red-500 transition-colors"
                        title="Remove persona"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

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
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-8">
                <Button
                  type="button"
                  variant="selection"
                  size="md"
                  onClick={handleRegeneratePersonas}
                  disabled={isRegenerating || isLoading}
                >
                  {isRegenerating ? (
                    <Loader className="animate-spin h-5 w-5 mr-2 inline" />
                  ) : (
                    <RefreshCw className="h-5 w-5 mr-2 inline" />
                  )}
                  Suggest new personas
                </Button>
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
                  ? "You can now proceed to create the survey"
                  : "Please describe your functional drivers before proceeding"}
              </p>
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
                "Continue to Review Persona's Drivers"}
              {currentStep === "drivers" && "Proceed to Survey"}
              <ArrowRight className="ml-2 h-5 w-5 inline" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JTBDContainer;
