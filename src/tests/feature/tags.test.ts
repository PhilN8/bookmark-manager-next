import { prisma } from '@/lib/prisma'

describe('Tags Database Operations', () => {
  const testWorkspaceId = 'test-workspace-tags-db'
  const testUserId = 'test-user-tags'

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
    await prisma.bookmarkTag.deleteMany({
      where: { bookmark: { workspaceId: testWorkspaceId } },
    })
    await prisma.bookmark.deleteMany({ where: { workspaceId: testWorkspaceId } })
    await prisma.tag.deleteMany({ where: { workspaceId: testWorkspaceId } })
    await prisma.workspace.deleteMany({ where: { id: testWorkspaceId } })
    await prisma.user.deleteMany({ where: { id: testUserId } })
    await prisma.$disconnect()
  })

  describe('Tag CRUD', () => {
    it('should create a tag', async () => {
      const tag = await prisma.tag.create({
        data: { name: 'Test Tag', workspaceId: testWorkspaceId },
      })

      expect(tag.name).toBe('Test Tag')
    })

    it('should enforce unique tag names per workspace', async () => {
      await expect(
        prisma.tag.create({
          data: { name: 'Test Tag', workspaceId: testWorkspaceId },
        })
      ).rejects.toThrow()
    })

    it('should list tags with bookmark count', async () => {
      const tags = await prisma.tag.findMany({
        where: { workspaceId: testWorkspaceId },
        include: { _count: { select: { bookmarkTags: true } } },
      })

      expect(tags.length).toBeGreaterThan(0)
      expect(tags[0]).toHaveProperty('_count')
    })
  })
})
