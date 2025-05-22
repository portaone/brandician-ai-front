import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, Copy, ArrowRight, Loader, RefreshCw } from 'lucide-react';
import { useBrandStore } from '../../store/brand';
import { Survey, SurveyQuestion } from '../../types';
import { brands } from '../../lib/api';

const SurveyContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { currentBrand, selectBrand, isLoading: isBrandLoading, error: brandError } = useBrandStore();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSurvey, setIsLoadingSurvey] = useState(false);
  const [surveyError, setSurveyError] = useState<string | null>(null);
  const [surveyUrl, setSurveyUrl] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!brandId || isLoadingSurvey) return;
      
      try {
        setIsLoadingSurvey(true);
        setSurveyError(null);
        await selectBrand(brandId);
        const draftSurvey = await brands.getSurveyDraft(brandId);
        setSurvey(draftSurvey);
      } catch (error: any) {
        console.error('Failed to load survey data:', error);
        setSurveyError(error?.response?.data?.message || 'Failed to load survey. Please try again.');
      } finally {
        setIsLoadingSurvey(false);
      }
    };

    loadData();
  }, [brandId, selectBrand]); // Removed isLoadingSurvey from dependencies

  const handleAddQuestion = () => {
    setEditingQuestion({
      type: 'text',
      text: '',
    });
  };

  const handleEditQuestion = (question: SurveyQuestion) => {
    setEditingQuestion(question);
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
    if (editingQuestion && 'id' in editingQuestion) {
      // Edit existing question
      const index = newQuestions.findIndex(q => q.id === editingQuestion.id);
      if (index !== -1) {
        newQuestions[index] = { ...question, id: editingQuestion.id };
      }
    } else {
      // Add new question
      newQuestions.push({
        ...question,
        id: `new-${Date.now()}`, // Temporary ID for new questions
      });
    }
    
    setSurvey({ ...survey, questions: newQuestions });
    setEditingQuestion(null);
  };

  const handleSaveSurvey = async () => {
    if (!survey || !brandId) return;
    
    setIsSubmitting(true);
    try {
      await brands.saveSurvey(brandId, survey);
      setSurveyUrl(`${window.location.origin}/survey/${brandId}`);
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Failed to save survey:', error);
      setSurveyError(error?.response?.data?.message || 'Failed to save survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(surveyUrl);
  };

  const handleDone = () => {
    if (brandId) {
      navigate(`/brands/${brandId}/strategy`);
    }
  };

  const handleRetry = () => {
    const loadData = async () => {
      if (!brandId || isLoadingSurvey) return;
      
      try {
        setIsLoadingSurvey(true);
        setSurveyError(null);
        await selectBrand(brandId);
        const draftSurvey = await brands.getSurveyDraft(brandId);
        setSurvey(draftSurvey);
      } catch (error: any) {
        console.error('Failed to load survey data:', error);
        setSurveyError(error?.response?.data?.message || 'Failed to load survey. Please try again.');
      } finally {
        setIsLoadingSurvey(false);
      }
    };

    loadData();
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
          <button
            onClick={handleRetry}
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Try Again
          </button>
          <button
            onClick={() => navigate('/brands')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium"
          >
            Exit
          </button>
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
                      className="border border-neutral-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
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
                    className="px-4 py-2 bg-neutral-100 border border-l-0 border-neutral-300 rounded-r-md hover:bg-neutral-200"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleDone}
                  className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
                >
                  Done for Now
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