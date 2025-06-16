import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, Loader, RefreshCw } from 'lucide-react';
import { useBrandStore } from '../../store/brand';
import { SurveyStatus } from '../../types';
import { brands } from '../../lib/api';
import { navigateAfterProgress } from '../../lib/navigation';

const CollectFeedbackContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { updateBrandStatus, progressBrandStatus } = useBrandStore();
  
  const [surveyStatus, setSurveyStatus] = useState<SurveyStatus | null>(null);
  const [surveyUrl, setSurveyUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string>('');

  const loadSurveyData = async () => {
    if (!brandId) return;

    setIsLoading(true);
    try {
      // Load survey status
      const status = await brands.getSurveyStatus(brandId);
      setSurveyStatus(status);

      // Load survey to get URL
      const survey = await brands.getSurvey(brandId);
      if (survey?.results?.url) {
        setSurveyUrl(survey.results.url);
      }
    } catch (error) {
      console.error('Failed to load survey data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSurveyData();
  }, [brandId]);

  const handleCopyUrl = async () => {
    if (!surveyUrl) return;
    
    try {
      await navigator.clipboard.writeText(surveyUrl);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      setCopyFeedback('Failed to copy');
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  const handleProceed = async () => {
    if (!brandId) return;
    
    try {
      // Use proper progress endpoint instead of manual status setting
      const statusUpdate = await progressBrandStatus(brandId);
      // Navigate based on backend response
      navigateAfterProgress(navigate, brandId, statusUpdate);
    } catch (error) {
      console.error('Failed to progress brand status:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Survey Collection</h2>
        
        {/* Survey Status */}
        {isLoading ? (
          <div className="flex items-center justify-center mb-6">
            <Loader className="animate-spin h-6 w-6 mr-2 text-primary-600" />
            <span className="text-gray-600">Loading survey status...</span>
          </div>
        ) : surveyStatus ? (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-center mb-4">
              <p className="text-lg text-gray-700">
                <span className="font-semibold text-primary-600 text-2xl">{surveyStatus.number_of_responses}</span> people have completed your survey!
              </p>
              {surveyStatus.last_response_date && (
                <p className="text-green-600 text-sm mt-2">
                  Last response: {new Date(surveyStatus.last_response_date).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-center text-gray-600">Unable to load survey status</p>
          </div>
        )}

        {/* Survey URL */}
        {surveyUrl && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Survey URL
            </label>
            <div className="flex">
              <input
                type="text"
                readOnly
                value={surveyUrl}
                className="flex-1 p-3 border border-r-0 border-gray-300 rounded-l-md bg-gray-50 text-sm"
              />
              <button
                onClick={handleCopyUrl}
                className="px-4 py-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 transition-colors"
              >
                {copyFeedback ? (
                  <span className="text-xs font-medium text-green-600">{copyFeedback}</span>
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          {surveyStatus && surveyStatus.number_of_responses < (surveyStatus.min_responses_required || 20) && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm font-medium mb-2">
                Minimum responses required
              </p>
              <p className="text-yellow-700 text-sm">
                We need at least {surveyStatus.min_responses_required || 20} survey responses to generate meaningful feedback analysis. 
                You currently have {surveyStatus.number_of_responses} response{surveyStatus.number_of_responses !== 1 ? 's' : ''}. 
                Please continue sharing your survey to collect more responses.
              </p>
            </div>
          )}

          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={loadSurveyData}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh survey status
            </button>
          </div>
          
          <button
            onClick={handleProceed}
            disabled={isLoading || !surveyStatus || surveyStatus.number_of_responses < (surveyStatus.min_responses_required || 20)}
            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-600"
          >
            {isLoading ? 'Loading survey status...' : 'Close the survey and analyze the results'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollectFeedbackContainer; 