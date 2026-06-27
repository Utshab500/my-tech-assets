import type { NextAuthConfig } from 'next-auth'

// Edge-compatible auth config — no Prisma, no Node.js-only modules.
// Used by proxy.ts (middleware). Full config is in auth.ts.
export const authConfig = {
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = request.nextUrl
      const isProtected =
        pathname.startsWith('/account') || pathname.startsWith('/api/user')
      if (isProtected && !isLoggedIn) return false
      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
