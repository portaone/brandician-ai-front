import axios from 'axios';
import { BrandStatus } from './brandStatus';
import { 
  JTBDList, 
  Survey, 
  SurveyQuestion, 
  SubmissionLink, 
  SurveyStatus, 
  Feedback,
  AdjustObject 
} from '../types';
import { BRAND_STATUS_CREATE_SURVEY } from './brandStatus';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1.0';
const DEBUG = import.meta.env.VITE_DEBUG === 'true';

const logApiCall = (type: string, url: string, data?: any, response?: any) => {
  if (!DEBUG) return;
  
  console.group(`🌐 API ${type}`);
  console.log('URL:', url);
  if (data) console.log('Request Data:', data);
  if (response) console.log('Response:', response);
  console.groupEnd();
};

// Enhanced error logging for connection issues
const logConnectionError = (error: any, url: string) => {
  console.group('🔴 Connection Error Details');
  console.log('Target URL:', `${API_URL}${url}`);
  console.log('Error Code:', error.code);
  console.log('Error Message:', error.message);
  
  if (error.code === 'ERR_CONNECTION_REFUSED') {
    console.log('💡 Troubleshooting:');
    console.log('   - Check if the backend server is running');
    console.log('   - Verify the API URL in your .env file');
    console.log('   - Current API_URL:', API_URL);
    console.log('   - Expected format: http://localhost:PORT (e.g., http://localhost:8000)');
  }
  
  console.groupEnd();
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to build API paths
const apiPath = (path: string) => `${API_PREFIX}${path}`;

// Add request interceptor for auth token
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

// Add response interceptor for token refresh
api.interceptors.response.use(
  (response) => {
    if (DEBUG) {
      logApiCall('RESPONSE', response.config.url || '', undefined, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Enhanced error logging with connection diagnostics
    if (DEBUG || error.code === 'ERR_CONNECTION_REFUSED' || !error.response) {
      if (!error.response) {
        logConnectionError(error, originalRequest.url || '');
      } else {
        console.error('🔴 API Error:', {
          url: originalRequest.url,
          status: error.response?.status,
          data: error.response?.data
        });
      }
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await api.post(apiPath('/auth/token/refresh'), {
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
    const response = await api.get(apiPath('/brands'));
    return response.data;
  },
  
  create: async (name: string, description?: string) => {
    const response = await api.post(apiPath('/brands'), { name, description });
    return response.data;
  },
  
  get: async (brandId: string) => {
    const response = await api.get(apiPath(`/brands/${brandId}`));
    return response.data;
  },
  
  update: async (brandId: string, updates: any) => {
    const response = await api.put(apiPath(`/brands/${brandId}`), updates);
    return response.data;
  },
  
  patch: async (brandId: string, updates: any) => {
    const response = await api.patch(apiPath(`/brands/${brandId}`), updates);
    return response.data;
  },
  
  delete: async (brandId: string) => {
    await api.delete(apiPath(`/brands/${brandId}`));
  },
  
  updateStatus: async (brandId: string, status: BrandStatus) => {
    const response = await api.put(apiPath(`/brands/${brandId}/status`), { status });
    return response.data;
  },

  getQuestions: async (brandId: string) => {
    const response = await api.get(apiPath(`/brands/${brandId}/questions`));
    return response.data;
  },

  getQuestion: async (brandId: string, questionId: string) => {
    const response = await api.get(apiPath(`/brands/${brandId}/questions/${questionId}`));
    return response.data;
  },

  getAnswers: async (brandId: string) => {
    const response = await api.get(apiPath(`/brands/${brandId}/answers/`));
    return response.data;
  },

  getAnswer: async (brandId: string, answerId: string) => {
    const response = await api.get(apiPath(`/brands/${brandId}/answers/${answerId}`));
    return response.data;
  },

  updateAnswer: async (brandId: string, answerId: string, answer: { question: string; answer: string }) => {
    const response = await api.put(apiPath(`/brands/${brandId}/answers/${answerId}`), answer);
    return response.data;
  },

  deleteAnswer: async (brandId: string, answerId: string) => {
    await api.delete(apiPath(`/brands/${brandId}/answers/${answerId}`));
  },

  getJTBD: async (brandId: string) => {
    const response = await api.post(apiPath(`/brands/${brandId}/jtbd/`));
    return response.data;
  },

  updateJTBD: async (brandId: string, jtbd: JTBDList) => {
    const response = await api.patch(apiPath(`/brands/${brandId}`), {
      jtbd,
      current_status: BRAND_STATUS_CREATE_SURVEY
    });
    return response.data;
  },

  getSurveyDraft: async (brandId: string) => {
    const response = await api.post(apiPath(`/brands/${brandId}/survey/`));
    return response.data;
  },

  getSurvey: async (brandId: string) => {
    const response = await api.get(apiPath(`/brands/${brandId}/survey`));
    return response.data;
  },

  saveSurvey: async (brandId: string, survey: Survey): Promise<SubmissionLink> => {
    const response = await api.put(apiPath(`/brands/${brandId}/survey`), survey);
    return response.data;
  },

  processAudio: async (brandId: string, answerId: string, audioFile: File) => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    const response = await api.post(apiPath(`/brands/${brandId}/answers/${answerId}/audio`), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  processAudioBatch: async (brandId: string, answerId: string, audioFile: File) => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    const response = await api.post(apiPath(`/brands/${brandId}/answers/${answerId}/audio-batch`), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getAudioProcessingStatus: async (brandId: string, answerId: string, processingId: string) => {
    const response = await api.get(apiPath(`/brands/${brandId}/answers/${answerId}/audio/${processingId}`));
    return response.data;
  },

  augmentAnswer: async (brandId: string, answerId: string, sourceText: string, style?: string, language?: string) => {
    const response = await api.post(apiPath(`/brands/${brandId}/answers/${answerId}/augment`), {
      source_text: sourceText,
      style,
      language,
    });
    return response.data;
  },

  generateSummary: async (brandId: string) => {
    console.log('🔄 Generating summary for brand:', brandId);
    const response = await api.post(apiPath(`/brands/${brandId}/summary`));
    console.log('✅ Summary generated:', response.data);
    return response.data;
  },

  getSummary: async (brandId: string) => {
    const response = await api.get(apiPath(`/brands/${brandId}/summary/`));
    return response.data;
  },

  updateSummary: async (brandId: string, summary: string) => {
    const response = await api.put(apiPath(`/brands/${brandId}/summary`), { summary });
    return response.data;
  },

  getSurveyStatus: async (brandId: string) => {
    const response = await api.get(apiPath(`/brands/${brandId}/survey/status/`));
    return response.data;
  },

  analyzeFeedback: async (brandId: string) => {
    const response = await api.post(apiPath(`/brands/${brandId}/feedback`));
    return response.data;
  },

  adjustSummary: async (brandId: string): Promise<AdjustObject> => {
    const response = await api.post(apiPath(`/brands/${brandId}/adjust/summary`));
    return response.data;
  },

  suggestSurvey: async (brandId: string) => {
    const response = await api.post(apiPath(`/brands/${brandId}/survey`));
    return response.data;
  },

  suggestJTBD: async (brandId: string) => {
    const response = await api.post(apiPath(`/brands/${brandId}/jtbd`));
    return response.data;
  },

  suggestArchetype: async (brandId: string) => {
    const response = await api.post(apiPath(`/brands/${brandId}/archetype`));
    return response.data;
  },

  updateArchetype: async (brandId: string, archetype: string) => {
    await api.put(apiPath(`/brands/${brandId}/archetype`), { archetype });
  },

  adjustArchetype: async (brandId: string) => {
    const response = await api.put(apiPath(`/brands/${brandId}/adjust/archetype`));
    return response.data;
  },

  suggestArchetypeAdjustment: async (brandId: string) => {
    const response = await api.post(apiPath(`/brands/${brandId}/adjust/archetype`));
    return response.data;
  },

  produceAssets: async (brandId: string) => {
    const response = await api.post(apiPath(`/brands/${brandId}/produce-assets/`));
    return response.data;
  },

  submitAnswer: async (brandId: string, answerId: string, answer: string, question: string) => {
    const response = await api.put(apiPath(`/brands/${brandId}/answers/${answerId}`), {
      question,
      answer,
    });
    return response.data;
  },
};

export default api;