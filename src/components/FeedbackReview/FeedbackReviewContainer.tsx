import { AlertCircle, ArrowRight, Loader, RefreshCw } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import { useBrandStore } from "../../store/brand";
import { Feedback } from "../../types";

// Global cache to prevent duplicate API calls across component instances
const feedbackCache = new Map<
  string,
  { loading: boolean; data?: Feedback; error?: string; timestamp: number }
>();

// Cache cleanup - remove entries older than 10 minutes
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of feedbackCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      feedbackCache.delete(key);
    }
  }
};

// Cleanup cache every 5 minutes
setInterval(cleanupCache, 5 * 60 * 1000);

function fixChangeTags(text: string): string {
  // Replace <change id=1 t=mod> with <change id="1" t="mod">
  return text.replace(/<change ([^>]+)>/g, (match, attrs) => {
    // Add quotes to all attribute values
    const fixedAttrs = attrs.replace(/(\\w+)=([^"'][^\\s>]*)/g, '$1="$2"');
    return `<change ${fixedAttrs}>`;
  });
}

const FeedbackReviewContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { selectBrand, currentBrand, progressBrandStatus } = useBrandStore();

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent duplicate API calls
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  // Dummy state to force reload
  const [reloadFlag, setReloadFlag] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadFeedbackAnalysis = async () => {
      if (!brandId || !isMounted) return;

      // Check global cache first
      const cacheKey = `feedback-${brandId}`;
      const cached = feedbackCache.get(cacheKey);

      // Check if cache entry is still valid
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        if (cached.loading) {
          console.log(
            "⏸️ Feedback analysis already in progress for this brand"
          );
          return;
        }

        if (cached.data) {
          console.log("📋 Using cached feedback data");
          setFeedback(cached.data);
          return;
        }
      } else if (cached) {
        // Remove expired cache entry
        feedbackCache.delete(cacheKey);
      }

      // Check if we're already loading or have loaded locally
      if (isLoadingRef.current || hasLoadedRef.current) {
        console.log("⏸️ Skipping duplicate local feedback analysis call");
        return;
      }

      // Mark as loading in cache
      feedbackCache.set(cacheKey, { loading: true, timestamp: Date.now() });
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        console.log("🔄 Loading feedback analysis for brand:", brandId);

        // Load brand data first
        if (isMounted) {
          await selectBrand(brandId);
        }

        // Only proceed with feedback analysis if component is still mounted
        if (isMounted && !hasLoadedRef.current) {
          const feedbackData = await brands.analyzeFeedback(brandId);
          console.log("✅ Feedback analysis completed:", feedbackData);

          if (isMounted) {
            setFeedback(feedbackData);
            hasLoadedRef.current = true;
            // Cache the successful result
            feedbackCache.set(cacheKey, {
              loading: false,
              data: feedbackData,
              timestamp: Date.now(),
            });
          }
        }
      } catch (error: any) {
        if (isMounted) {
          console.error("❌ Failed to analyze feedback:", error);

          let errorMessage = "Failed to analyze feedback. Please try again.";

          if (error?.response?.status === 500) {
            errorMessage =
              "Server error occurred while analyzing feedback. This might be due to insufficient survey responses or a temporary service issue.";
          } else if (error?.response?.status === 404) {
            errorMessage = "No survey data found for this brand.";
          } else if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
          }

          setError(errorMessage);
          // Don't cache errors - allow retries on fresh page loads
          // Only remove the loading state from cache
          feedbackCache.delete(cacheKey);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
        isLoadingRef.current = false;
        // Remove loading state from cache (but keep successful data cached)
        const currentCache = feedbackCache.get(cacheKey);
        if (currentCache?.loading) {
          feedbackCache.set(cacheKey, {
            loading: false,
            data: currentCache.data,
          });
        }
      }
    };

    // Small delay to help prevent React StrictMode duplicates
    const timeoutId = setTimeout(loadFeedbackAnalysis, 50);

    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      isLoadingRef.current = false;
    };
  }, [brandId, reloadFlag]); // Add reloadFlag to dependencies

  const handleProceedToNaming = async () => {
    if (!brandId) return;

    try {
      // Use proper progress endpoint instead of manual status setting
      await progressBrandStatus(brandId);
      // Navigate based on the new status returned by backend
      navigate(`/brands/${brandId}/pick-name`);
    } catch (error) {
      console.error("Failed to proceed to brand naming:", error);
    }
  };

  const handleRetry = () => {
    // Reset refs to allow retry
    hasLoadedRef.current = false;
    isLoadingRef.current = false;
    setError(null);
    setFeedback(null);
    // Clear cache for this brand
    if (brandId) {
      const cacheKey = `feedback-${brandId}`;
      feedbackCache.delete(cacheKey);
    }
    // Trigger a re-load by updating a dummy state
    setReloadFlag((flag) => !flag);
  };

  const handleRerunAnalysis = async () => {
    if (!brandId || isRerunning) return;

    setIsRerunning(true);
    setError(null);

    try {
      console.log("🔄 Re-running feedback analysis for brand:", brandId);

      // Clear cache for fresh analysis
      const cacheKey = `feedback-${brandId}`;
      feedbackCache.delete(cacheKey);

      // Reset local state
      hasLoadedRef.current = false;
      isLoadingRef.current = false;

      // Run fresh analysis
      const feedbackData = await brands.analyzeFeedback(brandId);
      console.log("✅ Fresh feedback analysis completed:", feedbackData);

      setFeedback(feedbackData);
      hasLoadedRef.current = true;

      // Cache the new result
      feedbackCache.set(cacheKey, { loading: false, data: feedbackData });
    } catch (error: any) {
      console.error("❌ Failed to re-run feedback analysis:", error);

      let errorMessage = "Failed to re-run analysis. Please try again.";

      if (error?.response?.status === 500) {
        errorMessage =
          "Server error occurred while analyzing feedback. This might be due to insufficient survey responses or a temporary service issue.";
      } else if (error?.response?.status === 404) {
        errorMessage = "No survey data found for this brand.";
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setError(errorMessage);
    } finally {
      setIsRerunning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="flex flex-col items-center">
          <Loader className="animate-spin h-8 w-8 text-primary-600 mb-4" />
          <p className="text-gray-600">Analyzing survey feedback...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Analysis Failed
          </h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-display font-bold text-neutral-800 mb-6">
            Feedback Analysis
          </h1>

          {feedback && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              {/* Survey Stats */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-medium text-blue-800 mb-2">
                  Survey Results
                </h3>
                <p className="text-blue-700">
                  <span className="font-semibold">
                    {feedback.number_of_responses}
                  </span>{" "}
                  responses collected
                </p>
                <p className="text-blue-600 text-sm">
                  Status: {feedback.status}
                </p>
                {feedback.results_link && (
                  <a
                    href={feedback.results_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-sm mt-2 inline-block"
                  >
                    View detailed results →
                  </a>
                )}
              </div>

              {/* Feedback Analysis */}
              {feedback.feedback ? (
                <div className="mb-6">
                  <h3 className="text-xl font-medium text-neutral-800 mb-4">
                    Analysis Results
                  </h3>
                  <div className="prose max-w-none">
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6">
                      <div className="whitespace-pre-wrap text-neutral-700 leading-relaxed">
                        {feedback.feedback}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">
                    No feedback analysis available yet.
                  </p>
                </div>
              )}

              {/* Proceed Status */}
              <div className="mb-6">
                {feedback.can_proceed ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">
                      ✓ Ready to proceed to brand asset generation
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 font-medium">
                      ⚠ Additional feedback analysis needed before proceeding
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={handleRerunAnalysis}
                  disabled={isRerunning}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRerunning ? (
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Re-run the analysis
                </button>

                <button
                  onClick={handleProceedToNaming}
                  disabled={!feedback.can_proceed}
                  className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Pick Brand Name
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackReviewContainer;
