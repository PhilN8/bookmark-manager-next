import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  userId: z.string(),
})

// GET /api/workspaces - List workspaces for a user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const workspaces = await prisma.workspace.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            bookmarks: true,
            folders: true,
            tags: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(workspaces)
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })
  }
}

// POST /api/workspaces - Create a new workspace
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = createWorkspaceSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, userId } = validation.data

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        userId,
      },
      include: {
        _count: {
          select: {
            bookmarks: true,
            folders: true,
            tags: true,
          },
        },
      },
    })

    return NextResponse.json(workspace, { status: 201 })
  } catch (error) {
    console.error('Error creating workspace:', error)
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
  }
}
