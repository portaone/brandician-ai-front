export type BrandStatus = 
  | 'new_brand'
  | 'questionnaire'
  | 'summary'
  | 'jtbd'
  | 'create_survey'
  | 'strategy'
  | 'identity'
  | 'complete';

export const BRAND_STATUS_CONFIG = {
  new_brand: {
    next: 'questionnaire',
    path: '/explanation',
    description: 'New Brand'
  },
  questionnaire: {
    next: 'summary',
    path: '/questionnaire',
    description: 'Brand Questionnaire'
  },
  summary: {
    next: 'jtbd',
    path: '/summary',
    description: 'Brand Summary'
  },
  jtbd: {
    next: 'create_survey',
    path: '/jtbd',
    description: 'Jobs To Be Done'
  },
  create_survey: {
    next: 'strategy',
    path: '/survey',
    description: 'Creating Survey'
  },
  strategy: {
    next: 'identity',
    path: '/strategy',
    description: 'Brand Strategy'
  },
  identity: {
    next: 'complete',
    path: '/identity',
    description: 'Brand Identity'
  },
  complete: {
    next: null,
    path: '/complete',
    description: 'Complete'
  },
} as const;

export const getNextStatus = (currentStatus: BrandStatus): BrandStatus | null => {
  return BRAND_STATUS_CONFIG[currentStatus]?.next || null;
};

export const getStatusPath = (status: BrandStatus, brandId: string): string => {
  const basePath = BRAND_STATUS_CONFIG[status]?.path || '/brands';
  return `/brands/${brandId}${basePath}`;
};

export const getStatusDescription = (status: BrandStatus): string => {
  return BRAND_STATUS_CONFIG[status]?.description || 'Unknown Status';
};