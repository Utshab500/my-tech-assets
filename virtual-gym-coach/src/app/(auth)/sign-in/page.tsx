'use client'

import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const result = await signIn('credentials', { email, password, redirect: false })

    setLoading(false)

    if (result?.error) {
      setError('Invalid email or password.')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="rounded-2xl p-8 shadow-sm" style={{ background: 'var(--surface)' }}>
      <h2 className="mb-6 text-lg font-medium" style={{ color: 'var(--ink)' }}>
        Sign in
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm mb-1.5 font-medium" style={{ color: 'var(--ink)' }}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg)',
              color: 'var(--ink)',
            }}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm mb-1.5 font-medium" style={{ color: 'var(--ink)' }}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg)',
              color: 'var(--ink)',
            }}
          />
        </div>

        {error && (
          <p className="text-sm" style={{ color: 'var(--accent)' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-60"
          style={{ background: 'var(--accent)' }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" className="font-medium underline underline-offset-4" style={{ color: 'var(--ink)' }}>
          Sign up
        </Link>
      </div>

      <div className="mt-4 text-center text-sm">
        <Link href="/" className="underline underline-offset-4" style={{ color: 'var(--muted)' }}>
          Continue as guest
        </Link>
      </div>
    </div>
  )
}
