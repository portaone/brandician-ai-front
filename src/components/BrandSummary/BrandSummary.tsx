import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Loader, ArrowRight } from 'lucide-react';
import { useBrandStore } from '../../store/brand';

const BrandSummary: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const [searchParams] = useSearchParams();
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
  const [errorState, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'generation' | 'save' | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    const initializeSummary = async () => {
      if (!brandId) return;
      if (hasInitialized.current) return;
      hasInitialized.current = true;

      try {
        console.log('🔄 Initializing summary for brand:', brandId);
        await selectBrand(brandId);
        
        // If regenerate=1, always generate a new summary
        if (searchParams.get('regenerate') === '1') {
          console.log('📝 Regenerating summary due to query param...');
          await generateBrandSummary(brandId);
          setIsGenerating(false);
          return;
        }
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
        setError('Failed to generate summary. Please try again.');
        setErrorType('generation');
      } finally {
        setIsGenerating(false);
      }
    };

    initializeSummary();
  }, [brandId, selectBrand, generateBrandSummary, loadSummary, searchParams]);

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
    setError(null);
    setErrorType(null);
    try {
      await updateBrandSummary(brandId, summary);
      navigate(`/brands/${brandId}/jtbd`);
    } catch (error) {
      console.error('Failed to update summary:', error);
      setError('Failed to save summary. Please try again.');
      setErrorType('save');
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

  if (errorState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-600 mb-4">{errorState}</div>
        <div className="flex space-x-4">
          <button
            onClick={async () => {
              setError(null);
              setErrorType(null);
              
              if (errorType === 'save') {
                // Retry saving the current summary
                setIsSubmitting(true);
                try {
                  await updateBrandSummary(brandId!, summary);
                  navigate(`/brands/${brandId}/jtbd`);
                } catch (error) {
                  console.error('Failed to update summary:', error);
                  setError('Failed to save summary. Please try again.');
                  setErrorType('save');
                } finally {
                  setIsSubmitting(false);
                }
              } else {
                // Retry generating a new summary
                setIsGenerating(true);
                setHasAttemptedGeneration(false);
                try {
                  if (brandId) {
                    await generateBrandSummary(brandId);
                  }
                } catch (error) {
                  console.error('Failed to generate summary:', error);
                  setError('Failed to generate summary. Please try again.');
                  setErrorType('generation');
                } finally {
                  setIsGenerating(false);
                }
              }
            }}
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary-600 text-white rounded-md disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Try again'}
          </button>
          <button
            onClick={() => navigate('/brands')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
          >
            Exit
          </button>
        </div>
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

            <div className="flex justify-between items-center">
              <button
                onClick={() => navigate(`/brands/${brandId}/questionnaire?summary=1`)}
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Change my answers
              </button>
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