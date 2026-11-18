import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api, { setAccessToken } from '../lib/api'

export default function GoogleSuccess() {
  const { updateUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    ;(async () => {
      // Clear any stale access token so the refresh endpoint is always called.
      setAccessToken(null)
      try {
        // The backend set the rt cookie during the OAuth callback redirect.
        // Call /auth/refresh to exchange it for a new access token.
        const { data } = await api.post('/auth/refresh')
        setAccessToken(data.data.accessToken)
        updateUser(data.data.user)
        navigate('/')
      } catch {
        // Cookie didn't arrive — redirect to login with an error flag
        navigate('/login?error=google')
      }
    })()
  }, [])

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-white dark:bg-slate-950">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      <p className="text-sm text-slate-500">Completing Google sign-in…</p>
    </div>
  )
}

