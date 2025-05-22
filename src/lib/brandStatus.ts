export type BrandStatus = 
  | 'new_brand'
  | 'questionnaire'
  | 'summary'
  | 'jtbd'
  | 'create_survey'
  | 'strategy'
  | 'identity'
  | 'collect_feedback'
  | 'feedback_review'
  | 'complete';

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
    next: 'strategy',
    path: '/survey'
  },
  strategy: {
    next: 'identity',
    path: '/strategy'
  },
  identity: {
    next: 'collect_feedback',
    path: '/identity'
  },
  collect_feedback: {
    next: 'feedback_review',
    path: '/collect-feedback'
  },
  feedback_review: {
    next: 'complete',
    path: '/feedback-review'
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

