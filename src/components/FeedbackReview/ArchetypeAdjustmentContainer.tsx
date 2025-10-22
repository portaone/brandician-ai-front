import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader, AlertCircle } from 'lucide-react';
import { brands } from '../../lib/api';
import GetHelpButton from '../common/GetHelpButton';

interface ArchetypeAdjustment {
  old_archetype: string;
  new_text: string;
  old_text?: string;
  changes?: { type: string; content: string; id?: string; t?: string }[];
  footnotes?: { id: string; text: string; url?: string | null }[];
}

interface ArchetypeAdjustmentContainerProps {
  onComplete: () => void;
  onError: (error: string) => void;
}

const ArchetypeAdjustmentContainer: React.FC<ArchetypeAdjustmentContainerProps> = ({
  onComplete,
  onError
}) => {
  const { brandId } = useParams<{ brandId: string }>();
  const [adjustment, setAdjustment] = useState<ArchetypeAdjustment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const explanationRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});
  const [reloadFlag, setReloadFlag] = useState(false);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    if (isLoadingRef.current) {
      console.log('🛑 Prevented duplicate archetype adjustment call');
      return;
    }
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    const fetchAdjustment = async () => {
      if (!brandId) {
        isLoadingRef.current = false;
        return;
      }
      try {
        // API: POST /api/v1.0/brands/id/adjust/archetype
        const data = await brands.suggestArchetypeAdjustment(brandId);
        if (isMounted) {
          setAdjustment({
            ...data,
            old_archetype: data.old_archetype ?? data.old_text,
            new_text: data.new_text,
          });
          setError(null);
        }
      } catch (error: any) {
        if (isMounted) {
          let errorMessage = 'Failed to load archetype adjustment. Please try again.';
          if (error?.response?.status === 500) {
            errorMessage = 'Server error occurred while analyzing the archetype. Please try again later.';
          } else if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
          }
          setError(errorMessage);
          onError(errorMessage);
        }
      } finally {
        if (isMounted) setIsLoading(false);
        isLoadingRef.current = false;
      }
    };
    fetchAdjustment();
    return () => { isMounted = false; isLoadingRef.current = false; };
  }, [brandId, onError, reloadFlag]);

  const handleRetry = () => {
    setError(null);
    setAdjustment(null);
    setIsLoading(true);
    setReloadFlag(flag => !flag);
  };

  const handleReevaluate = () => {
    setAdjustment(null);
    setError(null);
    setIsLoading(true);
    setReloadFlag(flag => !flag);
  };

  const handleAccept = async () => {
    console.log('[DEBUG] handleAccept: brandId =', brandId, 'adjustment =', adjustment);
    if (!brandId || !adjustment) {
      console.log('[DEBUG] handleAccept: missing brandId or adjustment');
      return;
    }
    if (!adjustment.new_text) {
      console.log('[DEBUG] handleAccept: missing new_text in adjustment', adjustment);
      setError('No proposed archetype found. Please try reloading or re-evaluating.');
      onError('No proposed archetype found. Please try reloading or re-evaluating.');
      return;
    }
    try {
      console.log('[DEBUG] handleAccept: calling updateArchetype with', adjustment.new_text);
      await brands.updateArchetype(brandId, adjustment.new_text);
      console.log('[DEBUG] handleAccept: updateArchetype success, calling onComplete');
      onComplete();
    } catch (error: any) {
      let errorMessage = 'Failed to update archetype. Please try again.';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      console.error('[DEBUG] handleAccept: error updating archetype', error);
      setError(errorMessage);
      onError(errorMessage);
    }
  };

  const handleReject = () => {
    onComplete();
  };

  const handleChangeClick = (id: string) => {
    const ref = explanationRefs.current[id];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ref.classList.add('ring-2', 'ring-primary-500');
      setTimeout(() => ref.classList.remove('ring-2', 'ring-primary-500'), 1200);
    }
  };

  function renderChanges() {
    if (!adjustment?.changes) return adjustment?.new_text || '';
    return adjustment.changes.map((seg, i) => {
      if (seg.type === 'text') {
        return <span key={i}>{seg.content}</span>;
      }
      if (seg.type === 'change') {
        let style = {};
        let className = "inline cursor-pointer px-1 rounded transition-colors hover:bg-yellow-100";
        if (seg.t === 'mod') {
          style = { fontWeight: 'bold', background: '#f0f6ff', color: '#1d4ed8' };
        }
        if (seg.t === 'del') {
          style = { textDecoration: 'line-through', background: '#fef2f2', color: '#b91c1c' };
        }
        if (seg.t === 'ref') {
          style = { fontWeight: 'bold', fontStyle: 'italic', background: '#f3f8ff', color: '#2563eb' };
        }
        return (
          <span
            key={i}
            style={style}
            className={className}
            title="Click to see the explanation of the suggestion"
            onClick={() => seg.id && handleChangeClick(seg.id)}
          >
            {seg.content}
          </span>
        );
      }
      return null;
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="flex flex-col items-center">
          <Loader className="animate-spin h-8 w-8 text-primary-600 mb-4" />
          <p className="text-gray-600">Analyzing feedback for adjusting brand archetype...</p>
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
            onClick={handleRetry}
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-display font-bold text-neutral-800">
              Review Brand Archetype
            </h1>
            <GetHelpButton variant="secondary" size="md" />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            {/* Old Archetype */}
            <div>
              <h3 className="text-xl font-medium text-neutral-800 mb-4">Current Archetype</h3>
              <div className="prose max-w-none">
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6">
                  <div className="whitespace-pre-wrap text-neutral-700 leading-relaxed">
                    {adjustment.old_archetype}
                  </div>
                </div>
              </div>
            </div>
            {/* New Archetype */}
            <div>
              <h3 className="text-xl font-medium text-neutral-800 mb-4">Proposed Archetype</h3>
              <div className="prose max-w-none">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="whitespace-pre-wrap text-neutral-700 leading-relaxed">
                    {renderChanges()}
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
                Keep Current Archetype
              </button>
              <button
                onClick={handleReevaluate}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Re-evaluate
              </button>
              <button
                onClick={handleAccept}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                Accept New Archetype
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchetypeAdjustmentContainer; 