import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/bookmarks/:id - Get single bookmark
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: { id },
      include: {
        urls: true,
        tags: { include: { tag: true } },
        folder: true,
      },
    })

    if (!bookmark) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
    }

    return NextResponse.json(bookmark)
  } catch (error) {
    console.error('Error fetching bookmark:', error)
    return NextResponse.json({ error: 'Failed to fetch bookmark' }, { status: 500 })
  }
}

// PUT /api/bookmarks/:id - Update bookmark
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const body = await request.json()
    const { title, description, folderId, tags, urls, archived } = body

    // If updating URLs, ensure exactly one is primary
    let urlsToUpdate = urls
    if (urls && urls.length > 0) {
      const hasPrimary = urls.some((u: { isPrimary: boolean }) => u.isPrimary)
      if (!hasPrimary) {
        urls[0].isPrimary = true
      }
    }

    // Delete existing URLs if URLs are being updated
    if (urlsToUpdate) {
      await prisma.bookmarkUrl.deleteMany({ where: { bookmarkId: id } })
    }

    const bookmark = await prisma.bookmark.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(folderId !== undefined && { folderId: folderId || null }),
        ...(archived !== undefined && { archived }),
        ...(urlsToUpdate && {
          urls: {
            create: urlsToUpdate.map((url: { url: string; isPrimary: boolean; label?: string }) => ({
              url: url.url,
              isPrimary: url.isPrimary,
              label: url.label || null,
            })),
          },
        }),
        ...(tags && {
          tags: {
            deleteMany: {},
            create: tags.map((tagId: string) => ({ tagId })),
          },
        }),
      },
      include: {
        urls: true,
        tags: { include: { tag: true } },
        folder: true,
      },
    })

    return NextResponse.json(bookmark)
  } catch (error) {
    console.error('Error updating bookmark:', error)
    return NextResponse.json({ error: 'Failed to update bookmark' }, { status: 500 })
  }
}

// DELETE /api/bookmarks/:id - Soft delete bookmark
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    await prisma.bookmark.update({
      where: { id },
      data: { archived: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bookmark:', error)
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 })
  }
}
