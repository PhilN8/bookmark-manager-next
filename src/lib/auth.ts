import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./prisma"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const JWT_SECRET = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET || "default-dev-secret-change-in-production"
)

const isProduction = process.env.NODE_ENV === "production"

const dbProvider = isProduction ? "postgresql" : "sqlite"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: dbProvider,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  trustedOrigins: process.env.TRUSTED_ORIGINS?.split(",") || ["http://localhost:3000"],
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
})

export type Session = typeof auth.$Infer.Session.session
export type User = typeof auth.$Infer.Session.user

// Token helpers
export async function createToken(payload: { userId: string; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: string; email: string }
  } catch {
    return null
  }
}

// Cookie helpers
export function setAuthCookie(token: string) {
  return {
    name: "auth-token",
    value: token,
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  }
}

export function clearAuthCookie() {
  return {
    name: "auth-token",
    value: "",
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    maxAge: 0,
  }
}

// Get authenticated user from request
export async function getAuthUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    return null
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true },
  })

  return user
}
