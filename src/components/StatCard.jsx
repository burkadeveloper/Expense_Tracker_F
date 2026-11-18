import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

const iconMap = { balance: Wallet, income: TrendingUp, expense: TrendingDown }

export default function StatCard({ label, value, sub, type = 'balance' }) {
  const Icon = iconMap[type] || Wallet
  const colors = {
    balance: 'text-brand-600 bg-brand-50 dark:bg-brand-950',
    income: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
    expense: 'text-red-600 bg-red-50 dark:bg-red-950',
  }
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[type]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  )
}
