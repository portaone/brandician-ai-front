import React from 'react';
import ReactMarkdown from 'react-markdown';

interface BrandAttributeDisplayProps {
  title: string;
  content: string | null;
  isLoading?: boolean;
  className?: string;
}

export const BrandAttributeDisplay: React.FC<BrandAttributeDisplayProps> = ({
  title,
  content,
  isLoading = false,
  className = ''
}) => {
  if (isLoading) {
    return (
      <div className={`${className}`}>
        <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
        <div className="text-gray-500 italic">Loading...</div>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className={`${className}`}>
      {title && <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>}
      <div className="prose prose-sm max-w-none text-gray-700">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

interface JTBDDisplayProps {
  jtbd: any | null;
  isLoading?: boolean;
  className?: string;
}

export const JTBDDisplay: React.FC<JTBDDisplayProps> = ({
  jtbd,
  isLoading = false,
  className = ''
}) => {
  if (isLoading) {
    return (
      <div className={`${className}`}>
        <h3 className="font-semibold text-gray-800 mb-2">Jobs-To-Be-Done</h3>
        <div className="text-gray-500 italic">Loading...</div>
      </div>
    );
  }

  if (!jtbd) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Personas */}
      {jtbd.personas && Object.keys(jtbd.personas).length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Personas:</h4>
          <div className="space-y-2">
            {Object.entries(jtbd.personas).map(([key, persona]: [string, any]) => (
              <div key={key} className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-gray-700 mb-1">{persona.name}</div>
                <div className="prose prose-sm max-w-none text-gray-600">
                  <ReactMarkdown>{persona.description}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Drivers */}
      {jtbd.drivers && (
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Drivers:</h4>
          <div className="bg-gray-50 p-3 rounded">
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown>
                {typeof jtbd.drivers === 'string'
                  ? jtbd.drivers.replace(/##\s+/g, '\n\n## ').trim()
                  : jtbd.drivers}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SurveyQuestionsDisplayProps {
  questions: any[] | null;
  isLoading?: boolean;
  className?: string;
}

export const SurveyQuestionsDisplay: React.FC<SurveyQuestionsDisplayProps> = ({
  questions,
  isLoading = false,
  className = ''
}) => {
  if (isLoading) {
    return (
      <div className={`${className}`}>
        <h3 className="font-semibold text-gray-800 mb-2">Survey Questions</h3>
        <div className="text-gray-500 italic">Loading...</div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {questions.map((question, index) => (
        <div key={question.id || index} className="bg-gray-50 p-3 rounded">
          <div className="flex items-start gap-2">
            <span className="font-semibold text-gray-700 shrink-0">
              Q{index + 1}:
            </span>
            <div className="flex-1">
              <div className="text-gray-800 mb-1">{question.text}</div>
              <div className="text-xs text-gray-500">
                Type: {question.type}
                {question.options && ` • ${question.options.length} options`}
              </div>
              {question.options && question.options.length > 0 && (
                <div className="mt-2 space-y-1">
                  {question.options.map((option: string, optionIndex: number) => (
                    <div key={optionIndex} className="text-xs text-gray-600 pl-4">
                      • {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};