import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/folders - List all folders
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspaceId') || 'default'
  const parentId = searchParams.get('parentId')

  try {
    const folders = await prisma.folder.findMany({
      where: {
        workspaceId,
        ...(parentId ? { parentId } : { parentId: null }),
      },
      include: {
        children: true,
        _count: { select: { bookmarks: true } },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(folders)
  } catch (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
  }
}

// POST /api/folders - Create a new folder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, parentId, workspaceId = 'default' } = body

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

    // Validate parentId if provided
    if (parentId) {
      const parentExists = await prisma.folder.findUnique({
        where: { id: parentId },
      })
      if (!parentExists) {
        return NextResponse.json(
          { error: 'Parent folder not found' },
          { status: 400 }
        )
      }
    }

    // Get the highest order number
    const lastFolder = await prisma.folder.findFirst({
      where: { workspaceId, parentId: parentId || null },
      orderBy: { order: 'desc' },
    })
    const order = lastFolder ? lastFolder.order + 1 : 0

    const folder = await prisma.folder.create({
      data: {
        name,
        workspaceId,
        parentId: parentId || null,
        order,
      },
      include: { children: true },
    })

    return NextResponse.json(folder, { status: 201 })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}

// PUT /api/folders - Update folder (reorder, rename)
// Note: Prefer using PUT /api/folders/:id for RESTful operations
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, parentId, order } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const folder = await prisma.folder.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(order !== undefined && { order }),
      },
      include: { children: true },
    })

    return NextResponse.json(folder)
  } catch (error) {
    console.error('Error updating folder:', error)
    return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 })
  }
}

// DELETE /api/folders - Delete a folder
// Note: Prefer using DELETE /api/folders/:id for RESTful operations
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }

  try {
    // Move bookmarks to root (null folderId) and delete subfolders
    await prisma.$transaction([
      prisma.bookmark.updateMany({ where: { folderId: id }, data: { folderId: null } }),
      prisma.folder.deleteMany({ where: { parentId: id } }),
      prisma.folder.delete({ where: { id } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 })
  }
}
