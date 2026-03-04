/**
 * @jest-environment node
 */
/**
 * Unit tests for the bookmark search route (GET /api/bookmarks).
 * Mocks Prisma and auth so no database is required.
 */

import { NextRequest } from 'next/server'

// --- Mocks (must be before imports that use them) ---

jest.mock('@/lib/auth', () => ({
  getAuthUser: jest.fn(),
}))

jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: jest.fn().mockReturnValue({ allowed: true }),
  getRateLimitIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
  writeLimitConfig: {},
}))

const mockQueryRaw = jest.fn()
const mockFindUnique = jest.fn()
const mockFindMany = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
    workspace: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
    bookmark: { findMany: (...args: unknown[]) => mockFindMany(...args) },
  },
}))

import { GET } from '@/app/api/bookmarks/route'
import { getAuthUser } from '@/lib/auth'

const mockGetAuthUser = getAuthUser as jest.MockedFunction<typeof getAuthUser>

const WORKSPACE_ID = 'ws-test-123'
const USER_ID = 'user-test-456'

const mockUser = { id: USER_ID, email: 'test@example.com', name: null, passwordHash: 'x', createdAt: new Date(), updatedAt: new Date() }
const mockWorkspace = { id: WORKSPACE_ID, userId: USER_ID, name: 'Test', createdAt: new Date(), updatedAt: new Date() }

function makeRequest(params: Record<string, string>) {
  const url = new URL('http://localhost/api/bookmarks')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString())
}

const mockBookmark = {
  id: 'bm-1',
  title: 'React Hooks Guide',
  description: 'Deep dive into hooks',
  folderId: null,
  workspaceId: WORKSPACE_ID,
  archived: false,
  searchVector: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  urls: [{ id: 'url-1', url: 'https://react.dev/hooks', isPrimary: true, label: null, bookmarkId: 'bm-1', createdAt: new Date(), updatedAt: new Date() }],
  tags: [],
  folder: null,
}

describe('GET /api/bookmarks — FTS search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAuthUser.mockResolvedValue(mockUser)
    mockFindUnique.mockResolvedValue(mockWorkspace)
  })

  it('returns bookmarks without search filter when q is absent', async () => {
    mockFindMany.mockResolvedValue([mockBookmark])

    const res = await GET(makeRequest({ workspaceId: WORKSPACE_ID }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.items).toHaveLength(1)
    // $queryRaw should NOT be called when there is no search query
    expect(mockQueryRaw).not.toHaveBeenCalled()
    // findMany where clause should have no OR key
    const whereArg = mockFindMany.mock.calls[0][0].where
    expect(whereArg.OR).toBeUndefined()
  })

  it('uses $queryRaw for FTS and includes matching IDs in findMany', async () => {
    mockQueryRaw.mockResolvedValue([{ id: 'bm-1' }])
    mockFindMany.mockResolvedValue([mockBookmark])

    const res = await GET(makeRequest({ workspaceId: WORKSPACE_ID, q: 'react hooks' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.items).toHaveLength(1)
    expect(mockQueryRaw).toHaveBeenCalledTimes(1)

    // The findMany where.OR must contain the FTS id-in clause
    const whereArg = mockFindMany.mock.calls[0][0].where
    expect(whereArg.OR).toBeDefined()
    const idClause = whereArg.OR.find((c: Record<string, unknown>) => c.id !== undefined)
    expect(idClause).toEqual({ id: { in: ['bm-1'] } })
  })

  it('includes URL contains clause alongside FTS ids', async () => {
    mockQueryRaw.mockResolvedValue([{ id: 'bm-1' }])
    mockFindMany.mockResolvedValue([mockBookmark])

    await GET(makeRequest({ workspaceId: WORKSPACE_ID, q: 'react' }))

    const whereArg = mockFindMany.mock.calls[0][0].where
    const urlClause = whereArg.OR.find(
      (c: Record<string, unknown>) => c.urls !== undefined,
    )
    expect(urlClause).toEqual({ urls: { some: { url: { contains: 'react' } } } })
  })

  it('omits id-in clause when FTS returns no results (URL-only fallback)', async () => {
    mockQueryRaw.mockResolvedValue([])   // FTS found nothing
    mockFindMany.mockResolvedValue([])

    await GET(makeRequest({ workspaceId: WORKSPACE_ID, q: 'unfindable' }))

    const whereArg = mockFindMany.mock.calls[0][0].where
    // OR should only have the URL clause, no id:in clause
    const idClause = whereArg.OR.find((c: Record<string, unknown>) => c.id !== undefined)
    expect(idClause).toBeUndefined()
    const urlClause = whereArg.OR.find((c: Record<string, unknown>) => c.urls !== undefined)
    expect(urlClause).toBeDefined()
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const res = await GET(makeRequest({ workspaceId: WORKSPACE_ID, q: 'react' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when workspaceId is missing', async () => {
    const res = await GET(makeRequest({ q: 'react' }))
    expect(res.status).toBe(400)
  })

  it('returns 403 when workspace does not belong to user', async () => {
    mockFindUnique.mockResolvedValue({ ...mockWorkspace, userId: 'other-user' })

    const res = await GET(makeRequest({ workspaceId: WORKSPACE_ID, q: 'react' }))
    expect(res.status).toBe(403)
  })
})
