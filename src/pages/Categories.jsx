import { useEffect, useState, useCallback } from 'react'
import { Plus, Tags, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { unwrap, errMsg } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/categories')
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
      if (editing) {
        await api.patch(`/categories/${editing._id}`, formData)
        toast.success('Category updated')
      } else {
        await api.post('/categories', formData)
        toast.success('Category created')
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
      await api.delete(`/categories/${id}`)
      toast.success('Category archived')
      fetch()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const income = categories.filter((c) => c.kind === 'income')
  const expense = categories.filter((c) => c.kind === 'expense')

  const renderGroup = (title, items) => (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase text-slate-400">{title}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <div key={c._id} className="card flex items-center gap-3 p-4">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: c.color || '#64748b' }}
            >
              {c.icon ? <span className="text-lg">{c.icon}</span> : <Tags className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{c.name?.en}</p>
              <p className="text-xs text-slate-400">{c.isDefault ? 'Default' : 'Custom'} · {c.key}</p>
            </div>
            {!c.isDefault && (
              <div className="flex gap-1">
                <button className="btn-ghost !px-2 !py-1" onClick={() => { setEditing(c); setModalOpen(true) }}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button className="btn-ghost !px-2 !py-1 text-red-500" onClick={() => setConfirmDelete(c)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize your income and expenses"
        action={
          <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
            <Plus className="h-4 w-4" /> New Category
          </button>
        }
      />
      {loading ? (
        <div className="flex h-64 items-center justify-center"><Spinner /></div>
      ) : categories.length === 0 ? (
        <EmptyState icon={Tags} title="No categories" description="Create categories to organize your transactions." />
      ) : (
        <div className="space-y-8">
          {renderGroup('Income', income)}
          {renderGroup('Expense', expense)}
        </div>
      )}
      <CategoryModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={handleSave} category={editing} />
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { handleDelete(confirmDelete._id); setConfirmDelete(null) }}
        title="Archive Category"
        message={`Archive "${confirmDelete?.name?.en}"? It will no longer appear in selection lists.`}
        confirmLabel="Archive"
      />
    </div>
  )
}

function CategoryModal({ open, onClose, onSave, category }) {
  const [form, setForm] = useState({ key: '', kind: 'expense', nameEn: '', nameAm: '', icon: '', color: '#64748b' })

  useEffect(() => {
    if (category) {
      setForm({
        key: category.key || '',
        kind: category.kind || 'expense',
        nameEn: category.name?.en || '',
        nameAm: category.name?.am || '',
        icon: category.icon || '',
        color: category.color || '#64748b',
      })
    } else {
      setForm({ key: '', kind: 'expense', nameEn: '', nameAm: '', icon: '', color: '#64748b' })
    }
  }, [category, open])

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      key: form.key,
      kind: form.kind,
      name: { en: form.nameEn, ...(form.nameAm ? { am: form.nameAm } : {}) },
      icon: form.icon || undefined,
      color: form.color,
    }
    onSave(data)
  }

  return (
    <Modal open={open} onClose={onClose} title={category ? 'Edit Category' : 'New Category'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Key (unique identifier)</label>
          <input className="input" required value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="e.g. groceries" />
        </div>
        <div>
          <label className="label">Kind</label>
          <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div>
          <label className="label">Name (English) *</label>
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
          <button type="submit" className="btn-primary">{category ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </Modal>
  )
}

function Spinner() {
  return <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
}
