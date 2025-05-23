import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useBrandStore } from '../../store/brand';
import QuestionnaireHeader from './QuestionnaireHeader';
import QuestionnaireItem from './QuestionnaireItem';
import QuestionnaireSummary from './QuestionnaireSummary';
import { Brain, ArrowRight } from 'lucide-react';
import { brands } from '../../lib/api';

const QuestionnaireContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    currentBrand,
    questions,
    answers,
    selectBrand,
    submitAnswer,
    updateBrandStatus,
    isLoading,
    error,
    loadQuestions,
    loadAnswers
  } = useBrandStore();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1); // Start at -1 for intro screen
  const [showSummary, setShowSummary] = useState(false);

  const typedAnswers: Record<string, any> = answers || {};

  useEffect(() => {
    if (brandId) {
      selectBrand(brandId);
      loadQuestions(brandId);
      loadAnswers(brandId);
    }
  }, [brandId, selectBrand, loadQuestions, loadAnswers]);

  useEffect(() => {
    if (questions.length > 0 && answers && currentQuestionIndex === -1) {
      if (searchParams.get('summary') === '1') {
        setShowSummary(true);
        return;
      }
      const firstUnansweredIndex = questions.findIndex(q => !(q.id in answers));
      if (firstUnansweredIndex === -1) {
        setShowSummary(true);
      } else {
        setCurrentQuestionIndex(firstUnansweredIndex);
      }
    }
  }, [questions, answers, currentQuestionIndex, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-primary-600 text-2xl">⟳</div>
      </div>
    );
  }

  if (error || !currentBrand || !brandId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">
          {error || 'Brand not found'}
        </div>
      </div>
    );
  }

  const handleNext = async (answer: string) => {
    if (!questions[currentQuestionIndex]) return;

    // Get the current answer from the store
    const currentAnswerObj = typedAnswers[questions[currentQuestionIndex].id];
    const previousAnswer = currentAnswerObj?.answer ?? "";

    // Only submit if the answer has changed (trimmed)
    if (answer.trim() !== previousAnswer.trim()) {
      try {
        await submitAnswer(
          brandId,
          questions[currentQuestionIndex].id,
          answer,
          questions[currentQuestionIndex].text
        );
      } catch (error) {
        console.error('Failed to submit answer:', error);
        return;
      }
    }

    if (currentQuestionIndex === questions.length - 1) {
      setShowSummary(true);
      return;
    }

    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleEditAnswer = (questionId: string) => {
    const index = questions.findIndex(q => q.id === questionId);
    if (index !== -1) {
      setShowSummary(false);
      setCurrentQuestionIndex(index);
    }
  };

  const handleComplete = async () => {
    if (!currentBrand.current_status || !brandId) return;
    
    try {
      console.log('🔄 Starting brand summary generation...');
      console.log('Current brand status:', currentBrand.current_status);
      
      // First update the status on the server
      const updatedBrand = await brands.updateStatus(brandId, 'summary');
      console.log('✅ Server status updated:', updatedBrand);
      
      // Then update local state
      await updateBrandStatus(brandId, 'summary');
      console.log('✅ Local state updated');
      
      // Finally navigate
      console.log('🚀 Navigating to summary page...');
      navigate(`/brands/${brandId}/summary`);
    } catch (error) {
      console.error('❌ Failed to complete questionnaire:', error);
      throw error;
    }
  };

  const handleStartQuestionnaire = () => {
    setCurrentQuestionIndex(0);
  };

  const handleSaveExit = async () => {
    // Save the current answer if it is not empty and has changed
    if (currentQuestion && currentAnswerObj && currentAnswerObj.answer !== undefined && currentAnswerObj.answer.trim() !== "") {
      // Already saved, just exit
      navigate('/brands');
      return;
    }
    if (currentQuestion && currentAnswerObj?.answer === undefined && currentQuestionIndex !== -1) {
      // If the answer is not saved yet, save it
      const answerToSave = currentAnswerObj?.answer || "";
      if (answerToSave.trim() !== "") {
        await submitAnswer(
          brandId,
          currentQuestion.id,
          answerToSave,
          currentQuestion.text
        );
      }
    }
    navigate('/brands');
  };

  const progress = currentQuestionIndex === -1 ? 0 : ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswerObj = currentQuestion ? typedAnswers[currentQuestion.id] : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <QuestionnaireHeader progress={progress} onSaveExit={handleSaveExit} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {currentQuestionIndex === -1 && !showSummary ? (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex justify-center mb-6">
                <Brain className="h-12 w-12 text-primary-600" />
              </div>
              
              <h2 className="text-2xl font-display font-bold text-center text-neutral-800 mb-4">
                Welcome to Your Brand Discovery Journey
              </h2>
              
              <div className="space-y-6 text-neutral-600">
                <p>
                  You're about to begin an in-depth exploration of your brand vision. This questionnaire will help us understand:
                </p>
                
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">1</span>
                    <span>Your target audience and their needs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">2</span>
                    <span>Your unique value proposition and market position</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">3</span>
                    <span>Your brand's personality and values</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">4</span>
                    <span>Your goals and aspirations for the brand</span>
                  </li>
                </ul>

                <div className="bg-primary-50 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>Tips for best results:</strong>
                  </p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• Take your time to provide thoughtful, detailed answers</li>
                    <li>• Be honest and authentic in your responses</li>
                    <li>• Consider your long-term vision, not just immediate needs</li>
                    <li>• You can use voice input or type your answers</li>
                  </ul>
                </div>

                <p className="text-sm">
                  The questionnaire takes about 15-20 minutes to complete. Your answers will be used to generate your brand strategy and identity.
                </p>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleStartQuestionnaire}
                  className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                >
                  Begin Questionnaire
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <header className="mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-2 bg-neutral-200 rounded-full w-full max-w-md">
                    <div 
                      className="h-2 bg-primary-500 rounded-full transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                <h2 className="text-2xl font-display font-bold text-center text-neutral-800 mb-2">
                  {currentBrand.name} - Brand Questionnaire
                </h2>
                <p className="text-center text-neutral-600">
                  Help us understand your brand vision
                </p>
              </header>

              {showSummary ? (
                <QuestionnaireSummary
                  questions={questions}
                  answers={answers}
                  onEditAnswer={handleEditAnswer}
                  onComplete={handleComplete}
                />
              ) : currentQuestion ? (
                <QuestionnaireItem
                  question={currentQuestion.text}
                  hint={currentQuestion.hint}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={questions.length}
                  isLastQuestion={currentQuestionIndex === questions.length - 1}
                  currentAnswer={currentAnswerObj?.answer}
                  brandId={brandId}
                  answerId={currentQuestion.id}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireContainer;