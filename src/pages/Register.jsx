import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Check, BarChart3, Target, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { errMsg } from '../lib/api'
import GoogleIcon from '../components/GoogleIcon'
import AuthLayout from '../components/AuthLayout'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', consent: false })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.consent) return toast.error('Please accept the terms to continue')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password, true)
      toast.success('Account created! Check your email to verify.')
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
        Start your<br />financial journey.
      </h2>
      <p className="mt-5 text-base leading-relaxed text-brand-100/80">
        Join thousands tracking their money with budgets, equbs, and powerful
        reports — built for Ethiopia.
      </p>
      <ul className="mt-10 space-y-3.5">
        {[
          'Free forever — no credit card needed',
          'Ethiopian calendar support',
          'SMS transaction parsing',
          'Multi-account & multi-currency',
        ].map((t) => (
          <li key={t} className="flex items-center gap-3">
            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/15">
              <Check className="h-3 w-3 text-brand-200" />
            </div>
            <span className="text-sm text-brand-100/90">{t}</span>
          </li>
        ))}
      </ul>
    </>
  )

  return (
    <AuthLayout panel={brandingPanel}>
      <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
        Create your account
      </h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
        Start tracking your finances today
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="label">Full name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              required
              minLength={2}
              className="input pl-11"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              className="input pl-11"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              className="input pl-11 pr-11"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
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
        <label className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => setForm({ ...form, consent: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span>
            I agree to the{' '}
            <span className="font-medium text-brand-600">Terms of Service</span>{' '}
            and{' '}
            <span className="font-medium text-brand-600">Privacy Policy</span>
          </span>
        </label>
        <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        <span className="text-xs font-medium text-slate-400">OR</span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="space-y-3">
        <a
          href={`${import.meta.env.VITE_API_URL || '/api/v1'}/auth/google`}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
        >
          <GoogleIcon className="h-5 w-5" />
          Sign up with Google
        </a>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
