import { BrandStatus } from '../lib/brandStatus';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Brand {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  current_status?: string;
  created_at?: string;
  updated_at?: string;
  answers?: Record<string, Answer>;
  jtbd?: JTBDList;
  survey?: Survey;
  summary?: string;
}

export interface Question {
  id: string;
  text: string;
  hint: string;
}

export interface Answer {
  id: string;
  question: string;
  answer: string;
}

export interface JTBD {
  id: string;
  brand_id: string;
  name: string;
  description: string;
  importance?: JTBDImportance;
}

export interface JTBDList {
  personas: Record<string, JTBD>;
  drivers?: string;
}

export type JTBDImportance = 
  | 'not_applicable'
  | 'not_important'
  | 'rarely_important'
  | 'somewhat_important'
  | 'important'
  | 'very_important';

export const JTBD_IMPORTANCE_LABELS: Record<JTBDImportance, string> = {
  not_applicable: 'Not applicable for my business',
  not_important: 'Not important',
  rarely_important: 'Rarely important',
  somewhat_important: 'Somewhat important',
  important: 'Important',
  very_important: 'Very important',
};

export type SurveyQuestionType = 'text' | 'single_choice' | 'multiple_choice' | 'rating';

export interface SurveyQuestion {
  id?: string;
  type: SurveyQuestionType;
  text: string;
  options?: string[];
}

export interface Survey {
  id: string;
  brand_id: string;
  questions: SurveyQuestion[];
  created_at?: string;
  updated_at?: string;
}