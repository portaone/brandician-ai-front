import { Edit2, Loader, RefreshCw } from "lucide-react";
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
  const [isEditing, setIsEditing] = useState(false);
  const [editingPersona, setEditingPersona] = useState<JTBD | null>(null);
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
    setIsEditing(false);
    setEditingPersona(null);
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
      const personaToSave = isEditing && editingPersona ? editingPersona : persona;
      await brands.savePrimaryPersona(brandId, toJTBDPersonaIn(personaToSave));
      setIsEditing(false);
      setEditingPersona(null);
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

  const handleSkip = () => {
    onComplete();
    scrollToTop();
  };

  const handleStartEditing = () => {
    setEditingPersona(persona ? { ...persona } : null);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setEditingPersona(null);
    setIsEditing(false);
  };

  const handleSaveEdits = () => {
    if (editingPersona) {
      setPersona(editingPersona);
    }
    setIsEditing(false);
    setEditingPersona(null);
  };

  const handleEditInfoField = (field: keyof PersonaInfo, value: string) => {
    if (!editingPersona) return;
    setEditingPersona({
      ...editingPersona,
      info: {
        ...editingPersona.info,
        [field]: value,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="loader-container">
        <div className="flex flex-col items-center gap-2">
          <BrandicianLoader />
          <p className="text-gray-600">
            Generating your primary persona...
          </p>
        </div>
      </div>
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
          <div className="flex justify-center gap-3">
            <Button
              onClick={() => {
                hasLoadedRef.current = false;
                setError(null);
                setIsLoading(true);
                // Trigger re-load
                const loadAgain = async () => {
                  try {
                    const data = await brands.generatePrimaryPersona(brandId!);
                    setPersona(data);
                  } catch (err: any) {
                    setError(err?.response?.data?.message || "Failed to generate primary persona.");
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
            <Button onClick={handleSkip} variant="secondary" size="md">
              Skip
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!persona) {
    return null;
  }

  const displayPersona = isEditing && editingPersona ? editingPersona : persona;

  const renderPersonaInfoDisplay = (info: PersonaInfo | undefined) => {
    if (!info) return <p className="text-gray-400 italic">No details available</p>;

    const fields = Object.entries(PERSONA_INFO_LABELS).filter(([key]) => {
      const val = info[key as keyof PersonaInfo];
      return typeof val === "string" && val.trim().length > 0;
    });

    if (fields.length === 0) return <p className="text-gray-400 italic">No details available</p>;

    return fields.map(([key, label]) => (
      <div key={key} className="mb-4 last:mb-0">
        <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-1">
          {label}
        </h4>
        <div className="prose prose-sm max-w-none text-neutral-700">
          <ReactMarkdown>{info[key as keyof PersonaInfo] as string}</ReactMarkdown>
        </div>
      </div>
    ));
  };

  const renderEditForm = () => {
    if (!editingPersona) return null;

    const fields = Object.entries(PERSONA_INFO_LABELS).filter(([key]) => {
      const val = editingPersona.info?.[key as keyof PersonaInfo];
      return typeof val === "string" && val.trim().length > 0;
    });

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Persona Name
          </label>
          <input
            type="text"
            value={editingPersona.name}
            onChange={(e) =>
              setEditingPersona({ ...editingPersona, name: e.target.value })
            }
            className="w-full p-2 border border-neutral-300 rounded-md"
          />
        </div>

        {fields.length > 0 ? (
          fields.map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {label}
              </label>
              <textarea
                value={(editingPersona.info?.[key as keyof PersonaInfo] as string) || ""}
                onChange={(e) => handleEditInfoField(key as keyof PersonaInfo, e.target.value)}
                className="w-full min-h-[100px] p-2 border border-neutral-300 rounded-md"
              />
            </div>
          ))
        ) : editingPersona.description !== undefined ? (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Description
            </label>
            <textarea
              value={editingPersona.description || ""}
              onChange={(e) =>
                setEditingPersona({ ...editingPersona, description: e.target.value })
              }
              className="w-full min-h-[150px] p-2 border border-neutral-300 rounded-md"
            />
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" onClick={handleCancelEditing} variant="ghost" size="md">
            Cancel
          </Button>
          <Button type="button" onClick={handleSaveEdits} size="md">
            Apply Changes
          </Button>
        </div>
      </div>
    );
  };

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
            Based on your JTBD personas and survey feedback, we've generated a primary
            persona that represents your most important target customer. Review and
            edit as needed, then accept to continue.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
            {/* Persona header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-800">
                  {displayPersona.name}
                </h2>
                {/* Metadata badges */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {displayPersona.confidence && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      displayPersona.confidence === "HIGH" ? "bg-green-100 text-green-800" :
                      displayPersona.confidence === "MEDIUM" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      Confidence: {displayPersona.confidence}
                    </span>
                  )}
                  {displayPersona.survey_prevalence !== undefined && (
                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                      Survey Prevalence: {displayPersona.survey_prevalence}%
                    </span>
                  )}
                  {displayPersona.ranking !== undefined && (
                    <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
                      Ranking: {displayPersona.ranking}/5
                    </span>
                  )}
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={handleStartEditing}
                  className="text-neutral-400 hover:text-primary-600 transition-colors"
                  title="Edit persona"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Persona content */}
            {isEditing ? (
              renderEditForm()
            ) : (
              <div className="mt-4">
                {displayPersona.info ? (
                  renderPersonaInfoDisplay(displayPersona.info)
                ) : displayPersona.description ? (
                  <div className="prose prose-sm max-w-none text-neutral-700">
                    <ReactMarkdown>{displayPersona.description}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-neutral-400 italic">No details available</p>
                )}
              </div>
            )}
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

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={handleSkip}
                disabled={isSaving}
              >
                Skip
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={handleSave}
                disabled={isSaving || isEditing}
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
    </div>
  );
};

export default PrimaryPersonaContainer;
