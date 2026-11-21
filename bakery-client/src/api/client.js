import axios from 'axios'

/**
 * In dev, Vite proxies /api → http://127.0.0.1:8000 (see vite.config.js).
 * In production, set VITE_API_URL to the deployed Laravel API URL.
 */
const baseURL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

/**
 * Attach the right bearer token to every request:
 * - Admin requests (/admin/*) use the admin token.
 * - Everything else (client reservations, auth) uses the client token.
 */
api.interceptors.request.use((config) => {
  const isAdminRequest = (config.url || '').startsWith('/admin')
  const token = isAdminRequest
    ? localStorage.getItem('admin_token')
    : localStorage.getItem('client_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
