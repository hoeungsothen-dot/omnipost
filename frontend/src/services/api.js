import axios from 'axios';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';

const api = axios.create({ baseURL: '/api', timeout: 30000 });

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
    } else {
      toast.error(msg);
    }
    return Promise.reject(new Error(msg));
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Content
export const contentAPI = {
  list: (params) => api.get('/content', { params }),
  get: (id) => api.get(`/content/${id}`),
  create: (data) => api.post('/content', data),
  update: (id, data) => api.patch(`/content/${id}`, data),
  delete: (id) => api.delete(`/content/${id}`),
  publish: (id) => api.post(`/content/${id}/publish`),
  calendar: (params) => api.get('/content/view/calendar', { params }),
};

// Platforms
export const platformAPI = {
  list: () => api.get('/platforms'),
  connect: (platform, data) => api.post(`/platforms/${platform}/connect`, data),
  disconnect: (platform) => api.delete(`/platforms/${platform}/disconnect`),
};

// Analytics
export const analyticsAPI = {
  overview: (params) => api.get('/analytics/overview', { params }),
  timeseries: (params) => api.get('/analytics/timeseries', { params }),
  topContent: (params) => api.get('/analytics/top-content', { params }),
};

// AI
export const aiAPI = {
  captions: (data) => api.post('/ai/captions', data),
  hashtags: (data) => api.post('/ai/hashtags', data),
  ideas: (data) => api.post('/ai/ideas', data),
  bestTimes: (data) => api.post('/ai/best-times', data),
  chat: (data) => api.post('/ai/chat', data),
};

// Upload
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
