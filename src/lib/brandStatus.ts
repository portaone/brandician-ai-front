export type BrandStatus = 
  | 'new_brand'
  | 'questionnaire'
  | 'summary'
  | 'jtbd'
  | 'create_survey'
  | 'collect_feedback'
  | 'feedback_review_summary'
  | 'feedback_review_jtbd'
  | 'feedback_review_archetype'
  | 'pick_name'
  | 'create_assets'
  | 'payment'
  | 'completed';

export const BRAND_STATUS_NEW = 'new_brand';
export const BRAND_STATUS_QUESTIONNAIRE = 'questionnaire';
export const BRAND_STATUS_SUMMARY = 'summary';
export const BRAND_STATUS_JTBD = 'jtbd';
export const BRAND_STATUS_CREATE_SURVEY = 'create_survey';
export const BRAND_STATUS_COLLECT_FEEDBACK = 'collect_feedback';
export const BRAND_STATUS_FEEDBACK_REVIEW_SUMMARY = 'feedback_review_summary';
export const BRAND_STATUS_FEEDBACK_REVIEW_JTBD = 'feedback_review_jtbd';
export const BRAND_STATUS_FEEDBACK_REVIEW_ARCHETYPE = 'feedback_review_archetype';
export const BRAND_STATUS_PICK_NAME = 'pick_name';
export const BRAND_STATUS_CREATE_ASSETS = 'create_assets';
export const BRAND_STATUS_PAYMENT = 'payment';
export const BRAND_STATUS_COMPLETED = 'completed';

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
    next: 'feedback_review_summary',
    path: '/collect-feedback'
  },
  feedback_review_summary: {
    next: 'feedback_review_jtbd',
    path: '/feedback-review',
    description: 'Review and adjust brand summary'
  },
  feedback_review_jtbd: {
    next: 'feedback_review_archetype',
    path: '/feedback-review',
    description: 'Review and adjust brand JTBD'
  },
  feedback_review_archetype: {
    next: 'pick_name',
    path: '/feedback-review',
    description: 'Review and adjust brand archetype'
  },
  pick_name: {
    next: 'create_assets',
    path: '/pick-name',
    description: 'Pick brand name'
  },
  create_assets: {
    next: 'payment',
    path: '/create-assets',
    description: 'Create brand assets'
  },
  payment: {
    next: 'completed',
    path: '/payment'
  },
  completed: {
    next: null,
    path: '/completed'
  },
} as const;

export const getNextStatus = (currentStatus: BrandStatus): BrandStatus | null => {
  return BRAND_STATUS_CONFIG[currentStatus]?.next || null;
};

export const getStatusPath = (status: BrandStatus, brandId: string): string => {
  const basePath = BRAND_STATUS_CONFIG[status]?.path || '/brands';
  return `/brands/${brandId}${basePath}`;
};

