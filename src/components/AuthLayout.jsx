/**
 * Shared split-screen layout for all authentication pages.
 * Left: branded gradient panel with rotating content.
 * Right: centered form area.
 */
export default function AuthLayout({ children, panel }) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      {/* ===== Left branding panel ===== */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden lg:flex">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900" />
        {/* Decorative glows */}
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/20">
              <span className="text-xl font-bold text-white">B</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              Birr Tracker
            </span>
          </div>

          {/* Middle — panel content injected by each page */}
          <div className="max-w-md">{panel}</div>

          {/* Footer */}
          <div className="flex items-center gap-6 text-xs text-brand-200/70">
            <span>© 2024 Birr Tracker</span>
            <span className="h-1 w-1 rounded-full bg-brand-300/40" />
            <span>Made for Ethiopia 🇪🇹</span>
          </div>
        </div>
      </div>

      {/* ===== Right form panel ===== */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile-only logo */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white">
              B
            </div>
            <span className="text-lg font-semibold tracking-tight">Birr Tracker</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
