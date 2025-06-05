import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SummaryAdjustmentContainer from './SummaryAdjustmentContainer';

// Define the review steps
export type ReviewStep = {
  id: string;
  component: React.ComponentType<{
    onComplete: () => void;
    onError: (error: string) => void;
  }>;
  title: string;
};

// Define the sequence of review steps
const REVIEW_STEPS: ReviewStep[] = [
  {
    id: 'summary',
    component: SummaryAdjustmentContainer,
    title: 'Review Brand Summary'
  }
  // Add more steps here as needed
];

const FeedbackReviewFlowContainer: React.FC = () => {
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const currentStep = REVIEW_STEPS[currentStepIndex];

  const handleStepComplete = () => {
    // Move to the next step or finish the review
    if (currentStepIndex < REVIEW_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // All steps completed, proceed to the next stage
      navigate('/brands/pick-name');
    }
  };

  const handleStepError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (!currentStep) {
    return null;
  }

  const StepComponent = currentStep.component;

  return (
    <div>
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900 font-bold"
          >
            ×
          </button>
        </div>
      )}
      <StepComponent
        onComplete={handleStepComplete}
        onError={handleStepError}
      />
    </div>
  );
};

export default FeedbackReviewFlowContainer; 