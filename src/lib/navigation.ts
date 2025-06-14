import { BrandStatus } from './brandStatus';

// Navigation utility that maps brand status to routes
export const getRouteForStatus = (brandId: string, status: BrandStatus): string => {
  const routes: Record<BrandStatus, string> = {
    'new_brand': `/brands/${brandId}/explanation`,
    'questionnaire': `/brands/${brandId}/questionnaire`,
    'summary': `/brands/${brandId}/summary`,
    'jtbd': `/brands/${brandId}/jtbd`,
    'create_survey': `/brands/${brandId}/survey`,
    'collect_feedback': `/brands/${brandId}/collect-feedback`,
    'feedback_review_summary': `/brands/${brandId}/feedback-review`,
    'feedback_review_jtbd': `/brands/${brandId}/feedback-review`,
    'feedback_review_archetype': `/brands/${brandId}/feedback-review`,
    'pick_name': `/brands/${brandId}/pick-name`,
    'create_assets': `/brands/${brandId}/create-assets`,
    'payment': `/brands/${brandId}/payment`,
    'completed': `/brands/${brandId}/completed`,
  };

  return routes[status] || `/brands/${brandId}`;
};

// Helper function to navigate to the appropriate route after brand progression
export const navigateAfterProgress = (
  navigate: (path: string) => void,
  brandId: string,
  statusUpdate: { status: BrandStatus }
) => {
  const nextRoute = getRouteForStatus(brandId, statusUpdate.status);
  navigate(nextRoute);
};