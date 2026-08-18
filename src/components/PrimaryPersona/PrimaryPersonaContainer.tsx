import { Check, ChevronDown, ChevronRight, Edit2, Lightbulb, Loader, RotateCcw, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import { scrollToTop } from "../../lib/utils";
import {
  ConfidenceLevel,
  JTBD,
  JTBDPersonaIn,
  PersonaInfo,
  PersonaTier,
} from "../../types";
import Button from "../common/Button";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import RegenerateButton from "../common/RegenerateButton";
import MarkdownPreviewer from "../common/MarkDownPreviewer";
import BrandicianLoader from "../common/BrandicianLoader";
import BrandNameDisplay from "../BrandName/BrandNameDisplay";
import { useBrandStore } from "../../store/brand";
import { LOADER_CONFIGS } from "../../lib/loader-constants";
import ErrorScreen from "../common/ErrorScreen";
import { getAppError } from "../../lib/errors";

const TIER_BADGE_STYLE: Record<PersonaTier, { bg: string; fg: string; label: string }> = {
  primary: { bg: "#fd615e", fg: "#ffffff", label: "Primary" },
  secondary: { bg: "rgba(127, 89, 113, 0.15)", fg: "#5a3f50", label: "Secondary" },
  contextual: { bg: "rgba(191, 172, 184, 0.25)", fg: "#7f5971", label: "Contextual" },
};

const CONFIDENCE_STYLE: Record<ConfidenceLevel, { bg: string; fg: string }> = {
  HIGH: { bg: "rgba(45, 122, 79, 0.15)", fg: "#2d7a4f" },
  MEDIUM: { bg: "rgba(244, 195, 67, 0.2)", fg: "#a0722a" },
  LOW: { bg: "rgba(253, 97, 94, 0.15)", fg: "#fd615e" },
};

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

function toJTBDPersonaIn(persona: JTBD): JTBDPersonaIn {
  return {
    name: persona.name,
    info: persona.info,
    ranking: persona.ranking,
    survey_prevalence: persona.survey_prevalence,
    confidence: persona.confidence,
  };
}

interface PrimaryPersonaContainerProps {
  onComplete: () => void;
  onError: (error: string) => void;
}

const PrimaryPersonaContainer: React.FC<PrimaryPersonaContainerProps> = ({
  onComplete,
  onError,
}) => {
  const { brandId } = useParams<{ brandId: string }>();
  const { currentBrand } = useBrandStore();
  const [persona, setPersona] = useState<JTBD | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null); // "name" | keyof PersonaInfo | null
  const [editingValue, setEditingValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const generatePersona = async () => {
      if (!brandId || hasLoadedRef.current) return;
      hasLoadedRef.current = true;
      setIsLoading(true);
      setError(null);
      try {
        const data = await brands.generatePrimaryPersona(brandId);
        setPersona(data);
      } catch (err: any) {
        console.error("Failed to generate primary persona:", err);
        const errorMessage = getAppError(
          err,
          "Failed to generate primary persona. Please try again.",
        ).message;
        setError(errorMessage);
        onError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    generatePersona();
  }, [brandId, onError]);

  const handleRegenerate = async () => {
    if (!brandId || isRegenerating) return;
    setIsRegenerating(true);
    setError(null);

    try {
      const data = await brands.generatePrimaryPersona(brandId);
      setPersona(data);
    } catch (err: any) {
      console.error("Failed to regenerate primary persona:", err);
      setError(
        getAppError(err, "Failed to regenerate primary persona. Please try again.")
          .message,
      );
    } finally {
      setIsRegenerating(false);
    }
    scrollToTop();
  };

  const handleSave = async () => {
    if (!brandId || !persona) return;
    setIsSaving(true);
    try {
      await brands.savePrimaryPersona(brandId, toJTBDPersonaIn(persona));
      onComplete();
    } catch (err: any) {
      console.error("Failed to save primary persona:", err);
      const errorMessage = getAppError(
        err,
        "Failed to save primary persona. Please try again.",
      ).message;
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsSaving(false);
    }
    scrollToTop();
  };

  const [pendingOverride, setPendingOverride] = useState<JTBD | null>(null);
  const [isOverriding, setIsOverriding] = useState(false);
  const [selectionRationale, setSelectionRationale] = useState<string | null>(
    null,
  );
  const [rationaleExpanded, setRationaleExpanded] = useState(false);
  const [jtbdPersonas, setJtbdPersonas] = useState<JTBD[]>([]);

  // Fetch the full JTBD persona list separately — the brand GET endpoint
  // returns BrandReduced which strips `jtbd` to keep the response light.
  useEffect(() => {
    if (!brandId) return;
    let cancelled = false;
    brands
      .getJTBD(brandId)
      .then((res) => {
        if (cancelled || !res?.personas) return;
        setJtbdPersonas(Object.values(res.personas));
      })
      .catch(() => {
        if (!cancelled) setJtbdPersonas([]);
      });
    return () => {
      cancelled = true;
    };
  }, [brandId, persona?.id]);

  // Fetch the AI's selection rationale (PERSONA_SELECTION hub property)
  // whenever the persona changes — so users see WHY the AI picked the
  // current primary alongside the persona itself.
  useEffect(() => {
    if (!brandId || !persona?.id) return;
    let cancelled = false;
    brands
      .getBrandHubTab(brandId, "personas")
      .then((res: any) => {
        if (cancelled) return;
        const body = res?.properties?.persona_selection;
        if (typeof body === "string" && body.trim().length > 0) {
          setSelectionRationale(body);
        } else {
          setSelectionRationale(null);
        }
      })
      .catch(() => {
        // Best-effort — silently hide the panel if the hub data isn't
        // available yet.
        if (!cancelled) setSelectionRationale(null);
      });
    return () => {
      cancelled = true;
    };
  }, [brandId, persona?.id]);

  const suggestedPersonaId = currentBrand?.suggested_primary_persona_id;
  // Resolve which JTBD persona is currently primary. After generate, the
  // returned persona has a fresh UUID, so we fall back to the LLM-saved
  // suggestion or a name match. After override, persona.id IS a JTBD id,
  // so the direct match wins.
  const primaryJtbdId =
    (persona && jtbdPersonas.find((p) => p.id === persona.id)?.id) ||
    suggestedPersonaId ||
    jtbdPersonas.find(
      (p) => persona && p.name.toLowerCase() === persona.name.toLowerCase(),
    )?.id;
  const otherPersonas = jtbdPersonas.filter((p) => p.id !== primaryJtbdId);
  const suggestedPersona = suggestedPersonaId
    ? jtbdPersonas.find((p) => p.id === suggestedPersonaId) || null
    : null;
  const isOverrideActive =
    !!suggestedPersonaId && !!primaryJtbdId && primaryJtbdId !== suggestedPersonaId;

  const doOverride = async (target: JTBD) => {
    if (!brandId || isOverriding) return;
    setIsOverriding(true);
    setError(null);
    try {
      const data = await brands.overridePrimaryPersona(brandId, target.id);
      setPersona(data);
      setPendingOverride(null);
    } catch (err: any) {
      const msg = getAppError(
        err,
        "Could not switch the primary persona. Please try again.",
      ).message;
      setError(msg);
      onError(msg);
    } finally {
      setIsOverriding(false);
    }
    scrollToTop();
  };

  const handleChoosePrimary = (target: JTBD) => {
    if (!target?.id || target.id === primaryJtbdId) return;
    // Revert to the AI-recommended pick: no warning needed.
    if (target.id === suggestedPersonaId) {
      doOverride(target);
      return;
    }
    // Surface the AI's reasoning while the user weighs the override.
    if (selectionRationale) setRationaleExpanded(true);
    setPendingOverride(target);
  };

  const startEditField = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditingValue(currentValue);
  };

  const cancelEditField = () => {
    setEditingField(null);
    setEditingValue("");
  };

  const saveEditField = () => {
    if (!persona || editingField === null) return;
    if (editingField === "name") {
      setPersona({ ...persona, name: editingValue });
    } else {
      setPersona({
        ...persona,
        info: { ...persona.info, [editingField]: editingValue },
      });
    }
    setEditingField(null);
    setEditingValue("");
  };

  if (isLoading) {
    return (
      <BrandicianLoader
        config={LOADER_CONFIGS.primaryPersona}
        isComplete={false}
      />
    );
  }

  if (error && !persona) {
    return (
      <ErrorScreen
        error={{ message: error, isNetworkError: false }}
        title="Generation Failed"
        onRetry={() => {
          hasLoadedRef.current = false;
          setError(null);
          setIsLoading(true);
          brands
            .generatePrimaryPersona(brandId!)
            .then((data) => setPersona(data))
            .catch((err: any) =>
              setError(
                getAppError(err, "Failed to generate primary persona.").message,
              ),
            )
            .finally(() => setIsLoading(false));
        }}
      />
    );
  }

  if (!persona) {
    return null;
  }

  const infoFields = persona.info
    ? Object.entries(PERSONA_INFO_LABELS).filter(([key]) => {
        const val = persona.info?.[key as keyof PersonaInfo];
        return typeof val === "string" && val.trim().length > 0;
      })
    : [];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between flex-wrap gap-3 items-center mb-6">
            <h1 className="text-3xl font-display font-bold text-neutral-800">
              <BrandNameDisplay brand={currentBrand!} />
              Primary Persona
            </h1>
            <div className="flex items-center flex-wrap gap-3">
              {brandId && <HistoryButton brandId={brandId} size="md" />}
              <GetHelpButton variant="secondary" size="md" />
            </div>
          </div>

          <p className="text-neutral-600 mb-6">
            Based on your Customer Needs and survey feedback, we've generated a
            primary persona that represents your most important target customer.
            Review and edit as needed, then accept to continue.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
            {/* Persona name — inline editable */}
            <div className="mb-4 group">
              {editingField === "name" ? (
                <div className="flex items-center gap-2">
                  {/* min-w-0 lets flex-1 actually shrink: an input's default
                      intrinsic min-width otherwise pushes this row ~215px past
                      a 360px container (and ~287px past a 320px one). */}
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="text-xl font-bold text-neutral-800 flex-1 min-w-0 p-1 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEditField();
                      if (e.key === "Escape") cancelEditField();
                    }}
                  />
                  <button
                    onClick={saveEditField}
                    className="btn btn-primary"
                    title="Save"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={cancelEditField}
                    className="btn btn-secondary"
                    title="Cancel"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-neutral-800">
                    {persona.name}
                  </h2>
                  <button
                    onClick={() => startEditField("name", persona.name)}
                    className="text-neutral-300 hover:text-primary-600 transition-colors opacity-0 group-hover:opacity-100"
                    title="Edit name"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Metadata badges */}
            <div className="flex flex-wrap gap-2 mb-4 text-xs items-center">
              <span
                className="px-2 py-1 rounded-full font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: TIER_BADGE_STYLE.primary.bg,
                  color: TIER_BADGE_STYLE.primary.fg,
                }}
              >
                Primary
              </span>
              {persona.confidence && (
                <span
                  className="px-2 py-1 rounded-full font-semibold uppercase tracking-wide"
                  style={{
                    backgroundColor: CONFIDENCE_STYLE[persona.confidence].bg,
                    color: CONFIDENCE_STYLE[persona.confidence].fg,
                  }}
                >
                  Confidence: {persona.confidence}
                </span>
              )}
              {persona.survey_prevalence !== undefined &&
                persona.survey_prevalence !== null && (
                  <span
                    className="px-2 py-1 rounded-full font-medium"
                    style={{ backgroundColor: "#7f5971", color: "#ffffff" }}
                  >
                    Matches {persona.survey_prevalence}% of survey responders
                  </span>
                )}
              {isOverrideActive && suggestedPersona && (
                <button
                  onClick={() => doOverride(suggestedPersona)}
                  disabled={isOverriding}
                  className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 underline disabled:opacity-50"
                  title={`Revert to AI's recommended primary: ${suggestedPersona.name}`}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Override active — revert to recommended
                </button>
              )}
            </div>

            {/* PersonaInfo fields — each individually editable */}
            <div className="space-y-4">
              {infoFields.length > 0 ? (
                infoFields.map(([key, label]) => {
                  const value = persona.info?.[
                    key as keyof PersonaInfo
                  ] as string;
                  const isFieldEditing = editingField === key;

                  return (
                    <div key={key} className="group">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                          {label}
                        </h4>
                        {!isFieldEditing && (
                          <button
                            onClick={() => startEditField(key, value)}
                            className="text-neutral-300 hover:text-primary-600 transition-colors opacity-0 group-hover:opacity-100"
                            title={`Edit ${label}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {isFieldEditing ? (
                        <div>
                          <textarea
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="w-full min-h-[100px] p-2 border border-primary-300 rounded-md text-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2 mt-1">
                            <button
                              onClick={cancelEditField}
                              className="btn-secondary px-2 py-1"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={saveEditField}
                              className="btn-primary px-2 py-1"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none text-neutral-700">
                          <MarkdownPreviewer markdown={value} />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : persona.description ? (
                <div className="prose prose-sm max-w-none text-neutral-700">
                  <MarkdownPreviewer markdown={persona.description} />
                </div>
              ) : (
                <p className="text-neutral-400 italic">No details available</p>
              )}
            </div>
          </div>

          {/* Why we picked this persona — AI's selection rationale.
              Hidden when the user has overridden the AI's pick: the
              rationale describes why the AI chose the recommended
              persona, which no longer reflects the current primary.
              Reappears automatically if the user reverts. */}
          {selectionRationale && !isOverrideActive && (
            <div className="bg-white rounded-lg shadow-lg mb-6 overflow-hidden">
              <button
                onClick={() => setRationaleExpanded((v) => !v)}
                className="w-full flex items-center gap-3 px-4 sm:px-6 py-4 hover:bg-neutral-50 transition-colors text-left"
                aria-expanded={rationaleExpanded}
              >
                <Lightbulb className="h-5 w-5 text-primary-600 flex-shrink-0" />
                <span className="font-semibold text-neutral-800 flex-1">
                  Why we picked this persona
                </span>
                <span className="text-xs text-neutral-500 hidden sm:inline">
                  {rationaleExpanded ? "Hide" : "Show"}
                </span>
                {rationaleExpanded ? (
                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                )}
              </button>
              {rationaleExpanded && (
                <div className="px-4 sm:px-6 pb-5 pt-1 border-t border-neutral-100">
                  <div className="prose prose-sm max-w-none text-neutral-700">
                    <MarkdownPreviewer markdown={selectionRationale} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Other personas — tier-labeled picker */}
          {otherPersonas.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
              <h3 className="text-lg font-bold text-neutral-800 mb-1">
                Other personas
              </h3>
              <p className="text-sm text-neutral-500 mb-4">
                The AI tiered every JTBD persona. You can override the primary
                pick — secondary and contextual personas remain available for
                campaigns and product variants.
              </p>
              <ul className="space-y-3">
                {otherPersonas.map((p) => {
                  const tier = p.tier ?? null;
                  const tierStyle = tier ? TIER_BADGE_STYLE[tier] : null;
                  const isSuggested = p.id === suggestedPersonaId;
                  return (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-300 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-neutral-800">
                            {p.name}
                          </span>
                          {tierStyle && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide"
                              style={{
                                backgroundColor: tierStyle.bg,
                                color: tierStyle.fg,
                              }}
                            >
                              {tierStyle.label}
                            </span>
                          )}
                          {isSuggested && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-800">
                              Recommended
                            </span>
                          )}
                          {p.survey_prevalence !== undefined &&
                            p.survey_prevalence !== null && (
                              <span className="text-xs text-neutral-500">
                                {p.survey_prevalence}% prevalence
                              </span>
                            )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleChoosePrimary(p)}
                        disabled={isOverriding || editingField !== null}
                        className="text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-md border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white transition-colors disabled:opacity-50"
                      >
                        {isSuggested ? "Revert to this" : "Choose as primary"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Override warning modal */}
          {pendingOverride && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold text-neutral-800 mb-3">
                  Switch primary persona?
                </h3>
                <p className="text-sm text-neutral-700 leading-relaxed mb-4">
                  You're selecting{" "}
                  <span className="font-semibold">{pendingOverride.name}</span>{" "}
                  as primary instead of{" "}
                  <span className="font-semibold">
                    {suggestedPersona?.name ?? "the recommended persona"}
                  </span>
                  . Our analysis suggests{" "}
                  <span className="font-semibold">
                    {suggestedPersona?.name ?? "the recommended persona"}
                  </span>{" "}
                  has stronger alignment with your archetype and higher
                  strategic value for your brand. You can proceed — just make
                  sure this choice reflects your target audience, not just who
                  you relate to most.
                </p>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    onClick={() => setPendingOverride(null)}
                    disabled={isOverriding}
                    className="px-3 py-2 rounded-md text-sm font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => doOverride(pendingOverride)}
                    disabled={isOverriding}
                    className="px-3 py-2 rounded-md text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isOverriding && (
                      <Loader className="h-4 w-4 animate-spin" />
                    )}
                    Yes, switch primary
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <RegenerateButton
              onClick={handleRegenerate}
              disabled={isRegenerating || isSaving}
              loading={isRegenerating}
              size="md"
            >
              Regenerate
            </RegenerateButton>

            <Button
              type="button"
              size="lg"
              onClick={handleSave}
              disabled={isSaving || editingField !== null}
            >
              {isSaving && (
                <Loader className="animate-spin h-5 w-5 mr-2 inline" />
              )}
              Accept & Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrimaryPersonaContainer;
