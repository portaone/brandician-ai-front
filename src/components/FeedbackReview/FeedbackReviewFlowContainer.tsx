import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SummaryAdjustmentContainer from './SummaryAdjustmentContainer';
import ArchetypeAdjustmentContainer from './ArchetypeAdjustmentContainer';
import { brands } from '../../lib/api';
import {
  BrandStatus,
  BRAND_STATUS_FEEDBACK_REVIEW_SUMMARY,
  BRAND_STATUS_FEEDBACK_REVIEW_JTBD,
  BRAND_STATUS_FEEDBACK_REVIEW_ARCHETYPE,
  BRAND_STATUS_PICK_NAME
} from '../../lib/brandStatus';

// Define the review steps
export type ReviewStep = {
  id: string;
  component: React.ComponentType<{
    onComplete: () => void;
    onError: (error: string) => void;
  }>;
  title: string;
  status: BrandStatus;
};

// Define the sequence of review steps
const REVIEW_STEPS: ReviewStep[] = [
  {
    id: 'summary',
    component: SummaryAdjustmentContainer,
    title: 'Review Brand Summary',
    status: BRAND_STATUS_FEEDBACK_REVIEW_SUMMARY,
  },
  // Uncomment and implement if you have a JTBD step
  // {
  //   id: 'jtbd',
  //   component: JTBDAdjustmentContainer,
  //   title: 'Review Brand JTBD',
  //   status: BRAND_STATUS_FEEDBACK_REVIEW_JTBD,
  // },
  {
    id: 'archetype',
    component: ArchetypeAdjustmentContainer,
    title: 'Review Brand Archetype',
    status: BRAND_STATUS_FEEDBACK_REVIEW_ARCHETYPE,
  },
  // Add more steps here as needed
];

const FeedbackReviewFlowContainer: React.FC = () => {
  const navigate = useNavigate();
  const { brandId } = useParams<{ brandId: string }>();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [brandStatus, setBrandStatus] = useState<BrandStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBrand = async () => {
      if (!brandId) return;
      setIsLoading(true);
      try {
        const brand = await brands.get(brandId);
        setBrandStatus(brand.current_status);
        // Set step index based on status
        const idx = REVIEW_STEPS.findIndex(step => step.status === brand.current_status);
        console.log('[DEBUG] useEffect: brand.current_status =', brand.current_status, '-> step idx =', idx);
        setCurrentStepIndex(idx >= 0 ? idx : 0);
      } catch (e) {
        setError('Failed to load brand info.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBrand();
  }, [brandId]);

  const handleStepComplete = async () => {
    if (!brandId) return;
    console.log('[DEBUG] handleStepComplete: currentStepIndex =', currentStepIndex);
    if (currentStepIndex < REVIEW_STEPS.length - 1) {
      // Move to next step and update status
      const nextStep = REVIEW_STEPS[currentStepIndex + 1];
      console.log('[DEBUG] handleStepComplete: Advancing to nextStep', nextStep);
      try {
        const statusResp = await brands.updateStatus(brandId, nextStep.status);
        console.log('[DEBUG] handleStepComplete: updateStatus response', statusResp);
        // Re-fetch brand to get the latest status from backend
        const brand = await brands.get(brandId);
        console.log('[DEBUG] handleStepComplete: brand after update', brand);
        setBrandStatus(brand.current_status);
        const idx = REVIEW_STEPS.findIndex(step => step.status === brand.current_status);
        console.log('[DEBUG] handleStepComplete: new step idx =', idx);
        setCurrentStepIndex(idx >= 0 ? idx : currentStepIndex + 1);
      } catch (e) {
        setError('Failed to update brand status.');
        console.error('[DEBUG] handleStepComplete: error updating status', e);
      }
    } else {
      // After last review step, go to PICK_NAME
      console.log('[DEBUG] handleStepComplete: Last step, updating to PICK_NAME');
      try {
        const statusResp = await brands.updateStatus(brandId, BRAND_STATUS_PICK_NAME);
        console.log('[DEBUG] handleStepComplete: updateStatus PICK_NAME response', statusResp);
        // Re-fetch brand to get the latest status from backend
        const brand = await brands.get(brandId);
        console.log('[DEBUG] handleStepComplete: brand after PICK_NAME update', brand);
        setBrandStatus(brand.current_status);
        navigate(`/brands/${brandId}/pick-name`);
      } catch (e) {
        setError('Failed to update brand status.');
        console.error('[DEBUG] handleStepComplete: error updating to PICK_NAME', e);
      }
    }
  };

  const handleStepError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Only render the current step and handle step advancement
  const currentStep = REVIEW_STEPS[currentStepIndex];
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