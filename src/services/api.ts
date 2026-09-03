import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let expoExtra: any = null;
try {
  const Constants = require('expo-constants')?.default || require('expo-constants');
  expoExtra = Constants?.expoConfig?.extra;
} catch (_) {}

const AUTH_TOKEN_KEY = '@dr_hakeem_auth_token';
const USER_KEY = '@dr_hakeem_user';

// Determine default API Base URL per platform (supports env secrets and expo extra)
export const getApiBaseUrl = (): string => {
  const url =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    expoExtra?.apiBaseUrl ||
    'https://magenta-stork-707380.hostingersite.com/api/v1';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    Accept: 'application/json',
  },
  timeout: 90000, // 90s timeout for AI PyTorch model inference & Grad-CAM
});

// Request Interceptor: Attach Sanctum Bearer Token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catch 401 Unauthorized & unwrap responses
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    }
    return Promise.reject(error);
  }
);

// ==========================================
// DATA CONTRACTS (Matching Laravel 13 API)
// ==========================================

export interface BackendUser {
  id: number;
  name: string;
  email: string;
  role?: string;
  created_at?: string;
}

export interface AuthResponseData {
  token: string;
  user: BackendUser;
}

export interface PatientSettings {
  notifications_enabled: boolean;
  dark_mode: boolean;
  language: string;
}

export interface PatientProfileData {
  id: number;
  user_id: number;
  patient_code: string;
  age: number;
  blood_group: string;
  skin_type: string;
  conditions: string[];
  active_allergies: string[];
  settings: PatientSettings;
  user?: BackendUser;
}

export interface SeverityAnalysis {
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  risk_label_ar: string;
  badge_color: string;
  is_malignant: boolean;
  recommendation_ar: string;
  recommendation_en: string;
  confidence_score: number;
  inference_time_ms?: number;
  overlay_alpha?: number;
}

export interface TopPrediction {
  class: string;
  label: string;
  confidence: number;
}

export interface DiagnosisResult {
  id: number;
  user_id: number;
  patient_id_code: string;
  image_url: string;
  heatmap_url?: string;
  predicted_class: string;
  predicted_label: string;
  explained_class?: string;
  explained_label?: string;
  label_ar: string;
  is_malignant: boolean;
  confidence: number;
  confidence_percentage: string;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  risk_level_label: string;
  badge_color: string;
  inference_time_ms: number;
  severity_analysis: SeverityAnalysis;
  status: string;
  alpha?: number;
  top_3?: TopPrediction[];
  top_predictions?: TopPrediction[];
  error_message?: string | null;
  status_label?: string | null;
  created_at: string;
}

export interface DiseaseDistributionItem {
  class: string;
  label_ar: string;
  is_malignant: boolean;
  count: number;
}

export interface AccuracyMetrics {
  average_confidence: number;
  average_confidence_percentage: string;
  average_inference_time_ms: number;
}

export interface DashboardStats {
  total_scans: number;
  completed_scans: number;
  failed_scans: number;
  high_risk_scans: number;
  growth_rate: number;
  accuracy_metrics: AccuracyMetrics;
  disease_distribution: DiseaseDistributionItem[];
  recent_scans: DiagnosisResult[];
}

export interface DiagnosisHistoryResponse {
  data: DiagnosisResult[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

// Token & User Persistence
export const authStorage = {
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken: async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (e) {
      console.error('Error saving auth token', e);
    }
  },
  getUser: async (): Promise<BackendUser | null> => {
    try {
      const user = await AsyncStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },
  setUser: async (user: BackendUser): Promise<void> => {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Error saving user data', e);
    }
  },
  clearAuth: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Error clearing auth', e);
    }
  },
};

// ==========================================
// 1. AUTHENTICATION SERVICE
// ==========================================
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponseData> => {
    const response = await apiClient.post<{ success: boolean; data: AuthResponseData }>('/auth/login', {
      email,
      password,
    });
    const authData = response.data.data;
    await authStorage.setToken(authData.token);
    await authStorage.setUser(authData.user);
    return authData;
  },

  register: async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ): Promise<AuthResponseData> => {
    const response = await apiClient.post<{ success: boolean; data: AuthResponseData }>('/auth/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
      role: 'patient',
    });
    const authData = response.data.data;
    await authStorage.setToken(authData.token);
    await authStorage.setUser(authData.user);
    return authData;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.warn('Logout request warning:', err);
    } finally {
      await authStorage.clearAuth();
    }
  },

  getAuthProfile: async (): Promise<BackendUser> => {
    const response = await apiClient.get<{ success: boolean; data: BackendUser }>('/auth/profile');
    return response.data.data;
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>('/auth/forgot-password', {
        email,
      });
      return response.data;
    } catch {
      return { success: true, message: 'Password reset link sent if account exists.' };
    }
  },
};

// ==========================================
// 2. PATIENT PROFILE SERVICE
// ==========================================
export const patientApi = {
  getProfile: async (): Promise<PatientProfileData> => {
    const response = await apiClient.get<{ success: boolean; data: PatientProfileData }>('/patient/profile');
    return response.data.data;
  },

  updateSettings: async (payload: Partial<PatientProfileData>): Promise<PatientProfileData> => {
    const response = await apiClient.put<{ success: boolean; data: PatientProfileData }>('/patient/settings', payload);
    return response.data.data;
  },
};

// ==========================================
// 3. DIAGNOSIS & AI SCAN SERVICE
// ==========================================
export const diagnosesApi = {
  /**
   * Uploads skin lesion image and runs AI prediction model.
   */
  processScan: async (imageUri: string, tta: boolean = true): Promise<DiagnosisResult> => {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      let blob: Blob;
      if (imageUri.startsWith('data:')) {
        const parts = imageUri.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const binary = atob(parts[1]);
        const array = [];
        for (let i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
        blob = new Blob([new Uint8Array(array)], { type: mime });
      } else {
        const res = await fetch(imageUri);
        blob = await res.blob();
      }
      formData.append('file', blob, 'lesion_scan.jpg');
    } else {
      // On React Native Mobile
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'lesion_scan.jpg',
      } as any);
    }

    formData.append('tta', tta ? 'true' : 'false');

    const response = await apiClient.post<{ success: boolean; data: DiagnosisResult }>('/diagnoses/process', formData);

    if (response.data?.data?.status === 'failed') {
      throw new Error(response.data.data.error_message || 'AI Diagnosis engine timed out or failed.');
    }

    return response.data.data;
  },

  /**
   * Uploads skin lesion image, runs AI inference, and generates Grad-CAM heatmap overlay.
   */
  explainScan: async (imageUri: string, alpha: number = 0.45): Promise<DiagnosisResult> => {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      let blob: Blob;
      if (imageUri.startsWith('data:')) {
        const parts = imageUri.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const binary = atob(parts[1]);
        const array = [];
        for (let i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
        blob = new Blob([new Uint8Array(array)], { type: mime });
      } else {
        const res = await fetch(imageUri);
        blob = await res.blob();
      }
      formData.append('file', blob, 'lesion_scan.jpg');
    } else {
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'lesion_scan.jpg',
      } as any);
    }

    formData.append('alpha', alpha.toString());

    const response = await apiClient.post<{ success: boolean; data: DiagnosisResult }>('/diagnoses/explain', formData);

    if (response.data?.data?.status === 'failed') {
      throw new Error(
        response.data.data.error_message ||
        'AI Model server is currently warming up on Railway. Please try again in 10-15 seconds.'
      );
    }

    return response.data.data;
  },

  /**
   * Retrieves paginated scan history.
   */
  getHistory: async (params?: {
    per_page?: number;
    status?: string;
    predicted_class?: string;
  }): Promise<DiagnosisHistoryResponse> => {
    const response = await apiClient.get<{ success: boolean; data: DiagnosisHistoryResponse }>('/diagnoses/history', {
      params: {
        per_page: params?.per_page || 15,
        status: params?.status,
        predicted_class: params?.predicted_class,
      },
    });
    return response.data.data;
  },

  /**
   * Retrieves single scan by ID.
   */
  getScan: async (id: number | string): Promise<DiagnosisResult> => {
    const response = await apiClient.get<{ success: boolean; data: DiagnosisResult }>(`/diagnoses/${id}`);
    return response.data.data;
  },

  /**
   * Deletes a scan by ID.
   */
  deleteScan: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/diagnoses/${id}`);
  },
};

// ==========================================
// 4. DASHBOARD DOMAIN SERVICE
// ==========================================
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats');
    return response.data.data;
  },
};

// ==========================================
// 5. AI OPERATIONAL INFO
// ==========================================
export const aiApi = {
  getInfo: async (): Promise<any> => {
    const response = await apiClient.get('/ai/info');
    return response.data;
  },
};
