import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, RotateCcw, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { unwrap, errMsg } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import { formatMoney, formatDate, formatDateTime, majorToMinor, toDatetimeLocal } from '../lib/format'

const TX_TYPES = ['income', 'expense', 'transfer']
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'telebirr', 'cbe_birr', 'mpesa', 'card', 'other']

export default function Transactions() {
  const [items, setItems] = useState([])
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ type: '', account: '', category: '', from: '', to: '', q: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20 }
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
      const [txRes, accRes, catRes] = await Promise.all([
        api.get('/transactions', { params }),
        api.get('/accounts'),
        api.get('/categories'),
      ])
      const d = unwrap(txRes)
      setItems(d?.items || [])
      setPage(d?.page || 1)
      setPages(d?.pages || 1)
      setTotal(d?.total || 0)
      setAccounts(unwrap(accRes)?.accounts || [])
      setCategories(unwrap(catRes)?.categories || [])
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async (formData) => {
    try {
      const payload = {
        ...formData,
        amountMinor: majorToMinor(formData.amount),
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
      }
      delete payload.amount
      if (editing) {
        await api.patch(`/transactions/${editing._id}`, payload)
        toast.success('Transaction updated')
      } else {
        await api.post('/transactions', payload)
        toast.success('Transaction created')
      }
      setModalOpen(false)
      setEditing(null)
      fetchData()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/transactions/${id}`)
      toast.success('Transaction deleted')
      fetchData()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const handleUndo = async (id) => {
    try {
      await api.post(`/transactions/${id}/undo`)
      toast.success('Transaction restored')
      fetchData()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Transactions"
        description={`${total} total transactions`}
        action={
          <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
            <Plus className="h-4 w-4" /> New Transaction
          </button>
        }
      />

      {/* Search & filters bar */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Search by payee or notes…"
            value={filters.q}
            onChange={(e) => { setFilters({ ...filters, q: e.target.value }); setPage(1) }}
          />
        </div>
        <button className="btn-secondary" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4" /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="mb-4 card p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="label">Type</label>
              <select className="input" value={filters.type} onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1) }}>
                <option value="">All</option>
                {TX_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Account</label>
              <select className="input" value={filters.account} onChange={(e) => { setFilters({ ...filters, account: e.target.value }); setPage(1) }}>
                <option value="">All</option>
                {accounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={filters.category} onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1) }}>
                <option value="">All</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name?.en}</option>)}
              </select>
            </div>
            <div>
              <label className="label">From</label>
              <input type="date" className="input" value={filters.from} onChange={(e) => { setFilters({ ...filters, from: e.target.value }); setPage(1) }} />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" className="input" value={filters.to} onChange={(e) => { setFilters({ ...filters, to: e.target.value }); setPage(1) }} />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button className="btn-ghost" onClick={() => { setFilters({ type: '', account: '', category: '', from: '', to: '', q: '' }); setPage(1) }}>
              Clear filters
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ArrowRightLeft}
          title="No transactions found"
          description="Create your first transaction to start tracking."
          action={<button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true) }}><Plus className="h-4 w-4" /> New Transaction</button>}
        />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Account</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((tx) => {
                    const Icon = tx.type === 'income' ? ArrowUpRight : tx.type === 'expense' ? ArrowDownRight : ArrowRightLeft
                    const color = tx.type === 'income' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' : tx.type === 'expense' ? 'text-red-600 bg-red-50 dark:bg-red-950' : 'text-blue-600 bg-blue-50 dark:bg-blue-950'
                    const accountName = tx.type === 'expense' ? tx.fromAccount?.name : tx.toAccount?.name || tx.fromAccount?.name
                    return (
                      <tr key={tx._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(tx.date)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">{tx.payee || tx.notes || tx.type}</div>
                              {tx.notes && tx.payee && <div className="text-xs text-slate-400">{tx.notes}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{tx.category?.name?.en || '—'}</td>
                        <td className="px-4 py-3 text-slate-500">{accountName || '—'}</td>
                        <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${tx.type === 'income' ? 'text-emerald-600' : tx.type === 'expense' ? 'text-red-600' : ''}`}>
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatMoney(tx.amountMinor, tx.currency)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button className="btn-ghost !px-2 !py-1" onClick={() => { setEditing(tx); setModalOpen(true) }} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button className="btn-ghost !px-2 !py-1 text-red-500" onClick={() => setConfirmDelete(tx)} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-400">Page {page} of {pages}</p>
              <div className="flex gap-1">
                <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
                <button className="btn-secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </div>
          )}
        </>
      )}

      <TransactionModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
        transaction={editing}
        accounts={accounts}
        categories={categories}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { handleDelete(confirmDelete._id); setConfirmDelete(null) }}
        title="Delete Transaction"
        message="This will soft-delete the transaction. You can undo it later if needed."
        confirmLabel="Delete"
      />
    </div>
  )
}

function TransactionModal({ open, onClose, onSave, transaction, accounts, categories }) {
  const [form, setForm] = useState({
    type: 'expense', amount: 0, currency: 'ETB', fromAccount: '', toAccount: '',
    category: '', date: toDatetimeLocal(), payee: '', notes: '', tags: '', paymentMethod: 'cash',
    vatApplied: false, totApplied: false, exchangeRate: '',
  })

  useEffect(() => {
    if (transaction) {
      setForm({
        type: transaction.type || 'expense',
        amount: (transaction.amountMinor || 0) / 100,
        currency: transaction.currency || 'ETB',
        fromAccount: transaction.fromAccount?._id || transaction.fromAccount || '',
        toAccount: transaction.toAccount?._id || transaction.toAccount || '',
        category: transaction.category?._id || transaction.category || '',
        date: toDatetimeLocal(transaction.date),
        payee: transaction.payee || '',
        notes: transaction.notes || '',
        tags: (transaction.tags || []).join(', '),
        paymentMethod: transaction.paymentMethod || 'cash',
        vatApplied: transaction.vatApplied || false,
        totApplied: transaction.totApplied || false,
        exchangeRate: transaction.exchangeRate || '',
      })
    } else {
      setForm({
        type: 'expense', amount: 0, currency: 'ETB', fromAccount: '', toAccount: '',
        category: '', date: toDatetimeLocal(), payee: '', notes: '', tags: '', paymentMethod: 'cash',
        vatApplied: false, totApplied: false, exchangeRate: '',
      })
    }
  }, [transaction, open])

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = { ...form }
    data.tags = data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
    if (data.exchangeRate) data.exchangeRate = parseFloat(data.exchangeRate)
    else delete data.exchangeRate
    if (!data.category) delete data.category
    // Clean up account fields based on type
    if (data.type === 'expense') { delete data.toAccount } else if (data.type === 'income') { delete data.fromAccount } else if (data.type === 'transfer') { delete data.category }
    onSave(data)
  }

  return (
    <Modal open={open} onClose={onClose} title={transaction ? 'Edit Transaction' : 'New Transaction'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {TX_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                    form.type === t
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Amount</label>
            <input type="number" step="0.01" required className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>

        {form.type === 'expense' && (
          <div>
            <label className="label">From Account</label>
            <select className="input" required value={form.fromAccount} onChange={(e) => setForm({ ...form, fromAccount: e.target.value })}>
              <option value="">Select account…</option>
              {accounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
        )}
        {form.type === 'income' && (
          <div>
            <label className="label">To Account</label>
            <select className="input" required value={form.toAccount} onChange={(e) => setForm({ ...form, toAccount: e.target.value })}>
              <option value="">Select account…</option>
              {accounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
        )}
        {form.type === 'transfer' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">From Account</label>
              <select className="input" required value={form.fromAccount} onChange={(e) => setForm({ ...form, fromAccount: e.target.value })}>
                <option value="">Select…</option>
                {accounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">To Account</label>
              <select className="input" required value={form.toAccount} onChange={(e) => setForm({ ...form, toAccount: e.target.value })}>
                <option value="">Select…</option>
                {accounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {form.type !== 'transfer' && (
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">None</option>
              {categories.filter((c) => c.kind === form.type).map((c) => <option key={c._id} value={c._id}>{c.name?.en}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date</label>
            <input type="datetime-local" required className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select className="input" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Payee</label>
            <input className="input" value={form.payee} onChange={(e) => setForm({ ...form, payee: e.target.value })} />
          </div>
          <div>
            <label className="label">Tags (comma-separated)</label>
            <input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.vatApplied} onChange={(e) => setForm({ ...form, vatApplied: e.target.checked })} className="h-4 w-4 rounded text-brand-600" />
            VAT Applied
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.totApplied} onChange={(e) => setForm({ ...form, totApplied: e.target.checked })} className="h-4 w-4 rounded text-brand-600" />
            TOT Applied
          </label>
          <div>
            <label className="label">Exchange Rate</label>
            <input type="number" step="0.01" className="input" placeholder="Optional" value={form.exchangeRate} onChange={(e) => setForm({ ...form, exchangeRate: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{transaction ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </Modal>
  )
}

function Spinner() {
  return <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
}
