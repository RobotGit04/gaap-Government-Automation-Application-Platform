import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api` 
    : '/api',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  profile: () => api.get('/auth/profile'),
};

// Applications
export const applicationAPI = {
  create: (type: string, agentId?: string) => api.post('/applications', { type, agentId }),
  getMyApplications: () => api.get('/applications/my'),
  getApplication: (id: string) => api.get(`/applications/${id}`),
  advance: (id: string, stepData?: any) => api.post(`/applications/${id}/advance`, { stepData }),
  submit: (id: string) => api.post(`/applications/${id}/submit`),
};

// KYC
export const kycAPI = {
  recordConsent: (purpose: string) => api.post('/kyc/consent', { purpose }),
  verifyAadhaar: (data: any) => api.post('/kyc/verify-aadhaar', data),
  verifyPAN: (data: any) => api.post('/kyc/verify-pan', data),
};

// Documents
export const documentAPI = {
  upload: (applicationId: string, documentType: string, file: File) => {
    const form = new FormData();
    form.append('document', file);
    form.append('applicationId', applicationId);
    form.append('documentType', documentType);
    return api.post('/documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getByApplication: (applicationId: string) => api.get(`/documents/application/${applicationId}`),
};

// eSign
export const esignAPI = {
  sendOTP: (applicationId: string, phone: string) => api.post('/esign/send-otp', { applicationId, phone }),
  verifyAndSign: (applicationId: string, phone: string, otp: string) =>
    api.post('/esign/verify-sign', { applicationId, phone, otp }),
};

// Admin
export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (page?: number) => api.get('/admin/users', { params: { page } }),
  applications: (page?: number, status?: string) => api.get('/admin/applications', { params: { page, status } }),
};

// Workflow
export const workflowAPI = {
  getTypes: () => api.get('/workflow/types'),
  getTemplate: (type: string) => api.get(`/workflow/template/${type}`),
};
