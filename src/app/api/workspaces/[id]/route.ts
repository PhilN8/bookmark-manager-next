import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
})

// GET /api/workspaces/:id - Get single workspace
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id },
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

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error fetching workspace:', error)
    return NextResponse.json({ error: 'Failed to fetch workspace' }, { status: 500 })
  }
}

// PUT /api/workspaces/:id - Update workspace
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()

    const validation = updateWorkspaceSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name } = validation.data

    // Check if workspace exists
    const existing = await prisma.workspace.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: { name },
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

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error updating workspace:', error)
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 })
  }
}

// DELETE /api/workspaces/:id - Delete workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Delete workspace (cascade will handle bookmarks, folders, tags)
    await prisma.workspace.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workspace:', error)
    return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 })
  }
}
