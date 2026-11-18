import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { unwrap, errMsg } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'
import PageHeader from '../components/PageHeader'
import { formatMoney, formatDate } from '../lib/format'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.get('/reports/dashboard')
        setData(unwrap(res))
      } catch (err) {
        toast.error(errMsg(err))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>

  const cur = user?.currency || 'ETB'

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.name}`}
        action={
          <button className="btn-primary" onClick={() => navigate('/transactions')}>
            <Plus className="h-4 w-4" /> New Transaction
          </button>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Balance" value={formatMoney(data?.totalBalanceMinor ?? 0, cur)} type="balance" sub="Across all active accounts" />
        <StatCard label="Income (This Month)" value={formatMoney(data?.incomeMinor ?? 0, cur)} type="income" sub={data ? formatDate(data.periodStart) + ' → ' + formatDate(data.periodEnd) : ''} />
        <StatCard label="Expense (This Month)" value={formatMoney(data?.expenseMinor ?? 0, cur)} type="expense" sub={data ? formatDate(data.periodStart) + ' → ' + formatDate(data.periodEnd) : ''} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="mb-4 text-lg font-semibold">Top Categories</h3>
          {data?.topCategories?.length ? (
            <div className="space-y-3">
              {data.topCategories.map((c, i) => {
                const max = data.topCategories[0].total
                const pct = max > 0 ? (c.total / max) * 100 : 0
                return (
                  <div key={i}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{c.cat?.name?.en || 'Uncategorized'}</span>
                      <span className="text-slate-500">{formatMoney(c.total, cur)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No spending recorded this month yet.</p>
          )}
        </div>

        <div className="card p-6">
          <h3 className="mb-4 text-lg font-semibold">Recent Transactions</h3>
          {data?.recentTransactions?.length ? (
            <div className="space-y-2">
              {data.recentTransactions.map((tx) => {
                const Icon = tx.type === 'income' ? ArrowUpRight : tx.type === 'expense' ? ArrowDownRight : ArrowRightLeft
                const color = tx.type === 'income' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' : tx.type === 'expense' ? 'text-red-600 bg-red-50 dark:bg-red-950' : 'text-blue-600 bg-blue-50 dark:bg-blue-950'
                return (
                  <div key={tx._id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{tx.payee || tx.notes || tx.type}</p>
                      <p className="text-xs text-slate-400">{formatDate(tx.date)}</p>
                    </div>
                    <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600' : tx.type === 'expense' ? 'text-red-600' : ''}`}>
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatMoney(tx.amountMinor, tx.currency)}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No transactions yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
}
