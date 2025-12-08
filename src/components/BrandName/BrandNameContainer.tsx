import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader, ArrowRight, RefreshCw, Check, Plus, X } from "lucide-react";
import { useBrandStore } from "../../store/brand";
import { brands } from "../../lib/api";
import BrandAssets from "../BrandAssets/BrandAssets";
import { navigateAfterProgress } from "../../lib/navigation";
import Button from "../common/Button";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";

interface BrandNameSuggestion {
  name: string;
  rationale?: string;
  domains_available?: string[];
  score: number;
}

interface BrandName {
  name: string;
  description: string;
  domains_available: string[];
  score?: number;
}

const BrandNameContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { selectBrand, currentBrand, progressBrandStatus } = useBrandStore();

  const [suggestions, setSuggestions] = useState<BrandNameSuggestion[]>([]);
  const [selectedName, setSelectedName] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");
  const [isShowingCustomInput, setIsShowingCustomInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAssets, setShowAssets] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<BrandName | null>(null);

  useEffect(() => {
    const loadBrandAndSuggestions = async () => {
      if (!brandId) return;

      setIsLoading(true);
      try {
        await selectBrand(brandId);
        // Get name suggestions from the dedicated endpoint
        const nameOptions = await brands.pickName(brandId);
        // Store draft separately
        setCurrentDraft(nameOptions.draft || null);
        // Only set alt_options as suggestions
        const altSuggestions = Array.isArray(nameOptions.alt_options)
          ? nameOptions.alt_options.map((opt: BrandName) => ({
              name: opt.name,
              rationale: opt.description,
              domains_available: opt.domains_available || [],
              score: opt.score,
            }))
          : [];
        setSuggestions(altSuggestions);
      } catch (error) {
        setError("Failed to generate brand name suggestions");
      } finally {
        setIsLoading(false);
      }
    };

    loadBrandAndSuggestions();
  }, [brandId]);

  const handleSelectName = (name: string) => {
    setSelectedName(name);
    setCustomName("");
    setIsShowingCustomInput(false);
  };

  const handleCustomNameSubmit = () => {
    if (customName.trim()) {
      setSelectedName(customName.trim());
      setIsShowingCustomInput(false);
    }
  };

  const handleProceedToAssets = async () => {
    if (!brandId || !selectedName || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Use proper progress endpoint instead of calling pickName again
      const statusUpdate = await progressBrandStatus(brandId);
      // Navigate to the next step as determined by the backend
      navigateAfterProgress(navigate, brandId, statusUpdate);
    } catch (error) {
      console.error("Failed to proceed to asset creation:", error);
      setError("Failed to progress to asset creation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateNewSuggestions = async () => {
    if (!brandId || isGenerating) return;

    setIsGenerating(true);
    try {
      const nameOptions = await brands.pickName(brandId);

      const suggestions = [];
      if (nameOptions.draft) {
        suggestions.push({
          name: nameOptions.draft.name,
          rationale: nameOptions.draft.description,
          domains_available: nameOptions.draft.domains_available || [],
          score: nameOptions.draft.score,
        });
      }
      if (Array.isArray(nameOptions.alt_options)) {
        suggestions.push(
          ...nameOptions.alt_options.map((opt: BrandName) => ({
            name: opt.name,
            rationale: opt.description,
            domains_available: opt.domains_available || [],
            score: opt.score,
          }))
        );
      }
      setSuggestions(suggestions);
    } catch (error) {
      setError("Failed to generate new suggestions");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGetDomains = async (domains: string[]) => {
    if (!brandId || domains.length === 0) return;

    try {
      const response = await brands.registerDomains(brandId, domains);
      window.open(response.registration_url, "_blank");
    } catch (error) {
      console.error("Failed to get domain registration URL:", error);
      // Fallback to GoDaddy
      window.open("https://www.godaddy.com", "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="flex flex-col items-center">
          <Loader className="animate-spin h-8 w-8 text-primary-600 mb-4" />
          <p className="text-gray-600">Loading brand naming options...</p>
        </div>
      </div>
    );
  }

  if (showAssets && brandId) {
    return <BrandAssets brandId={brandId} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between flex-wrap gap-2 items-center mb-6">
            <h1 className="text-3xl font-display font-bold text-neutral-800">
              Pick Your Brand Name
            </h1>
            <div className="flex items-center flex-wrap gap-3">
              {brandId && (
                <HistoryButton brandId={brandId} variant="outline" size="md" />
              )}
              <GetHelpButton variant="secondary" size="md" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-2 sm:p-6 mb-8">
            {/* Current Brand Name Section */}
            {currentDraft && (
              <div className="mb-6 p-2 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-4 flex-wrap justify-between">
                <div>
                  <h3 className="font-medium text-blue-800 mb-2">
                    Current Brand: {currentDraft.name}
                  </h3>
                  {/* Show available domains for current brand name if any */}
                  {Array.isArray(currentDraft.domains_available) &&
                    currentDraft.domains_available.some((domain: string) =>
                      domain.includes(".")
                    ) && (
                      <>
                        <div className="mb-1 font-medium text-blue-700">
                          Domains available:
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {currentDraft.domains_available
                            .filter((domain: string) => domain.includes("."))
                            .map((domain: string, i: number) => (
                              <span
                                key={i}
                                className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-mono"
                              >
                                {domain}
                              </span>
                            ))}
                        </div>
                        <Button
                          onClick={() =>
                            handleGetDomains(
                              currentDraft.domains_available.filter(
                                (domain: string) => domain.includes(".")
                              )
                            )
                          }
                          variant="secondary"
                          size="sm"
                        >
                          Get them now!
                        </Button>
                      </>
                    )}
                </div>
                <Button
                  onClick={() => handleSelectName(currentDraft.name)}
                  variant={
                    selectedName === currentDraft.name ? "primary" : "secondary"
                  }
                  size="md"
                >
                  {selectedName === currentDraft.name
                    ? "✓ Keeping Current Name"
                    : "Keep Current Name"}
                </Button>
              </div>
            )}

            {/* Name Suggestions */}
            <div className="mb-6">
              <div className="flex items-center flex-wrap gap-2 justify-between mb-4">
                <h3 className="text-xl font-medium text-neutral-800">
                  Suggested Names
                </h3>
                <Button
                  onClick={handleGenerateNewSuggestions}
                  disabled={isGenerating}
                  variant="secondary"
                  size="sm"
                >
                  {isGenerating ? (
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Generate New Suggestions
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedName === suggestion.name
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => handleSelectName(suggestion.name)}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        {suggestion.name}
                      </h4>
                      {selectedName === suggestion.name && (
                        <Check className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                    {suggestion.rationale && (
                      <p className="text-sm text-gray-600 mt-1">
                        {suggestion.rationale}
                      </p>
                    )}
                    {/* Show available domains as green badges if they contain a dot */}
                    {Array.isArray(suggestion.domains_available) &&
                      suggestion.domains_available.some((domain) =>
                        domain.includes(".")
                      ) && (
                        <>
                          <div className="mt-2 mb-1 font-medium text-green-700">
                            Domains available:
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {suggestion.domains_available
                              .filter((domain) => domain.includes("."))
                              .map((domain, i) => (
                                <span
                                  key={i}
                                  className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-mono"
                                >
                                  {domain}
                                </span>
                              ))}
                          </div>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGetDomains(
                                suggestion.domains_available?.filter((domain) =>
                                  domain.includes(".")
                                ) || []
                              );
                            }}
                            variant="secondary"
                            size="sm"
                          >
                            Get them now!
                          </Button>
                        </>
                      )}
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Name Input */}
            <div className="mb-6">
              <h3 className="text-xl font-medium text-neutral-800 mb-4">
                Or Enter Your Own Name
              </h3>

              {!isShowingCustomInput ? (
                <Button
                  onClick={() => setIsShowingCustomInput(true)}
                  variant="secondary"
                  size="md"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Enter Custom Name
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter your brand name"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleCustomNameSubmit()
                    }
                  />
                  <button
                    onClick={handleCustomNameSubmit}
                    disabled={!customName.trim()}
                    className="px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setIsShowingCustomInput(false);
                      setCustomName("");
                    }}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Selected Name Display */}
            {selectedName && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-medium text-green-800 mb-2">
                  Selected Brand Name
                </h3>
                <p className="text-green-700 text-xl font-semibold">
                  {selectedName}
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Action Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleProceedToAssets}
                disabled={!selectedName || isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                ) : null}
                Create Brand Assets
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandNameContainer;
