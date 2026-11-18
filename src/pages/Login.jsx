import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, BarChart3, Target, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { errMsg } from '../lib/api'
import GoogleIcon from '../components/GoogleIcon'
import AuthLayout from '../components/AuthLayout'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const errorParam = searchParams.get('error')
  if (errorParam === 'google' && !loading) {
    toast.error('Google sign-in failed. Please try again.')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setLoading(false)
    }
  }

  const brandingPanel = (
    <>
      <h2 className="text-[2.5rem] font-bold leading-[1.15] text-white">
        Track every birr.<br />Master your money.
      </h2>
      <p className="mt-5 text-base leading-relaxed text-brand-100/80">
        Smart personal finance for Ethiopia — accounts, budgets, equbs, and
        reports, all in one place.
      </p>
      <div className="mt-10 space-y-4">
        <Highlight icon={BarChart3} title="Visual reports" desc="See where your money goes" />
        <Highlight icon={Target} title="Budget tracking" desc="Stay on top of your spending" />
        <Highlight icon={Users} title="Equb manager" desc="Track rotating savings groups" />
      </div>
    </>
  )

  return (
    <AuthLayout panel={brandingPanel}>
      <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
        Welcome back
      </h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
        Sign in to your account to continue
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              className="input pl-11"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label">Password</label>
            <Link
              to="/phone-login"
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              className="input pl-11 pr-11"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <Divider />
      <SocialButtons />
      <SwitchLink text="Don't have an account?" linkText="Create one" to="/register" />
    </AuthLayout>
  )
}

function Highlight({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-center gap-3.5">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
        <Icon className="h-5 w-5 text-brand-200" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-brand-200/60">{desc}</p>
      </div>
    </div>
  )
}

function Divider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      <span className="text-xs font-medium text-slate-400">OR</span>
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
    </div>
  )
}

function SocialButtons() {
  return (
    <div className="space-y-3">
      <a
        href={`${import.meta.env.VITE_API_URL || '/api/v1'}/auth/google`}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
      >
        <GoogleIcon className="h-5 w-5" />
        Continue with Google
      </a>
      <Link
        to="/phone-login"
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <line x1="12" y1="18" x2="12" y2="18" />
        </svg>
        Sign in with phone
      </Link>
    </div>
  )
}

function SwitchLink({ text, linkText, to }) {
  return (
    <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
      {text}{' '}
      <Link to={to} className="font-semibold text-brand-600 hover:text-brand-700">
        {linkText}
      </Link>
    </p>
  )
}
