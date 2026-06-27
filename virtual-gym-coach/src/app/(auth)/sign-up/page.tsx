import Link from 'next/link'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

async function createAccount(formData: FormData) {
  'use server'

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password || password.length < 8) {
    redirect('/sign-up?error=invalid')
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    redirect('/sign-up?error=exists')
  }

  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.create({ data: { email, name: name || null, password: hashed } })

  redirect('/sign-in?registered=1')
}

type SearchParams = Promise<{ error?: string; [key: string]: string | undefined }>

export default async function SignUpPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const errorMsg =
    params.error === 'exists'
      ? 'An account with that email already exists.'
      : params.error === 'invalid'
        ? 'Please provide a valid email and a password of at least 8 characters.'
        : null

  return (
    <div className="rounded-2xl p-8 shadow-sm" style={{ background: 'var(--surface)' }}>
      <h2 className="mb-6 text-lg font-medium" style={{ color: 'var(--ink)' }}>
        Create account
      </h2>

      <form action={createAccount} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm mb-1.5 font-medium" style={{ color: 'var(--ink)' }}>
            Name <span style={{ color: 'var(--muted)' }}>(optional)</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg)',
              color: 'var(--ink)',
            }}
          />
        </div>

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
            Password <span style={{ color: 'var(--muted)' }}>(min 8 chars)</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg)',
              color: 'var(--ink)',
            }}
          />
        </div>

        {errorMsg && (
          <p className="text-sm" style={{ color: 'var(--accent)' }}>
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity"
          style={{ background: 'var(--accent)' }}
        >
          Create account
        </button>
      </form>

      <div className="mt-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
        Already have an account?{' '}
        <Link href="/sign-in" className="font-medium underline underline-offset-4" style={{ color: 'var(--ink)' }}>
          Sign in
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
