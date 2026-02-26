import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tags/:id - Get single tag
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const tag = await prisma.tag.findUnique({
            where: { id },
            include: {
                _count: { select: { bookmarkTags: true } },
                bookmarkTags: {
                    include: {
                        bookmark: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
        })

        if (!tag) {
            return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
        }

        return NextResponse.json(tag)
    } catch (error) {
        console.error('Error fetching tag:', error)
        return NextResponse.json({ error: 'Failed to fetch tag' }, { status: 500 })
    }
}

// PUT /api/tags/:id - Update tag
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const body = await request.json()
        const { name } = body

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        // Validate tag exists
        const existingTag = await prisma.tag.findUnique({
            where: { id },
        })

        if (!existingTag) {
            return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
        }

        const tag = await prisma.tag.update({
            where: { id },
            data: { name },
            include: {
                _count: { select: { bookmarkTags: true } },
            },
        })

        return NextResponse.json(tag)
    } catch (error) {
        console.error('Error updating tag:', error)
        return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 })
    }
}

// DELETE /api/tags/:id - Delete a tag
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        // Validate tag exists
        const tag = await prisma.tag.findUnique({
            where: { id },
        })

        if (!tag) {
            return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
        }

        await prisma.tag.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting tag:', error)
        return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
    }
}
