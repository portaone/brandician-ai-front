import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, Copy, ArrowRight, Loader, RefreshCw, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { useBrandStore } from '../../store/brand';
import { Survey, SurveyQuestion, SurveyStatus } from '../../types';
import { brands } from '../../lib/api';
import Button from '../common/Button';

const SurveyContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { currentBrand, selectBrand, isLoading: isBrandLoading, error: brandError, progressBrandStatus } = useBrandStore();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [surveyStatus, setSurveyStatus] = useState<SurveyStatus | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSurvey, setIsLoadingSurvey] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [surveyError, setSurveyError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'load' | 'save' | null>(null);
  const [surveyUrl, setSurveyUrl] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string>('');
  const [draggedQuestion, setDraggedQuestion] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!brandId || isLoadingSurvey) return;
      
      try {
        setIsLoadingSurvey(true);
        setSurveyError(null);
        setErrorType(null);
        await selectBrand(brandId);
        
        if (isMounted) {
          // First try to get existing saved survey
          try {
            const existingSurvey = await brands.getSurvey(brandId);
            // If we get a survey with results, show success screen
            if (existingSurvey?.results?.url) {
              setSurvey(existingSurvey);
              setSurveyUrl(existingSurvey.results.url);
              setShowSuccess(true);
              return;
            }
          } catch (existingSurveyError) {
            // Survey doesn't exist or no results, continue to draft
            console.log('No existing survey found, loading draft...');
          }
          
          // If no existing survey or no results, get draft for editing
          const draftSurvey = await brands.getSurveyDraft(brandId);
          
          // Ensure all questions have sequential numeric IDs
          if (draftSurvey?.questions) {
            draftSurvey.questions = draftSurvey.questions.map((question: SurveyQuestion, index: number) => ({
              ...question,
              id: question.id || String(index + 1)
            }));
          }
          
          setSurvey(draftSurvey);
        }
      } catch (error: any) {
        if (isMounted) {
          console.error('Failed to load survey data:', error);
          setSurveyError(error?.response?.data?.message || 'Failed to load survey. Please try again.');
          setErrorType('load');
        }
      } finally {
        if (isMounted) {
          setIsLoadingSurvey(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [brandId]);

  const loadSurveyStatus = async () => {
    if (!brandId || isLoadingStatus) return;

    try {
      setIsLoadingStatus(true);
      const status = await brands.getSurveyStatus(brandId);
      setSurveyStatus(status);
    } catch (error: any) {
      console.error('Failed to load survey status:', error);
      // Don't set error for status loading as it's not critical
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Load survey status when showing success screen
  useEffect(() => {
    if (showSuccess && brandId) {
      loadSurveyStatus();
    }
  }, [showSuccess, brandId]);

  const handleAddQuestion = () => {
    // Get the next sequential ID
    const maxId = Math.max(0, ...survey?.questions.map(q => parseInt(q.id || '0') || 0) || [0]);
    setEditingQuestion({
      id: String(maxId + 1),
      type: 'text',
      text: '',
    });
  };

  const handleEditQuestion = (question: SurveyQuestion) => {
    setEditingQuestion({ ...question, options: Array.isArray(question.options) ? [...question.options] : undefined });
  };

  const handleDeleteQuestion = (index: number) => {
    if (!survey) return;
    
    const newQuestions = [...survey.questions];
    newQuestions.splice(index, 1);
    setSurvey({ ...survey, questions: newQuestions });
  };

  const handleSaveQuestion = (question: SurveyQuestion) => {
    if (!survey) return;
    
    const newQuestions = [...survey.questions];
    
    // Check if we're editing an existing question
    const existingIndex = editingQuestion?.id 
      ? newQuestions.findIndex(q => q.id === editingQuestion.id)
      : -1;
    
    if (existingIndex !== -1 && editingQuestion?.id) {
      // Update existing question
      newQuestions[existingIndex] = { ...question, id: editingQuestion.id };
    } else {
      // This shouldn't happen with our new flow, but handle it gracefully
      const maxId = Math.max(0, ...newQuestions.map(q => parseInt(q.id || '0') || 0));
      newQuestions.push({
        ...question,
        id: String(maxId + 1),
      });
    }
    
    setSurvey({ ...survey, questions: newQuestions });
    setEditingQuestion(null);
  };

  const handleMoveQuestion = (fromIndex: number, toIndex: number) => {
    if (!survey || fromIndex === toIndex) return;
    
    const newQuestions = [...survey.questions];
    const [movedQuestion] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, movedQuestion);
    
    setSurvey({ ...survey, questions: newQuestions });
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      handleMoveQuestion(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (survey && index < survey.questions.length - 1) {
      handleMoveQuestion(index, index + 1);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedQuestion(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedQuestion !== null && draggedQuestion !== dropIndex) {
      handleMoveQuestion(draggedQuestion, dropIndex);
    }
    setDraggedQuestion(null);
  };

  const handleDragEnd = () => {
    setDraggedQuestion(null);
  };

  const hasEnoughResponses = () => {
    if (!surveyStatus) return false;
    const minRequired = surveyStatus.min_responses_required || 0;
    const currentResponses = surveyStatus.number_of_responses || 0;
    return currentResponses >= minRequired;
  };

  const handleSaveSurvey = async () => {
    if (!survey || !brandId) return;
    
    setIsSubmitting(true);
    try {
      const response = await brands.saveSurvey(brandId, survey);
      
      // Extract URL from SubmissionLink object
      if (response && response.url) {
        console.log('✅ Survey saved successfully, URL received:', response.url);
        setSurveyUrl(response.url);
      } else {
        console.warn('⚠️ No URL found in response, using fallback. Response:', response);
        setSurveyUrl(`${window.location.origin}/survey/${brandId}`);
      }
      
      setShowSuccess(true);
      setSurveyError(null);
      setErrorType(null);
    } catch (error: any) {
      console.error('Failed to save survey:', error);
      setSurveyError(error?.response?.data?.message || 'Failed to save survey. Please try again.');
      setErrorType('save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyUrl = async () => {
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

  const handleDone = async () => {
    if (brandId) {
      // Use proper progress endpoint instead of manual status setting
      try {
        await progressBrandStatus(brandId);
      } catch (e) {
        console.error('Failed to progress brand status:', e);
      }
      navigate(`/brands/${brandId}/collect-feedback`);
    }
  };

  const handleCheckStatus = () => {
    if (brandId) {
      navigate(`/brands/${brandId}/collect-feedback`);
    }
  };

  const handleRetry = () => {
    if (errorType === 'save') {
      // Retry saving the current survey data
      handleSaveSurvey();
    } else {
      // Retry loading survey from server
      const loadData = async () => {
        if (!brandId || isLoadingSurvey) return;
        
        try {
          setIsLoadingSurvey(true);
          setSurveyError(null);
          setErrorType(null);
          await selectBrand(brandId);
          const draftSurvey = await brands.getSurveyDraft(brandId);
          
          // Ensure all questions have sequential numeric IDs
          if (draftSurvey?.questions) {
            draftSurvey.questions = draftSurvey.questions.map((question: SurveyQuestion, index: number) => ({
              ...question,
              id: question.id || String(index + 1)
            }));
          }
          
          setSurvey(draftSurvey);
        } catch (error: any) {
          console.error('Failed to load survey data:', error);
          setSurveyError(error?.response?.data?.message || 'Failed to load survey. Please try again.');
          setErrorType('load');
        } finally {
          setIsLoadingSurvey(false);
        }
      };

      loadData();
    }
  };

  if (isBrandLoading || (isLoadingSurvey && !surveyError)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin h-6 w-6 text-primary-600" />
      </div>
    );
  }

  if (brandError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {brandError}
      </div>
    );
  }

  if (surveyError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{surveyError}</p>
        <div className="flex space-x-4">
          <Button
            onClick={handleRetry}
            disabled={isSubmitting || isLoadingSurvey}
            size="md"
          >
            {(isSubmitting || isLoadingSurvey) && <Loader className="animate-spin h-5 w-5 mr-2 inline" />}
            <RefreshCw className="h-5 w-5 mr-2 inline" />
            {errorType === 'save' ? 'Retry Save' : 'Try Again'}
          </Button>
          <Button
            onClick={() => navigate('/brands')}
            variant="secondary"
            size="md"
          >
            Exit
          </Button>
        </div>
      </div>
    );
  }

  if (!currentBrand) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Brand not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-display font-bold text-neutral-800 mb-6">
            Create Customer Survey
          </h1>

          {!showSuccess ? (
            <>
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <div className="space-y-6">
                  {survey?.questions.map((question, index) => (
                    <div 
                      key={question.id || index}
                      className={`border border-neutral-200 rounded-lg p-4 transition-all ${
                        draggedQuestion === index ? 'opacity-50' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-start gap-3">
                        {/* Drag handle and reorder controls */}
                        <div className="flex flex-col items-center gap-1 pt-1">
                          <GripVertical className="h-5 w-5 text-neutral-400 cursor-move" />
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                              className="text-neutral-400 hover:text-primary-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleMoveDown(index)}
                              disabled={!survey || index === survey.questions.length - 1}
                              className="text-neutral-400 hover:text-primary-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Question content */}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-neutral-500">
                                  Question {index + 1}
                                </span>
                              </div>
                              <div className="text-lg font-medium text-neutral-800 whitespace-pre-wrap">
                                {question.text}
                              </div>
                              <p className="text-sm text-neutral-500 mt-1">
                                Type: {question.type}
                                {question.options && ` • ${question.options.length} options`}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditQuestion(question)}
                                className="text-neutral-400 hover:text-primary-600 transition-colors"
                              >
                                <Edit2 className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(index)}
                                className="text-neutral-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                          
                          {question.options && (
                            <div className="space-y-2">
                              {question.options.map((option, optionIndex) => (
                                <div 
                                  key={optionIndex}
                                  className="text-neutral-600 pl-4"
                                >
                                  • {option}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleAddQuestion}
                    className="w-full py-4 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-600 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Question
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveSurvey}
                  disabled={isSubmitting || !survey?.questions.length}
                  className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {isSubmitting && <Loader className="animate-spin h-5 w-5 mr-2" />}
                  Save Survey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-medium text-neutral-800 mb-4">
                Survey Created Successfully!
              </h2>
              
              {/* Survey Status Section */}
              {isLoadingStatus ? (
                <div className="mb-6 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <div className="flex items-center">
                    <Loader className="animate-spin h-5 w-5 mr-2 text-primary-600" />
                    <span className="text-neutral-600">Loading survey status...</span>
                  </div>
                </div>
              ) : surveyStatus ? (
                <div className={`mb-6 p-4 rounded-lg border ${
                  hasEnoughResponses() 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <h3 className={`text-lg font-medium mb-2 ${
                    hasEnoughResponses() ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    Survey Status
                  </h3>
                  <div className="space-y-2">
                    <p className={hasEnoughResponses() ? 'text-green-700' : 'text-yellow-700'}>
                      <span className="font-semibold">{surveyStatus.number_of_responses || 0}</span> of{' '}
                      <span className="font-semibold">{surveyStatus.min_responses_required || 0}</span> required responses completed
                    </p>
                    {!hasEnoughResponses() && (
                      <p className="text-yellow-600 text-sm">
                        You need {(surveyStatus.min_responses_required || 0) - (surveyStatus.number_of_responses || 0)} more responses to proceed
                      </p>
                    )}
                    {surveyStatus.last_response_date && (
                      <p className={`text-sm ${hasEnoughResponses() ? 'text-green-600' : 'text-yellow-600'}`}>
                        Last response: {new Date(surveyStatus.last_response_date).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Survey URL
                </label>
                <div className="flex">
                  <input
                    type="text"
                    readOnly
                    value={surveyUrl}
                    className="flex-1 p-2 border border-r-0 border-neutral-300 rounded-l-md bg-neutral-50"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-4 py-2 bg-neutral-100 border border-l-0 border-neutral-300 rounded-r-md hover:bg-neutral-200 relative"
                  >
                    {copyFeedback ? (
                      <span className="text-xs font-medium text-green-600">{copyFeedback}</span>
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  Please copy the survey URL to clipboard and send it to your potential customers to complete. 
                  Try to have as many people engaged as possible, since the more feedback we receive, 
                  the better we will understand the potential customer perception of your brand and can make necessary adjustments.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={surveyStatus && hasEnoughResponses() ? handleDone : handleCheckStatus}
                  disabled={surveyStatus ? !hasEnoughResponses() : false}
                  className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {surveyStatus && hasEnoughResponses() 
                    ? 'Close the survey and analyze the results' 
                    : surveyStatus && !hasEnoughResponses()
                    ? `Need at least ${surveyStatus.min_responses_required} responses to proceed`
                    : 'Check survey status'
                  }
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {editingQuestion && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
                <h3 className="text-xl font-medium text-neutral-800 mb-4">
                  {editingQuestion.id ? 'Edit Question' : 'Add Question'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Question Type
                    </label>
                    <select
                      value={editingQuestion.type}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        type: e.target.value as SurveyQuestion['type']
                      })}
                      className="w-full p-2 border border-neutral-300 rounded-md"
                    >
                      <option value="text">Text</option>
                      <option value="single_choice">Single Choice</option>
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="rating">Rating</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Question Text
                    </label>
                    <textarea
                      value={editingQuestion.text}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        text: e.target.value
                      })}
                      className="w-full p-2 border border-neutral-300 rounded-md min-h-[100px]"
                      placeholder="Enter your question"
                    />
                  </div>

                  {(editingQuestion.type === 'single_choice' || editingQuestion.type === 'multiple_choice') && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Options (one per line)
                      </label>
                      <textarea
                        value={editingQuestion.options?.join('\n') || ''}
                        onChange={(e) => setEditingQuestion({
                          ...editingQuestion,
                          options: e.target.value.split('\n').map(o => o.trim()).filter(Boolean)
                        })}
                        className="w-full p-2 border border-neutral-300 rounded-md min-h-[100px]"
                        placeholder="Enter options, one per line:
- Option 1
- Option 2
- Option 3"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setEditingQuestion(null)}
                    className="px-4 py-2 text-neutral-600 hover:text-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveQuestion(editingQuestion)}
                    disabled={!editingQuestion.text.trim()}
                    className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    Save Question
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyContainer;