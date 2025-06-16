import axios from 'axios';
import { BrandStatus } from './navigation';
import { 
  JTBDList, 
  Survey, 
  SurveyQuestion, 
  SubmissionLink, 
  SurveyStatus, 
  Feedback,
  AdjustObject 
} from '../types';
import { BRAND_STATUS_CREATE_SURVEY } from './navigation';

// Extend axios config to include our metadata
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      requestId: string;
    };
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1.0';
const DEBUG = import.meta.env.VITE_DEBUG === 'true';

// Generate random request ID
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const logApiCall = (type: string, url: string, requestId: string, data?: any, response?: any) => {
  console.log(`🌐 [${requestId}] API ${type} ${url}`);
  
  if (DEBUG) {
    console.group(`🌐 [${requestId}] API ${type}`);
    console.log('URL:', url);
    console.log('Request ID:', requestId);
    if (data) console.log('Request Data:', data);
    if (response) console.log('Response:', response);
    console.groupEnd();
  }
};

// Enhanced error logging for connection issues
const logConnectionError = (error: any, url: string, requestId: string) => {
  console.group(`🔴 [${requestId}] Connection Error Details`);
  console.log('Target URL:', `${API_URL}${url}`);
  console.log('Request ID:', requestId);
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

// Request deduplication system
const pendingRequests = new Map<string, Promise<any>>();

const createRequestKey = (method: string, url: string, data?: any) => {
  const dataKey = data ? JSON.stringify(data) : '';
  return `${method}:${url}:${dataKey}`;
};

const deduplicate = async <T>(
  key: string, 
  requestFn: () => Promise<T>
): Promise<T> => {
  if (pendingRequests.has(key)) {
    const requestId = generateRequestId();
    console.log(`🔄 [${requestId}] Deduplicating request: ${key}`);
    return pendingRequests.get(key) as Promise<T>;
  }
  
  const promise = requestFn();
  pendingRequests.set(key, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    pendingRequests.delete(key);
  }
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

// Add request interceptor for auth token and request ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Generate and add request ID
  const requestId = generateRequestId();
  config.headers['X-Request-ID'] = requestId;
  
  // Store request ID in config for later use in response/error logging
  config.metadata = { requestId };
  
  logApiCall(config.method?.toUpperCase() || 'REQUEST', config.url || '', requestId, config.data);
  
  return config;
});

// Add response interceptor for token refresh
api.interceptors.response.use(
  (response) => {
    const requestId = response.config.metadata?.requestId || 'unknown';
    logApiCall('RESPONSE', response.config.url || '', requestId, undefined, response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const requestId = originalRequest?.metadata?.requestId || 'unknown';
    
    // Enhanced error logging with connection diagnostics
    if (DEBUG || error.code === 'ERR_CONNECTION_REFUSED' || !error.response) {
      if (!error.response) {
        logConnectionError(error, originalRequest.url || '', requestId);
      } else {
        console.error(`🔴 [${requestId}] API Error:`, {
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
    const key = createRequestKey('GET', apiPath('/brands'));
    return deduplicate(key, async () => {
      const response = await api.get(apiPath('/brands'));
      return response.data;
    });
  },
  
  create: async (name: string, description?: string) => {
    const response = await api.post(apiPath('/brands'), { name, description });
    return response.data;
  },
  
  get: async (brandId: string) => {
    const key = createRequestKey('GET', apiPath(`/brands/${brandId}`));
    return deduplicate(key, async () => {
      const response = await api.get(apiPath(`/brands/${brandId}`));
      return response.data;
    });
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

  // Proper progress endpoint - use this instead of updateStatus for workflow progression
  progressStatus: async (brandId: string) => {
    const key = createRequestKey('POST', apiPath(`/brands/${brandId}/progress/`));
    return deduplicate(key, async () => {
      const response = await api.post(apiPath(`/brands/${brandId}/progress/`));
      return response.data;
    });
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

  updateAnswers: async (brandId: string, answers: Record<string, any>) => {
    await api.put(apiPath(`/brands/${brandId}/answers/`), answers);
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
    try {
      // Try to get existing JTBD first
      const response = await api.get(apiPath(`/brands/${brandId}/jtbd/`));
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // If no JTBD exists, suggest new one
        const key = createRequestKey('POST', apiPath(`/brands/${brandId}/jtbd/`));
        return deduplicate(key, async () => {
          const response = await api.post(apiPath(`/brands/${brandId}/jtbd/`));
          return response.data;
        });
      }
      throw error;
    }
  },

  updateJTBD: async (brandId: string, jtbd: JTBDList) => {
    await api.put(apiPath(`/brands/${brandId}/jtbd/`), jtbd);
  },

  adjustJTBDPersonas: async (brandId: string): Promise<AdjustObject[]> => {
    const key = createRequestKey('POST', apiPath(`/brands/${brandId}/adjust/jtbd-personas`));
    return deduplicate(key, async () => {
      const response = await api.post(apiPath(`/brands/${brandId}/adjust/jtbd-personas`));
      return response.data;
    });
  },

  adjustJTBDDrivers: async (brandId: string): Promise<AdjustObject> => {
    const key = createRequestKey('POST', apiPath(`/brands/${brandId}/adjust/jtbd-drivers`));
    return deduplicate(key, async () => {
      const response = await api.post(apiPath(`/brands/${brandId}/adjust/jtbd-drivers`));
      return response.data;
    });
  },

  getSurveyDraft: async (brandId: string) => {
    const key = createRequestKey('POST', apiPath(`/brands/${brandId}/survey/`));
    return deduplicate(key, async () => {
      const response = await api.post(apiPath(`/brands/${brandId}/survey/`));
      return response.data;
    });
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
    try {
      const response = await api.get(apiPath(`/brands/${brandId}/summary/`));
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // If no summary exists, generate new one
        const response = await api.post(apiPath(`/brands/${brandId}/summary/`));
        return response.data;
      }
      throw error;
    }
  },

  updateSummary: async (brandId: string, summary: string) => {
    await api.put(apiPath(`/brands/${brandId}/summary/`), { summary });
  },

  getSurveyStatus: async (brandId: string) => {
    const response = await api.get(apiPath(`/brands/${brandId}/survey/status/`));
    return response.data;
  },

  analyzeFeedback: async (brandId: string) => {
    const key = createRequestKey('POST', apiPath(`/brands/${brandId}/survey-feedback`));
    return deduplicate(key, async () => {
      const response = await api.post(apiPath(`/brands/${brandId}/survey-feedback`));
      return response.data;
    });
  },

  adjustSummary: async (brandId: string): Promise<AdjustObject> => {
    const key = createRequestKey('POST', apiPath(`/brands/${brandId}/adjust/summary`));
    return deduplicate(key, async () => {
      const response = await api.post(apiPath(`/brands/${brandId}/adjust/summary`));
      return response.data;
    });
  },

  suggestSurvey: async (brandId: string) => {
    const response = await api.post(apiPath(`/brands/${brandId}/survey`));
    return response.data;
  },

  suggestJTBD: async (brandId: string) => {
    const response = await api.post(apiPath(`/brands/${brandId}/jtbd`));
    return response.data;
  },

  getArchetype: async (brandId: string) => {
    try {
      const response = await api.get(apiPath(`/brands/${brandId}/archetype/`));
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // If no archetype exists, suggest new one
        const response = await api.post(apiPath(`/brands/${brandId}/archetype/`));
        return response.data;
      }
      throw error;
    }
  },

  suggestArchetype: async (brandId: string) => {
    const response = await api.post(apiPath(`/brands/${brandId}/archetype/`));
    return response.data;
  },

  updateArchetype: async (brandId: string, archetype: string) => {
    await api.put(apiPath(`/brands/${brandId}/archetype/`), { archetype });
  },

  adjustArchetype: async (brandId: string) => {
    const response = await api.put(apiPath(`/brands/${brandId}/adjust/archetype`));
    return response.data;
  },

  suggestArchetypeAdjustment: async (brandId: string) => {
    const key = createRequestKey('POST', apiPath(`/brands/${brandId}/adjust/archetype`));
    return deduplicate(key, async () => {
      const response = await api.post(apiPath(`/brands/${brandId}/adjust/archetype`));
      return response.data;
    });
  },

  produceAssets: async (brandId: string) => {
    const key = createRequestKey('POST', apiPath(`/brands/${brandId}/produce-assets/`));
    return deduplicate(key, async () => {
      const response = await api.post(apiPath(`/brands/${brandId}/produce-assets/`));
      return response.data;
    });
  },

  listAssets: async (brandId: string) => {
    const key = createRequestKey('GET', apiPath(`/brands/${brandId}/assets/`));
    return deduplicate(key, async () => {
      const response = await api.get(apiPath(`/brands/${brandId}/assets/`));
      return response.data;
    });
  },

  getAsset: async (brandId: string, assetId: string) => {
    const key = createRequestKey('GET', apiPath(`/brands/${brandId}/assets/${assetId}`));
    return deduplicate(key, async () => {
      const response = await api.get(apiPath(`/brands/${brandId}/assets/${assetId}`));
      return response.data;
    });
  },

  pickName: async (brandId: string) => {
    const key = createRequestKey('POST', apiPath(`/brands/${brandId}/pick-name/`));
    return deduplicate(key, async () => {
      const response = await api.post(apiPath(`/brands/${brandId}/pick-name/`));
      return response.data;
    });
  },

  submitAnswer: async (brandId: string, answerId: string, answer: string, question: string) => {
    const response = await api.put(apiPath(`/brands/${brandId}/answers/${answerId}`), {
      question,
      answer,
    });
    return response.data;
  },

  createPaymentSession: async (brandId: string, amount: number, description?: string, paymentMethod?: string) => {
    const params = new URLSearchParams();
    if (paymentMethod) {
      params.append('payment_method', paymentMethod);
    }
    
    const url = apiPath('/payments/checkout') + (params.toString() ? `?${params.toString()}` : '');
    
    const response = await api.post(url, {
      brand_id: brandId,
      amount: Number(amount.toFixed(2)), // Round to 2 decimal places
      currency: 'USD',
      description: description || `Brand creation payment for ${brandId}`
    });
    return response.data;
  },

  getPaymentStatus: async (brandId: string) => {
    const key = createRequestKey('GET', apiPath(`/brands/${brandId}/payment-status`));
    return deduplicate(key, async () => {
      const response = await api.get(apiPath(`/brands/${brandId}/payment-status`));
      return response.data;
    });
  },

  listBrandPayments: async (brandId: string) => {
    const key = createRequestKey('GET', apiPath(`/brands/${brandId}/payments`));
    return deduplicate(key, async () => {
      const response = await api.get(apiPath(`/brands/${brandId}/payments`));
      return response.data;
    });
  },

  getPaymentMethods: async () => {
    const key = createRequestKey('GET', apiPath('/payment-methods'));
    return deduplicate(key, async () => {
      const response = await api.get(apiPath('/payment-methods'));
      return response.data;
    });
  },

  registerDomains: async (brandId: string, domains: string[]) => {
    const response = await api.post(apiPath(`/brands/${brandId}/register-domains/`), {
      domains
    });
    return response.data;
  },

  updateFeedback: async (brandId: string, feedback: {
    rating?: number;
    testimonial?: string;
    suggestion?: string;
    author?: string;
  }) => {
    await api.put(apiPath(`/brands/${brandId}/feedback/`), feedback);
  },
};

export default api;