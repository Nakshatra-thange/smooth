import { apiClient } from './apiClient'

const api = {
  get: async <T = any>(...args: Parameters<typeof apiClient.get>) => {
    const res = await apiClient.get<T>(...args)
    return res.data
  },
  post: async <T = any>(...args: Parameters<typeof apiClient.post>) => {
    const res = await apiClient.post<T>(...args)
    return res.data
  },
  patch: async <T = any>(...args: Parameters<typeof apiClient.patch>) => {
    const res = await apiClient.patch<T>(...args)
    return res.data
  },
  delete: async <T = any>(...args: Parameters<typeof apiClient.delete>) => {
    const res = await apiClient.delete<T>(...args)
    return res.data
  }
}

export default api
