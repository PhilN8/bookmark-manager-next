import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/folders/:id - Get single folder
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const folder = await prisma.folder.findUnique({
            where: { id },
            include: {
                children: true,
                _count: { select: { bookmarks: true } },
            },
        })

        if (!folder) {
            return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
        }

        return NextResponse.json(folder)
    } catch (error) {
        console.error('Error fetching folder:', error)
        return NextResponse.json({ error: 'Failed to fetch folder' }, { status: 500 })
    }
}

// PUT /api/folders/:id - Update folder
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const body = await request.json()
        const { name, parentId, order } = body

        // Validate folder exists
        const existingFolder = await prisma.folder.findUnique({
            where: { id },
        })

        if (!existingFolder) {
            return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
        }

        // Validate parentId if provided (and not null)
        if (parentId) {
            const parentExists = await prisma.folder.findUnique({
                where: { id: parentId },
            })
            if (!parentExists) {
                return NextResponse.json({ error: 'Parent folder not found' }, { status: 400 })
            }

            // Prevent setting itself as parent
            if (parentId === id) {
                return NextResponse.json({ error: 'Cannot set folder as its own parent' }, { status: 400 })
            }
        }

        const folder = await prisma.folder.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(parentId !== undefined && { parentId: parentId || null }),
                ...(order !== undefined && { order }),
            },
            include: {
                children: true,
                _count: { select: { bookmarks: true } },
            },
        })

        return NextResponse.json(folder)
    } catch (error) {
        console.error('Error updating folder:', error)
        return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 })
    }
}

// DELETE /api/folders/:id - Delete a folder
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        // Validate folder exists
        const folder = await prisma.folder.findUnique({
            where: { id },
        })

        if (!folder) {
            return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
        }

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
