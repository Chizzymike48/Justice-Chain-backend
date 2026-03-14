import api from './api'

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

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post<{ success: boolean; data: LoginResult }>('/auth/login', { email, password })
    return response.data.data
  },
  
  signup: async (data: SignupData) => {
    const response = await api.post<{ success: boolean; data: LoginResult }>('/auth/register', data)
    return response.data.data
  },
  
  logout: async () => {
    const response = await api.post<{ success: boolean; message: string }>('/auth/logout')
    return response.data
  },
}

export default authService
