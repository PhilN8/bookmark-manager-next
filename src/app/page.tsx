'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Tag, Archive, Loader2 } from 'lucide-react'
import { useStore, Bookmark } from '@/lib/store'
import { FolderTree } from '@/components/FolderSidebar'
import { BookmarkCard } from '@/components/BookmarkCard'
import { BookmarkForm } from '@/components/BookmarkForm'

const API_BASE = '/api'

export default function Home() {
  const {
    bookmarks, setBookmarks,
    folders, setFolders,
    tags, setTags,
    selectedFolderId, setSelectedFolderId,
    selectedTagId, setSelectedTagId,
    searchQuery, setSearchQuery,
    showArchived, setShowArchived,
    isLoading, setIsLoading,
  } = useStore()

  const [showForm, setShowForm] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)

  const fetchBookmarks = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (selectedFolderId) params.set('folder', selectedFolderId)
      if (selectedTagId) params.set('tag', selectedTagId)
      if (showArchived) params.set('archived', 'true')
      
      const res = await fetch(`${API_BASE}/bookmarks?${params}`)
      if (res.ok) setBookmarks(await res.json())
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, selectedFolderId, selectedTagId, showArchived, setBookmarks, setIsLoading])

  const fetchFolders = async () => {
    const res = await fetch(`${API_BASE}/folders`)
    if (res.ok) setFolders(await res.json())
  }

  const fetchTags = async () => {
    const res = await fetch(`${API_BASE}/tags`)
    if (res.ok) setTags(await res.json())
  }

  useEffect(() => { fetchBookmarks() }, [fetchBookmarks])
  useEffect(() => { fetchFolders(); fetchTags() }, [])

  const handleCreateFolder = async (name: string, parentId?: string) => {
    const res = await fetch(`${API_BASE}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId }),
    })
    if (res.ok) fetchFolders()
  }

  const handleSubmitBookmark = async (data: any) => {
    const url = editingBookmark ? `${API_BASE}/bookmarks/${editingBookmark.id}` : `${API_BASE}/bookmarks`
    const method = editingBookmark ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (res.ok) { setShowForm(false); setEditingBookmark(null); fetchBookmarks() }
  }

  const handleDeleteBookmark = async (id: string) => {
    if (!confirm('Archive this bookmark?')) return
    const res = await fetch(`${API_BASE}/bookmarks/${id}`, { method: 'DELETE' })
    if (res.ok) fetchBookmarks()
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b"><h1 className="text-xl font-bold text-slate-800">Bookmark Manager</h1></div>
        <div className="flex-1 overflow-y-auto">
          <FolderTree folders={folders} selectedFolderId={selectedFolderId} onSelectFolder={setSelectedFolderId} onCreateFolder={handleCreateFolder} />
          <div className="p-2 border-t">
            <h3 className="font-semibold text-sm text-slate-600 px-2 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-1 px-2">
              {tags.map((tag) => (
                <button key={tag.id} onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
                  className={`px-2 py-1 rounded text-xs ${selectedTagId === tag.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b p-4 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search bookmarks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => setShowArchived(!showArchived)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${showArchived ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
            <Archive className="w-4 h-4" />{showArchived ? 'Show Active' : 'Archived'}
          </button>
          <button onClick={() => { setEditingBookmark(null); setShowForm(true) }} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <Plus className="w-4 h-4" />New Bookmark
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
          ) : bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Tag className="w-12 h-12 mb-2" /><p>No bookmarks found</p>
              <button onClick={() => { setEditingBookmark(null); setShowForm(true) }} className="mt-2 text-blue-500 hover:underline">Create your first bookmark</button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bookmarks.map((bookmark) => <BookmarkCard key={bookmark.id} bookmark={bookmark} onEdit={setEditingBookmark} onDelete={handleDeleteBookmark} />)}
            </div>
          )}
        </div>
      </main>
      {showForm && <BookmarkForm bookmark={editingBookmark} folders={folders} tags={tags} onSubmit={handleSubmitBookmark} onClose={() => { setShowForm(false); setEditingBookmark(null) }} />}
    </div>
  )
}
