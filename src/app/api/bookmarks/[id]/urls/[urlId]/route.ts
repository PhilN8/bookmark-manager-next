import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { checkRateLimit, getRateLimitIdentifier, writeLimitConfig } from '@/lib/rateLimit'

// DELETE /api/bookmarks/:id/urls/:urlId — remove a URL from a bookmark
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; urlId: string }> }
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

    const { id, urlId } = await params

    try {
        // Verify the URL exists and belongs to this bookmark
        const bookmarkUrl = await prisma.bookmarkUrl.findUnique({
            where: { id: urlId },
            include: {
                bookmark: {
                    include: { workspace: true, urls: true },
                },
            },
        })

        if (!bookmarkUrl) {
            return NextResponse.json({ error: 'URL not found' }, { status: 404 })
        }

        if (bookmarkUrl.bookmarkId !== id) {
            return NextResponse.json({ error: 'URL does not belong to this bookmark' }, { status: 400 })
        }

        if (bookmarkUrl.bookmark.workspace.userId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const allUrls = bookmarkUrl.bookmark.urls
        if (allUrls.length <= 1) {
            return NextResponse.json(
                { error: 'Cannot remove the last URL from a bookmark' },
                { status: 400 }
            )
        }

        await prisma.$transaction(async (tx) => {
            await tx.bookmarkUrl.delete({ where: { id: urlId } })

            // If the deleted URL was primary, promote the first remaining URL
            if (bookmarkUrl.isPrimary) {
                const remaining = allUrls.filter((u) => u.id !== urlId)
                if (remaining.length > 0) {
                    await tx.bookmarkUrl.update({
                        where: { id: remaining[0].id },
                        data: { isPrimary: true },
                    })
                }
            }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('Error removing URL from bookmark:', error)
        return NextResponse.json({ error: 'Failed to remove URL' }, { status: 500 })
    }
}
