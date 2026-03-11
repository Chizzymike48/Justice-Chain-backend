import axios from 'axios'

const FALLBACK_API_URL = 'http://localhost:5000/api/v1'

const normalizeApiBaseUrl = (value?: string): string => {
  const raw = value?.trim()
  const base = raw && raw.length > 0 ? raw : FALLBACK_API_URL
  const trimmed = base.replace(/\/+$/, '')

  if (/\/api\/v\d+$/i.test(trimmed)) {
    return trimmed
  }

  if (/\/api$/i.test(trimmed)) {
    return `${trimmed}/v1`
  }

  return `${trimmed}/api/v1`
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL as string | undefined)
const AUTH_TOKEN_KEY = 'authToken'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
