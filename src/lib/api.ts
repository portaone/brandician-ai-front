import axios from 'axios';
import { BrandStatus } from './brandStatus';
import { JTBDList, Survey, SurveyQuestion } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const DEBUG = import.meta.env.VITE_DEBUG === 'true';

const logApiCall = (type: string, url: string, data?: any, response?: any) => {
  if (!DEBUG) return;
  
  console.group(`🌐 API ${type}`);
  console.log('URL:', url);
  if (data) console.log('Request Data:', data);
  if (response) console.log('Response:', response);
  console.groupEnd();
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (DEBUG) {
    logApiCall(config.method?.toUpperCase() || 'REQUEST', config.url || '', config.data);
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (DEBUG) {
      logApiCall('RESPONSE', response.config.url || '', undefined, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (DEBUG) {
      console.error('🔴 API Error:', {
        url: originalRequest.url,
        status: error.response?.status,
        data: error.response?.data
      });
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await api.post('/api/v1.0/auth/token/refresh', {
          refresh_token: refreshToken,
        });
        
        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (error) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const auth = {
  register: async (email: string, name: string) => {
    const response = await api.post('/api/v1.0/auth/register', { email, name });
    return response.data;
  },
  
  verifyOTP: async (otpId: string, otp: string) => {
    const response = await api.post('/api/v1.0/auth/verify-otp', { otp_id: otpId, otp });
    const { access_token, refresh_token } = response.data;
    localStorage.setItem('access_token', access_token);
    if (refresh_token) {
      localStorage.setItem('refresh_token', refresh_token);
    }
    return response.data;
  },
  
  login: async (email: string) => {
    const response = await api.post('/api/v1.0/auth/login', { email });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/api/v1.0/users/me');
    return response.data;
  },
};

export const brands = {
  list: async () => {
    const response = await api.get('/api/v1.0/brands');
    return response.data;
  },
  
  create: async (name: string, description?: string) => {
    const response = await api.post('/api/v1.0/brands', { name, description });
    return response.data;
  },
  
  get: async (brandId: string) => {
    const response = await api.get(`/api/v1.0/brands/${brandId}`);
    return response.data;
  },
  
  getQuestions: async (brandId: string) => {
    const response = await api.get(`/api/v1.0/brands/${brandId}/questions`);
    return response.data;
  },
  
  getAnswers: async (brandId: string) => {
    const response = await api.get(`/api/v1.0/brands/${brandId}/answers/`);
    return response.data;
  },
  
  submitAnswer: async (brandId: string, questionId: string, answer: string, question: string) => {
    const response = await api.put(`/api/v1.0/brands/${brandId}/answers/${questionId}`, {
      answer,
      question
    });
    return response.data;
  },
  
  updateStatus: async (brandId: string, status: BrandStatus) => {
    const response = await api.patch(`/api/v1.0/brands/${brandId}`, { 
      current_status: status 
    });
    return response.data;
  },

  getJTBD: async (brandId: string) => {
    const response = await api.post(`/api/v1.0/brands/${brandId}/jtbd/`);
    return response.data;
  },

  updateJTBD: async (brandId: string, jtbd: JTBDList) => {
    const response = await api.patch(`/api/v1.0/brands/${brandId}`, {
      jtbd,
      current_status: 'create_survey'
    });
    return response.data;
  },

  getSurveyDraft: async (brandId: string) => {
    const response = await api.post(`/api/v1.0/brands/${brandId}/survey/`);
    return response.data;
  },

  saveSurvey: async (brandId: string, survey: Survey) => {
    // Only send the questions array when saving the survey
    const response = await api.put(`/api/v1.0/brands/${brandId}/survey/`, {
      questions: survey.questions.map(q => ({
        type: q.type,
        text: q.text,
        options: q.options
      }))
    });
    return response.data;
  },

  processAudio: async (brandId: string, answerId: string, audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'recording.webm');  // Changed from 'audio' to 'audio_file' to match API spec

    const response = await api.post(
      `/api/v1.0/brands/${brandId}/answers/${answerId}/audio`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  getAudioProcessingStatus: async (brandId: string, answerId: string, processingId: string) => {
    const response = await api.get(
      `/api/v1.0/brands/${brandId}/answers/${answerId}/audio/${processingId}`
    );
    return response.data;
  },

  augmentAnswer: async (brandId: string, answerId: string, text: string) => {
    console.log('🔍 Augmenting answer:', { brandId, answerId, text });
    const response = await api.post(
      `/api/v1.0/brands/${brandId}/answers/${answerId}/augment`,
      { source_text: text }
    );
    console.log('✨ Augmentation response:', response.data);
    return response.data;
  },

  generateSummary: async (brandId: string) => {
    console.log('🔄 Generating summary for brand:', brandId);
    const response = await api.post(`/api/v1.0/brands/${brandId}/summary`);
    console.log('✅ Summary generated:', response.data);
    return response.data;
  },

  getSummary: async (brandId: string) => {
    const response = await api.get(`/api/v1.0/brands/${brandId}/summary/`);
    return response.data;
  },

  updateSummary: async (brandId: string, summary: string) => {
    const response = await api.put(`/api/v1.0/brands/${brandId}/summary`, { summary });
    return response.data;
  },
};

export default api;