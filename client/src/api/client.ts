import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';

const TOKEN_KEY = 'lucky_shop_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}


// ── Type helpers for unwrapped axios responses ──
export interface ApiResponseWrapper<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
  error?: { code: string; message: string; details?: unknown };
}

export const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});



// ── Idempotency Key ──
export function generateIdempotencyKey(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
}
// ── CSRF Token ──
let csrfToken: string | null = null;

export async function fetchCsrfToken(): Promise<string> {
  const res = await http.get('/csrf-token');
  csrfToken = (res.data as unknown as { csrfToken: string }).csrfToken;
  return csrfToken;
}
// 请求拦截器
http.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase()) && csrfToken) {
      config.headers['x-csrf-token'] = csrfToken;
      // Attach idempotency key for write operations (if not already set)
      if (!config.headers['idempotency-key']) {
        config.headers['idempotency-key'] = generateIdempotencyKey();
      }
    }
    return config;
  },
  (err) => Promise.reject(err),
);

// ── CSRF retry state ──
let isRefreshingCsrf = false;
let csrfRefreshPromise: Promise<string> | null = null;

async function refreshCsrfAndRetry(err: AxiosError): Promise<unknown> {
  if (!isRefreshingCsrf) {
    isRefreshingCsrf = true;
    csrfRefreshPromise = fetchCsrfToken().finally(() => {
      isRefreshingCsrf = false;
      csrfRefreshPromise = null;
    });
  }
  const newToken = await csrfRefreshPromise;
  // Retry the original request with new CSRF token
  if (err.config) {
    err.config.headers['x-csrf-token'] = newToken;
    return http.request(err.config);
  }
  return Promise.reject(err);
}

// 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (err: AxiosError<{ error?: { code: string; message: string } }>) => {
    const code = err.response?.data?.error?.code;
    const message = err.response?.data?.error?.message || err.message;

    if (err.response?.status === 401) {
      clearToken();
      if (!location.pathname.startsWith('/login')) {
        location.href = '/login?redirect=' + encodeURIComponent(location.pathname);
      }
    }

    // Auto-retry on CSRF token expiry
    if (err.response?.status === 403 && code === 'A4003') {
      return refreshCsrfAndRetry(err);
    }

    return Promise.reject({ code: code || 'A5000', message, status: err.response?.status });
  },
);

export async function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  return http.request(config) as unknown as T;
}
