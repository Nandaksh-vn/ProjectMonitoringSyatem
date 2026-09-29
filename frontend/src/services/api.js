import axios from 'axios';

// Backend runs at http://localhost:8080 with context path /api
// Vite proxy maps /api → http://localhost:8080  (so /api/v1/... hits /api/v1/...)
const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

const mlApi = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// ─── JWT Interceptors ─────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('infrawatch_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('infrawatch_token');
      localStorage.removeItem('infrawatch_user');
      
      const path = window.location.pathname;
      const isPublic = path === '/' || path === '/login' || path.startsWith('/sectors') || path.startsWith('/projects');
      
      if (!isPublic) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  // Backend returns: { token, id, username, email, role }
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => {
    localStorage.removeItem('infrawatch_token');
    localStorage.removeItem('infrawatch_user');
  },
};

// ─── Public ───────────────────────────────────────────────────────────────────
export const publicService = {
  getStats: () => api.get('/public/stats'),
  getProjects: () => api.get('/public/projects'),
  getProjectById: (id) => api.get(`/public/projects/${id}`),
  getSectors: () => api.get('/public/sectors'),
  getMilestones: (id) => api.get(`/public/projects/${id}/milestones`),
  getPredictions: (id) => api.get(`/public/projects/${id}/predictions`)
};

// ─── Projects ────────────────────────────────────────────────────────────────
export const projectService = {
  getAll: (params) => api.get('/projects', { params: { size: 200, ...params } }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  getMonthlyData: (id) => api.get(`/projects/${id}/monthly-data`),
  getMilestones: (id) => api.get(`/projects/${id}/milestones`),
  getRiskFactors: (id) => api.get(`/projects/${id}/risk-factors`),
};

// ─── Predictions ─────────────────────────────────────────────────────────────
export const predictionService = {
  getByProject: (id) => api.get(`/projects/${id}/predictions`),
  getRiskFactors: (predictionId) => api.get(`/predictions/${predictionId}/risk-factors`),
};

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const alertService = {
  getAll: () => api.get('/alerts'),
  getByProject: (id) => api.get(`/alerts/project/${id}`),
  resolve: (id) => api.patch(`/alerts/${id}/resolve`),
};

// ─── Recommendations ─────────────────────────────────────────────────────────
export const recommendationService = {
  getAll: () => api.get('/recommendations'),
  getByProject: (id) => api.get(`/projects/${id}/recommendations`),
};

// ─── AI Assistant ───────────────────────────────────────────────────────────
export const assistantService = {
  chat: (data) => api.post('/assistant/chat', data),
};

// ─── ML Service ───────────────────────────────────────────────────────────────
export const mlService = {
  getHealth: () => mlApi.get('/health'),
  getModelPerformance: () => mlApi.get('/model-performance'),
  predict: (data) => mlApi.post('/predict', data),
};

// ─── Health ───────────────────────────────────────────────────────────────────
export const getBackendHealth = () =>
  axios.get('/api/health').then((r) => r.data).catch(() => ({ status: 'DOWN' }));
export const getMlServiceHealth = () =>
  mlApi.get('/health').then((r) => r.data).catch(() => ({ status: 'DOWN' }));

export default api;
