import { useEffect, useState, useCallback } from 'react'
import {
  Users, BarChart3, Building2, Tags, Shield, Search, ChevronRight,
  UserCog, Trash2, RotateCcw, Plus, Pencil, ToggleLeft, ToggleRight,
  TrendingUp, Wallet, ArrowLeftRight, Target, Layers,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api, { unwrap, errMsg } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import { formatMoney, formatDate, formatDateTime } from '../lib/format'

export default function Admin() {
  const [tab, setTab] = useState('stats')

  const tabs = [
    { key: 'stats', label: 'Overview', icon: BarChart3 },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'providers', label: 'Providers', icon: Building2 },
    { key: 'categories', label: 'Categories', icon: Tags },
  ]

  return (
    <div>
      <PageHeader title="Admin Panel" description="System administration and management" />
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-brand-600 text-brand-700 dark:text-brand-300'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stats' && <StatsTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'providers' && <ProvidersTab />}
      {tab === 'categories' && <CategoriesTab />}
    </div>
  )
}

// ===== Stats Tab =====
function StatsTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.get('/admin/stats')
        setStats(unwrap(res))
      } catch (err) {
        toast.error(errMsg(err))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <Spinner />
  if (!stats) return null

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, sub: `${stats.activeUsers} active`, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
    { label: 'Admins', value: stats.adminCount, sub: 'Admin accounts', icon: Shield, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
    { label: 'Accounts', value: stats.totalAccounts, sub: 'All accounts', icon: Wallet, color: 'text-brand-600 bg-brand-50 dark:bg-brand-950' },
    { label: 'Transactions', value: stats.totalTransactions, sub: 'Active transactions', icon: ArrowLeftRight, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' },
    { label: 'Budgets', value: stats.totalBudgets, sub: 'All budgets', icon: Target, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950' },
    { label: 'Equbs', value: stats.totalEqubs, sub: 'All equbs', icon: Layers, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950' },
    { label: 'Categories', value: stats.totalCategories, sub: 'All categories', icon: Tags, color: 'text-pink-600 bg-pink-50 dark:bg-pink-950' },
    { label: 'Deleted Users', value: stats.deletedUsers, sub: 'Soft-deleted', icon: Trash2, color: 'text-red-600 bg-red-50 dark:bg-red-950' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{c.label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.color}`}>
                <c.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold">{c.value}</div>
            <div className="mt-1 text-xs text-slate-400">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Transaction volume (last 30 days) */}
      {stats.transactionVolume?.length > 0 && (
        <div className="card p-6">
          <h3 className="mb-4 text-lg font-semibold">Transaction Volume (Last 30 Days)</h3>
          <div className="space-y-3">
            {stats.transactionVolume.map((v, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                <span className="capitalize font-medium">{v._id}</span>
                <div className="text-right">
                  <span className="font-semibold">{v.count} transactions</span>
                  <span className="ml-3 text-sm text-slate-400">{formatMoney(v.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New users per day (last 7 days) */}
      {stats.newUsersPerDay?.length > 0 && (
        <div className="card p-6">
          <h3 className="mb-4 text-lg font-semibold">New Users (Last 7 Days)</h3>
          <div className="flex items-end gap-2" style={{ height: 120 }}>
            {stats.newUsersPerDay.map((d, i) => {
              const max = Math.max(...stats.newUsersPerDay.map((x) => x.count), 1)
              const h = (d.count / max) * 100
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-medium">{d.count}</span>
                  <div className="w-full rounded-t bg-brand-500" style={{ height: `${h}%`, minHeight: 4 }} />
                  <span className="text-[10px] text-slate-400">{d._id.slice(5)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ===== Users Tab =====
function UsersTab() {
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [detailUser, setDetailUser] = useState(null)
  const [userDetail, setUserDetail] = useState(null)
  const [userAccounts, setUserAccounts] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/users', { params: { page, limit: 20, q } })
      const d = unwrap(res)
      setUsers(d?.users || [])
      setPage(d?.page || 1)
      setPages(d?.pages || 1)
      setTotal(d?.total || 0)
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setLoading(false)
    }
  }, [page, q])

  useEffect(() => { fetch() }, [fetch])

  const handleRoleChange = async (id, role) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role })
      toast.success(`User role set to ${role}`)
      fetch()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`)
      toast.success('User deleted')
      fetch()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const handleRestore = async (id) => {
    try {
      await api.post(`/admin/users/${id}/restore`)
      toast.success('User restored')
      fetch()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const handleToggle = async (id) => {
    try {
      await api.post(`/admin/users/${id}/toggle-active`)
      toast.success('User status toggled')
      fetch()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const openDetail = async (user) => {
    setDetailUser(user)
    try {
      const res = await api.get(`/admin/users/${user.id}`)
      setUserDetail(unwrap(res)?.user)
      const accRes = await api.get(`/admin/users/${user.id}/accounts`)
      setUserAccounts(unwrap(accRes)?.accounts || [])
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Search by name, email, or phone…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {loading ? <Spinner /> : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="No users match your search." />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-slate-500">{u.email || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{u.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {u.deletedAt ? (
                          <span className="badge bg-red-50 text-red-600 dark:bg-red-950">Deleted</span>
                        ) : (
                          <span className="badge bg-emerald-50 text-emerald-600 dark:bg-emerald-950">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button className="btn-ghost !px-2 !py-1" title="View" onClick={() => openDetail(u)}>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          {u.deletedAt ? (
                            <button className="btn-ghost !px-2 !py-1 text-emerald-500" title="Restore" onClick={() => handleRestore(u._id)}>
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          ) : (
                            <button className="btn-ghost !px-2 !py-1 text-amber-500" title="Suspend" onClick={() => handleToggle(u._id)}>
                              <ToggleRight className="h-4 w-4" />
                            </button>
                          )}
                          <button className="btn-ghost !px-2 !py-1 text-red-500" title="Delete" onClick={() => setConfirmDelete(u)}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-400">Page {page} of {pages} · {total} users</p>
              <div className="flex gap-1">
                <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
                <button className="btn-secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* User detail modal */}
      <Modal open={!!detailUser} onClose={() => setDetailUser(null)} title="User Details" size="lg">
        {userDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="Name" value={userDetail.name} />
              <DetailRow label="Email" value={userDetail.email || '—'} />
              <DetailRow label="Phone" value={userDetail.phone || '—'} />
              <DetailRow label="Role" value={userDetail.role} />
              <DetailRow label="Currency" value={userDetail.currency} />
              <DetailRow label="Calendar" value={userDetail.calendar} />
              <DetailRow label="Locale" value={userDetail.locale} />
              <DetailRow label="Theme" value={userDetail.theme} />
              <DetailRow label="Email Verified" value={userDetail.emailVerified ? '✓' : '✗'} />
              <DetailRow label="Phone Verified" value={userDetail.phoneVerified ? '✓' : '✗'} />
              <DetailRow label="Onboarded" value={userDetail.onboarded ? '✓' : '✗'} />
              <DetailRow label="Joined" value={formatDateTime(userDetail.createdAt)} />
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Accounts ({userAccounts.length})</h4>
              {userAccounts.length === 0 ? (
                <p className="text-sm text-slate-400">No accounts.</p>
              ) : (
                <div className="space-y-2">
                  {userAccounts.map((a) => (
                    <div key={a._id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                      <div>
                        <span className="font-medium">{a.name}</span>
                        <span className="ml-2 text-xs text-slate-400 capitalize">{a.type.replace('_', ' ')}</span>
                      </div>
                      <span className="font-semibold">{formatMoney(a.balanceMinor, a.currency)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { handleDelete(confirmDelete._id); setConfirmDelete(null) }}
        title="Delete User"
        message={`Soft-delete "${confirmDelete?.name}"? The user's data will be preserved but they won't be able to log in.`}
        confirmLabel="Delete"
      />
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div>
      <span className="text-xs text-slate-400">{label}</span>
      <p className="font-medium">{value}</p>
    </div>
  )
}

// ===== Providers Tab =====
function ProvidersTab() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/providers')
      setProviders(unwrap(res)?.providers || [])
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleSave = async (formData) => {
    try {
      if (editing) {
        await api.patch(`/admin/providers/${editing._id}`, formData)
        toast.success('Provider updated')
      } else {
        await api.post('/admin/providers', formData)
        toast.success('Provider created')
      }
      setModalOpen(false)
      setEditing(null)
      fetch()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/providers/${id}`)
      toast.success('Provider deleted')
      fetch()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
          <Plus className="h-4 w-4" /> New Provider
        </button>
      </div>
      {loading ? <Spinner /> : providers.length === 0 ? (
        <EmptyState icon={Building2} title="No providers" description="Add financial service providers." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <div key={p._id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-xs capitalize text-slate-400">{p.kind.replace('_', ' ')}</p>
                </div>
                <div className="flex gap-1">
                  <button className="btn-ghost !px-2 !py-1" onClick={() => { setEditing(p); setModalOpen(true) }}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button className="btn-ghost !px-2 !py-1 text-red-500" onClick={() => setConfirmDelete(p)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <span className={`badge mt-3 ${p.active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                {p.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      )}
      <ProviderModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={handleSave} provider={editing} />
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { handleDelete(confirmDelete._id); setConfirmDelete(null) }}
        title="Delete Provider"
        message={`Delete "${confirmDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}

function ProviderModal({ open, onClose, onSave, provider }) {
  const [form, setForm] = useState({ name: '', kind: 'bank', active: true })
  useEffect(() => {
    if (provider) setForm({ name: provider.name, kind: provider.kind, active: provider.active })
    else setForm({ name: '', kind: 'bank', active: true })
  }, [provider, open])
  return (
    <Modal open={open} onClose={onClose} title={provider ? 'Edit Provider' : 'New Provider'}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Kind</label>
          <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            <option value="bank">Bank</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="card">Card</option>
            <option value="other">Other</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded text-brand-600" />
          Active
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{provider ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </Modal>
  )
}

// ===== Categories Tab =====
function CategoriesTab() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/categories')
      setCategories(unwrap(res)?.categories || [])
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleSave = async (formData) => {
    try {
      await api.post('/admin/categories', formData)
      toast.success('Default category created')
      setModalOpen(false)
      fetch()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/categories/${id}`)
      toast.success('Category deleted')
      fetch()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> New Default Category
        </button>
      </div>
      {loading ? <Spinner /> : categories.length === 0 ? (
        <EmptyState icon={Tags} title="No categories" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Key</th>
                <th className="px-4 py-3 font-medium">Kind</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {categories.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {c.icon && <span>{c.icon}</span>}
                      <span className="font-medium">{c.name?.en}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{c.key}</td>
                  <td className="px-4 py-3 capitalize">{c.kind}</td>
                  <td className="px-4 py-3">
                    {c.isDefault ? <span className="badge bg-blue-50 text-blue-600 dark:bg-blue-950">Default</span> : <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-800">Custom</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{c.user ? c.user.name : 'System'}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn-ghost !px-2 !py-1 text-red-500" onClick={() => setConfirmDelete(c)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <CategoryModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { handleDelete(confirmDelete._id); setConfirmDelete(null) }}
        title="Delete Category"
        message={`Delete "${confirmDelete?.name?.en}"? This is permanent.`}
        confirmLabel="Delete"
      />
    </div>
  )
}

function CategoryModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ key: '', kind: 'expense', nameEn: '', nameAm: '', icon: '', color: '#64748b' })
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      key: form.key,
      kind: form.kind,
      name: { en: form.nameEn, ...(form.nameAm ? { am: form.nameAm } : {}) },
      icon: form.icon || undefined,
      color: form.color,
    })
  }
  return (
    <Modal open={open} onClose={onClose} title="New Default Category">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Key</label>
          <input className="input" required value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
        </div>
        <div>
          <label className="label">Kind</label>
          <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div>
          <label className="label">Name (English)</label>
          <input className="input" required value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
        </div>
        <div>
          <label className="label">Name (Amharic)</label>
          <input className="input" value={form.nameAm} onChange={(e) => setForm({ ...form, nameAm: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Icon (emoji)</label>
            <input className="input" maxLength={4} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🛒" />
          </div>
          <div>
            <label className="label">Color</label>
            <input type="color" className="input h-10 cursor-pointer" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Create</button>
        </div>
      </form>
    </Modal>
  )
}

function Spinner() {
  return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" /></div>
}
