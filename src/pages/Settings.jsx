import { useState, useRef } from 'react'
import { Save, Download, Trash2, LogOut, ShieldCheck, Loader2, Mail, Camera, Send, CheckCircle2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import api, { errMsg } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import { initialOf } from '../lib/format'

export default function Settings() {
  const { user, updateUser, logout, logoutAll } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    locale: user?.locale || 'en',
    calendar: user?.calendar || 'ethiopian',
    currency: user?.currency || 'ETB',
    theme: user?.theme || 'system',
    dataSaver: user?.dataSaver || false,
    onboarded: user?.onboarded || false,
  })
  const [saving, setSaving] = useState(false)
  const [sendingVerify, setSendingVerify] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false)
  const [confirmRemoveAvatar, setConfirmRemoveAvatar] = useState(false)
  const fileInputRef = useRef(null)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.patch('/users/me', form)
      updateUser(res.data.data.user)
      toast.success('Settings saved')
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  const handleSendVerification = async () => {
    setSendingVerify(true)
    try {
      await api.post('/auth/send-verification')
      toast.success('Verification email sent! Check your inbox.')
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setSendingVerify(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image too large (max 2MB)')
      return
    }
    setUploadingAvatar(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const res = await api.post('/users/me/avatar', { avatar: reader.result })
          updateUser(res.data.data.user)
          toast.success('Profile picture updated')
        } catch (err) {
          toast.error(errMsg(err))
        } finally {
          setUploadingAvatar(false)
        }
      }
      reader.onerror = () => {
        toast.error('Failed to read image')
        setUploadingAvatar(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      toast.error(errMsg(err))
      setUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      const res = await api.delete('/users/me/avatar')
      updateUser(res.data.data.user)
      toast.success('Profile picture removed')
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const handleExport = async () => {
    try {
      const res = await api.get('/users/export')
      const data = res.data.data
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `birr-tracker-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Data exported')
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete('/users/me')
      toast.success('Account scheduled for deletion')
      await logout()
      navigate('/login')
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const handleLogoutAll = async () => {
    await logoutAll()
    navigate('/login')
  }

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account and preferences" />

      <div className="max-w-2xl space-y-6">
        {/* Profile picture + name */}
        <div className="card p-6">
          <h3 className="mb-4 text-lg font-semibold">Profile Picture</h3>
          <div className="flex items-center gap-6">
            <div className="relative">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-20 w-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                  {initialOf(user?.name)}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 disabled:opacity-50"
                title="Change picture"
              >
                {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-sm text-slate-400">{user?.email || 'No email'}</p>
              {user?.avatar && (
                <button onClick={() => setConfirmRemoveAvatar(true)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600">
                  <X className="h-3 w-3" /> Remove picture
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile info */}
        <div className="card p-6">
          <h3 className="mb-4 text-lg font-semibold">Profile</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+251912345678" />
              </div>
              <div>
                <label className="label">Currency</label>
                <input className="input" maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Language</label>
                <select className="input" value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })}>
                  <option value="en">English</option>
                  <option value="am">Amharic</option>
                  <option value="om">Oromo</option>
                  <option value="ti">Tigrinya</option>
                </select>
              </div>
              <div>
                <label className="label">Calendar</label>
                <select className="input" value={form.calendar} onChange={(e) => setForm({ ...form, calendar: e.target.value })}>
                  <option value="ethiopian">Ethiopian</option>
                  <option value="gregorian">Gregorian</option>
                </select>
              </div>
              <div>
                <label className="label">App Theme</label>
                <select className="input" value={theme} onChange={(e) => { setTheme(e.target.value); setForm({ ...form, theme: e.target.value }) }}>
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.dataSaver} onChange={(e) => setForm({ ...form, dataSaver: e.target.checked })} className="h-4 w-4 rounded text-brand-600" />
              Data Saver Mode
            </label>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Email verification */}
        <div className="card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Mail className="h-5 w-5" /> Email Verification
          </h3>
          {user?.emailVerified ? (
            <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-4 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Your email is verified</span>
            </div>
          ) : (
            <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950">
              <p className="text-sm text-amber-700 dark:text-amber-300">Your email is not yet verified. Verify it to secure your account.</p>
              <button onClick={handleSendVerification} disabled={sendingVerify} className="btn-primary mt-3">
                {sendingVerify ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sendingVerify ? 'Sending…' : 'Send verification email'}
              </button>
            </div>
          )}
        </div>

        {/* Data Management */}
        <div className="card p-6">
          <h3 className="mb-4 text-lg font-semibold">Data Management</h3>
          <div className="space-y-3">
            <button className="btn-secondary w-full justify-start" onClick={handleExport}>
              <Download className="h-4 w-4" /> Export All Data (JSON)
            </button>
            <button className="btn-secondary w-full justify-start" onClick={() => setConfirmLogoutAll(true)}>
              <LogOut className="h-4 w-4" /> Log Out of All Devices
            </button>
            <button className="btn-danger w-full justify-start" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Delete Account
            </button>
          </div>
        </div>

        {/* Account info */}
        <div className="card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="h-5 w-5 text-emerald-600" /> Account Status
          </h3>
          <div className="space-y-2 text-sm">
            <Row label="Role" value={user?.role} />
            <Row label="Email Verified" value={user?.emailVerified ? '✓ Yes' : '✗ No'} />
            <Row label="Phone Verified" value={user?.phoneVerified ? '✓ Yes' : '✗ No'} />
            <Row label="Onboarded" value={user?.onboarded ? '✓ Yes' : '✗ No'} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Account"
        message="This will soft-delete your account. You will be logged out immediately."
        confirmLabel="Delete Account"
      />
      <ConfirmDialog
        open={confirmLogoutAll}
        onClose={() => setConfirmLogoutAll(false)}
        onConfirm={handleLogoutAll}
        title="Log Out Everywhere"
        message="This will revoke all active sessions across all devices."
        confirmLabel="Log Out Everywhere"
        danger={false}
      />
      <ConfirmDialog
        open={confirmRemoveAvatar}
        onClose={() => setConfirmRemoveAvatar(false)}
        onConfirm={handleRemoveAvatar}
        title="Remove Profile Picture"
        message="Are you sure you want to remove your profile picture?"
        confirmLabel="Remove"
      />
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 dark:border-slate-800">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
