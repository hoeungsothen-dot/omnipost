import axios from 'axios';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';

// Use VITE_API_URL env var in production, fall back to relative /api for local dev
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Something went wrong';
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    } else if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
      // Backend not connected — silently fail for static preview
      console.warn('Backend not reachable:', BASE_URL);
    } else {
      toast.error(msg);
    }
    return Promise.reject(new Error(msg));
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const contentAPI = {
  list: (params) => api.get('/content', { params }),
  get: (id) => api.get(`/content/${id}`),
  create: (data) => api.post('/content', data),
  update: (id, data) => api.patch(`/content/${id}`, data),
  delete: (id) => api.delete(`/content/${id}`),
  publish: (id) => api.post(`/content/${id}/publish`),
  calendar: (params) => api.get('/content/view/calendar', { params }),
};

export const platformAPI = {
  list: () => api.get('/platforms'),
  connect: (platform, data) => api.post(`/platforms/${platform}/connect`, data),
  disconnect: (platform) => api.delete(`/platforms/${platform}/disconnect`),
};

export const analyticsAPI = {
  overview: (params) => api.get('/analytics/overview', { params }),
  timeseries: (params) => api.get('/analytics/timeseries', { params }),
  topContent: (params) => api.get('/analytics/top-content', { params }),
};

export const aiAPI = {
  captions: (data) => api.post('/ai/captions', data),
  hashtags: (data) => api.post('/ai/hashtags', data),
  ideas: (data) => api.post('/ai/ideas', data),
  bestTimes: (data) => api.post('/ai/best-times', data),
  chat: (data) => api.post('/ai/chat', data),
};

export const uploadAPI = {
  upload: (files, onProgress) => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    return api.post('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: e => onProgress?.(Math.round((e.loaded / e.total) * 100)),
    });
  },
};

export default api;
