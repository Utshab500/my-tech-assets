import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/user — permanently removes the authenticated user and all their data.
// Cascading deletes in Prisma schema handle related records automatically.
export async function DELETE() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.user.delete({ where: { id: session.user.id } })

  return NextResponse.json({ ok: true }, { status: 200 })
}
