import axios from 'axios';

const API_URL = 'https://studysync-oi6p.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data)
};

// Groups API
export const groupsAPI = {
  getAll: () => api.get('/groups'),
  getMyGroups: () => api.get('/groups/my-groups'),
  create: (data) => api.post('/groups', data),
  join: (id) => api.post(`/groups/${id}/join`),
  updateProgress: (id, progress) => api.patch(`/groups/${id}/progress`, { progress })
};

// Notes API
export const notesAPI = {
  getAll: (params) => api.get('/notes', { params }),
  getOne: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`)
};

// Sessions API
export const sessionsAPI = {
  getAll: (params) => api.get('/sessions', { params }),
  create: (data) => api.post('/sessions', data),
  join: (id) => api.post(`/sessions/${id}/join`)
};

// Progress API
export const progressAPI = {
  getMyProgress: () => api.get('/progress/me')
};

export default api;