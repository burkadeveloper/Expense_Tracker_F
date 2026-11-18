// Money is stored as integer santim (1 ETB = 100 santim)

export function minorToMajor(minor) {
  if (minor == null || isNaN(minor)) return 0
  return Number(minor) / 100
}

export function formatMoney(minor, currency = 'ETB') {
  const major = minorToMajor(minor)
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major)
  return `${formatted} ${currency}`
}

export function formatMoneyShort(minor, currency = 'ETB') {
  const major = minorToMajor(minor)
  if (Math.abs(major) >= 1_000_000) return `${(major / 1_000_000).toFixed(1)}M ${currency}`
  if (Math.abs(major) >= 1_000) return `${(major / 1_000).toFixed(1)}K ${currency}`
  return formatMoney(minor, currency)
}

export function majorToMinor(major) {
  return Math.round(Number(major) * 100)
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function toDatetimeLocal(date = new Date()) {
  const d = new Date(date)
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 16)
}

export function initialOf(name) {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}
