import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api, { setAccessToken, getAccessToken, unwrap, errMsg } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      // Try a silent refresh in case we have a valid cookie but no access token
      try {
        const { data } = await api.post('/auth/refresh')
        setAccessToken(data.data.accessToken)
        setUser(data.data.user)
      } catch {
        setUser(null)
      }
      return
    }
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.data.user)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await fetchMe()
      setLoading(false)
    })()
  }, [fetchMe])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { user, accessToken } = res.data.data
    setAccessToken(accessToken)
    setUser(user)
    return user
  }

  const register = async (name, email, password, consent) => {
    const res = await api.post('/auth/register', { name, email, password, consent })
    const { user, accessToken } = res.data.data
    setAccessToken(accessToken)
    setUser(user)
    return user
  }

  const phoneRequestOtp = async (phone, purpose = 'login') => {
    await api.post('/auth/phone/request-otp', { phone, purpose })
  }

  const phoneVerifyOtp = async (phone, code, purpose = 'login') => {
    const res = await api.post('/auth/phone/verify-otp', { phone, code, purpose })
    const { user, accessToken } = res.data.data
    setAccessToken(accessToken)
    setUser(user)
    return user
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      /* ignore */
    }
    setAccessToken(null)
    setUser(null)
  }

  const logoutAll = async () => {
    try {
      await api.post('/auth/logout-all')
    } catch {
      /* ignore */
    }
    setAccessToken(null)
    setUser(null)
  }

  const updateUser = (updated) => setUser(updated)

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        phoneRequestOtp,
        phoneVerifyOtp,
        logout,
        logoutAll,
        fetchMe,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
