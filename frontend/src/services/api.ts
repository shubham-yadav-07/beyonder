import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  })

  // Attach token
  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  // Handle 401 – try refresh, else logout.
  // Auth endpoints (login/register/refresh) are excluded: a 401 there means
  // "bad credentials" or "expired refresh token", not "session expired" —
  // those should surface as inline errors, not trigger a redirect/reload.
  const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh']

  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config as AxiosRequestConfig & { _retry?: boolean }
      const isAuthEndpoint = AUTH_ENDPOINTS.some(p => original?.url?.includes(p))

      if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
        original._retry = true
        const refreshToken = useAuthStore.getState().refreshToken
        if (refreshToken) {
          try {
            const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
              refresh_token: refreshToken,
            })
            useAuthStore.getState().setToken(data.access_token)
            if (original.headers) original.headers.Authorization = `Bearer ${data.access_token}`
            return client(original)
          } catch {
            useAuthStore.getState().logout()
            window.location.href = '/login'
          }
        } else {
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
  )

  return client
}

export const api = createClient()

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  me: () => api.get('/auth/me'),
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/auth/change-password', data),
  refresh: (token: string) => api.post('/auth/refresh', { refresh_token: token }),
}

// ── Threats ───────────────────────────────────────────────────────────────────
export const threatsApi = {
  list: (params?: { level?: string; status?: string; limit?: number; skip?: number }) =>
    api.get('/threats/', { params }),
  get: (id: string) => api.get(`/threats/${id}`),
  scan: () => api.post('/threats/scan'),
  analyze: (path: string, file_hash?: string) =>
    api.post('/threats/analyze', { path, file_hash }),
  quarantine: (id: string) => api.put(`/threats/${id}/quarantine`),
  resolve: (id: string) => api.put(`/threats/${id}/resolve`),
  score: () => api.get('/threats/summary/score'),
  history: () => api.get('/threats/summary/history'),
}

// ── Backup ────────────────────────────────────────────────────────────────────
export const backupApi = {
  list: () => api.get('/backup/'),
  create: (data: { name: string; type: string; paths?: string[] }) =>
    api.post('/backup/', data),
  restore: (id: string) => api.post(`/backup/${id}/restore`),
  validate: (id: string) => api.get(`/backup/${id}/validate`),
  stats: () => api.get('/backup/stats'),
  recoveryLogs: () => api.get('/backup/recovery-logs'),
  recoveryLog: (id: string) => api.get(`/backup/recovery-logs/${id}`),
}

// ── Monitor ───────────────────────────────────────────────────────────────────
export const monitorApi = {
  list: () => api.get('/monitor/'),
  add: (path: string, label?: string) => api.post('/monitor/', { path, label }),
  remove: (id: string) => api.delete(`/monitor/${id}`),
  scan: (id: string) => api.post(`/monitor/${id}/scan`),
  events: (params?: { limit?: number; folder_id?: string }) => api.get('/monitor/events', { params }),
  status: () => api.get('/monitor/status'),
}

// ── Blockchain ────────────────────────────────────────────────────────────────
export const blockchainApi = {
  logs: (params?: { limit?: number; severity?: string }) =>
    api.get('/blockchain/logs', { params }),
  stats: () => api.get('/blockchain/stats'),
  verify: () => api.get('/blockchain/verify'),
  exportCsv: () => api.get('/blockchain/export', { responseType: 'blob' }),
}

// ── Mother AI ─────────────────────────────────────────────────────────────────
export const aiApi = {
  chat: (message: string, history: Array<{ role: string; content: string }> = []) =>
    api.post('/mother-ai/chat', { message, history }),
  stats: () => api.get('/mother-ai/stats'),
  patterns: (days?: number) => api.get('/mother-ai/patterns', { params: { days } }),
  predict: (days?: number) => api.get('/mother-ai/predict', { params: { days } }),
  similar: (threatId: string) => api.get(`/mother-ai/similar/${threatId}`),
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: (unread_only?: boolean) =>
    api.get('/notifications/', { params: { unread_only } }),
  count: () => api.get('/notifications/count'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
}
