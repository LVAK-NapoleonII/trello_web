import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/admin',
  headers: { 'Content-Type': 'application/json' }
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  config.headers['Pragma'] = 'no-cache';
  config.headers['Expires'] = '0';

  if (config.params) {
    config.params._ = Date.now();
  } else {
    config.params = { _: Date.now() };
  }

  return config;
});

export const adminApi = {
  getStats: () => API.get('/dashboard/stats'),
  getUsers: (params) => API.get('/users', { params }),
  getUser: (id) => API.get(`/users/${id}`),
  updateAdmin: (id, isAdmin) => API.put(`/users/${id}/admin`, { isAdmin }),
  banUser: (id, reason, duration) => API.post(`/users/${id}/ban`, { reason, duration }),
  unbanUser: (id) => API.post(`/users/${id}/unban`),
  deleteUser: (id, permanent) => API.delete(`/users/${id}`, { data: { permanent } }),
  restoreUser: (id) => API.post(`/users/${id}/restore`),

  getWorkspaces: (params) => API.get('/workspaces', { params }),
  getWorkspace: (id) => API.get(`/workspaces/${id}`),
  deleteWorkspace: (id, permanent) => API.delete(`/workspaces/${id}`, { data: { permanent } }),
  restoreWorkspace: (id) => API.post(`/workspaces/${id}/restore`),

  getBoards: (params) => API.get('/boards', { params }),
  getBoard: (id) => API.get(`/boards/${id}`),
  deleteBoard: (id, permanent) => API.delete(`/boards/${id}`, { data: { permanent } }),
  restoreBoard: (id) => API.post(`/boards/${id}/restore`),

  getInactiveUsers: (days) => API.get('/users/inactive/list', { params: { days } }),
  sendInactivityNotices: () => API.post('/users/inactive/notify'),
  deleteInactiveUsers: () => API.post('/users/inactive/delete'),

  getActivityLogs: (params) => API.get('/logs', { params })
};