import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const { auth } = NextAuth(authConfig)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default auth(function proxy(req: NextRequest & { auth: any }) {
  const response = NextResponse.next()

  // Give every visitor an anonymous guest-id for guest conversations
  if (!req.cookies.get('guest-id')) {
    response.cookies.set('guest-id', crypto.randomUUID(), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
  }

  return response
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
