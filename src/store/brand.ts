import { create } from 'zustand';
import { brands } from '../lib/api';
import { Brand, Question, Answer, JTBDList } from '../types';
import { BrandStatus } from '../lib/brandStatus';

interface BrandState {
  brands: Brand[];
  currentBrand: Brand | null;
  questions: Question[];
  answers: Answer[];
  isLoading: boolean;
  error: string | null;
  loadBrands: () => Promise<void>;
  createBrand: (name: string, description?: string) => Promise<Brand>;
  selectBrand: (brandId: string) => Promise<void>;
  loadQuestions: (brandId: string) => Promise<void>;
  loadAnswers: (brandId: string) => Promise<void>;
  submitAnswer: (brandId: string, questionId: string, answer: string, question: string) => Promise<void>;
  updateBrandStatus: (brandId: string, status: BrandStatus) => Promise<void>;
  loadJTBD: (brandId: string) => Promise<void>;
  updateJTBD: (brandId: string, jtbd: JTBDList) => Promise<void>;
}

export const useBrandStore = create<BrandState>((set, get) => ({
  brands: [],
  currentBrand: null,
  questions: [],
  answers: [],
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
      const answers = Object.entries(answersData).map(([questionId, data]) => ({
        id: questionId,
        question: questionId,
        answer: data.answer,
      }));
      set({ answers });
    } catch (error) {
      set({ error: 'Failed to load answers' });
      throw error;
    }
  },
  
  submitAnswer: async (brandId: string, questionId: string, answer: string, question: string) => {
    set({ isLoading: true, error: null });
    try {
      const newAnswer = await brands.submitAnswer(brandId, questionId, answer, question);
      set((state) => ({
        answers: [
          ...state.answers.filter(a => a.question !== questionId),
          {
            id: questionId,
            question: questionId,
            answer: newAnswer.answer,
          }
        ],
        isLoading: false,
      }));
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
      const updatedBrand = await brands.updateJTBD(brandId, jtbd);
      set((state) => ({
        brands: state.brands.map(b => b.id === brandId ? updatedBrand : b),
        currentBrand: state.currentBrand?.id === brandId ? updatedBrand : state.currentBrand,
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false, error: 'Failed to update JTBD' });
      throw error;
    }
  },
}));