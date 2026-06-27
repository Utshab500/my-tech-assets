export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            Virtual Gym Coach
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Your AI elite gym coach
          </p>
        </div>
        {children}
      </div>
    </main>
  )
}
