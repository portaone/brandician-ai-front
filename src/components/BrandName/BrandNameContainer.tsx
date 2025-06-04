import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader, ArrowRight, RefreshCw, Check, Plus, X } from 'lucide-react';
import { useBrandStore } from '../../store/brand';
import { brands } from '../../lib/api';

interface BrandNameSuggestion {
  name: string;
  rationale?: string;
}

const BrandNameContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { selectBrand, currentBrand } = useBrandStore();
  
  const [suggestions, setSuggestions] = useState<BrandNameSuggestion[]>([]);
  const [selectedName, setSelectedName] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [isShowingCustomInput, setIsShowingCustomInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBrandAndSuggestions = async () => {
      if (!brandId) return;

      setIsLoading(true);
      try {
        // Load brand data
        await selectBrand(brandId);
        
        // Generate initial name suggestions
        await generateNameSuggestions();
      } catch (error) {
        console.error('Failed to load brand data:', error);
        setError('Failed to load brand information');
      } finally {
        setIsLoading(false);
      }
    };

    loadBrandAndSuggestions();
  }, [brandId]);

  const generateNameSuggestions = async () => {
    if (!brandId || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    
    try {
      // Mock API call for now - replace with actual API endpoint
      // const response = await brands.generateBrandNames(brandId);
      
      // Mock suggestions for demonstration
      const mockSuggestions: BrandNameSuggestion[] = [
        { name: "VineVibe", rationale: "Combines wine culture with positive energy" },
        { name: "TerroirTaste", rationale: "Emphasizes the unique characteristics of wine regions" },
        { name: "SommSelect", rationale: "Professional wine selection expertise" },
        { name: "CellarCraft", rationale: "Artisanal approach to wine curation" },
        { name: "WineWise", rationale: "Smart, knowledgeable wine recommendations" },
      ];
      
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Failed to generate name suggestions:', error);
      setError('Failed to generate name suggestions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectName = (name: string) => {
    setSelectedName(name);
    setCustomName('');
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
      // Update brand with selected name
      await brands.update(brandId, { name: selectedName });
      
      // Update status to create_assets
      await brands.updateStatus(brandId, 'create_assets');
      
      // Navigate to create assets page
      navigate(`/brands/${brandId}/create-assets`);
    } catch (error) {
      console.error('Failed to proceed to asset creation:', error);
      setError('Failed to save brand name and proceed');
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-display font-bold text-neutral-800 mb-6">
            Pick Your Brand Name
          </h1>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Based on your brand analysis and feedback, here are some suggested names for your brand. 
                You can select one of the suggestions or enter your own custom name.
              </p>
              
              {currentBrand && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Current Brand: {currentBrand.name}</h3>
                  <p className="text-blue-700 text-sm">
                    You can keep this name or choose a new one from the suggestions below.
                  </p>
                </div>
              )}
            </div>

            {/* Name Suggestions */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-medium text-neutral-800">Suggested Names</h3>
                <button
                  onClick={generateNameSuggestions}
                  disabled={isGenerating}
                  className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? (
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Generate New Suggestions
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedName === suggestion.name
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectName(suggestion.name)}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{suggestion.name}</h4>
                      {selectedName === suggestion.name && (
                        <Check className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                    {suggestion.rationale && (
                      <p className="text-sm text-gray-600 mt-1">{suggestion.rationale}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Name Input */}
            <div className="mb-6">
              <h3 className="text-xl font-medium text-neutral-800 mb-4">Or Enter Your Own Name</h3>
              
              {!isShowingCustomInput ? (
                <button
                  onClick={() => setIsShowingCustomInput(true)}
                  className="inline-flex items-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Enter Custom Name
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter your brand name"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomNameSubmit()}
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
                      setCustomName('');
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
                <h3 className="text-lg font-medium text-green-800 mb-2">Selected Brand Name</h3>
                <p className="text-green-700 text-xl font-semibold">{selectedName}</p>
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
              <button
                onClick={handleProceedToAssets}
                disabled={!selectedName || isSubmitting}
                className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                ) : null}
                Create Brand Assets
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandNameContainer; 