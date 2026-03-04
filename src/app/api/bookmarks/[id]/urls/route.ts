import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { bookmarkUrlSchema } from '@/lib/schemas'
import { checkRateLimit, getRateLimitIdentifier, writeLimitConfig } from '@/lib/rateLimit'

// POST /api/bookmarks/:id/urls — add a new URL to an existing bookmark
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const ip = getRateLimitIdentifier(request)
    const { allowed } = checkRateLimit(`write:${ip}`, writeLimitConfig)
    if (!allowed) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const user = await getAuthUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const body = await request.json().catch(() => null)
    if (!body) {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const result = bookmarkUrlSchema.safeParse(body)
    if (!result.success) {
        return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
    }

    const { url, isPrimary = false, label } = result.data

    try {
        // Verify bookmark exists and belongs to the authenticated user's workspace
        const bookmark = await prisma.bookmark.findUnique({
            where: { id },
            include: { workspace: true },
        })

        if (!bookmark) {
            return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
        }

        if (bookmark.workspace.userId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
