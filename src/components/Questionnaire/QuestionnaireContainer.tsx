import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBrandStore } from '../../store/brand';
import QuestionnaireHeader from './QuestionnaireHeader';
import QuestionnaireItem from './QuestionnaireItem';
import QuestionnaireSummary from './QuestionnaireSummary';
import { Brain, ArrowRight } from 'lucide-react';
import { brands } from '../../lib/api';

const QuestionnaireContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { 
    currentBrand,
    questions,
    answers,
    selectBrand,
    submitAnswer,
    updateBrandStatus,
    isLoading,
    error 
  } = useBrandStore();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1); // Start at -1 for intro screen
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (brandId) {
      selectBrand(brandId);
    }
  }, [brandId, selectBrand]);

  useEffect(() => {
    if (questions.length > 0 && answers && currentQuestionIndex === -1) {
      const answeredQuestions = new Map(answers.map(a => [a.question, a]));
      const firstUnansweredIndex = questions.findIndex(q => !answeredQuestions.has(q.id));
      
      if (firstUnansweredIndex === -1) {
        setShowSummary(true);
      }
    }
  }, [questions, answers, currentQuestionIndex]);

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

    try {
      await submitAnswer(
        brandId,
        questions[currentQuestionIndex].id,
        answer,
        questions[currentQuestionIndex].text
      );

      if (currentQuestionIndex === questions.length - 1) {
        setShowSummary(true);
        return;
      }

      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
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
      await brands.updateStatus(brandId, 'summary');
      await updateBrandStatus(brandId, 'summary');
      navigate(`/brands/${brandId}/summary`);
    } catch (error) {
      console.error('Failed to complete questionnaire:', error);
      throw error;
    }
  };

  const handleStartQuestionnaire = () => {
    setCurrentQuestionIndex(0);
  };

  const progress = currentQuestionIndex === -1 ? 0 : ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswerObj = answers.find(a => a.question === currentQuestion?.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <QuestionnaireHeader progress={progress} />
      
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