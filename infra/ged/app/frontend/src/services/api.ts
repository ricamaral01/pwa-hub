import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/unificado/ged';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
});
let unifiedRefresh: Promise<string> | null = null;

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ged_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const isLogin = error.config?.url?.includes('/auth/login');
      const isUnifiedSession = error.config?.url?.includes('/auth/unified-session');
      if (!isLogin && !isUnifiedSession) {
        const embedded = window.self !== window.top &&
          (sessionStorage.getItem('ged_embed') === '1' ||
           new URLSearchParams(window.location.search).get('embed') === '1');
        if (embedded) {
          const config = error.config as typeof error.config & { _unifiedRetried?: boolean };
          if (config && !config._unifiedRetried) {
            config._unifiedRetried = true;
            if (!unifiedRefresh) {
              unifiedRefresh = api.get('/auth/unified-session', {withCredentials:true})
                .then(response => {
                  const {token,user} = response.data;
                  if (!token || !user) throw new Error('Sessão GED inválida.');
                  localStorage.setItem('ged_token', token);
                  localStorage.setItem('ged_user', JSON.stringify(user));
                  return token as string;
                }).finally(() => { unifiedRefresh = null; });
            }
            try {
              const token = await unifiedRefresh;
              config.headers.Authorization = `Bearer ${token}`;
              return api.request(config);
            } catch { /* Show the access state inside the shell. */ }
          }
          localStorage.removeItem('ged_token');
          localStorage.removeItem('ged_user');
          window.dispatchEvent(new Event('ged-embedded-access-denied'));
          return Promise.reject(error);
        }
        localStorage.removeItem('ged_token');
        localStorage.removeItem('ged_user');
        window.location.href = '/unificado/ged/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  unifiedSession: () => api.get('/auth/unified-session', {withCredentials: true}),
  logout: () => api.post('/auth/logout'),
  changePassword: (data: object) => api.post('/auth/change-password', data),
};

export const usersApi = {
  list: (params?: object) => api.get('/users', { params }),
  options: () => api.get('/users/options'),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: object) => api.post('/users', data),
  update: (id: string, data: object) => api.put(`/users/${id}`, data),
  resetPassword: (id: string, password: string) => api.patch(`/users/${id}/password`, { password }),
  remove: (id: string) => api.delete(`/users/${id}`),
};

export const documentsApi = {
  list: (params?: object) => api.get('/documents', { params }),
  stats: () => api.get('/documents/stats'),
  statsByArea: () => api.get('/documents/stats/area'),
  expiring: () => api.get('/documents/expiring'),
  getById: (id: string) => api.get(`/documents/${id}`),
  create: (data: object) => api.post('/documents', data),
  update: (id: string, data: object) => api.put(`/documents/${id}`, data),
  remove: (id: string) => api.delete(`/documents/${id}`),
  publish: (id: string) => api.post(`/documents/${id}/publish`),
  makeObsolete: (id: string) => api.post(`/documents/${id}/obsolete`),
  getVersions: (id: string) => api.get(`/documents/${id}/versions`),
  getOfficePreview: (id: string, versionId: string) =>
    api.get<{ url: string; expires_at: string }>(`/documents/${id}/versions/${versionId}/preview-link`),
  uploadVersion: (id: string, file: File, validUntil?: string, changeSummary?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (validUntil) formData.append('valid_until', validUntil);
    if (changeSummary) formData.append('change_summary', changeSummary);
    return api.post(`/documents/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const approvalsApi = {
  getPending: () => api.get('/approvals/pending'),
  getAll: () => api.get('/approvals'),
  approve: (versionId: string, comments?: string) =>
    api.post(`/approvals/${versionId}/approve`, { comments }),
  reject: (versionId: string, comments?: string) =>
    api.post(`/approvals/${versionId}/reject`, { comments }),
};

export const readLogsApi = {
  confirm: (document_id: string, version_id: string) =>
    api.post('/read-logs', { document_id, version_id }),
  getLogs: (documentId: string) => api.get(`/read-logs/${documentId}`),
  myStatus: (documentId: string) => api.get(`/read-logs/${documentId}/my-status`),
};

export const rncApi = {
  mode: () => api.get<{ readonly: boolean }>('/rnc/mode'),
  users: () => api.get('/rnc/users/options'),
  list: (params?: object) => api.get('/rnc', { params }),
  getById: (id: string) => api.get(`/rnc/${id}`),
  create: (data: object) => api.post('/rnc', data),
  triage: (id: string, data: object) => api.patch(`/rnc/${id}/triage`, data),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.patch(`/rnc/${id}/status`, { status, notes }),
  upsertRootCause: (id: string, data: object) => api.put(`/rnc/${id}/root-cause`, data),
  addAction: (id: string, data: object) => api.post(`/rnc/${id}/actions`, data),
  updateAction: (id: string, actionId: string, data: object) =>
    api.patch(`/rnc/${id}/actions/${actionId}`, data),
  reviewEffectiveness: (id: string, data: object) => api.post(`/rnc/${id}/effectiveness`, data),
  close: (id: string, conclusion_summary?: string) => api.post(`/rnc/${id}/close`, { conclusion_summary }),
  reopen: (id: string, reason?: string) => api.post(`/rnc/${id}/reopen`, { reason }),
  comment: (id: string, comment: string) => api.post(`/rnc/${id}/comments`, { comment }),
  uploadAttachment: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/rnc/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const tasksApi = {
  users: () => api.get('/tasks/users/options'),
  dashboard: () => api.get('/tasks/dashboard'),
  list: (params?: object) => api.get('/tasks', { params }),
  getById: (id: string) => api.get(`/tasks/${id}`),
  create: (data: object) => api.post('/tasks', data),
  update: (id: string, data: object) => api.put(`/tasks/${id}`, data),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.patch(`/tasks/${id}/status`, { status, notes }),
  updateResponsible: (id: string, responsible_id: string) =>
    api.patch(`/tasks/${id}/responsible`, { responsible_id }),
  updateDueDate: (id: string, due_date?: string) =>
    api.patch(`/tasks/${id}/due-date`, { due_date }),
  comment: (id: string, comment: string) => api.post(`/tasks/${id}/comments`, { comment }),
  addParticipant: (id: string, user_id: string) => api.post(`/tasks/${id}/participants`, { user_id }),
  removeParticipant: (id: string, userId: string) => api.delete(`/tasks/${id}/participants/${userId}`),
  linkDocument: (id: string, document_id: string) => api.post(`/tasks/${id}/documents`, { document_id }),
  unlinkDocument: (id: string, documentId: string) => api.delete(`/tasks/${id}/documents/${documentId}`),
  cancel: (id: string, notes?: string) => api.post(`/tasks/${id}/cancel`, { notes }),
  uploadAttachment: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/tasks/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const calibrationsApi = {
  list: (params?: object) => api.get('/calibrations', { params }),
  stats: () => api.get('/calibrations/stats'),
  publicVerify: (id: string) => axios.get(`${API_URL}/api/calibrations/public/${id}`),
  create: (data: FormData) => api.post('/calibrations', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) => api.put(`/calibrations/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id: string) => api.delete(`/calibrations/${id}`),
};

export default api;
