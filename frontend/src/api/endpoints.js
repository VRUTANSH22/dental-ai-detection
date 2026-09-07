/**
 * API endpoint functions — all REST calls organized by domain.
 * Each function returns the Axios promise.
 */
import api from './axios';

/* ═══════════════════════ AUTH ═══════════════════════ */

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: (refreshToken) => api.post('/auth/logout', { refresh_token: refreshToken }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
};

/* ═══════════════════════ PATIENT ═══════════════════════ */

export const patientAPI = {
  getProfile: () => api.get('/patient/profile'),
  updateProfile: (data) => api.put('/patient/profile', data),
  uploadAvatar: (formData) =>
    api.post('/patient/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getPredictions: (params) => api.get('/patient/predictions', { params }),
  getDashboardStats: () => api.get('/patient/dashboard/stats'),
};

/* ═══════════════════════ PREDICTION ═══════════════════════ */

export const predictionAPI = {
  predict: (formData) =>
    api.post('/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 60s for AI inference
    }),
  getById: (id) => api.get(`/predictions/${id}`),
  delete: (id) => api.delete(`/predictions/${id}`),
};

/* ═══════════════════════ APPOINTMENTS ═══════════════════════ */

export const appointmentAPI = {
  book: (data) => api.post('/appointments', data),
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  cancel: (id) => api.delete(`/appointments/${id}`),
  getAvailableDoctors: () => api.get('/appointments/available-doctors'),
};

/* ═══════════════════════ DOCTOR ═══════════════════════ */

export const doctorAPI = {
  getPatients: (params) => api.get('/doctor/patients', { params }),
  getPatientPredictions: (patientId) => api.get(`/doctor/patients/${patientId}/predictions`),
  reviewPrediction: (predictionId, data) =>
    api.put(`/doctor/predictions/${predictionId}/review`, data),
  getAppointments: (params) => api.get('/doctor/appointments', { params }),
  getAnalytics: () => api.get('/doctor/analytics'),
};

/* ═══════════════════════ ADMIN ═══════════════════════ */

export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getAnalytics: () => api.get('/admin/analytics'),
  getPredictions: (params) => api.get('/admin/predictions', { params }),
  getContactMessages: (params) => api.get('/admin/contact-messages', { params }),
  markMessageRead: (messageId) => api.put(`/admin/contact-messages/${messageId}/read`),
};

/* ═══════════════════════ REPORTS ═══════════════════════ */

export const reportAPI = {
  downloadPdf: (predictionId) =>
    api.get(`/reports/${predictionId}/pdf`, { responseType: 'blob' }),
  getMyReports: () => api.get('/reports'),
  getDiseaseInfo: () => api.get('/reports/public/disease-info'),
  getSingleDiseaseInfo: (name) => api.get(`/reports/public/disease-info/${name}`),
};

/* ═══════════════════════ CONTACT ═══════════════════════ */

export const contactAPI = {
  submit: (data) => api.post('/contact', data),
};
