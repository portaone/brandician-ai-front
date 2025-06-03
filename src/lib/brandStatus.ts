export type BrandStatus = 
  | 'new_brand'
  | 'questionnaire'
  | 'summary'
  | 'jtbd'
  | 'create_survey'
  | 'collect_feedback'
  | 'feedback_review'
  | 'create_assets'
  | 'payment'
  | 'complete';

export const BRAND_STATUS_NEW = 'new_brand';
export const BRAND_STATUS_QUESTIONNAIRE = 'questionnaire';
export const BRAND_STATUS_SUMMARY = 'summary';
export const BRAND_STATUS_JTBD = 'jtbd';
export const BRAND_STATUS_CREATE_SURVEY = 'create_survey';
export const BRAND_STATUS_COLLECT_FEEDBACK = 'collect_feedback';
export const BRAND_STATUS_FEEDBACK_REVIEW = 'feedback_review';
export const BRAND_STATUS_CREATE_ASSETS = 'create_assets';
export const BRAND_STATUS_PAYMENT = 'payment';
export const BRAND_STATUS_COMPLETE = 'complete';

export const BRAND_STATUS_CONFIG = {
  new_brand: {
    next: 'questionnaire',
    path: '/explanation'
  },
  questionnaire: {
    next: 'summary',
    path: '/questionnaire'
  },
  summary: {
    next: 'jtbd',
    path: '/summary'
  },
  jtbd: {
    next: 'create_survey',
    path: '/jtbd'
  },
  create_survey: {
    next: 'collect_feedback',
    path: '/survey'
  },
  collect_feedback: {
    next: 'feedback_review',
    path: '/collect-feedback'
  },
  feedback_review: {
    next: 'create_assets',
    path: '/feedback-review'
  },
  create_assets: {
    next: 'payment',
    path: '/create-assets'
  },
  payment: {
    next: 'complete',
    path: '/payment'
  },
  complete: {
    next: null,
    path: '/complete'
  },
} as const;

export const getNextStatus = (currentStatus: BrandStatus): BrandStatus | null => {
  return BRAND_STATUS_CONFIG[currentStatus]?.next || null;
};

export const getStatusPath = (status: BrandStatus, brandId: string): string => {
  const basePath = BRAND_STATUS_CONFIG[status]?.path || '/brands';
  return `/brands/${brandId}${basePath}`;
};

