import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sanitizeSearchQuery, createBookmarkSchema } from '@/lib/schemas'

// GET /api/bookmarks - List bookmarks with filters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const folderId = searchParams.get('folder')
  const tagId = searchParams.get('tag')
  const archived = searchParams.get('archived') === 'true'
  const workspaceId = searchParams.get('workspaceId') || 'default'

  // Sanitize search query
  const sanitizedQ = q ? sanitizeSearchQuery(q) : undefined

  try {
    const where: Record<string, unknown> = {
      workspaceId,
      archived,
    }

    if (folderId) {
      where.folderId = folderId
    }

    if (tagId) {
      where.tags = {
        some: { tagId }
      }
    }

    if (sanitizedQ) {
      where.OR = [
        { title: { contains: sanitizedQ } },
        { description: { contains: sanitizedQ } },
        { urls: { some: { url: { contains: sanitizedQ } } } }
      ]
    }

    const bookmarks = await prisma.bookmark.findMany({
      where,
      include: {
        urls: true,
        tags: {
          include: { tag: true }
        },
        folder: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(bookmarks)
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 })
  }
}

// POST /api/bookmarks - Create a new bookmark
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input with Zod
    const validation = createBookmarkSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { title, description, folderId, tags, urls, workspaceId = 'default' } = validation.data

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

    // Validate folderId if provided
    if (folderId) {
      const folderExists = await prisma.folder.findUnique({
        where: { id: folderId },
      })
      if (!folderExists) {
        return NextResponse.json(
          { error: 'Folder not found' },
          { status: 400 }
        )
      }
    }

    // Validate that all provided tags exist
    if (tags && tags.length > 0) {
      const existingTags = await prisma.tag.findMany({
        where: { id: { in: tags } },
      })
      if (existingTags.length !== tags.length) {
        return NextResponse.json(
          { error: 'One or more tags not found. Please select existing tags only.' },
          { status: 400 }
        )
      }
    }

    // Ensure exactly one primary URL
    const primaryCount = urls.filter((u) => u.isPrimary).length
    if (primaryCount === 0) {
      urls[0].isPrimary = true
    } else if (primaryCount > 1) {
      // If multiple primaries specified, only keep the first one
      let foundFirst = false
      urls.forEach((u) => {
        if (u.isPrimary) {
          if (foundFirst) {
            u.isPrimary = false
          } else {
            foundFirst = true
          }
        }
      })
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        title,
        description,
        folderId: folderId || null,
        workspaceId,
        urls: {
          create: urls.map((url) => ({
            url: url.url,
            isPrimary: url.isPrimary,
            label: url.label || null,
          })),
        },
        tags: (tags && tags.length > 0) ? {
          create: tags.map((tagId: string) => ({ tagId })),
        } : undefined,
      },
      include: {
        urls: true,
        tags: { include: { tag: true } },
        folder: true,
      },
    })

    return NextResponse.json(bookmark, { status: 201 })
  } catch (error) {
    console.error('Error creating bookmark:', error)
    return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 })
  }
}
