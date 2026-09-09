/**
 * Axios instance with interceptors for JWT auth, token refresh,
 * and automatic failover between Render (primary) and localhost (fallback).
 */
import axios from 'axios';
import { PRIMARY_API_URL, FALLBACK_API_URL } from '../utils/constants';

// Start with Render as primary backend; failover to localhost if Render is unreachable
let currentBaseURL = PRIMARY_API_URL;

const api = axios.create({
  baseURL: `${currentBaseURL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // 45s timeout to allow for Render free tier cold starts
});

/**
 * Request interceptor — ensure active baseURL and attach JWT token.
 */
api.interceptors.request.use(
  (config) => {
    config.baseURL = `${currentBaseURL}/api`;
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor — handle failover and 401 token refresh.
 */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ─── Automatic Failover: Render → Localhost ──────────────────────────────
    // If Render is offline, returning 502 Bad Gateway, cold-starting with a timeout,
    // or has a network error, automatically fallback to the local backend server.
    const isUnreachable =
      !error.response ||
      error.response.status === 502 ||
      error.response.status === 503 ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('Network Error');

    if (
      isUnreachable &&
      originalRequest &&
      !originalRequest._fallbackTried &&
      currentBaseURL !== FALLBACK_API_URL
    ) {
      console.warn(
        `[API Failover] Primary backend (${currentBaseURL}) returned error (status: ${error.response?.status || error.code}). Automatically trying local backend (${FALLBACK_API_URL}).`
      );
      originalRequest._fallbackTried = true;
      currentBaseURL = FALLBACK_API_URL;
      api.defaults.baseURL = `${FALLBACK_API_URL}/api`;
      originalRequest.baseURL = `${FALLBACK_API_URL}/api`;
      return api(originalRequest);
    }

    // ─── Token Refresh: 401 Unauthorized ─────────────────────────────────────
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        // No refresh token — force logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${currentBaseURL}/api/auth/refresh`, {
          refresh_token: refreshToken,
        });

        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);

        api.defaults.headers.Authorization = `Bearer ${data.access_token}`;
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;

        processQueue(null, data.access_token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const getCurrentBackendUrl = () => currentBaseURL;
export default api;
