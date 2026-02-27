import { prisma } from '@/lib/prisma'

describe('Workspaces Database Operations', () => {
  const testUserId = 'test-user-workspaces'

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.bookmarkTag.deleteMany({
      where: { bookmark: { workspace: { userId: testUserId } } },
    })
    await prisma.bookmarkUrl.deleteMany({
      where: { bookmark: { workspace: { userId: testUserId } } },
    })
    await prisma.bookmark.deleteMany({
      where: { workspace: { userId: testUserId } },
    })
    await prisma.folder.deleteMany({
      where: { workspace: { userId: testUserId } },
    })
    await prisma.tag.deleteMany({
      where: { workspace: { userId: testUserId } },
    })
    await prisma.workspace.deleteMany({
      where: { userId: testUserId },
    })
    await prisma.user.deleteMany({
      where: { id: testUserId },
    })

    // Create test user
    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'test-workspaces@example.com',
        passwordHash: 'test-hash',
      },
    })
  })

  afterAll(async () => {
    // Clean up
    await prisma.bookmarkTag.deleteMany({
      where: { bookmark: { workspace: { userId: testUserId } } },
    })
    await prisma.bookmarkUrl.deleteMany({
      where: { bookmark: { workspace: { userId: testUserId } } },
    })
    await prisma.bookmark.deleteMany({
      where: { workspace: { userId: testUserId } },
    })
    await prisma.folder.deleteMany({
      where: { workspace: { userId: testUserId } },
    })
    await prisma.tag.deleteMany({
      where: { workspace: { userId: testUserId } },
    })
    await prisma.workspace.deleteMany({
      where: { userId: testUserId },
    })
    await prisma.user.deleteMany({
      where: { id: testUserId },
    })
    await prisma.$disconnect()
  })

  describe('Workspace CRUD', () => {
    let workspaceId: string

    it('should create a workspace', async () => {
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Test Workspace',
          userId: testUserId,
        },
      })

      expect(workspace.name).toBe('Test Workspace')
      expect(workspace.userId).toBe(testUserId)
      workspaceId = workspace.id
    })

    it('should get a workspace by id', async () => {
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      })

      expect(workspace).not.toBeNull()
      expect(workspace?.name).toBe('Test Workspace')
    })

    it('should update a workspace', async () => {
      const updated = await prisma.workspace.update({
        where: { id: workspaceId },
        data: { name: 'Updated Workspace' },
      })

      expect(updated.name).toBe('Updated Workspace')
    })

    it('should list workspaces by user', async () => {
      // Create second workspace
      await prisma.workspace.create({
        data: {
          name: 'Second Workspace',
          userId: testUserId,
        },
      })

      const workspaces = await prisma.workspace.findMany({
        where: { userId: testUserId },
        orderBy: { createdAt: 'asc' },
      })

      expect(workspaces.length).toBe(2)
      expect(workspaces[0].name).toBe('Updated Workspace')
      expect(workspaces[1].name).toBe('Second Workspace')
    })

    it('should delete a workspace and cascade to bookmarks, folders, tags', async () => {
      // Create bookmark, folder, tag in workspace
      const tag = await prisma.tag.create({
        data: {
          name: 'Test Tag',
          workspaceId,
        },
      })

      const folder = await prisma.folder.create({
        data: {
          name: 'Test Folder',
          workspaceId,
        },
      })

      const bookmark = await prisma.bookmark.create({
        data: {
          title: 'Test Bookmark',
          workspaceId,
          folderId: folder.id,
          tags: {
            create: [{ tagId: tag.id }],
          },
          urls: {
            create: [{ url: 'https://test.com', isPrimary: true }],
          },
        },
      })

      // Delete workspace
      await prisma.workspace.delete({
        where: { id: workspaceId },
      })

      // Verify cascade delete
      const deletedBookmark = await prisma.bookmark.findUnique({
        where: { id: bookmark.id },
      })
      expect(deletedBookmark).toBeNull()

      const deletedFolder = await prisma.folder.findUnique({
        where: { id: folder.id },
      })
      expect(deletedFolder).toBeNull()

      const deletedTag = await prisma.tag.findUnique({
        where: { id: tag.id },
      })
      expect(deletedTag).toBeNull()
    })

    it('should allow duplicate workspace names for different users', async () => {
      // Create another user
      const otherUserId = 'test-user-workspaces-2'
      await prisma.user.create({
        data: {
          id: otherUserId,
          email: 'other@example.com',
          passwordHash: 'hash',
        },
      })

      // Should succeed because different user
      const workspace = await prisma.workspace.create({
        data: {
          name: 'Duplicate Workspace',
          userId: otherUserId,
        },
      })

      expect(workspace.name).toBe('Duplicate Workspace')

      // Cleanup
      await prisma.workspace.deleteMany({ where: { userId: otherUserId } })
      await prisma.user.deleteMany({ where: { id: otherUserId } })
    })
  })
})
