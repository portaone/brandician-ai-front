import React, { useState, useEffect } from 'react';
import { Question, Answer } from './QuestionnaireContainer';

interface QuestionSlideProps {
  question: Question;
  onAnswer: (answer: Answer) => void;
  currentAnswer?: Answer;
}

const QuestionSlide: React.FC<QuestionSlideProps> = ({ 
  question,
  onAnswer,
  currentAnswer
}) => {
  const [textValue, setTextValue] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  
  // Initialize state from current answer if it exists
  useEffect(() => {
    if (currentAnswer) {
      if (question.type === 'multiple-choice') {
        setSelectedOptions(Array.isArray(currentAnswer.value) ? currentAnswer.value : []);
      } else {
        setTextValue(currentAnswer.value as string || '');
      }
    } else {
      // Reset state when question changes without an existing answer
      setTextValue('');
      setSelectedOptions([]);
    }
  }, [question.id, currentAnswer]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTextValue(value);
    onAnswer({
      questionId: question.id,
      value
    });
  };

  const handleMultipleChoiceChange = (option: string) => {
    let newSelection;
    
    if (selectedOptions.includes(option)) {
      newSelection = selectedOptions.filter(item => item !== option);
    } else {
      // Limit to 3 selections if this is the brand values question
      if (question.id === 'brand-values' && selectedOptions.length >= 3) {
        newSelection = [...selectedOptions.slice(1), option];
      } else {
        newSelection = [...selectedOptions, option];
      }
    }
    
    setSelectedOptions(newSelection);
    onAnswer({
      questionId: question.id,
      value: newSelection
    });
  };

  return (
    <div>
      <h3 className="text-xl font-display font-bold text-neutral-800 mb-2">
        {question.question}
      </h3>
      
      {question.description && (
        <p className="text-neutral-600 mb-6">
          {question.description}
        </p>
      )}
      
      <div className="mt-4">
        {question.type === 'text' && (
          <input
            type="text"
            value={textValue}
            onChange={handleTextChange}
            className="w-full p-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Your answer"
            required={question.required}
          />
        )}
        
        {question.type === 'textarea' && (
          <textarea
            value={textValue}
            onChange={handleTextChange}
            className="w-full p-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px]"
            placeholder="Your answer"
            required={question.required}
          />
        )}
        
        {question.type === 'multiple-choice' && question.options && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.options.map((option) => (
              <div 
                key={option}
                onClick={() => handleMultipleChoiceChange(option)}
                className={`p-3 border rounded-md cursor-pointer transition-colors ${
                  selectedOptions.includes(option)
                    ? 'bg-primary-50 border-primary-400 text-primary-700'
                    : 'bg-white border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center">
                  <div className={`h-5 w-5 rounded-full border flex-shrink-0 flex items-center justify-center ${
                    selectedOptions.includes(option)
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-neutral-400'
                  }`}>
                    {selectedOptions.includes(option) && (
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span className="ml-2">{option}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {question.type === 'rating' && (
          <div className="flex justify-between items-center mt-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => {
                  setTextValue(rating.toString());
                  onAnswer({
                    questionId: question.id,
                    value: rating.toString()
                  });
                }}
                className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-medium transition-colors ${
                  parseInt(textValue) === rating
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {rating}
              </button>
            ))}
          </div>
        )}

        {question.id === 'brand-values' && selectedOptions.length > 0 && (
          <p className="text-sm text-neutral-500 mt-2">
            {selectedOptions.length}/3 values selected
          </p>
        )}
      </div>
    </div>
  );
};

export default QuestionSlide;