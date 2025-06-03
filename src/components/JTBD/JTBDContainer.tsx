import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader, ArrowRight, X, Edit2, RefreshCw } from 'lucide-react';
import { useBrandStore } from '../../store/brand';
import { JTBD, JTBDImportance, JTBD_IMPORTANCE_LABELS } from '../../types';

type Step = 'rating' | 'editing' | 'drivers';

const JTBDContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { currentBrand, selectBrand, loadJTBD, updateJTBD, isLoading, error } = useBrandStore();
  const [personas, setPersonas] = useState<JTBD[]>([]);
  const [drivers, setDrivers] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('rating');
  const [editingPersona, setEditingPersona] = useState<JTBD | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const isRegeneratingRef = useRef<boolean>(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      if (brandId && !hasInitialized.current) {
        hasInitialized.current = true;
        await selectBrand(brandId);
        await loadJTBD(brandId);
      }
    };
    loadData();
  }, [brandId, selectBrand, loadJTBD]);

  useEffect(() => {
    if (currentBrand?.jtbd) {
      const jtbdData = currentBrand.jtbd;
      if (jtbdData.personas) {
        const personasArray = Object.entries(jtbdData.personas).map(([id, data]) => ({
          ...data,
          id: data.id ?? id,
        }));
        setPersonas(personasArray);
      }
      setDrivers(jtbdData.drivers || '');
    }
  }, [currentBrand]);

  const handleImportanceChange = (personaId: string, importance: JTBDImportance) => {
    if (importance === 'not_applicable') {
      handleRemovePersona(personaId);
    } else {
      setPersonas(prev => prev.map(p => 
        p.id === personaId ? { ...p, importance } : p
      ));
    }
  };

  const handleRemovePersona = (personaId: string) => {
    setPersonas(prev => prev.filter(p => p.id !== personaId));
  };

  const handleEditPersona = (persona: JTBD) => {
    setEditingPersona(persona);
  };

  const handleSavePersona = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPersona) return;

    setPersonas(prev => prev.map(p => 
      p.id === editingPersona.id ? editingPersona : p
    ));
    setEditingPersona(null);
  };

  const handleDriversChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDrivers(e.target.value);
  };

  const getSelectedPersonas = () => {
    return personas.filter(p => p.importance && p.importance !== 'not_applicable')
      .sort((a, b) => {
        const importanceOrder = {
          very_important: 5,
          important: 4,
          somewhat_important: 3,
          rarely_important: 2,
          not_important: 1,
          not_applicable: 0
        };
        return (importanceOrder[b.importance!] || 0) - (importanceOrder[a.importance!] || 0);
      })
      .slice(0, 3);
  };

  const renderParagraphs = (text: string) => {
    return text.split('\n').map((paragraph, index) => (
      <p key={index} className="text-neutral-600 mb-2 last:mb-0">
        {paragraph.trim()}
      </p>
    ));
  };

  const canProceedFromRating = getSelectedPersonas().length >= 3;
  const canProceedFromEditing = getSelectedPersonas().every(p => p.description && p.description.trim().length > 0);
  const canProceedFromDrivers = drivers.trim().length > 0;

  const handleProceed = async () => {
    if (currentStep === 'rating' && canProceedFromRating) {
      setCurrentStep('editing');
    } else if (currentStep === 'editing' && canProceedFromEditing) {
      setCurrentStep('drivers');
    } else if (currentStep === 'drivers' && canProceedFromDrivers && brandId) {
      setIsSubmitting(true);
      try {
        const selectedPersonas = getSelectedPersonas();
        const jtbdData = {
          personas: selectedPersonas.reduce((acc, persona) => ({
            ...acc,
            [persona.id]: persona
          }), {}),
          drivers
        };

        await updateJTBD(brandId, jtbdData);
        navigate(`/brands/${brandId}/survey`);
      } catch (error) {
        console.error('Failed to update JTBD:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleRegeneratePersonas = async () => {
    if (!brandId) return;
    if (isRegeneratingRef.current) return;
    isRegeneratingRef.current = true;
    setIsRegenerating(true);
    try {
      await loadJTBD(brandId);
    } catch (error) {
      // Optionally show error
    } finally {
      setIsRegenerating(false);
      isRegeneratingRef.current = false;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin h-6 w-6 text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-600 mb-4">{error}</div>
        <div className="flex space-x-4">
          <button
            onClick={async () => {
              hasInitialized.current = false;
              if (brandId) {
                await selectBrand(brandId);
                await loadJTBD(brandId);
              }
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-md"
          >
            Try again
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
            Jobs To Be Done Analysis
          </h1>

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${currentStep === 'rating' ? 'text-primary-600' : 'text-neutral-400'}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                  currentStep === 'rating' ? 'border-primary-600 bg-primary-50' : 'border-neutral-300'
                }`}>1</div>
                <span className="ml-2 font-medium">Rate Personas</span>
              </div>
              <div className="h-px w-8 bg-neutral-300" />
              <div className={`flex items-center ${currentStep === 'editing' ? 'text-primary-600' : 'text-neutral-400'}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                  currentStep === 'editing' ? 'border-primary-600 bg-primary-50' : 'border-neutral-300'
                }`}>2</div>
                <span className="ml-2 font-medium">Edit Descriptions</span>
              </div>
              <div className="h-px w-8 bg-neutral-300" />
              <div className={`flex items-center ${currentStep === 'drivers' ? 'text-primary-600' : 'text-neutral-400'}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                  currentStep === 'drivers' ? 'border-primary-600 bg-primary-50' : 'border-neutral-300'
                }`}>3</div>
                <span className="ml-2 font-medium">Functional Drivers</span>
              </div>
            </div>
          </div>

          {currentStep === 'rating' && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <p className="text-neutral-600 mb-6">
                Rate the importance of each persona for your business. You need to rate at least 3 personas
                to proceed. If some things are not correct about the persona - do not worry, you will
                have a chance to edit the persona later. Remove any personas that are not applicable to your business.
              </p>

              <div className="space-y-6">
                {personas.map((persona) => (
                  <div 
                    key={persona.id}
                    className="border border-neutral-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-neutral-800">
                          {persona.name}
                        </h3>
                        <div className="mt-2">
                          {renderParagraphs(persona.description)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePersona(persona.id)}
                        className="text-neutral-400 hover:text-red-500 transition-colors"
                        title="Remove persona"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(JTBD_IMPORTANCE_LABELS).map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => handleImportanceChange(persona.id, value as JTBDImportance)}
                          className={`p-2 text-sm rounded-md transition-colors ${
                            persona.importance === value
                              ? 'bg-primary-100 text-primary-700 border-primary-200'
                              : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-8">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  onClick={handleRegeneratePersonas}
                  disabled={isRegenerating || isLoading}
                >
                  {isRegenerating ? (
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                  ) : (
                    <RefreshCw className="h-5 w-5 mr-2" />
                  )}
                  Generate new personas
                </button>

              </div>
            </div>
          )}

          {currentStep === 'editing' && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <p className="text-neutral-600 mb-6">
                Edit the descriptions of your top 3 selected personas to better match your business context.
              </p>

              {editingPersona ? (
                <form onSubmit={handleSavePersona} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Persona Name
                    </label>
                    <input
                      type="text"
                      value={editingPersona.name}
                      onChange={e => setEditingPersona({ ...editingPersona, name: e.target.value })}
                      className="w-full p-2 border border-neutral-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editingPersona.description}
                      onChange={e => setEditingPersona({ ...editingPersona, description: e.target.value })}
                      className="w-full min-h-[150px] p-2 border border-neutral-300 rounded-md"
                      placeholder="Enter description with each section on a new line..."
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingPersona(null)}
                      className="px-4 py-2 text-neutral-600 hover:text-neutral-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {getSelectedPersonas().map((persona) => (
                    <div 
                      key={persona.id}
                      className="border border-neutral-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-neutral-800">
                            {persona.name}
                          </h3>
                          <div className="mt-2">
                            {renderParagraphs(persona.description)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditPersona(persona)}
                          className="text-neutral-400 hover:text-primary-600 transition-colors ml-4"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 'drivers' && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-xl font-medium text-neutral-800 mb-2">
                Functional, Emotional and Social Drivers
              </h2>
              <p className="text-neutral-600 mb-6">
                Review the factors that motivate your personas to engage with your brand.
                Did we get everything right? Did we miss something important?
              </p>
              <textarea
                value={drivers}
                onChange={handleDriversChange}
                className="w-full min-h-[300px] p-4 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your functional drivers, with each driver on a new line..."
              />
            </div>
          )}

          <div className="flex justify-between items-center">
            {currentStep === 'rating' && (
              <p className="text-sm text-neutral-500">
                {canProceedFromRating 
                  ? 'You can now proceed to edit persona descriptions'
                  : `Rate at least ${3 - getSelectedPersonas().length} more personas to proceed`
                }
              </p>
            )}
            {currentStep === 'editing' && (
              <p className="text-sm text-neutral-500">
                {canProceedFromEditing
                  ? 'You can now proceed to define functional drivers'
                  : 'Please edit all persona descriptions before proceeding'
                }
              </p>
            )}
            {currentStep === 'drivers' && (
              <p className="text-sm text-neutral-500">
                {canProceedFromDrivers
                  ? 'You can now proceed to create the survey'
                  : 'Please describe your functional drivers before proceeding'
                }
              </p>
            )}
            
            <button
              onClick={handleProceed}
              disabled={
                (currentStep === 'rating' && !canProceedFromRating) ||
                (currentStep === 'editing' && !canProceedFromEditing) ||
                (currentStep === 'drivers' && !canProceedFromDrivers) ||
                isSubmitting ||
                !!editingPersona
              }
              className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader className="animate-spin h-5 w-5 mr-2" />}
              {currentStep === 'rating' && 'Continue to Edit Personas'}
              {currentStep === 'editing' && 'Continue to Review Persona\'s Drivers'}
              {currentStep === 'drivers' && 'Proceed to Survey'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JTBDContainer;