import api, { API_BASE_URL } from './api'

interface LoginUser {
  id: string
  email: string
  name: string
  role: string
}

interface LoginResult {
  token: string
  user: LoginUser
}

interface SignupData {
  name: string
  email: string
  password: string
}

interface ApiErrorResponse {
  message?: string
  errors?: Array<{ field: string; message: string }>
}

const getAuthErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    if ('response' in error && error.response && typeof error.response === 'object') {
      const response = error.response as { data?: ApiErrorResponse }
      if (response.data?.errors && response.data.errors.length > 0) {
        const details = response.data.errors.map((err) => `${err.field}: ${err.message}`).join(', ')
        return `Validation failed: ${details}`
      }
      if (response.data?.message) {
        return response.data.message
      }
    }

    if ('code' in error && error.code === 'ERR_NETWORK') {
      return `Unable to reach the backend at ${API_BASE_URL}.`
    }

    if (error.message === 'Network Error') {
      return `Unable to reach the backend at ${API_BASE_URL}.`
    }

    return error.message
  }

  return fallback
}

export const authService = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post<{ success: boolean; data: LoginResult }>('/auth/login', { email, password })
      return response.data.data
    } catch (error: unknown) {
      throw new Error(getAuthErrorMessage(error, 'Login failed. Please verify your credentials or backend connection.'))
    }
  },
  
  signup: async (data: SignupData) => {
    try {
      const response = await api.post<{ success: boolean; data: LoginResult }>('/auth/register', data)
      return response.data.data
    } catch (error: unknown) {
      throw new Error(getAuthErrorMessage(error, 'Signup failed. Please try again.'))
    }
  },
  
  logout: async () => {
    try {
      const response = await api.post<{ success: boolean; message: string }>('/auth/logout')
      return response.data
    } catch (error: unknown) {
      throw new Error(getAuthErrorMessage(error, 'Logout failed. Please try again.'))
    }
  },
}

export default authService
