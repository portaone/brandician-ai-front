import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, ArrowRight } from 'lucide-react';
import { Question, Answer } from '../../types';

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
              <p className="text-gray-600">{answer?.answer || 'No answer provided'}</p>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between items-center pt-4">
        <button
          onClick={() => navigate('/brands')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Save and Exit
        </button>
        
        <button
          onClick={onComplete}
          className="flex items-center px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
        >
          Generate Brand Summary
          <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default QuestionnaireSummary;