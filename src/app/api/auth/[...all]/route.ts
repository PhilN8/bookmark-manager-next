import { NextResponse } from 'next/server'
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

const authHandler = toNextJsHandler(auth)

export async function GET(...args: unknown[]) {
  try {
    return await authHandler.GET(...args)
  } catch (error) {
    console.error('Auth GET error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

export async function POST(...args: unknown[]) {
  try {
    return await authHandler.POST(...args)
  } catch (error) {
    console.error('Auth POST error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
