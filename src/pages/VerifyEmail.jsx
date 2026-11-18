import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { MailCheck, MailWarning, Loader2, ArrowLeft, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errMsg } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import GoogleIcon from '../components/GoogleIcon'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const [status, setStatus] = useState(token ? 'verifying' : 'prompt') // verifying | success | error | prompt
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!token) return
    ;(async () => {
      try {
        const res = await api.post('/auth/verify-email', { token })
        updateUser(res.data.data.user)
        setStatus('success')
        toast.success('Email verified successfully!')
        setTimeout(() => navigate('/'), 2500)
      } catch (err) {
        setStatus('error')
        toast.error(errMsg(err))
      }
    })()
  }, [token])

  const handleResend = async () => {
    setSending(true)
    try {
      await api.post('/auth/send-verification')
      toast.success('Verification email sent! Check your inbox.')
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setSending(false)
    }
  }

  // Auto-redirect if already verified
  if (user?.emailVerified && status !== 'verifying') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="card w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
            <MailCheck className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold">Email already verified</h2>
          <p className="mt-2 text-sm text-slate-500">Your email is confirmed. No action needed.</p>
          <Link to="/" className="btn-primary mt-6 inline-flex">Go to Dashboard</Link>
        </div>
      </div>
    )
  }

  // Token verification flow
  if (token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="card w-full max-w-md p-8 text-center">
          {status === 'verifying' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <h2 className="text-xl font-bold">Verifying your email…</h2>
              <p className="mt-2 text-sm text-slate-500">Please wait a moment.</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
                <MailCheck className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-emerald-600">Email verified!</h2>
              <p className="mt-2 text-sm text-slate-500">Redirecting you to the dashboard…</p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950">
                <MailWarning className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-red-600">Verification failed</h2>
              <p className="mt-2 text-sm text-slate-500">The link may be expired or invalid. Request a new verification email.</p>
              <button onClick={handleResend} disabled={sending} className="btn-primary mt-6">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Resend verification email
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // No token — prompt user to send verification email
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950">
          <MailWarning className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold">Verify your email</h2>
        <p className="mt-2 text-sm text-slate-500">
          {user?.email ? (
            <>We'll send a verification link to <span className="font-medium text-slate-700 dark:text-slate-300">{user.email}</span></>
          ) : (
            'Send a verification link to your email address.'
          )}
        </p>
        <button onClick={handleResend} disabled={sending} className="btn-primary mt-6 w-full">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? 'Sending…' : 'Send verification email'}
        </button>
        <Link to="/" className="mt-4 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-3 w-3" /> Back to dashboard
        </Link>
      </div>
    </div>
  )
}
