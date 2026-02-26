import { Bookmark, BookmarkFormData, Folder, Tag } from './types'

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
  }): Promise<Bookmark[]> {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.set('q', params.q)
    if (params?.folder) searchParams.set('folder', params.folder)
    if (params?.tag) searchParams.set('tag', params.tag)
    if (params?.archived) searchParams.set('archived', 'true')
    
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

  async restore(id: string): Promise<Bookmark> {
    return this.update(id, { archived: false })
  },

  async moveToFolder(id: string, folderId: string | null): Promise<Bookmark> {
    return this.update(id, { folderId })
  },

  async setTags(id: string, tagIds: string[]): Promise<Bookmark> {
    return this.update(id, { tags: tagIds })
  },
}

// Folder API
export const folderApi = {
  async getAll(): Promise<Folder[]> {
    const res = await fetch(`${API_BASE}/folders`)
    return handleResponse(res)
  },

  async create(name: string, parentId?: string): Promise<Folder> {
    const res = await fetch(`${API_BASE}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId }),
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
  async getAll(): Promise<Tag[]> {
    const res = await fetch(`${API_BASE}/tags`)
    return handleResponse(res)
  },

  async create(name: string): Promise<Tag> {
    const res = await fetch(`${API_BASE}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    return handleResponse(res)
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/tags?id=${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete tag')
  },
}
