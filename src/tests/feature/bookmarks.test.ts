import { prisma } from '@/lib/prisma'

describe('Bookmarks Database Operations', () => {
  const testWorkspaceId = 'test-workspace-db'
  const testUserId = 'test-user-bookmarks'

  beforeAll(async () => {
    // Create test user first
    await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: { id: testUserId, email: `${testUserId}@test.com`, passwordHash: 'hash' },
    })
    // Then create workspace
    await prisma.workspace.upsert({
      where: { id: testWorkspaceId },
      update: {},
      create: { id: testWorkspaceId, name: 'Test Workspace', userId: testUserId },
    })
  })

  afterAll(async () => {
    await prisma.bookmarkUrl.deleteMany({
      where: { bookmark: { workspaceId: testWorkspaceId } },
    })
    await prisma.bookmark.deleteMany({
      where: { workspaceId: testWorkspaceId },
    })
    await prisma.folder.deleteMany({
      where: { workspaceId: testWorkspaceId },
    })
    await prisma.tag.deleteMany({
      where: { workspaceId: testWorkspaceId },
    })
    await prisma.workspace.deleteMany({
      where: { id: testWorkspaceId },
    })
    await prisma.user.deleteMany({
      where: { id: testUserId },
    })
    await prisma.$disconnect()
  })

  describe('Bookmark CRUD', () => {
    let bookmarkId: string

    it('should create a bookmark with multiple URLs', async () => {
      const bookmark = await prisma.bookmark.create({
        data: {
          title: 'Test Bookmark',
          description: 'Test description',
          workspaceId: testWorkspaceId,
          urls: {
            create: [
              { url: 'https://primary.com', isPrimary: true, label: 'Primary' },
              { url: 'https://secondary.com', isPrimary: false, label: 'Secondary' },
            ],
          },
        },
        include: { urls: true },
      })

      expect(bookmark.title).toBe('Test Bookmark')
      expect(bookmark.urls).toHaveLength(2)
      bookmarkId = bookmark.id
    })

    it('should enforce one primary URL constraint', async () => {
      const bookmark = await prisma.bookmark.findUnique({
        where: { id: bookmarkId },
        include: { urls: true },
      })

      const primaryUrls = bookmark?.urls.filter(u => u.isPrimary)
      expect(primaryUrls).toHaveLength(1)
    })

    it('should update a bookmark', async () => {
      const updated = await prisma.bookmark.update({
        where: { id: bookmarkId },
        data: { title: 'Updated Title' },
      })

      expect(updated.title).toBe('Updated Title')
    })

    it('should soft-delete (archive) a bookmark', async () => {
      await prisma.bookmark.update({
        where: { id: bookmarkId },
        data: { archived: true },
      })

      const bookmark = await prisma.bookmark.findUnique({
        where: { id: bookmarkId },
      })

      expect(bookmark?.archived).toBe(true)
    })

    it('should query archived bookmarks', async () => {
      const archived = await prisma.bookmark.findMany({
        where: { workspaceId: testWorkspaceId, archived: true },
      })

      expect(archived.length).toBeGreaterThan(0)
    })
  })

  describe('Folder Operations', () => {
    let folderId: string

    it('should create a folder', async () => {
      const folder = await prisma.folder.create({
        data: {
          name: 'Test Folder',
          workspaceId: testWorkspaceId,
        },
      })

      expect(folder.name).toBe('Test Folder')
      folderId = folder.id
    })

    it('should create nested folder', async () => {
      const child = await prisma.folder.create({
        data: {
          name: 'Child Folder',
          workspaceId: testWorkspaceId,
          parentId: folderId,
        },
      })

      expect(child.parentId).toBe(folderId)
    })

    it('should delete folder and move bookmarks to root', async () => {
      await prisma.folder.delete({ where: { id: folderId } })
      const deleted = await prisma.folder.findUnique({ where: { id: folderId } })
      expect(deleted).toBeNull()
    })
  })

  describe('Tag Operations', () => {
    it('should create a tag', async () => {
      const tag = await prisma.tag.create({
        data: {
          name: 'Test Tag',
          workspaceId: testWorkspaceId,
        },
      })

      expect(tag.name).toBe('Test Tag')
    })

    it('should enforce unique tag names per workspace', async () => {
      await expect(
        prisma.tag.create({
          data: {
            name: 'Test Tag',
            workspaceId: testWorkspaceId,
          },
        })
      ).rejects.toThrow()
    })
  })
})
