import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/bookmarks/:id/urls - Add a new URL to an existing bookmark
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const body = await request.json()
        const { url, isPrimary = false, label } = body

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 })
        }

        // Validate bookmark exists
        const bookmark = await prisma.bookmark.findUnique({
            where: { id },
        })

        if (!bookmark) {
            return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
        }

        // If setting as primary, unset other primary URLs first
        if (isPrimary) {
            await prisma.bookmarkUrl.updateMany({
                where: { bookmarkId: id, isPrimary: true },
                data: { isPrimary: false },
            })
        }

        const bookmarkUrl = await prisma.bookmarkUrl.create({
            data: {
                bookmarkId: id,
                url,
                isPrimary,
                label: label || null,
            },
        })

        return NextResponse.json(bookmarkUrl, { status: 201 })
    } catch (error) {
        console.error('Error adding URL to bookmark:', error)
        return NextResponse.json({ error: 'Failed to add URL' }, { status: 500 })
    }
}
