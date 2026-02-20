import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import ArchetypeAdjustmentContainer from "./ArchetypeAdjustmentContainer";
import JTBDAdjustmentContainer from "./JTBDAdjustmentContainer";
import SummaryAdjustmentContainer from "./SummaryAdjustmentContainer";
import PrimaryPersonaContainer from "../PrimaryPersona/PrimaryPersonaContainer";
import {
  BrandStatus,
  BRAND_STATUS_FEEDBACK_REVIEW_SUMMARY,
  BRAND_STATUS_FEEDBACK_REVIEW_JTBD,
  BRAND_STATUS_PRIMARY_PERSONA_SELECTION,
  BRAND_STATUS_FEEDBACK_REVIEW_ARCHETYPE,
  BRAND_STATUS_PICK_NAME,
} from "../../lib/navigation";

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
    id: "summary",
    component: SummaryAdjustmentContainer,
    title: "Review Brand Summary",
    status: BRAND_STATUS_FEEDBACK_REVIEW_SUMMARY,
  },
  {
    id: "jtbd",
    component: JTBDAdjustmentContainer,
    title: "Review CJobs-to-be-Done",
    status: BRAND_STATUS_FEEDBACK_REVIEW_JTBD,
  },
  {
    id: "primary-persona",
    component: PrimaryPersonaContainer,
    title: "Select Primary Persona",
    status: BRAND_STATUS_PRIMARY_PERSONA_SELECTION,
  },
  {
    id: "archetype",
    component: ArchetypeAdjustmentContainer,
    title: "Review Brand Archetype",
    status: BRAND_STATUS_FEEDBACK_REVIEW_ARCHETYPE,
  },
  // Add more steps here as needed
];

const FeedbackReviewFlowContainer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { brandId } = useParams<{ brandId: string }>();
  const [error, setError] = useState<string | null>(null);
  const [currentBrand, setCurrentBrand] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrand = async () => {
      if (!brandId) return;
      setIsLoading(true);
      try {
        const brand = await brands.get(brandId);
        setCurrentBrand(brand);
        console.log(
          "[DEBUG] useEffect: brand.current_status =",
          brand.current_status
        );
      } catch (e) {
        setError("Failed to load brand info.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBrand();
  }, [brandId]);

  // Handle redirects in a separate effect to avoid render-time navigation
  useEffect(() => {
    if (shouldRedirect) {
      navigate(shouldRedirect, { replace: true });
      setShouldRedirect(null);
    }
  }, [shouldRedirect, navigate]);

  // Check if user is on the right step when brand status changes
  useEffect(() => {
    if (!currentBrand || !brandId || isLoading || shouldRedirect) return;

    const getStepFromPath = () => {
      if (location.pathname.endsWith("/summary")) return "summary";
      if (location.pathname.endsWith("/jtbd")) return "jtbd";
      if (location.pathname.endsWith("/primary-persona")) return "primary-persona";
      if (location.pathname.endsWith("/archetype")) return "archetype";
      if (location.pathname.endsWith("/feedback-review")) return null; // Old generic path
      return null;
    };

    const currentStepId = getStepFromPath();
    const expectedStep = REVIEW_STEPS.find(
      (step) => step.status === currentBrand.current_status
    );

    console.log(
      "[DEBUG] Status check - Current path step:",
      currentStepId,
      "Expected step:",
      expectedStep?.id,
      "Brand status:",
      currentBrand.current_status
    );

    if (expectedStep && currentStepId !== expectedStep.id) {
      const correctPath = `/brands/${brandId}/feedback-review/${expectedStep.id}`;
      console.log("[DEBUG] Setting redirect to correct step:", correctPath);
      setShouldRedirect(correctPath);
    } else if (!expectedStep) {
      console.log("[DEBUG] Not in review flow, redirecting to brand home");
      setShouldRedirect(`/brands/${brandId}`);
    }
  }, [
    currentBrand?.current_status,
    location.pathname,
    brandId,
    isLoading,
    shouldRedirect,
  ]);

  const handleStepComplete = async () => {
    if (!brandId || !currentBrand) {
      console.log(
        "[DEBUG] handleStepComplete: Missing brandId or currentBrand"
      );
      return;
    }

    console.log(
      "[DEBUG] FeedbackReviewFlow: handleStepComplete called, current status =",
      currentBrand.current_status
    );

    try {
      // Always progress to the next status via backend
      console.log("[DEBUG] FeedbackReviewFlow: Calling progressStatus...");
      const progressResp = await brands.progressStatus(brandId);
      console.log(
        "[DEBUG] FeedbackReviewFlow: progress response",
        progressResp
      );

      // Re-fetch brand to get the latest status from backend
      console.log("[DEBUG] FeedbackReviewFlow: Fetching updated brand...");
      const updatedBrand = await brands.get(brandId);
      console.log(
        "[DEBUG] FeedbackReviewFlow: brand after progress",
        updatedBrand
      );
      setCurrentBrand(updatedBrand);

      // Check if we're still in the feedback review flow
      const isStillInReviewFlow = REVIEW_STEPS.some(
        (step) => step.status === updatedBrand.current_status
      );
      console.log(
        "[DEBUG] FeedbackReviewFlow: Still in review flow?",
        isStillInReviewFlow,
        "New status:",
        updatedBrand.current_status
      );

      if (!isStillInReviewFlow) {
        // We've completed all review steps, navigate to the next phase
        console.log(
          "[DEBUG] FeedbackReviewFlow: Exiting review flow, navigating to next phase"
        );
        if (updatedBrand.current_status === BRAND_STATUS_PICK_NAME) {
          navigate(`/brands/${brandId}/pick-name`);
        } else {
          // Use generic navigation helper if available
          navigate(`/brands/${brandId}`);
        }
      }
      // If still in review flow, the component will re-render with the new status
    } catch (e) {
      setError("Failed to progress brand status.");
      console.error("[DEBUG] FeedbackReviewFlow: error progressing status", e);
    }
  };

  const handleStepError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!currentBrand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Brand not found
      </div>
    );
  }

  // Don't render if we have a pending redirect
  if (shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Redirecting...
      </div>
    );
  }

  // Determine which step component to show based on URL path
  const getStepFromPath = () => {
    if (location.pathname.endsWith("/summary")) return "summary";
    if (location.pathname.endsWith("/jtbd")) return "jtbd";
    if (location.pathname.endsWith("/primary-persona")) return "primary-persona";
    if (location.pathname.endsWith("/archetype")) return "archetype";
    return null;
  };

  const currentStepId = getStepFromPath();
  const currentStep = REVIEW_STEPS.find((step) => step.id === currentStepId);

  // If no valid step found, show loading while redirect happens
  if (!currentStep) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const StepComponent = currentStep.component;

  return (
    <div>
      <StepComponent
        onComplete={handleStepComplete}
        onError={handleStepError}
      />
    </div>
  );
};

export default FeedbackReviewFlowContainer;
