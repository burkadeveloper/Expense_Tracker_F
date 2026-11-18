import { useEffect, useState, useCallback } from 'react'
import { Plus, Users, Pencil, Archive, Trash2, CalendarPlus, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { unwrap, errMsg } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import { formatMoney, formatDate, majorToMinor } from '../lib/format'

const FREQUENCIES = ['weekly', 'biweekly', 'monthly']

export default function Equbs() {
  const [equbs, setEqubs] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [detailEqub, setDetailEqub] = useState(null)
  const [detailPayments, setDetailPayments] = useState([])
  const [paymentModal, setPaymentModal] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [eqRes, accRes] = await Promise.all([api.get('/equbs'), api.get('/accounts')])
      setEqubs(unwrap(eqRes)?.equbs || [])
      setAccounts(unwrap(accRes)?.accounts || [])
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
        contributionMinor: majorToMinor(formData.contribution),
        account: formData.account || null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        payoutDate: formData.payoutDate ? new Date(formData.payoutDate).toISOString() : undefined,
      }
      delete payload.contribution
      if (editing) {
        await api.patch(`/equbs/${editing._id}`, payload)
        toast.success('Equb updated')
      } else {
        await api.post('/equbs', payload)
        toast.success('Equb created')
      }
      setModalOpen(false)
      setEditing(null)
      fetch()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const handleArchive = async (id) => {
    try {
      await api.post(`/equbs/${id}/archive`)
      toast.success('Equb archived')
      fetch()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const openDetail = async (equb) => {
    try {
      const res = await api.get(`/equbs/${equb._id}`)
      const d = unwrap(res)
      setDetailEqub(d.equb)
      setDetailPayments(d.payments || [])
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const addPayment = async (formData) => {
    try {
      const payload = {
        amountMinor: formData.amount ? majorToMinor(formData.amount) : undefined,
        date: formData.date ? new Date(formData.date).toISOString() : undefined,
        round: formData.round ? parseInt(formData.round) : undefined,
        notes: formData.notes || undefined,
      }
      await api.post(`/equbs/${detailEqub._id}/payments`, payload)
      toast.success('Payment added')
      setPaymentModal(false)
      openDetail(detailEqub)
      fetch()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const removePayment = async (paymentId) => {
    try {
      await api.delete(`/equbs/${detailEqub._id}/payments/${paymentId}`)
      toast.success('Payment removed')
      openDetail(detailEqub)
      fetch()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const markPayoutReceived = async (equb) => {
    try {
      await api.post(`/equbs/${equb._id}/payout-received`)
      toast.success('Payout marked as received')
      fetch()
      if (detailEqub?._id === equb._id) openDetail(equb)
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Equbs"
        description="Track your rotating savings groups"
        action={
          <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
            <Plus className="h-4 w-4" /> New Equb
          </button>
        }
      />
      {loading ? (
        <div className="flex h-64 items-center justify-center"><Spinner /></div>
      ) : equbs.length === 0 ? (
        <EmptyState icon={Users} title="No equbs yet" description="Create an equb to track your rotating savings contributions." action={<button className="btn-primary" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> New Equb</button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {equbs.map((e) => {
            const progressPct = e.members > 0 ? Math.min((e.paymentCount / (e.members * (e.payoutRound || 1))) * 100, 100) : 0
            return (
              <div key={e._id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{e.name}</h3>
                      <p className="text-xs capitalize text-slate-400">{e.frequency} · {e.members} members</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn-ghost !px-2 !py-1" onClick={() => { setEditing(e); setModalOpen(true) }} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className="btn-ghost !px-2 !py-1" onClick={() => setConfirmArchive(e)} title="Archive">
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Contribution</p>
                    <p className="font-semibold">{formatMoney(e.contributionMinor)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Pot Size</p>
                    <p className="font-semibold">{formatMoney(e.potMinor)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Paid</p>
                    <p className="font-semibold">{formatMoney(e.paidMinor)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Payments</p>
                    <p className="font-semibold">{e.paymentCount}</p>
                  </div>
                </div>
                {e.receivedPayout && (
                  <span className="badge mt-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950">Payout received</span>
                )}
                <div className="mt-4 flex gap-2">
                  <button className="btn-secondary flex-1" onClick={() => openDetail(e)}>View Details</button>
                  {!e.receivedPayout && (
                    <button className="btn-ghost" title="Mark payout received" onClick={() => markPayoutReceived(e)}>
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <EqubModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={handleSave} equb={editing} accounts={accounts} />

      {/* Detail Modal */}
      <Modal open={!!detailEqub} onClose={() => setDetailEqub(null)} title={detailEqub?.name || 'Equb Details'} size="lg">
        {detailEqub && (
          <div>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800">
                <p className="text-xs text-slate-400">Contribution</p>
                <p className="font-bold">{formatMoney(detailEqub.contributionMinor)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800">
                <p className="text-xs text-slate-400">Total Paid</p>
                <p className="font-bold">{formatMoney(equbs.find((e) => e._id === detailEqub._id)?.paidMinor || 0)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800">
                <p className="text-xs text-slate-400">Pot Size</p>
                <p className="font-bold">{formatMoney(equbs.find((e) => e._id === detailEqub._id)?.potMinor || 0)}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <h4 className="font-semibold">Payment History</h4>
              <button className="btn-primary" onClick={() => setPaymentModal(true)}>
                <CalendarPlus className="h-4 w-4" /> Add Payment
              </button>
            </div>
            <div className="mt-3 max-h-64 overflow-y-auto">
              {detailPayments.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">No payments recorded yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-slate-400">
                    <tr>
                      <th className="py-2">Date</th>
                      <th className="py-2">Round</th>
                      <th className="py-2">Notes</th>
                      <th className="py-2 text-right">Amount</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailPayments.map((p) => (
                      <tr key={p._id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="py-2">{formatDate(p.date)}</td>
                        <td className="py-2">{p.round || '—'}</td>
                        <td className="py-2 text-slate-400">{p.notes || '—'}</td>
                        <td className="py-2 text-right font-medium">{formatMoney(p.amountMinor)}</td>
                        <td className="py-2 text-right">
                          <button className="btn-ghost !px-2 !py-1 text-red-500" onClick={() => removePayment(p._id)}>
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </Modal>

      <PaymentModal open={paymentModal} onClose={() => setPaymentModal(false)} onSave={addPayment} defaultAmount={detailEqub?.contributionMinor ? detailEqub.contributionMinor / 100 : 0} />

      <ConfirmDialog
        open={!!confirmArchive}
        onClose={() => setConfirmArchive(null)}
        onConfirm={() => { handleArchive(confirmArchive._id); setConfirmArchive(null) }}
        title="Archive Equb"
        message={`Archive "${confirmArchive?.name}"?`}
        confirmLabel="Archive"
      />
    </div>
  )
}

function EqubModal({ open, onClose, onSave, equb, accounts }) {
  const [form, setForm] = useState({
    name: '', contribution: 0, frequency: 'monthly', members: 2,
    startDate: '', payoutRound: '', payoutDate: '', receivedPayout: false, account: '',
  })

  useEffect(() => {
    if (equb) {
      setForm({
        name: equb.name || '',
        contribution: (equb.contributionMinor || 0) / 100,
        frequency: equb.frequency || 'monthly',
        members: equb.members || 2,
        startDate: equb.startDate ? new Date(equb.startDate).toISOString().slice(0, 10) : '',
        payoutRound: equb.payoutRound || '',
        payoutDate: equb.payoutDate ? new Date(equb.payoutDate).toISOString().slice(0, 10) : '',
        receivedPayout: equb.receivedPayout || false,
        account: equb.account?._id || equb.account || '',
      })
    } else {
      setForm({ name: '', contribution: 0, frequency: 'monthly', members: 2, startDate: '', payoutRound: '', payoutDate: '', receivedPayout: false, account: '' })
    }
  }, [equb, open])

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = { ...form }
    data.members = parseInt(data.members)
    if (data.payoutRound) data.payoutRound = parseInt(data.payoutRound)
    else delete data.payoutRound
    onSave(data)
  }

  return (
    <Modal open={open} onClose={onClose} title={equb ? 'Edit Equb' : 'New Equb'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Family Equb" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Contribution Amount</label>
            <input type="number" step="0.01" required className="input" value={form.contribution} onChange={(e) => setForm({ ...form, contribution: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="label">Members</label>
            <input type="number" min={2} required className="input" value={form.members} onChange={(e) => setForm({ ...form, members: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Frequency</label>
            <select className="input" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
              {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Linked Account</label>
            <select className="input" value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })}>
              <option value="">None</option>
              {accounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start Date</label>
            <input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div>
            <label className="label">Payout Round</label>
            <input type="number" className="input" value={form.payoutRound} onChange={(e) => setForm({ ...form, payoutRound: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Payout Date</label>
          <input type="date" className="input" value={form.payoutDate} onChange={(e) => setForm({ ...form, payoutDate: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.receivedPayout} onChange={(e) => setForm({ ...form, receivedPayout: e.target.checked })} className="h-4 w-4 rounded text-brand-600" />
          Payout received
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{equb ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </Modal>
  )
}

function PaymentModal({ open, onClose, onSave, defaultAmount }) {
  const [form, setForm] = useState({ amount: 0, date: new Date().toISOString().slice(0, 10), round: '', notes: '' })

  useEffect(() => {
    if (open) setForm({ amount: defaultAmount, date: new Date().toISOString().slice(0, 10), round: '', notes: '' })
  }, [open, defaultAmount])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Payment" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Amount (leave empty to use default contribution)</label>
          <input type="number" step="0.01" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date</label>
            <input type="date" required className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Round</label>
            <input type="number" className="input" value={form.round} onChange={(e) => setForm({ ...form, round: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Add</button>
        </div>
      </form>
    </Modal>
  )
}

function Spinner() {
  return <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
}
