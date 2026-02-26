'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { Bookmark, BookmarkUrl, Folder, Tag } from '@/lib/store'

interface BookmarkFormProps {
  bookmark?: Bookmark | null
  folders: Folder[]
  tags: Tag[]
  onSubmit: (data: { title: string; description?: string; folderId?: string; tags: string[]; urls: { url: string; isPrimary: boolean; label?: string }[] }) => void
  onClose: () => void
}

export function BookmarkForm({ bookmark, folders, tags, onSubmit, onClose }: BookmarkFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [folderId, setFolderId] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [urls, setUrls] = useState<{ url: string; isPrimary: boolean; label: string }[]>([])
  const [newTagName, setNewTagName] = useState('')

  useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title)
      setDescription(bookmark.description || '')
      setFolderId(bookmark.folderId || '')
      setSelectedTags(bookmark.tags.map(({ tag }) => tag.id))
      setUrls(bookmark.urls.map((u) => ({ url: u.url, isPrimary: u.isPrimary, label: u.label || '' })))
    } else {
      setUrls([{ url: '', isPrimary: true, label: '' }])
    }
  }, [bookmark])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || urls.length === 0 || !urls[0].url.trim()) return
    
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      folderId: folderId || undefined,
      tags: selectedTags,
      urls: urls.filter((u) => u.url.trim()).map((u, i) => ({
        url: u.url.trim(),
        isPrimary: i === 0 || u.isPrimary,
        label: u.label.trim() || undefined,
      })),
    })
  }

  const addUrl = () => {
    setUrls([...urls, { url: '', isPrimary: false, label: '' }])
  }

  const removeUrl = (index: number) => {
    if (urls.length === 1) return
    const newUrls = urls.filter((_, i) => i !== index)
    if (!newUrls.some((u) => u.isPrimary)) {
      newUrls[0].isPrimary = true
    }
    setUrls(newUrls)
  }

  const updateUrl = (index: number, field: string, value: string | boolean) => {
    const newUrls = [...urls]
    newUrls[index] = { ...newUrls[index], [field]: value }
    if (field === 'isPrimary' && value) {
      newUrls.forEach((u, i) => { if (i !== index) u.isPrimary = false })
    }
    setUrls(newUrls)
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId])
  }

  const createAndAddTag = () => {
    if (newTagName.trim()) {
      const tempId = `temp-${Date.now()}`
      setSelectedTags([...selectedTags, tempId])
      setNewTagName('')
    }
  }

  const flattenFolders = (folders: Folder[], depth = 0): { id: string; name: string; depth: number }[] => {
    return folders.flatMap((f) => [
      { id: f.id, name: f.name, depth },
      ...flattenFolders(f.children || [], depth + 1),
    ])
  }

  const flatFolders = flattenFolders(folders)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{bookmark ? 'Edit Bookmark' : 'New Bookmark'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Folder</label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No folder</option>
              {flatFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  {'—'.repeat(f.depth)} {f.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URLs *</label>
            <div className="space-y-2">
              {urls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={url.isPrimary}
                    onChange={(e) => updateUrl(index, 'isPrimary', e.target.checked)}
                    className="w-4 h-4"
                    title="Primary URL"
                  />
                  <input
                    type="url"
                    value={url.url}
                    onChange={(e) => updateUrl(index, 'url', e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={index === 0}
                  />
                  <input
                    type="text"
                    value={url.label}
                    onChange={(e) => updateUrl(index, 'label', e.target.value)}
                    placeholder="Label (optional)"
                    className="w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeUrl(index)}
                    disabled={urls.length === 1}
                    className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addUrl} className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <Plus className="w-4 h-4" /> Add URL
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedTags.includes(tag.id) ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="New tag"
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={createAndAddTag} className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200">
                Add
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              {bookmark ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
