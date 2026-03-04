import { Bookmark, BookmarkFormData, BookmarkPage, BookmarkUrl, Folder, Tag, Workspace } from './types'

const API_BASE = '/api'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }))
    throw new Error(error.error || 'An error occurred')
  }
  return response.json()
}

// Bookmark API
export const bookmarkApi = {
  async getAll(params?: {
    q?: string
    folder?: string
    tag?: string
    archived?: boolean
    cursor?: string
    limit?: number
    workspaceId?: string
  }): Promise<BookmarkPage> {
    const searchParams = new URLSearchParams()
    if (params?.workspaceId) searchParams.set('workspaceId', params.workspaceId)
    if (params?.q) searchParams.set('q', params.q)
    if (params?.folder) searchParams.set('folder', params.folder)
    if (params?.tag) searchParams.set('tag', params.tag)
    if (params?.archived) searchParams.set('archived', 'true')
    if (params?.cursor) searchParams.set('cursor', params.cursor)
    if (params?.limit) searchParams.set('limit', String(params.limit))
    
    const res = await fetch(`${API_BASE}/bookmarks?${searchParams}`)
    return handleResponse(res)
  },

  async getById(id: string): Promise<Bookmark> {
    const res = await fetch(`${API_BASE}/bookmarks/${id}`)
    return handleResponse(res)
  },

  async create(data: BookmarkFormData): Promise<Bookmark> {
    const res = await fetch(`${API_BASE}/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse(res)
  },

  async update(id: string, data: Partial<BookmarkFormData & { archived: boolean }>): Promise<Bookmark> {
    const res = await fetch(`${API_BASE}/bookmarks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse(res)
  },

  async archive(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/bookmarks/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to archive bookmark')
  },

  async hardDelete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/bookmarks/${id}?permanent=true`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to permanently delete bookmark')
  },

  async restore(id: string): Promise<Bookmark> {
    return this.update(id, { archived: false })
  },

  async moveToFolder(id: string, folderId: string | null): Promise<Bookmark> {
    return this.update(id, { folderId })
  },

  async setTags(id: string, tagIds: string[]): Promise<Bookmark> {
    return this.update(id, { tags: tagIds })
  },

  async addUrl(
    bookmarkId: string,
    data: { url: string; isPrimary?: boolean; label?: string }
  ): Promise<BookmarkUrl> {
    const res = await fetch(`${API_BASE}/bookmarks/${bookmarkId}/urls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<BookmarkUrl>(res)
  },

  async removeUrl(bookmarkId: string, urlId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/bookmarks/${bookmarkId}/urls/${urlId}`, {
      method: 'DELETE',
    })
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({ error: 'Failed to remove URL' }))
      throw new Error(err.error || 'Failed to remove URL')
    }
  },
}

// Folder API
export const folderApi = {
  async getAll(workspaceId: string): Promise<Folder[]> {
    const res = await fetch(`${API_BASE}/folders?workspaceId=${encodeURIComponent(workspaceId)}`)
    return handleResponse(res)
  },

  async create(name: string, workspaceId: string, parentId?: string): Promise<Folder> {
    const res = await fetch(`${API_BASE}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, workspaceId, parentId }),
    })
    return handleResponse(res)
  },

  async update(id: string, name: string): Promise<Folder> {
    const res = await fetch(`${API_BASE}/folders`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name }),
    })
    return handleResponse(res)
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/folders?id=${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete folder')
  },
}

// Tag API
export const tagApi = {
  async getAll(workspaceId: string): Promise<Tag[]> {
    const res = await fetch(`${API_BASE}/tags?workspaceId=${encodeURIComponent(workspaceId)}`)
    return handleResponse(res)
  },

  async create(name: string, workspaceId: string): Promise<Tag> {
    const res = await fetch(`${API_BASE}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, workspaceId }),
    })
    return handleResponse(res)
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/tags?id=${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete tag')
  },
}

// Workspace API
export const workspaceApi = {
  async getAll(userId: string): Promise<Workspace[]> {
    const res = await fetch(`${API_BASE}/workspaces?userId=${userId}`)
    return handleResponse(res)
  },

  async getById(id: string): Promise<Workspace> {
    const res = await fetch(`${API_BASE}/workspaces/${id}`)
    return handleResponse(res)
  },

  async create(name: string, userId: string): Promise<Workspace> {
    const res = await fetch(`${API_BASE}/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, userId }),
    })
    return handleResponse(res)
  },

  async update(id: string, name: string): Promise<Workspace> {
    const res = await fetch(`${API_BASE}/workspaces/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    return handleResponse(res)
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/workspaces/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete workspace')
  },
}

// Auth API (Custom JWT-based)
export const authApi = {
  async signUp(email: string, password: string, name?: string): Promise<{ id: string; email: string; name?: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    return handleResponse(res)
  },

  async signIn(email: string, password: string): Promise<{ id: string; email: string; name?: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return handleResponse(res)
  },

  async signOut(): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/logout`, { method: 'POST' })
    if (!res.ok) throw new Error('Failed to sign out')
  },

  async getSession(): Promise<{ data: { id: string; email: string; name?: string } }> {
    const res = await fetch(`${API_BASE}/auth/me`)
    return handleResponse(res)
  },
}
