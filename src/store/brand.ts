import { create } from 'zustand';
import { brands } from '../lib/api';
import { Brand, Question, Answer, JTBDList } from '../types';
import { BrandStatus } from '../lib/navigation';

interface BrandState {
  brands: Brand[];
  currentBrand: Brand | null;
  questions: Question[];
  answers: Answer[];
  answersMap: Map<string, Answer>; // More efficient for lookups
  isLoading: boolean;
  error: string | null;
  loadBrands: () => Promise<void>;
  createBrand: (name: string, description?: string) => Promise<Brand>;
  selectBrand: (brandId: string) => Promise<void>;
  loadQuestions: (brandId: string) => Promise<void>;
  loadAnswers: (brandId: string) => Promise<void>;
  submitAnswer: (brandId: string, questionId: string, answer: string, question: string) => Promise<void>;
  updateBrandStatus: (brandId: string, status: BrandStatus) => Promise<void>;
  progressBrandStatus: (brandId: string) => Promise<{status: BrandStatus}>;
  loadJTBD: (brandId: string) => Promise<void>;
  updateJTBD: (brandId: string, jtbd: JTBDList) => Promise<void>;
  generateBrandSummary: (brandId: string) => Promise<void>;
  updateBrandSummary: (brandId: string, summary: string) => Promise<void>;
  loadSummary: (brandId: string) => Promise<string>;
  loadArchetype: (brandId: string) => Promise<void>;
  updateArchetype: (brandId: string, archetype: string) => Promise<void>;
}

export const useBrandStore = create<BrandState>((set, get) => ({
  brands: [],
  currentBrand: null,
  questions: [],
  answers: [],
  answersMap: new Map(),
  isLoading: false,
  error: null,
  
  loadBrands: async () => {
    set({ isLoading: true, error: null });
    try {
      const brandList = await brands.list();
      set({ brands: brandList, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: 'Failed to load brands' });
      throw error;
    }
  },
  
  createBrand: async (name: string, description?: string) => {
    set({ isLoading: true, error: null });
    try {
      const brand = await brands.create(name, description);
      set((state) => ({
        brands: [...state.brands, brand],
        currentBrand: brand,
        isLoading: false,
      }));
      return brand;
    } catch (error) {
      set({ isLoading: false, error: 'Failed to create brand' });
      throw error;
    }
  },
  
  selectBrand: async (brandId: string) => {
    set({ isLoading: true, error: null });
    try {
      const brand = await brands.get(brandId);
      set({ currentBrand: brand, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: 'Failed to load brand data' });
      throw error;
    }
  },
  
  loadQuestions: async (brandId: string) => {
    try {
      const questions = await brands.getQuestions(brandId);
      set({ questions });
    } catch (error) {
      set({ error: 'Failed to load questions' });
      throw error;
    }
  },
  
  loadAnswers: async (brandId: string) => {
    try {
      const answersData = await brands.getAnswers(brandId);
      const answers = Object.entries(answersData).map(([questionId, data]: [string, any]) => ({
        id: questionId,
        question: questionId,
        answer: data.answer,
      }));
      
      // Create optimized map for O(1) lookups
      const answersMap = new Map(answers.map(answer => [answer.question, answer]));
      
      set({ answers, answersMap });
    } catch (error: any) {
      set({ error: 'Failed to load answers' });
      throw error;
    }
  },
  
  submitAnswer: async (brandId: string, questionId: string, answer: string, question: string) => {
    set({ isLoading: true, error: null });
    try {
      const newAnswer = await brands.submitAnswer(brandId, questionId, answer, question);
      
      set((state) => {
        const updatedAnswer = {
          id: questionId,
          question: questionId,
          answer: newAnswer.answer,
        };
        
        // Update both array and map efficiently
        const answers = [...state.answers.filter(a => a.question !== questionId), updatedAnswer];
        const answersMap = new Map(state.answersMap);
        answersMap.set(questionId, updatedAnswer);
        
        return {
          answers,
          answersMap,
          isLoading: false,
        };
      });
    } catch (error) {
      set({ isLoading: false, error: 'Failed to submit answer' });
      throw error;
    }
  },

  updateBrandStatus: async (brandId: string, status: BrandStatus) => {
    set({ isLoading: true, error: null });
    try {
      const updatedBrand = await brands.updateStatus(brandId, status);
      set((state) => ({
        brands: state.brands.map(b => b.id === brandId ? updatedBrand : b),
        currentBrand: state.currentBrand?.id === brandId ? updatedBrand : state.currentBrand,
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false, error: 'Failed to update brand status' });
      throw error;
    }
  },

  progressBrandStatus: async (brandId: string) => {
    set({ isLoading: true, error: null });
    try {
      const statusUpdate = await brands.progressStatus(brandId);
      // Refresh the brand to get the updated status and any server-side changes
      const updatedBrand = await brands.get(brandId);
      set((state) => ({
        brands: state.brands.map(b => b.id === brandId ? updatedBrand : b),
        currentBrand: state.currentBrand?.id === brandId ? updatedBrand : state.currentBrand,
        isLoading: false,
      }));
      return statusUpdate;
    } catch (error) {
      set({ isLoading: false, error: 'Failed to progress brand status' });
      throw error;
    }
  },

  loadJTBD: async (brandId: string) => {
    set({ isLoading: true, error: null });
    try {
      const jtbdData = await brands.getJTBD(brandId);
      set((state) => ({
        currentBrand: state.currentBrand ? {
          ...state.currentBrand,
          jtbd: jtbdData
        } : null,
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false, error: 'Failed to load JTBD data' });
      throw error;
    }
  },

  updateJTBD: async (brandId: string, jtbd: JTBDList) => {
    set({ isLoading: true, error: null });
    try {
      await brands.updateJTBD(brandId, jtbd);
      // Update current brand's JTBD locally since the API doesn't return the full brand
      set((state) => ({
        currentBrand: state.currentBrand ? {
          ...state.currentBrand,
          jtbd: jtbd
        } : null,
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false, error: 'Failed to update JTBD' });
      throw error;
    }
  },

  generateBrandSummary: async (brandId: string) => {
    console.log('🔄 Starting brand summary generation in store...');
    set({ isLoading: true, error: null });
    try {
      const summaryData = await brands.generateSummary(brandId);
      console.log('✅ Summary generated in store:', summaryData);
      set((state) => ({
        currentBrand: state.currentBrand ? {
          ...state.currentBrand,
          summary: summaryData.summary
        } : null,
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('❌ Failed to generate summary:', error);
      set({ isLoading: false, error: 'Failed to generate brand summary' });
      throw error;
    }
  },

  loadSummary: async (brandId: string) => {
    set({ isLoading: true, error: null });
    try {
      const summaryData = await brands.getSummary(brandId);
      set((state) => ({
        currentBrand: state.currentBrand ? {
          ...state.currentBrand,
          summary: summaryData.summary
        } : null,
        isLoading: false,
      }));
      return summaryData.summary;
    } catch (error: any) {
      set({ isLoading: false, error: 'Failed to load brand summary' });
      throw error;
    }
  },

  updateBrandSummary: async (brandId: string, summary: string) => {
    set({ isLoading: true, error: null });
    try {
      await brands.updateSummary(brandId, summary);
      // Update current brand's summary locally since the API doesn't return the full brand
      set((state) => ({
        currentBrand: state.currentBrand ? {
          ...state.currentBrand,
          summary: summary
        } : null,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ isLoading: false, error: 'Failed to update brand summary' });
      throw error;
    }
  },

  loadArchetype: async (brandId: string) => {
    set({ isLoading: true, error: null });
    try {
      const archetypeData = await brands.getArchetype(brandId);
      set((state) => ({
        currentBrand: state.currentBrand ? {
          ...state.currentBrand,
          archetype: archetypeData.archetype
        } : null,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ isLoading: false, error: 'Failed to load archetype data' });
      throw error;
    }
  },

  updateArchetype: async (brandId: string, archetype: string) => {
    set({ isLoading: true, error: null });
    try {
      await brands.updateArchetype(brandId, archetype);
      // Update current brand's archetype locally since the API doesn't return the full brand
      set((state) => ({
        currentBrand: state.currentBrand ? {
          ...state.currentBrand,
          archetype: archetype
        } : null,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ isLoading: false, error: 'Failed to update archetype' });
      throw error;
    }
  },
}));