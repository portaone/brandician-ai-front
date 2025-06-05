import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader, AlertCircle } from 'lucide-react';
import { brands } from '../../lib/api';
import { AdjustObject } from '../../types';

// Global cache to prevent duplicate API calls across component instances
const adjustmentCache = new Map<string, { loading: boolean; data?: AdjustObject; error?: string }>();

interface SummaryAdjustmentContainerProps {
  onComplete: () => void;
  onError: (error: string) => void;
}

// Helper to parse <change> tags and render as React elements
function parseSummaryText(text: string, onChangeClick: (id: string) => void): React.ReactNode {
  // Use DOMParser to parse the XML-like string
  const parser = new DOMParser();
  // Wrap in a root element to allow parsing fragments
  const doc = parser.parseFromString(`<root>${text}</root>`, 'text/xml');
  const root = doc.documentElement;

  function renderNode(node: ChildNode, key: number): React.ReactNode {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'change') {
      const el = node as Element;
      const t = el.getAttribute('t');
      const id = el.getAttribute('id') || '';
      const children = Array.from(el.childNodes).map((child, i) => renderNode(child, i));
      let style = {};
      let className = 'inline cursor-pointer px-1 rounded transition-colors';
      let tooltip = 'Click to see the explanation of the suggestion';
      if (t === 'mod') {
        style = { fontWeight: 'bold', background: '#f0f6ff', color: '#1d4ed8' };
      } else if (t === 'del') {
        style = { textDecoration: 'line-through', background: '#fef2f2', color: '#b91c1c' };
      }
      return (
        <span
          key={key}
          style={style}
          className={className + ' hover:bg-yellow-100'}
          title={tooltip}
          onClick={() => onChangeClick(id)}
        >
          {children}
        </span>
      );
    }
    // Fallback: render children
    return Array.from(node.childNodes).map((child, i) => renderNode(child, i));
  }

  return Array.from(root.childNodes).map((node, i) => renderNode(node, i));
}

const SummaryAdjustmentContainer: React.FC<SummaryAdjustmentContainerProps> = ({
  onComplete,
  onError
}) => {
  const { brandId } = useParams<{ brandId: string }>();
  const [adjustment, setAdjustment] = useState<AdjustObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Prevent duplicate API calls
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const explanationRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    let isMounted = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    
    const loadAdjustment = async () => {
      if (!brandId || !isMounted) return;
      
      // Check global cache first
      const cacheKey = `adjustment-${brandId}`;
      const cached = adjustmentCache.get(cacheKey);
      
      if (cached?.loading) {
        console.log('⏸️ Summary adjustment already in progress for this brand');
        // Poll for data until it arrives or component unmounts
        pollTimer = setInterval(() => {
          const polled = adjustmentCache.get(cacheKey);
          if (polled?.data && isMounted) {
            setAdjustment(polled.data);
            setIsLoading(false);
            if (pollTimer) clearInterval(pollTimer);
          }
          if (!isMounted && pollTimer) {
            clearInterval(pollTimer);
          }
        }, 100);
        setIsLoading(true);
        return;
      }
      
      if (cached?.data) {
        console.log('📋 Using cached adjustment data');
        setAdjustment(cached.data);
        setIsLoading(false);
        return;
      }
      
      // Check if we're already loading or have loaded locally
      if (isLoadingRef.current || hasLoadedRef.current) {
        console.log('⏸️ Skipping duplicate local adjustment call');
        setIsLoading(true);
        return;
      }

      // Mark as loading in cache
      adjustmentCache.set(cacheKey, { loading: true });
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('🔄 Loading summary adjustment for brand:', brandId);
        const data = await brands.adjustSummary(brandId);
        
        if (isMounted) {
          setAdjustment(data);
          hasLoadedRef.current = true;
          // Cache the successful result
          adjustmentCache.set(cacheKey, { loading: false, data });
        }
      } catch (error: any) {
        if (isMounted) {
          console.error('❌ Failed to load summary adjustment:', error);
          
          let errorMessage = 'Failed to load summary adjustment. Please try again.';
          
          if (error?.response?.status === 500) {
            errorMessage = 'Server error occurred while analyzing the summary. Please try again later.';
          } else if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
          }
          
          setError(errorMessage);
          onError(errorMessage);
          // Don't cache errors - allow retries on fresh page loads
          // Only remove the loading state from cache
          adjustmentCache.delete(cacheKey);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
        isLoadingRef.current = false;
        // Remove loading state from cache (but keep successful data cached)
        const currentCache = adjustmentCache.get(cacheKey);
        if (currentCache?.loading) {
          adjustmentCache.set(cacheKey, { loading: false, data: currentCache.data });
        }
      }
    };

    // Small delay to help prevent React StrictMode duplicates
    const timeoutId = setTimeout(loadAdjustment, 50);

    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (pollTimer) clearInterval(pollTimer);
      isLoadingRef.current = false;
    };
  }, [brandId, onError]);

  const handleAccept = async () => {
    if (!brandId || !adjustment) return;

    try {
      // Update the brand summary with the new text
      await brands.updateSummary(brandId, adjustment.new_text);
      // Clear cache after successful update
      const cacheKey = `adjustment-${brandId}`;
      adjustmentCache.delete(cacheKey);
      onComplete();
    } catch (error: any) {
      console.error('Failed to update summary:', error);
      let errorMessage = 'Failed to update summary. Please try again.';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      onError(errorMessage);
    }
  };

  const handleReject = () => {
    // Clear cache when rejecting the adjustment
    if (brandId) {
      const cacheKey = `adjustment-${brandId}`;
      adjustmentCache.delete(cacheKey);
    }
    // Simply proceed to the next step without updating
    onComplete();
  };

  // Scroll to explanation by id
  const handleChangeClick = (id: string) => {
    const ref = explanationRefs.current[id];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ref.classList.add('ring-2', 'ring-primary-500');
      setTimeout(() => ref.classList.remove('ring-2', 'ring-primary-500'), 1200);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="flex flex-col items-center">
          <Loader className="animate-spin h-8 w-8 text-primary-600 mb-4" />
          <p className="text-gray-600">Analyzing brand summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-4">Analysis Failed</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!adjustment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-display font-bold text-neutral-800 mb-6">
            Review Brand Summary
          </h1>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            {/* Survey Status */}
            {adjustment.survey && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-medium text-blue-800 mb-2">Survey Status</h3>
                <p className="text-blue-700">
                  <span className="font-semibold">{adjustment.survey.number_of_responses}</span> responses collected
                </p>
                {adjustment.survey.last_response_date && (
                  <p className="text-blue-600 text-sm">
                    Last response: {new Date(adjustment.survey.last_response_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Current Summary */}
            <div>
              <h3 className="text-xl font-medium text-neutral-800 mb-4">Current Summary</h3>
              <div className="prose max-w-none">
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6">
                  <div className="whitespace-pre-wrap text-neutral-700 leading-relaxed">
                    {adjustment.old_text}
                  </div>
                </div>
              </div>
            </div>

            {/* Proposed Summary */}
            <div>
              <h3 className="text-xl font-medium text-neutral-800 mb-4">Proposed Summary</h3>
              <div className="prose max-w-none">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="whitespace-pre-wrap text-neutral-700 leading-relaxed">
                    {parseSummaryText(adjustment.new_text, handleChangeClick)}
                  </div>
                </div>
              </div>
            </div>

            {/* Footnotes */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-neutral-800 mb-4">Changes Explained</h3>
              <div className="space-y-4">
                {(adjustment.footnotes ?? []).map((note) => (
                  <div
                    key={note.id}
                    ref={el => (explanationRefs.current[note.id] = el)}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 transition-all"
                  >
                    <p className="text-neutral-700 font-semibold">Suggestion {note.id}</p>
                    <p className="text-neutral-700">{note.text}</p>
                    {note.url && (
                      <a
                        href={note.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
                      >
                        View source →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleReject}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Keep Current Summary
              </button>
              <button
                onClick={handleAccept}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                Accept New Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryAdjustmentContainer; 