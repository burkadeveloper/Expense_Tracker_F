import { useEffect, useState, useCallback } from 'react'
import { Plus, Target, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { unwrap, errMsg } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import { formatMoney, formatDate, majorToMinor } from '../lib/format'

export default function Budgets() {
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [bRes, cRes] = await Promise.all([api.get('/budgets'), api.get('/categories')])
      setBudgets(unwrap(bRes)?.budgets || [])
      setCategories(unwrap(cRes)?.categories || [])
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleSave = async (formData) => {
    try {
      const payload = {
        ...formData,
        amountMinor: majorToMinor(formData.amount),
        category: formData.category || null,
      }
      delete payload.amount
      if (editing) {
        await api.patch(`/budgets/${editing._id}`, payload)
        toast.success('Budget updated')
      } else {
        await api.post('/budgets', payload)
        toast.success('Budget created')
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
      await api.delete(`/budgets/${id}`)
      toast.success('Budget deleted')
      fetch()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Set spending limits and track progress"
        action={
          <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
            <Plus className="h-4 w-4" /> New Budget
          </button>
        }
      />
      {loading ? (
        <div className="flex h-64 items-center justify-center"><Spinner /></div>
      ) : budgets.length === 0 ? (
        <EmptyState icon={Target} title="No budgets yet" description="Create a budget to track your spending limits." action={<button className="btn-primary" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> New Budget</button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => {
            const pct = b.amountMinor > 0 ? Math.min((b.spentMinor / b.amountMinor) * 100, 100) : 0
            const overBudget = b.spentMinor > b.amountMinor
            return (
              <div key={b._id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{b.category?.name?.en || 'Overall Budget'}</h3>
                    <p className="text-xs text-slate-400">{b.calendar === 'ethiopian' ? 'Ethiopian' : 'Gregorian'} · {b.year}/{b.month}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn-ghost !px-2 !py-1" onClick={() => { setEditing(b); setModalOpen(true) }}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className="btn-ghost !px-2 !py-1 text-red-500" onClick={() => setConfirmDelete(b)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">{formatMoney(b.spentMinor)}</span>
                    <span className="text-sm text-slate-400">of {formatMoney(b.amountMinor)}</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className={overBudget ? 'text-red-500 font-medium' : 'text-slate-400'}>
                      {pct.toFixed(0)}% used
                    </span>
                    <span className="text-slate-400">
                      {formatDate(b.periodStart)} → {formatDate(b.periodEnd)}
                    </span>
                  </div>
                  {b.rollover && <span className="badge mt-2 bg-blue-50 text-blue-600 dark:bg-blue-950">Rollover</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <BudgetModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={handleSave} budget={editing} categories={categories} />
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { handleDelete(confirmDelete._id); setConfirmDelete(null) }}
        title="Delete Budget"
        message="This will permanently delete this budget."
        confirmLabel="Delete"
      />
    </div>
  )
}

function BudgetModal({ open, onClose, onSave, budget, categories }) {
  const [form, setForm] = useState({
    category: '', amount: 0, calendar: 'ethiopian', year: new Date().getFullYear(), month: new Date().getMonth() + 1,
    rollover: false, alert80: true, alert100: true,
  })

  useEffect(() => {
    if (budget) {
      setForm({
        category: budget.category?._id || budget.category || '',
        amount: (budget.amountMinor || 0) / 100,
        calendar: budget.calendar || 'ethiopian',
        year: budget.year || new Date().getFullYear(),
        month: budget.month || 1,
        rollover: budget.rollover || false,
        alert80: budget.alert80 ?? true,
        alert100: budget.alert100 ?? true,
      })
    } else {
      setForm({ category: '', amount: 0, calendar: 'ethiopian', year: new Date().getFullYear(), month: new Date().getMonth() + 1, rollover: false, alert80: true, alert100: true })
    }
  }, [budget, open])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={budget ? 'Edit Budget' : 'New Budget'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Category (optional — leave empty for overall)</label>
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">Overall Budget</option>
            {categories.filter((c) => c.kind === 'expense').map((c) => <option key={c._id} value={c._id}>{c.name?.en}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Budget Amount</label>
          <input type="number" step="0.01" required className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Calendar</label>
            <select className="input" value={form.calendar} onChange={(e) => setForm({ ...form, calendar: e.target.value })}>
              <option value="ethiopian">Ethiopian</option>
              <option value="gregorian">Gregorian</option>
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <input type="number" required className="input" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })} />
          </div>
          <div>
            <label className="label">Month</label>
            <input type="number" min={1} max={13} required className="input" value={form.month} onChange={(e) => setForm({ ...form, month: parseInt(e.target.value) })} />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.rollover} onChange={(e) => setForm({ ...form, rollover: e.target.checked })} className="h-4 w-4 rounded text-brand-600" />
            Rollover
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.alert80} onChange={(e) => setForm({ ...form, alert80: e.target.checked })} className="h-4 w-4 rounded text-brand-600" />
            Alert at 80%
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.alert100} onChange={(e) => setForm({ ...form, alert100: e.target.checked })} className="h-4 w-4 rounded text-brand-600" />
            Alert at 100%
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{budget ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </Modal>
  )
}

function Spinner() {
  return <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
}
