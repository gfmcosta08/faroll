import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8001' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('fox_token')
  if (token && cfg.headers) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fox_token')
      localStorage.removeItem('fox_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
