import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/bookmarks - List bookmarks with filters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const folderId = searchParams.get('folder')
  const tagId = searchParams.get('tag')
  const archived = searchParams.get('archived') === 'true'
  const workspaceId = searchParams.get('workspaceId') || 'default'

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

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { urls: { some: { url: { contains: q } } } }
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
    const { title, description, folderId, tags, urls, workspaceId = 'default' } = body

    if (!title || !urls || urls.length === 0) {
      return NextResponse.json(
        { error: 'Title and at least one URL are required' },
        { status: 400 }
      )
    }

    // Ensure exactly one primary URL
    const hasPrimary = urls.some((u: { isPrimary: boolean }) => u.isPrimary)
    if (!hasPrimary) {
      urls[0].isPrimary = true
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        title,
        description,
        folderId: folderId || null,
        workspaceId,
        urls: {
          create: urls.map((url: { url: string; isPrimary: boolean; label?: string }) => ({
            url: url.url,
            isPrimary: url.isPrimary,
            label: url.label || null,
          })),
        },
        tags: tags?.length > 0 ? {
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
