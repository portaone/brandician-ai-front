import { Check, Edit2, Loader, RefreshCw, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import { scrollToTop } from "../../lib/utils";
import { JTBD, JTBDPersonaIn, PersonaInfo } from "../../types";
import Button from "../common/Button";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";
import ReactMarkdown from "react-markdown";
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
        const errorMessage =
          err?.response?.data?.message ||
          err?.response?.data?.detail ||
          "Failed to generate primary persona. Please try again.";
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
      const errorMessage =
        err?.response?.data?.message ||
        "Failed to regenerate primary persona. Please try again.";
      setError(errorMessage);
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
      const errorMessage =
        err?.response?.data?.message ||
        "Failed to save primary persona. Please try again.";
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsSaving(false);
    }
    scrollToTop();
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Generation Failed
          </h2>
          <p className="text-red-600 mb-6">{error}</p>
          <Button
            onClick={() => {
              hasLoadedRef.current = false;
              setError(null);
              setIsLoading(true);
              const loadAgain = async () => {
                try {
                  const data = await brands.generatePrimaryPersona(brandId!);
                  setPersona(data);
                } catch (err: any) {
                  setError(
                    err?.response?.data?.message ||
                      "Failed to generate primary persona.",
                  );
                } finally {
                  setIsLoading(false);
                }
              };
              loadAgain();
            }}
            size="md"
          >
            Try Again
          </Button>
        </div>
      </div>
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
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between flex-wrap gap-3 items-center mb-6">
            <h1 className="text-3xl font-display font-bold text-neutral-800">
              <BrandNameDisplay brand={currentBrand!} />
              Primary Persona
            </h1>
            <div className="flex items-center flex-wrap gap-3">
              {brandId && (
                <HistoryButton brandId={brandId} variant="outline" size="md" />
              )}
              <GetHelpButton variant="secondary" size="md" />
            </div>
          </div>

          <p className="text-neutral-600 mb-6">
            Based on your JTBD personas and survey feedback, we've generated a
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
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="text-xl font-bold text-neutral-800 flex-1 p-1 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEditField();
                      if (e.key === "Escape") cancelEditField();
                    }}
                  />
                  <button
                    onClick={saveEditField}
                    className="text-green-600 hover:text-green-700 p-1"
                    title="Save"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={cancelEditField}
                    className="text-neutral-400 hover:text-neutral-600 p-1"
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
            <div className="flex flex-wrap gap-2 mb-4 text-xs">
              {persona.confidence && (
                <span
                  className={`px-2 py-1 rounded-full font-medium ${
                    persona.confidence === "HIGH"
                      ? "bg-green-100 text-green-800"
                      : persona.confidence === "MEDIUM"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  Confidence: {persona.confidence}
                </span>
              )}
              {persona.survey_prevalence !== undefined &&
                persona.survey_prevalence !== null && (
                  <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                    Matches {persona.survey_prevalence}% of survey responders
                  </span>
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
                              className="text-sm text-neutral-500 hover:text-neutral-700 px-2 py-1"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={saveEditField}
                              className="text-sm text-primary-600 hover:text-primary-700 font-medium px-2 py-1"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none text-neutral-700">
                          <ReactMarkdown>{value}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : persona.description ? (
                <div className="prose prose-sm max-w-none text-neutral-700">
                  <ReactMarkdown>{persona.description}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-neutral-400 italic">No details available</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleRegenerate}
              disabled={isRegenerating || isSaving}
            >
              {isRegenerating ? (
                <Loader className="animate-spin h-5 w-5 mr-2 inline" />
              ) : (
                <RefreshCw className="h-5 w-5 mr-2 inline" />
              )}
              Regenerate
            </Button>

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
