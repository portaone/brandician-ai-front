import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit2, ArrowRight } from 'lucide-react';
import { Question, Answer } from '../../types';
import Button from '../common/Button';

interface QuestionnaireSummaryProps {
  questions: Question[];
  answers: Answer[];
  onEditAnswer: (questionId: string) => void;
  onComplete: () => void;
}

const QuestionnaireSummary: React.FC<QuestionnaireSummaryProps> = ({
  questions,
  answers,
  onEditAnswer,
  onComplete,
}) => {
  const navigate = useNavigate();
  const { brandId } = useParams<{ brandId: string }>();

  // Scroll to top when component mounts
  useEffect(() => {
    // Add a delay to ensure DOM is fully rendered
    const scrollTimeout = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 200);

    return () => clearTimeout(scrollTimeout);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Answers</h2>
      
      <div className="space-y-6 mb-8">
        {questions.map((question) => {
          const answer = answers.find(a => a.question === question.id);
          
          return (
            <div key={question.id} className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-gray-900">{question.text}</h3>
                <button
                  onClick={() => onEditAnswer(question.id)}
                  className="text-primary-600 hover:text-primary-700 flex items-center"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>
              {answer?.answer ? (
                <p className="text-gray-600">{answer.answer}</p>
              ) : (
                <p className="text-primary-600 italic font-medium">No answer provided</p>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between items-center pt-4">
        <Button
          onClick={() => navigate('/brands')}
          variant="secondary"
          size="md"
          tabIndex={-1}
        >
          Save and Exit
        </Button>

        <Button
          onClick={onComplete}
          size="lg"
          tabIndex={-1}
        >
          Generate Brand Summary
          <ArrowRight className="ml-2 h-5 w-5 inline" />
        </Button>
      </div>
    </div>
  );
};

export default QuestionnaireSummary;