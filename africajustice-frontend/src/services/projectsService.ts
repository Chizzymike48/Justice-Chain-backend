import api from './api'

export interface ProjectPayload {
  title: string
  description: string
  budget: number
  agency: string
  location?: string
  progress?: number
  status?: string
}

export interface ProjectRecord extends ProjectPayload {
  id: string
  createdAt?: string
  updatedAt?: string
}

export const projectsService = {
  getProjects: async (): Promise<ProjectRecord[]> => {
    const response = await api.get<{ success: boolean; data: ProjectRecord[] }>('/projects')
    return response.data.data
  },
  createProject: async (payload: ProjectPayload): Promise<ProjectRecord> => {
    const response = await api.post<{ success: boolean; data: ProjectRecord }>('/projects', payload)
    return response.data.data
  },
}

export default projectsService
