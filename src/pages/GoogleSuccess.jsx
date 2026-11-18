import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function GoogleSuccess() {
  const { fetchMe } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    ;(async () => {
      // The backend set the refresh cookie. Now we call /auth/refresh to get an access token.
      try {
        await fetchMe()
      } catch {
        /* will redirect to login */
      }
      navigate('/')
    })()
  }, [])
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        <p className="text-slate-500">Completing Google sign-in…</p>
      </div>
    </div>
  )
}
