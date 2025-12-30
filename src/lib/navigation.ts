// Brand status type definition
export type BrandStatus =
  | "new_brand"
  | "questionnaire"
  | "summary"
  | "jtbd"
  | "create_survey"
  | "collect_feedback"
  | "feedback_review_summary"
  | "feedback_review_jtbd"
  | "feedback_review_archetype"
  | "pick_name"
  | "create_assets"
  | "testimonial"
  | "payment"
  | "completed";

// Brand status constants
export const BRAND_STATUS_NEW = "new_brand";
export const BRAND_STATUS_QUESTIONNAIRE = "questionnaire";
export const BRAND_STATUS_SUMMARY = "summary";
export const BRAND_STATUS_JTBD = "jtbd";
export const BRAND_STATUS_CREATE_SURVEY = "create_survey";
export const BRAND_STATUS_COLLECT_FEEDBACK = "collect_feedback";
export const BRAND_STATUS_FEEDBACK_REVIEW_SUMMARY = "feedback_review_summary";
export const BRAND_STATUS_FEEDBACK_REVIEW_JTBD = "feedback_review_jtbd";
export const BRAND_STATUS_FEEDBACK_REVIEW_ARCHETYPE =
  "feedback_review_archetype";
export const BRAND_STATUS_PICK_NAME = "pick_name";
export const BRAND_STATUS_CREATE_ASSETS = "create_assets";
export const BRAND_STATUS_TESTIMONIAL = "testimonial";
export const BRAND_STATUS_PAYMENT = "payment";
export const BRAND_STATUS_COMPLETED = "completed";

// Navigation utility that maps brand status to routes
export const getRouteForStatus = (
  brandId: string,
  status: BrandStatus
): string => {
  const routes: Record<BrandStatus, string> = {
    new_brand: `/brands/${brandId}/explanation`,
    questionnaire: `/brands/${brandId}/questionnaire`,
    summary: `/brands/${brandId}/summary`,
    jtbd: `/brands/${brandId}/jtbd`,
    create_survey: `/brands/${brandId}/survey`,
    collect_feedback: `/brands/${brandId}/collect-feedback`,
    feedback_review_summary: `/brands/${brandId}/feedback-review/summary`,
    feedback_review_jtbd: `/brands/${brandId}/feedback-review/jtbd`,
    feedback_review_archetype: `/brands/${brandId}/feedback-review/archetype`,
    pick_name: `/brands/${brandId}/pick-name`,
    create_assets: `/brands/${brandId}/create-assets`,
    testimonial: `/brands/${brandId}/testimonial`,
    payment: `/brands/${brandId}/payment`,
    completed: `/brands/${brandId}/completed`,
  };

  return routes[status] || `/brands/${brandId}`;
};

// Helper function to navigate to the appropriate route after brand progression
// Accepts either { status: BrandStatus } or { current_status: BrandStatus } (Brand object)
export const navigateAfterProgress = (
  navigate: (path: string) => void,
  brandId: string,
  statusUpdate: { status?: BrandStatus; current_status?: BrandStatus }
) => {
  const status = statusUpdate.status || statusUpdate.current_status;
  if (!status) {
    console.error(
      "navigateAfterProgress: No status found in statusUpdate",
      statusUpdate
    );
    navigate(`/brands/${brandId}`);
    return;
  }
  const nextRoute = getRouteForStatus(brandId, status);
  navigate(nextRoute);
};
