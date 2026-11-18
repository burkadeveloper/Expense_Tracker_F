import { useState } from 'react'
import { MessageSquareText, Sparkles, Copy, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { unwrap, errMsg } from '../lib/api'
import PageHeader from '../components/PageHeader'
import { formatMoney } from '../lib/format'

export default function SmsParser() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleParse = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await api.post('/sms/parse', { text })
      setResult(unwrap(res))
      toast.success('SMS parsed')
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setLoading(false)
    }
  }

  const samples = [
    'You have received 500 ETB from Abebe Bekele. Reference: TXN123456789. Available balance: 12,345 ETB. Date: 2024-03-15',
    'You sent 1,200 ETB to CBE account 12345. Fee: 5 ETB. Ref: TR987654321. Date: 2024-03-16',
    'Telebirr: You paid 250 ETB to Merchant "Bambu Supermarket". Ref: TP998877. Date: 2024-04-01',
  ]

  return (
    <div>
      <PageHeader title="SMS Parser" description="Paste an SMS notification to extract transaction details" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 text-brand-600" />
            <h3 className="text-lg font-semibold">SMS Input</h3>
          </div>
          <form onSubmit={handleParse} className="space-y-4">
            <div>
              <label className="label">Paste your SMS text</label>
              <textarea
                required
                rows={6}
                className="input font-mono text-sm"
                placeholder="e.g. You have received 500 ETB from Abebe..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              <Sparkles className="h-4 w-4" />
              {loading ? 'Parsing…' : 'Parse SMS'}
            </button>
          </form>
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-slate-400">Try a sample:</p>
            <div className="space-y-2">
              {samples.map((s, i) => (
                <button
                  key={i}
                  className="block w-full truncate rounded-lg border border-slate-200 px-3 py-2 text-left text-xs text-slate-500 hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:hover:bg-brand-950"
                  onClick={() => setText(s)}
                >
                  {s.substring(0, 80)}…
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold">Parsed Result</h3>
          </div>
          {result ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {result.matched ? '✓ Transaction detected' : '✗ No transaction pattern matched'}
              </div>
              {result.matched && (
                <div className="space-y-2">
                  <Row label="Type" value={result.type} />
                  {result.amountMinor != null && <Row label="Amount" value={formatMoney(result.amountMinor)} />}
                  {result.providerName && <Row label="Provider" value={result.providerName} />}
                  {result.providerKey && <Row label="Provider Key" value={result.providerKey} />}
                  {result.counterparty && <Row label="Counterparty" value={result.counterparty} />}
                  {result.reference && <Row label="Reference" value={result.reference} />}
                  {result.paymentMethod && <Row label="Payment Method" value={result.paymentMethod} />}
                  {result.date && <Row label="Date" value={result.date} />}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
              Parsed transaction details will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm dark:border-slate-800">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  )
}
