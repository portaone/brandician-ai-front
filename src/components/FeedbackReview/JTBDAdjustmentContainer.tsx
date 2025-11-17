import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader, AlertCircle, Plus } from 'lucide-react';
import { brands } from '../../lib/api';
import { AdjustObject, JTBDList } from '../../types';
import GetHelpButton from '../common/GetHelpButton';
import HistoryButton from '../common/HistoryButton';

// Global cache to prevent duplicate API calls across component instances
const adjustmentCache = new Map<string, { loading: boolean; personasData?: AdjustObject[]; driversData?: AdjustObject; error?: string }>();

interface JTBDAdjustmentContainerProps {
  onComplete: () => void;
  onError: (error: string) => void;
}

// Single persona widget component
interface PersonaWidgetProps {
  persona: AdjustObject;
  index: number;
  isNewPersona?: boolean;
  onChangeClick: (id: string) => void;
  explanationRefs: React.MutableRefObject<{ [id: string]: HTMLDivElement | null }>;
  choice: 'original' | 'adjusted' | 'include' | null;
  onChoiceChange: (choice: 'original' | 'adjusted' | 'include') => void;
}

const PersonaWidget: React.FC<PersonaWidgetProps> = ({ 
  persona, 
  index, 
  isNewPersona = false, 
  onChangeClick, 
  explanationRefs,
  choice,
  onChoiceChange
}) => {
  function renderChanges() {
    if (!persona.changes || persona.changes.length === 0) {
      return <span>{persona.new_text || <em>No changes were suggested.</em>}</span>;
    }
    return persona.changes.map((seg, i) => {
      if (seg.type === 'text') {
        return <span key={i}>{seg.content}</span>;
      }
      if (seg.type === 'change') {
        let style = {};
        if (seg.t === 'mod') style = { fontWeight: 'bold', background: '#f0f6ff', color: '#1d4ed8' };
        if (seg.t === 'del') style = { textDecoration: 'line-through', background: '#fef2f2', color: '#b91c1c' };
        if (seg.t === 'ref') style = { fontStyle: 'italic', background: '#fef9e7', color: '#b26a00' };
        return (
          <span
            key={i}
            style={style}
            className="inline cursor-pointer px-1 rounded transition-colors hover:bg-yellow-100"
            title="Click to see the explanation of the suggestion"
            onClick={() => seg.id && onChangeClick(seg.id)}
          >
            {seg.content}
          </span>
        );
      }
      return null;
    });
  }

  return (
    <div className={`border rounded-lg p-6 ${isNewPersona ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {isNewPersona ? 'New Suggested Persona' : `Persona ${index + 1}`}
        </h3>
        {isNewPersona && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            <Plus className="h-3 w-3" />
            New
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Current/Original Text */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {isNewPersona ? 'Additional Persona' : 'Current'}
          </h4>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[120px]">
            <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
              {isNewPersona ? 'This is a newly suggested persona based on feedback analysis.' : persona.old_text}
            </div>
          </div>
        </div>

        {/* Proposed/New Text */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {isNewPersona ? 'Suggested Content' : 'Proposed'}
          </h4>
          <div className={`border rounded-lg p-4 min-h-[120px] ${isNewPersona ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
              {renderChanges()}
            </div>
          </div>
        </div>
      </div>

      {/* Footnotes for this persona */}
      {persona.footnotes && persona.footnotes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Changes Explained</h4>
          <div className="space-y-2">
            {persona.footnotes.map((note) => (
              <div
                key={note.id}
                ref={el => (explanationRefs.current[note.id] = el)}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 transition-all text-sm"
              >
                <p className="text-gray-700 font-medium">Suggestion {note.id}</p>
                <p className="text-gray-600">{note.text}</p>
                {note.url && (
                  <a
                    href={note.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-xs mt-1 inline-block"
                  >
                    View source →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Choice Controls */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          {isNewPersona ? 'What would you like to do with this new persona?' : 'Which version do you prefer?'}
        </h4>
        <div className="flex gap-3">
          {!isNewPersona && (
            <button
              onClick={() => onChoiceChange('original')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                choice === 'original'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Keep Original
            </button>
          )}
          {isNewPersona ? (
            <>
              <button
                onClick={() => onChoiceChange('include')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  choice === 'include'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Add the new persona
              </button>
              <button
                onClick={() => onChoiceChange('original')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  choice === 'original'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                Discard the new persona
              </button>
            </>
          ) : (
            <button
              onClick={() => onChoiceChange('adjusted')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                choice === 'adjusted'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Accept Adjusted
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Drivers diff component
interface DriversDiffProps {
  driversAdjustment: AdjustObject;
  onChangeClick: (id: string) => void;
  explanationRefs: React.MutableRefObject<{ [id: string]: HTMLDivElement | null }>;
  choice: 'original' | 'adjusted' | null;
  onChoiceChange: (choice: 'original' | 'adjusted') => void;
}

const DriversDiff: React.FC<DriversDiffProps> = ({ driversAdjustment, onChangeClick, explanationRefs, choice, onChoiceChange }) => {
  function renderChanges() {
    if (!driversAdjustment.changes || driversAdjustment.changes.length === 0) {
      return <span>{driversAdjustment.new_text || <em>No changes were suggested.</em>}</span>;
    }
    return driversAdjustment.changes.map((seg, i) => {
      if (seg.type === 'text') {
        return <span key={i}>{seg.content}</span>;
      }
      if (seg.type === 'change') {
        let style = {};
        if (seg.t === 'mod') style = { fontWeight: 'bold', background: '#f0f6ff', color: '#1d4ed8' };
        if (seg.t === 'del') style = { textDecoration: 'line-through', background: '#fef2f2', color: '#b91c1c' };
        if (seg.t === 'ref') style = { fontStyle: 'italic', background: '#fef9e7', color: '#b26a00' };
        return (
          <span
            key={i}
            style={style}
            className="inline cursor-pointer px-1 rounded transition-colors hover:bg-yellow-100"
            title="Click to see the explanation of the suggestion"
            onClick={() => seg.id && onChangeClick(seg.id)}
          >
            {seg.content}
          </span>
        );
      }
      return null;
    });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Jobs-to-be-Done Drivers</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Current Drivers */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-4">Current Drivers</h4>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[200px]">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {driversAdjustment.old_text}
            </div>
          </div>
        </div>
        
        {/* Proposed Drivers */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-4">Proposed Drivers</h4>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 min-h-[200px]">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {renderChanges()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footnotes for drivers */}
      {driversAdjustment.footnotes && driversAdjustment.footnotes.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-lg font-medium text-gray-800 mb-4">Drivers Changes Explained</h4>
          <div className="space-y-3">
            {driversAdjustment.footnotes.map((note) => (
              <div
                key={note.id}
                ref={el => (explanationRefs.current[note.id] = el)}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 transition-all"
              >
                <p className="text-gray-700 font-semibold">Suggestion {note.id}</p>
                <p className="text-gray-700">{note.text}</p>
                {note.url && (
                  <a
                    href={note.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
                  >
                    View source →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Choice Controls for Drivers */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-lg font-medium text-gray-800 mb-4">Which drivers version do you prefer?</h4>
        <div className="flex gap-3">
          <button
            onClick={() => onChoiceChange('original')}
            className={`px-6 py-3 rounded-lg font-medium text-sm transition-colors ${
              choice === 'original'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Keep Original Drivers
          </button>
          <button
            onClick={() => onChoiceChange('adjusted')}
            className={`px-6 py-3 rounded-lg font-medium text-sm transition-colors ${
              choice === 'adjusted'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            Accept Adjusted Drivers
          </button>
        </div>
      </div>
    </div>
  );
};

const JTBDAdjustmentContainer: React.FC<JTBDAdjustmentContainerProps> = ({
  onComplete,
  onError
}) => {
  const { brandId } = useParams<{ brandId: string }>();
  const [personasAdjustments, setPersonasAdjustments] = useState<AdjustObject[] | null>(null);
  const [driversAdjustment, setDriversAdjustment] = useState<AdjustObject | null>(null);
  const [currentJTBD, setCurrentJTBD] = useState<JTBDList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track user choices for each persona and drivers
  const [personaChoices, setPersonaChoices] = useState<Record<number, 'original' | 'adjusted' | 'include'>>({});
  const [driversChoice, setDriversChoice] = useState<'original' | 'adjusted' | null>(null);
  
  // Prevent duplicate API calls
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const explanationRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});

  // Helper to clear cache and refs for this brand
  const clearAdjustmentCache = () => {
    if (brandId) {
      const cacheKey = `jtbd-adjustment-${brandId}`;
      adjustmentCache.delete(cacheKey);
    }
    isLoadingRef.current = false;
    hasLoadedRef.current = false;
  };

  // Choice change handlers
  const handlePersonaChoiceChange = (index: number, choice: 'original' | 'adjusted' | 'include') => {
    setPersonaChoices(prev => ({
      ...prev,
      [index]: choice
    }));
  };

  const handleDriversChoiceChange = (choice: 'original' | 'adjusted') => {
    setDriversChoice(choice);
  };

  // Reset choices when data changes
  const resetChoices = () => {
    setPersonaChoices({});
    setDriversChoice(null);
  };

  // Retry handler
  const handleRetry = () => {
    setError(null);
    setPersonasAdjustments(null);
    setDriversAdjustment(null);
    setCurrentJTBD(null);
    resetChoices();
    clearAdjustmentCache();
    setIsLoading(true);
    setReloadFlag(flag => !flag);
  };
  const [reloadFlag, setReloadFlag] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadAdjustments = async () => {
      if (!brandId || !isMounted) return;

      // Robust guard against duplicate/racing API calls
      const cacheKey = `jtbd-adjustment-${brandId}`;
      const cached = adjustmentCache.get(cacheKey);
      if (hasLoadedRef.current || isLoadingRef.current) {
        console.log('🛑 Prevented duplicate JTBD adjustment call');
        return;
      }
      if (cached?.loading) {
        setIsLoading(true);
        return;
      }
      if (cached?.personasData && cached?.driversData) {
        console.log('📋 Using cached JTBD adjustment data');
        setPersonasAdjustments(cached.personasData);
        setDriversAdjustment(cached.driversData);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      isLoadingRef.current = true;
      adjustmentCache.set(cacheKey, { loading: true });

      try {
        console.log('🔄 Loading JTBD adjustments for brand:', brandId);
        
        // First get current JTBD data
        const jtbdData = await brands.getJTBD(brandId);
        if (isMounted) {
          setCurrentJTBD(jtbdData);
        }

        // Load both personas and drivers adjustments in parallel
        const [personasData, driversData] = await Promise.all([
          brands.adjustJTBDPersonas(brandId),
          brands.adjustJTBDDrivers(brandId)
        ]);

        if (isMounted) {
          setPersonasAdjustments(personasData);
          setDriversAdjustment(driversData);
          resetChoices(); // Reset choices when new data is loaded
          hasLoadedRef.current = true;
          adjustmentCache.set(cacheKey, { 
            loading: false, 
            personasData, 
            driversData 
          });
        }
      } catch (error: any) {
        if (isMounted) {
          console.error('❌ Failed to load JTBD adjustments:', error);
          let errorMessage = 'Failed to load JTBD adjustments. Please try again.';
          if (error?.response?.status === 500) {
            errorMessage = 'Server error occurred while analyzing the JTBD. Please try again later.';
          } else if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
          }
          setError(errorMessage);
          onError(errorMessage);
          clearAdjustmentCache();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
        isLoadingRef.current = false;
        const currentCache = adjustmentCache.get(cacheKey);
        if (currentCache?.loading) {
          adjustmentCache.set(cacheKey, { loading: false, personasData: currentCache.personasData, driversData: currentCache.driversData });
        }
      }
    };

    const timeoutId = setTimeout(loadAdjustments, 50);
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      isLoadingRef.current = false;
    };
  }, [brandId, onError, reloadFlag]);

  const handleAccept = async () => {
    if (!brandId || !currentJTBD || !personasAdjustments || !driversAdjustment) return;
    try {
      console.log('[DEBUG] JTBDAdjustment: Updating JTBD...');
      
      // Update with new personas and drivers
      const updatedJTBD: JTBDList = {
        personas: currentJTBD.personas, // Keep existing persona structure but will be overridden by new content
        drivers: driversAdjustment.new_text || currentJTBD.drivers || ''
      };
      
      await brands.updateJTBD(brandId, updatedJTBD);
      console.log('[DEBUG] JTBDAdjustment: JTBD updated, calling onComplete...');
      
      const cacheKey = `jtbd-adjustment-${brandId}`;
      adjustmentCache.delete(cacheKey);
      onComplete();
      console.log('[DEBUG] JTBDAdjustment: onComplete called');
    } catch (error: any) {
      console.error('Failed to update JTBD:', error);
      let errorMessage = 'Failed to update JTBD. Please try again.';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setError(errorMessage);
      onError(errorMessage);
    }
  };

  const handleReject = () => {
    if (brandId) {
      const cacheKey = `jtbd-adjustment-${brandId}`;
      adjustmentCache.delete(cacheKey);
    }
    onComplete();
  };

  const handleReevaluate = () => {
    clearAdjustmentCache();
    setPersonasAdjustments(null);
    setDriversAdjustment(null);
    setCurrentJTBD(null);
    resetChoices();
    setError(null);
    setIsLoading(true);
    setTimeout(() => setReloadFlag(flag => !flag), 0);
  };

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
          <p className="text-gray-600">Analyzing feedback to adjust JTBD personas and drivers...</p>
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

  if (!personasAdjustments || !driversAdjustment) {
    return null;
  }

  // Separate existing personas and new suggestions
  const existingPersonas = personasAdjustments.filter(p => p.old_text && p.old_text.trim() !== '');
  const newPersonas = personasAdjustments.filter(p => !p.old_text || p.old_text.trim() === '');
  
  // Check if all choices are made
  const totalPersonas = personasAdjustments.length;
  const personaChoicesMade = Object.keys(personaChoices).length;
  const allChoicesMade = personaChoicesMade === totalPersonas && driversChoice !== null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-display font-bold text-neutral-800">
              Review Jobs-to-be-Done
            </h1>
            <div className="flex items-center gap-3">
              {brandId && <HistoryButton brandId={brandId} variant="outline" size="md" />}
              <GetHelpButton variant="secondary" size="md" />
            </div>
          </div>

          {/* Survey Status */}
          {personasAdjustments[0]?.survey && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Survey Status</h3>
              <p className="text-blue-700">
                <span className="font-semibold">{personasAdjustments[0].survey.number_of_responses}</span> responses collected
              </p>
              {personasAdjustments[0].survey.last_response_date && (
                <p className="text-blue-600 text-sm">
                  Last response: {new Date(personasAdjustments[0].survey.last_response_date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Personas Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Persona Adjustments</h2>
            
            {/* Existing Personas */}
            {existingPersonas.length > 0 && (
              <div className="space-y-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800">Updated Personas</h3>
                {existingPersonas.map((persona, index) => (
                  <PersonaWidget
                    key={`existing-${index}`}
                    persona={persona}
                    index={index}
                    isNewPersona={false}
                    onChangeClick={handleChangeClick}
                    explanationRefs={explanationRefs}
                    choice={personaChoices[index] || null}
                    onChoiceChange={(choice) => handlePersonaChoiceChange(index, choice)}
                  />
                ))}
              </div>
            )}

            {/* New Personas */}
            {newPersonas.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-600" />
                  Newly Suggested Personas
                </h3>
                {newPersonas.map((persona, index) => {
                  const personaIndex = existingPersonas.length + index;
                  return (
                    <PersonaWidget
                      key={`new-${index}`}
                      persona={persona}
                      index={personaIndex}
                      isNewPersona={true}
                      onChangeClick={handleChangeClick}
                      explanationRefs={explanationRefs}
                      choice={personaChoices[personaIndex] || null}
                      onChoiceChange={(choice) => handlePersonaChoiceChange(personaIndex, choice)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Drivers Section */}
          <div className="mb-8">
            <DriversDiff
              driversAdjustment={driversAdjustment}
              onChangeClick={handleChangeClick}
              explanationRefs={explanationRefs}
              choice={driversChoice}
              onChoiceChange={handleDriversChoiceChange}
            />
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Progress Indicator */}
            {!allChoicesMade && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="text-amber-800 font-medium mb-2">Please make choices for all items</h4>
                <div className="text-amber-700 text-sm">
                  <p>Persona choices: {personaChoicesMade}/{totalPersonas}</p>
                  <p>Drivers choice: {driversChoice ? '✓' : '✗'}</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {allChoicesMade ? (
                  <span className="text-green-600 font-medium">✓ All choices made - ready to proceed</span>
                ) : (
                  <span className="text-amber-600">Make choices for all personas and drivers to proceed</span>
                )}
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleReject}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Keep Current JTBD
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
                  disabled={!allChoicesMade}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    allChoicesMade
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JTBDAdjustmentContainer;