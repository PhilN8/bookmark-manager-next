import { prisma } from '@/lib/prisma'

describe('Folders Database Operations', () => {
  const testWorkspaceId = 'test-workspace-folders-db'
  const testUserId = 'test-user-folders'

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
    await prisma.folder.deleteMany({ where: { workspaceId: testWorkspaceId } })
    await prisma.workspace.deleteMany({ where: { id: testWorkspaceId } })
    await prisma.user.deleteMany({ where: { id: testUserId } })
    await prisma.$disconnect()
  })

  describe('Folder CRUD', () => {
    it('should create a root folder', async () => {
      const folder = await prisma.folder.create({
        data: { name: 'Root Folder', workspaceId: testWorkspaceId },
      })

      expect(folder.name).toBe('Root Folder')
      expect(folder.parentId).toBeNull()
    })

    it('should create a nested folder', async () => {
      const parent = await prisma.folder.create({
        data: { name: 'Parent', workspaceId: testWorkspaceId },
      })

      const child = await prisma.folder.create({
        data: { name: 'Child', workspaceId: testWorkspaceId, parentId: parent.id },
      })

      expect(child.parentId).toBe(parent.id)
    })

    it('should update folder name', async () => {
      const folder = await prisma.folder.create({
        data: { name: 'Original', workspaceId: testWorkspaceId },
      })

      const updated = await prisma.folder.update({
        where: { id: folder.id },
        data: { name: 'Updated' },
      })

      expect(updated.name).toBe('Updated')
    })

    it('should reorder folders by order field', async () => {
      const folder1 = await prisma.folder.create({
        data: { name: 'First', workspaceId: testWorkspaceId, order: 0 },
      })
      const folder2 = await prisma.folder.create({
        data: { name: 'Second', workspaceId: testWorkspaceId, order: 1 },
      })

      expect(folder1.order).toBeLessThan(folder2.order)
    })
  })
})
