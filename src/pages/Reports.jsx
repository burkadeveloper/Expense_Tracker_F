import { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { unwrap, errMsg } from '../lib/api'
import PageHeader from '../components/PageHeader'
import { formatMoney, formatMoneyShort, minorToMajor } from '../lib/format'

const PIE_COLORS = ['#3390fd', '#1d70f0', '#1357dd', '#1547b3', '#163e8e', '#0e2456', '#59b0ff', '#8ecdff']

export default function Reports() {
  const [byCategory, setByCategory] = useState([])
  const [trend, setTrend] = useState([])
  const [ethMonth, setEthMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 })
  const [ethReport, setEthReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('expense')

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [catRes, trendRes] = await Promise.all([
          api.get('/reports/by-category', { params: { type: reportType } }),
          api.get('/reports/monthly-trend', { params: { months: 6 } }),
        ])
        setByCategory(unwrap(catRes)?.rows || [])
        setTrend(unwrap(trendRes)?.rows || [])
      } catch (err) {
        toast.error(errMsg(err))
      } finally {
        setLoading(false)
      }
    })()
  }, [reportType])

  const fetchEthMonth = async () => {
    try {
      const res = await api.get('/reports/ethiopian-month', { params: ethMonth })
      setEthReport(unwrap(res))
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  useEffect(() => { fetchEthMonth() }, [])

  // Build chart-friendly data
  const catData = byCategory.map((r) => ({
    name: r.cat?.name?.en || 'Unknown',
    value: minorToMajor(r.total),
    total: r.total,
  }))

  // Group trend by month
  const monthMap = new Map()
  trend.forEach((r) => {
    const key = `${r._id.y}-${String(r._id.m).padStart(2, '0')}`
    if (!monthMap.has(key)) monthMap.set(key, { month: key, income: 0, expense: 0 })
    monthMap.get(key)[r._id.type] = minorToMajor(r.total)
  })
  const trendData = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month))

  return (
    <div>
      <PageHeader title="Reports" description="Visualize your spending patterns and trends" />

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Spinner /></div>
      ) : (
        <div className="space-y-6">
          {/* By Category — Pie chart */}
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Spending by Category</h3>
              <select className="input max-w-[140px]" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            {catData.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${formatMoneyShort(value * 100)}`}>
                      {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(v * 100)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {catData.slice(0, 8).map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="flex-1 text-sm">{c.name}</span>
                      <span className="text-sm font-medium">{formatMoney(c.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">No data for this period.</p>
            )}
          </div>

          {/* Monthly Trend — Line chart */}
          <div className="card p-6">
            <h3 className="mb-4 text-lg font-semibold">Income vs Expense Trend (6 months)</h3>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(v) => formatMoneyShort(v * 100)} />
                  <Tooltip formatter={(v) => formatMoney(v * 100)} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expense" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">No trend data available.</p>
            )}
          </div>

          {/* Ethiopian Month Report */}
          <div className="card p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Ethiopian Calendar Month Report</h3>
              <div className="flex gap-2">
                <input type="number" className="input w-24" value={ethMonth.year} onChange={(e) => setEthMonth({ ...ethMonth, year: parseInt(e.target.value) || 0 })} placeholder="Year" />
                <input type="number" min={1} max={13} className="input w-24" value={ethMonth.month} onChange={(e) => setEthMonth({ ...ethMonth, month: parseInt(e.target.value) || 1 })} placeholder="Month" />
                <button className="btn-primary" onClick={fetchEthMonth}>Generate</button>
              </div>
            </div>
            {ethReport && (
              <div>
                <p className="mb-4 text-sm text-slate-400">
                  Period: {new Date(ethReport.start).toLocaleDateString()} → {new Date(ethReport.end).toLocaleDateString()}
                </p>
                {ethReport.totals?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {ethReport.totals.map((t, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                        <p className="text-sm capitalize text-slate-500">{t._id}</p>
                        <p className={`mt-1 text-xl font-bold ${t._id === 'income' ? 'text-emerald-600' : t._id === 'expense' ? 'text-red-600' : ''}`}>
                          {formatMoney(t.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-sm text-slate-400">No data for this Ethiopian month.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
}
