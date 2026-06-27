import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ChatShell } from '@/components/chat/chat-shell'

export default async function Home() {
  const session = await auth()
  const user = session?.user
    ? { id: session.user.id, email: session.user.email, name: session.user.name ?? null }
    : null

  const hasProfile = user
    ? !!(await prisma.profile.findUnique({ where: { userId: user.id }, select: { id: true } }))
    : true // guests skip onboarding

  return <ChatShell user={user} showOnboarding={user !== null && !hasProfile} />
}
