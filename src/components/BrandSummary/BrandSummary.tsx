import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader, ArrowRight } from 'lucide-react';
import { useBrandStore } from '../../store/brand';

const BrandSummary: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { 
    currentBrand, 
    selectBrand, 
    updateBrandSummary, 
    generateBrandSummary,
    loadSummary,
    isLoading, 
    error 
  } = useBrandStore();
  const [summary, setSummary] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);

  useEffect(() => {
    const initializeSummary = async () => {
      if (!brandId) return;
      
      try {
        console.log('🔄 Initializing summary for brand:', brandId);
        await selectBrand(brandId);
        
        // Try to load existing summary first
        try {
          const existingSummary = await loadSummary(brandId);
          if (existingSummary) {
            console.log('📝 Using existing summary');
            setSummary(existingSummary);
            setIsGenerating(false);
            return;
          }
        } catch (error) {
          console.log('No existing summary found, will generate new one');
        }
        
        // Only generate summary if we haven't tried before
        if (!hasAttemptedGeneration) {
          console.log('📝 Generating new summary...');
          setHasAttemptedGeneration(true);
          await generateBrandSummary(brandId);
        }
      } catch (error) {
        console.error('❌ Failed to initialize summary:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    initializeSummary();
  }, [brandId, selectBrand, generateBrandSummary, loadSummary, hasAttemptedGeneration]);

  useEffect(() => {
    if (currentBrand?.summary) {
      setSummary(currentBrand.summary);
    }
  }, [currentBrand]);

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSummary(e.target.value);
  };

  const handleProceed = async () => {
    if (!brandId || !summary || !summary.trim()) return;

    setIsSubmitting(true);
    try {
      await updateBrandSummary(brandId, summary);
      navigate(`/brands/${brandId}/jtbd`);
    } catch (error) {
      console.error('Failed to update summary:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isGenerating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">
            {isGenerating ? 'Generating brand summary...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-display font-bold text-neutral-800 mb-6">
            Brand Summary
          </h1>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-neutral-600 mb-6">
              We've analyzed your responses and generated a summary of your brand. 
              Please review and make any necessary adjustments.
            </p>

            <div className="mb-6">
              <label 
                htmlFor="summary" 
                className="block text-sm font-medium text-neutral-700 mb-2"
              >
                Brand Summary
              </label>
              <textarea
                id="summary"
                value={summary}
                onChange={handleSummaryChange}
                className="w-full min-h-[300px] p-4 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Loading summary..."
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleProceed}
                disabled={isSubmitting || !summary || !summary.trim()}
                className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                ) : null}
                Proceed to Jobs to be Done
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandSummary;