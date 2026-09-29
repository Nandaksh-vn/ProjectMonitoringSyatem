import axios from 'axios';

// Backend runs at http://localhost:8080 with context path /api
// Vite proxy maps /api → http://localhost:8080  (so /api/v1/... hits /api/v1/...)
const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

const mlApi = axios.create({
  baseURL: import.meta.env.VITE_ML_API_URL || 'http://localhost:8000',
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
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  logout: () => {
    localStorage.removeItem('infrawatch_token');
    localStorage.removeItem('infrawatch_user');
  },
};

// ─── Public ───────────────────────────────────────────────────────────────────
export const publicService = {
  getStats: () => api.get('/public/stats'),
  getReport: () => api.get('/public/reports'),
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
  update: (id, data) => api.put(`/projects/${id}`, data),
  remove: (id) => api.delete(`/projects/${id}`),
  getMonthlyData: (id) => api.get(`/projects/${id}/monthly-data`),
  getMilestones: (id) => api.get(`/projects/${id}/milestones`),
  getRiskFactors: (id) => api.get(`/projects/${id}/risk-factors`),
  getPredictions: (id) => api.get(`/projects/${id}/predictions`),
  getAlerts: (id) => api.get(`/projects/${id}/alerts`),
  getRecommendations: (id) => api.get(`/projects/${id}/recommendations`),
};

// ─── Predictions ─────────────────────────────────────────────────────────────
export const predictionService = {
  getByProject: (id) => api.get(`/projects/${id}/predictions`),
  getLatest: (projectId) => api.get(`/predictions/project/${projectId}`),
  getLatestPerProject: () => api.get('/predictions/latest'),
  getRiskFactors: (predictionId) => api.get(`/predictions/${predictionId}/risk-factors`),
  getLatestRiskFactors: (projectId) => api.get(`/predictions/project/${projectId}/latest-risk-factors`),
  // Server-side proxy to the ML service, so the browser never calls port 8000.
  getModelPerformance: () => api.get('/predictions/model-performance'),
  getModelVersions: () => api.get('/predictions/model-versions'),
  // Re-runs the ML pipeline and persists fresh predictions and risk factors.
  syncProject: (projectId) => api.post(`/predictions/project/${projectId}/sync`),
  syncAll: () => api.post('/predictions/sync'),
  preview: (features) => api.post('/predictions/preview', features),
};

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const alertService = {
  getAll: () => api.get('/alerts'),
  getByProject: (id) => api.get(`/alerts/project/${id}`),
  resolve: (id) => api.patch(`/alerts/${id}/resolve`),
  runRules: () => api.post('/alerts/run'),
};

// ─── Reference data (ministries / sectors / agencies) ─────────────────────────
export const referenceService = {
  getAll: () => api.get('/reference/all'),
  getMinistries: () => api.get('/reference/ministries'),
  getSectors: () => api.get('/reference/sectors'),
  getAgencies: (ministryId) =>
    api.get('/reference/agencies', { params: ministryId ? { ministryId } : {} }),
};

// ─── Recommendations ─────────────────────────────────────────────────────────
export const recommendationService = {
  getAll: () => api.get('/recommendations'),
  getByProject: (id) => api.get(`/projects/${id}/recommendations`),
  recordAction: (id, actionTaken, details) =>
    api.patch(`/recommendations/${id}/action`, { actionTaken, details }),
};

// ─── Data import ─────────────────────────────────────────────────────────────
export const uploadService = {
  getTemplate: () => api.get('/data/upload/template'),
  uploadProjects: (file, dryRun = false) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/data/upload/projects', form, { params: { dryRun }, headers: multipartHeaders() });
  },
  uploadMonthlyData: (file, projectId, dryRun = false) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/data/upload/monthly-data', form, {
      params: { projectId, dryRun },
      headers: multipartHeaders(),
    });
  },
  uploadPredictions: (file, projectId = null, dryRun = false) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/data/upload/predictions', form, {
      params: { projectId, dryRun },
      headers: multipartHeaders(),
    });
  },
};

// axios sets its own multipart boundary; forcing JSON here corrupts the upload.
function multipartHeaders() {
  return { 'Content-Type': 'multipart/form-data' };
}

// ─── AI Assistant ───────────────────────────────────────────────────────────
export const assistantService = {
  chat: (data) => api.post('/assistant/chat', data),
};

// ─── Health ───────────────────────────────────────────────────────────────────
export const getBackendHealth = () =>
  api.get('/health').then((r) => r.data).catch(() => ({ status: 'DOWN' }));
export const getMlServiceHealth = () =>
  api.get('/health/ml').then((r) => r.data).catch(() => ({ status: 'DOWN' }));

export default api;
