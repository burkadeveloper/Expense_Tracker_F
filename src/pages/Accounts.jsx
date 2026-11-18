import { useEffect, useState, useCallback } from 'react'
import { Wallet, Plus, Archive, Trash2, Pencil, ArrowRightLeft, Landmark, CreditCard, PiggyBank } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { unwrap, errMsg } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import { formatMoney, majorToMinor } from '../lib/format'

const ACCOUNT_TYPES = ['cash', 'bank', 'mobile_money', 'credit_card', 'savings', 'investment', 'equb', 'iddir', 'loan']

const typeIcons = {
  cash: Wallet,
  bank: Landmark,
  mobile_money: Wallet,
  credit_card: CreditCard,
  savings: PiggyBank,
  investment: PiggyBank,
  equb: Wallet,
  iddir: Wallet,
  loan: CreditCard,
}

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmArchive, setConfirmArchive] = useState(null)

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const [accRes, provRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/providers'),
      ])
      setAccounts(unwrap(accRes)?.accounts || [])
      setProviders(unwrap(provRes)?.providers || [])
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  const handleSave = async (formData) => {
    try {
      if (editing) {
        await api.patch(`/accounts/${editing._id}`, formData)
        toast.success('Account updated')
      } else {
        await api.post('/accounts', formData)
        toast.success('Account created')
      }
      setModalOpen(false)
      setEditing(null)
      fetchAccounts()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const handleArchive = async (id) => {
    try {
      await api.post(`/accounts/${id}/archive`)
      toast.success('Account archived')
      fetchAccounts()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/accounts/${id}`)
      toast.success('Account deleted')
      fetchAccounts()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const handleTransfer = async (formData) => {
    try {
      await api.post('/accounts/transfer', {
        ...formData,
        fromAmountMinor: majorToMinor(formData.fromAmount),
        toAmountMinor: formData.toAmount ? majorToMinor(formData.toAmount) : undefined,
      })
      toast.success('Transfer completed')
      setTransferOpen(false)
      fetchAccounts()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const totalBalance = accounts.reduce((s, a) => s + (a.balanceMinor || 0), 0)

  return (
    <div>
      <PageHeader
        title="Accounts"
        description="Manage your financial accounts"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setTransferOpen(true)}>
              <ArrowRightLeft className="h-4 w-4" /> Transfer
            </button>
            <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
              <Plus className="h-4 w-4" /> New Account
            </button>
          </div>
        }
      />

      {totalBalance !== 0 && (
        <div className="mb-6 card p-5 bg-gradient-to-r from-brand-600 to-brand-800 text-white border-0">
          <p className="text-sm opacity-90">Total Balance</p>
          <p className="mt-1 text-3xl font-bold">{formatMoney(totalBalance)}</p>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Spinner /></div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Create your first account to start tracking your finances."
          action={<button className="btn-primary" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Create Account</button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => {
            const Icon = typeIcons[acc.type] || Wallet
            return (
              <div key={acc._id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{acc.name}</h3>
                      <p className="text-xs capitalize text-slate-400">{acc.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn-ghost !px-2 !py-1" onClick={() => { setEditing(acc); setModalOpen(true) }} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className="btn-ghost !px-2 !py-1" onClick={() => setConfirmArchive(acc)} title="Archive">
                      <Archive className="h-4 w-4" />
                    </button>
                    <button className="btn-ghost !px-2 !py-1 text-red-500" onClick={() => setConfirmDelete(acc)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{formatMoney(acc.balanceMinor, acc.currency)}</p>
                  {acc.provider && (
                    <p className="mt-1 text-xs text-slate-400">{acc.provider.name} · {acc.provider.kind}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AccountModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
        account={editing}
        providers={providers}
      />

      <TransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        onSave={handleTransfer}
        accounts={accounts}
      />

      <ConfirmDialog
        open={!!confirmArchive}
        onClose={() => setConfirmArchive(null)}
        onConfirm={() => { handleArchive(confirmArchive._id); setConfirmArchive(null) }}
        title="Archive Account"
        message={`Archive "${confirmArchive?.name}"? You can restore it later if needed.`}
        confirmLabel="Archive"
      />
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { handleDelete(confirmDelete._id); setConfirmDelete(null) }}
        title="Delete Account"
        message={`Delete "${confirmDelete?.name}"? This can only be done if the account has no transactions.`}
        confirmLabel="Delete"
      />
    </div>
  )
}

function AccountModal({ open, onClose, onSave, account, providers }) {
  const [form, setForm] = useState({ name: '', type: 'cash', provider: '', currency: 'ETB', openingBalance: 0 })

  useEffect(() => {
    if (account) {
      setForm({
        name: account.name || '',
        type: account.type || 'cash',
        provider: account.provider?._id || account.provider || '',
        currency: account.currency || 'ETB',
        openingBalance: (account.openingBalanceMinor || 0) / 100,
      })
    } else {
      setForm({ name: '', type: 'cash', provider: '', currency: 'ETB', openingBalance: 0 })
    }
  }, [account, open])

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = { ...form }
    data.provider = data.provider || null
    data.openingBalanceMinor = majorToMinor(data.openingBalance)
    delete data.openingBalance
    onSave(data)
  }

  return (
    <Modal open={open} onClose={onClose} title={account ? 'Edit Account' : 'New Account'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Account Name</label>
          <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. CBE Savings" />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Provider (optional)</label>
          <select className="input" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
            <option value="">— None —</option>
            {providers.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.kind})</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Currency</label>
            <input className="input" maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
          </div>
          <div>
            <label className="label">Opening Balance</label>
            <input type="number" step="0.01" className="input" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{account ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </Modal>
  )
}

function TransferModal({ open, onClose, onSave, accounts }) {
  const [form, setForm] = useState({ fromAccount: '', toAccount: '', fromAmount: 0, toAmount: '', date: '', notes: '' })

  useEffect(() => {
    if (open) setForm({ fromAccount: accounts[0]?._id || '', toAccount: accounts[1]?._id || '', fromAmount: 0, toAmount: '', date: '', notes: '' })
  }, [open])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <Modal open={open} onClose={onClose} title="Transfer Between Accounts">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">From Account</label>
          <select className="input" required value={form.fromAccount} onChange={(e) => setForm({ ...form, fromAccount: e.target.value })}>
            {accounts.map((a) => <option key={a._id} value={a._id}>{a.name} ({formatMoney(a.balanceMinor, a.currency)})</option>)}
          </select>
        </div>
        <div>
          <label className="label">To Account</label>
          <select className="input" required value={form.toAccount} onChange={(e) => setForm({ ...form, toAccount: e.target.value })}>
            {accounts.map((a) => <option key={a._id} value={a._id}>{a.name} ({formatMoney(a.balanceMinor, a.currency)})</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Amount</label>
            <input type="number" step="0.01" required className="input" value={form.fromAmount} onChange={(e) => setForm({ ...form, fromAmount: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="label">Received Amount (optional)</label>
            <input type="number" step="0.01" className="input" placeholder="For currency exchange" value={form.toAmount} onChange={(e) => setForm({ ...form, toAmount: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Date (optional)</label>
          <input type="datetime-local" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Transfer</button>
        </div>
      </form>
    </Modal>
  )
}

function Spinner() {
  return <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
}
