import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createToken, setAuthCookie } from '@/lib/auth'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    const passwordHash = await hash(password, 10)

    const user = await prisma.user.create({
      data: { email, passwordHash },
    })

    // Create default workspace for new user
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
