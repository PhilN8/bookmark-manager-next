import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { checkRateLimit, getRateLimitIdentifier, writeLimitConfig } from '@/lib/rateLimit'
import { sanitizeSearchQuery, sanitizeUrlQuery, createBookmarkSchema } from '@/lib/schemas'

// GET /api/bookmarks - List bookmarks with filters
export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const folderId = searchParams.get('folder')
  const tagId = searchParams.get('tag')
  const archived = searchParams.get('archived') === 'true'
  const workspaceId = searchParams.get('workspaceId')
  const cursor = searchParams.get('cursor') || undefined
  const limitParam = searchParams.get('limit')
  const limit = Math.min(Math.max(parseInt(limitParam ?? '20', 10) || 20, 1), 100)

  if (!workspaceId) {
    return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 })
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  })

  if (!workspace || workspace.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Sanitize search query
  const sanitizedQ = q ? sanitizeSearchQuery(q) : undefined
  // Preserve colons for URL substring matching (e.g. "https://example.com")
  const sanitizedUrlQ = q ? sanitizeUrlQuery(q) : undefined

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
      // FTS via GIN index on searchVector (title + description).
      // Include the archived filter so we don't pull back IDs from the wrong view.
      const ftsResults = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Bookmark"
        WHERE "workspaceId" = ${workspaceId}
          AND "archived" = ${archived}
          AND "searchVector" @@ websearch_to_tsquery('english', ${sanitizedQ})
      `
      const ftsIds = ftsResults.map((r) => r.id)

      // Combine: FTS matches (title/description) OR case-insensitive URL substring match.
      where.OR = [
        ...(ftsIds.length > 0 ? [{ id: { in: ftsIds } }] : []),
        { urls: { some: { url: { contains: sanitizedUrlQ, mode: 'insensitive' as const } } } },
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
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasNextPage = bookmarks.length > limit
    const items = hasNextPage ? bookmarks.slice(0, limit) : bookmarks
    const nextCursor = hasNextPage ? items[items.length - 1].id : null

    return NextResponse.json({ items, nextCursor })
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 })
  }
}

// POST /api/bookmarks - Create a new bookmark
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const identifier = `write:${getRateLimitIdentifier(request)}`
  const rateLimit = checkRateLimit(identifier, writeLimitConfig)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
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
    
    // Validate input with Zod
    const validation = createBookmarkSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { title, description, folderId, tags, urls, workspaceId = 'default' } = validation.data

    // Verify workspace belongs to the authenticated user
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    })

    if (!workspace || workspace.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
