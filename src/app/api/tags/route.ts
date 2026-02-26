import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tags - List all tags
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspaceId') || 'default'

  try {
    const tags = await prisma.tag.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { bookmarkTags: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, workspaceId = 'default' } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Ensure workspace exists
    let workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    })

    if (!workspace) {
      // Create default workspace with a default user if it doesn't exist
      let user = await prisma.user.findFirst()
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'default@bookmark-manager.local',
            passwordHash: 'placeholder',
          },
        })
      }
      workspace = await prisma.workspace.create({
        data: {
          id: workspaceId,
          name: 'Default Workspace',
          userId: user.id,
        },
      })
    }

    const existingTag = await prisma.tag.findUnique({
      where: { workspaceId_name: { workspaceId, name } },
    })

    if (existingTag) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 409 })
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        workspaceId,
      },
      include: { _count: { select: { bookmarkTags: true } } },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}

// DELETE /api/tags - Delete a tag
// Note: Prefer using DELETE /api/tags/:id for RESTful operations
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }

  try {
    await prisma.tag.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
  }
}
