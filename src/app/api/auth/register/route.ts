import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createToken, setAuthCookie } from '@/lib/auth'
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rateLimit'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
})

export async function POST(request: Request) {
  // Check rate limit (same as login — prevent account creation abuse)
  const identifier = getRateLimitIdentifier(request)
  const rateLimit = checkRateLimit(identifier)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  try {
    const body = await request.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    const passwordHash = await hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        emailVerified: false,
      },
    })

    await prisma.workspace.create({
      data: { name: 'My Workspace', userId: user.id },
    })

    const token = await createToken({ userId: user.id, email: user.email })

    const response = NextResponse.json(
      { data: { id: user.id, email: user.email } },
      { status: 201 }
    )

    response.cookies.set(setAuthCookie(token))

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
