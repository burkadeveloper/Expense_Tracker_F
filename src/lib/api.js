import axios from 'axios'

// Use relative path so Vite dev proxy forwards to backend (avoids CORS/cookie issues)
const baseURL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// ---- Token management ----
let accessToken = null
let isRefreshing = false
let refreshSubscribers = []

export function setAccessToken(token) {
  accessToken = token
  if (token) localStorage.setItem('accessToken', token)
  else localStorage.removeItem('accessToken')
}

export function getAccessToken() {
  if (!accessToken) accessToken = localStorage.getItem('accessToken')
  return accessToken
}

// Initialize from storage
accessToken = localStorage.getItem('accessToken')

function subscribeRefresh(cb) {
  refreshSubscribers.push(cb)
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

// Request interceptor — attach Authorization header
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — handle 401, auto-refresh once
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url.includes('/auth/')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeRefresh((token) => {
            if (!token) return reject(error)
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }
      original._retry = true
      isRefreshing = true
      try {
        const { data } = await api.post('/auth/refresh')
        const newToken = data.data.accessToken
        setAccessToken(newToken)
        onRefreshed(newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshErr) {
        onRefreshed(null)
        setAccessToken(null)
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

/** Unwrap the standard envelope { success, data, message, errors } */
export function unwrap(res) {
  return res.data?.data
}

/** Extract user-facing error message from any axios error */
export function errMsg(err) {
  return (
    err.response?.data?.message ||
    err.response?.data?.errors?.[0]?.message ||
    err.message ||
    'Something went wrong'
  )
}

export default api
