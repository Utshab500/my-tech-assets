import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(null, { status: 401 })
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json(profile)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    goal?: string | null
    experienceLevel?: string | null
    environment?: string | null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      goal: body.goal ?? null,
      experienceLevel: body.experienceLevel ?? null,
      environment: body.environment ?? null,
    },
    update: {
      goal: body.goal ?? null,
      experienceLevel: body.experienceLevel ?? null,
      environment: body.environment ?? null,
    },
  })

  return NextResponse.json(profile)
}
