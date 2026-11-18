import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Phone, KeyRound, Loader2, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { errMsg } from '../lib/api'
import AuthLayout from '../components/AuthLayout'

export default function PhoneLogin() {
  const { phoneRequestOtp, phoneVerifyOtp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('request')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequest = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await phoneRequestOtp(phone, 'login')
      toast.success('OTP sent to your phone')
      setStep('verify')
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await phoneVerifyOtp(phone, code, 'login')
      toast.success('Phone verified!')
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
        Sign in with<br />your phone.
      </h2>
      <p className="mt-5 text-base leading-relaxed text-brand-100/80">
        No password needed. We'll send a one-time code to your phone number to
        verify it's you.
      </p>
      <div className="mt-10 space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
            <ShieldCheck className="h-5 w-5 text-brand-200" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Secure & fast</p>
            <p className="text-xs text-brand-200/60">6-digit code, expires in 5 minutes</p>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <AuthLayout panel={brandingPanel}>
      <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
        Phone sign-in
      </h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
        {step === 'request'
          ? 'Enter your number to receive a code'
          : `Enter the code sent to ${phone}`}
      </p>

      {step === 'request' ? (
        <form onSubmit={handleRequest} className="mt-8 space-y-5">
          <div>
            <label className="label">Phone number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                required
                className="input pl-11"
                placeholder="+251912345678"
                pattern="^\+251[79]\d{8}$"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Format: +251[7|9]XXXXXXXX
            </p>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {loading ? 'Sending…' : 'Send code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="mt-8 space-y-5">
          <div>
            <label className="label">6-digit code</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                required
                maxLength={6}
                className="input pl-11 text-center text-xl tracking-[0.4em] font-semibold"
                placeholder="000000"
                pattern="^\d{6}$"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {loading ? 'Verifying…' : 'Verify & sign in'}
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-600"
            onClick={() => setStep('request')}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Change phone number
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Use email instead
        </Link>
      </p>
    </AuthLayout>
  )
}
