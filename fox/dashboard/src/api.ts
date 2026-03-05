import axios from 'axios'
import { supabase } from './lib/supabase'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8001'
const api = axios.create({ baseURL })

// Injeta o JWT do Supabase em cada requisição
api.interceptors.request.use(async cfg => {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (token && cfg.headers) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      supabase.auth.signOut()
      window.location.href = '/app/imoveis/login'
    }
    return Promise.reject(err)
  }
)

export default api
