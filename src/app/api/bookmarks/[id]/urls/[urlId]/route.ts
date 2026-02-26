import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE /api/bookmarks/:id/urls/:urlId - Remove a specific URL from a bookmark
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; urlId: string }> }
) {
    const { id, urlId } = await params

    try {
        // Check if this is the only URL or the primary URL
        const bookmark = await prisma.bookmark.findUnique({
            where: { id },
            include: { urls: true },
        })

        if (!bookmark) {
            return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
        }

        const urlToDelete = bookmark.urls.find(u => u.id === urlId)
        if (!urlToDelete) {
            return NextResponse.json({ error: 'URL not found' }, { status: 404 })
        }

        // Prevent deletion if it's the only URL
        if (bookmark.urls.length === 1) {
            return NextResponse.json(
                { error: 'Cannot delete the only URL. A bookmark must have at least one URL.' },
                { status: 400 }
            )
        }

        // If deleting the primary URL, promote another URL to primary
        if (urlToDelete.isPrimary) {
            const otherUrl = bookmark.urls.find(u => u.id !== urlId)
            if (otherUrl) {
                await prisma.bookmarkUrl.update({
                    where: { id: otherUrl.id },
                    data: { isPrimary: true },
                })
            }
        }

        await prisma.bookmarkUrl.delete({ where: { id: urlId } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting URL:', error)
        return NextResponse.json({ error: 'Failed to delete URL' }, { status: 500 })
    }
}
