import { BrandStatus } from '../lib/navigation';

export interface User {
  id: string;
  email: string;
  name: string;
  admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BrandReduced {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  current_status?: string;
  created_at?: string;
  updated_at?: string;
  survey_id?: string;
  brand_name?: string;
  payment_complete?: number;
  status_description?: string;
}

export interface Brand extends BrandReduced {
  answers?: Record<string, Answer>;
  jtbd?: JTBDList;
  survey?: Survey;
  summary?: string;
  status_description?: string;
  archetype?: string;
  draft?: BrandNameSuggestion;
  alt_options?: BrandNameSuggestion[];
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

export interface BrandAssetSummary {
  id: string;
  type: BrandAssetType;
}

export interface BrandAssetsListResponse {
  assets: BrandAssetSummary[];
}

export interface BrandAsset {
  type: BrandAssetType;
  display_as?: BrandAssetDisplayType;
  description?: string | null;
  url?: string | null;
  content?: string | null;
  created_at?: string | null;
}

export type BrandAssetDisplayType = 'text' | 'markdown' | 'html' | 'image';

export type BrandAssetType = 'logo' | 'tagline' | 'visual_style' | 'text_writer_prompt' | 'brand_book' | 'ext_system_asset';

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

export interface SubmissionLink {
  url: string;
  expires_at?: string;
  created_at?: string;
}

export interface SurveyStatus {
  status: string;
  number_of_responses: number;
  min_responses_required?: number;
  last_response_date?: string;
}

export interface Feedback {
  status: string;
  number_of_responses: number;
  results_link?: string;
  feedback?: string;
  can_proceed: boolean;
}

export interface FootNote {
  id: string;
  text: string;
  url?: string;
}

export interface AdjustObject {
  old_text: string;
  new_text: string;
  survey?: SurveyStatus;
  footnotes?: FootNote[];
  changes?: { type: string; content: string; id?: string; t?: string }[];
}

export interface BrandNameSuggestion {
  name: string;
  description: string;
  domains_available: string[];
  score: number | null;
}