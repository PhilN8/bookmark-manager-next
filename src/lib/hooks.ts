import { useCallback } from 'react'
import { toast } from 'sonner'
import { useStore } from './store'
import { bookmarkApi, folderApi, tagApi } from './api'
import { useDebounce } from './useDebounce'
import { BookmarkFormData } from './types'

// Bookmark Hook
export function useBookmarks() {
  const {
    bookmarks,
    setBookmarks,
    selectedFolderId,
    selectedTagId,
    showArchived,
    isLoading,
    setIsLoading,
  } = useStore()

  const searchQuery = useStore((state) => state.searchQuery)
  const debouncedSearch = useDebounce(searchQuery, 300)

  const fetchBookmarks = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await bookmarkApi.getAll({
        q: debouncedSearch || undefined,
        folder: selectedFolderId || undefined,
        tag: selectedTagId || undefined,
        archived: showArchived,
      })
      setBookmarks(data)
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
      toast.error('Failed to load bookmarks')
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, selectedFolderId, selectedTagId, showArchived, setBookmarks, setIsLoading])

  const createBookmark = useCallback(async (data: BookmarkFormData) => {
    const bookmark = await bookmarkApi.create(data)
    toast.success('Bookmark created', { description: `"${data.title}" has been added.` })
    return bookmark
  }, [])

  const updateBookmark = useCallback(async (id: string, data: Partial<BookmarkFormData>) => {
    const bookmark = await bookmarkApi.update(id, data)
    toast.success('Bookmark updated', { description: `"${bookmark.title}" has been updated.` })
    return bookmark
  }, [])

  const archiveBookmark = useCallback(async (id: string, title: string) => {
    await bookmarkApi.archive(id)
    toast.success('Bookmark archived', { description: `"${title}" has been archived.` })
  }, [])

  const restoreBookmark = useCallback(async (id: string, title: string) => {
    await bookmarkApi.restore(id)
    toast.success('Bookmark restored', { description: `"${title}" has been restored.` })
  }, [])

  const moveToFolder = useCallback(async (bookmarkId: string, folderId: string | null) => {
    await bookmarkApi.moveToFolder(bookmarkId, folderId)
  }, [])

  const toggleTag = useCallback(async (bookmarkId: string, tagId: string, currentTagIds: string[]) => {
    const hasTag = currentTagIds.includes(tagId)
    const newTagIds = hasTag
      ? currentTagIds.filter((id) => id !== tagId)
      : [...currentTagIds, tagId]
    await bookmarkApi.setTags(bookmarkId, newTagIds)
  }, [])

  return {
    bookmarks,
    isLoading,
    fetchBookmarks,
    createBookmark,
    updateBookmark,
    archiveBookmark,
    restoreBookmark,
    moveToFolder,
    toggleTag,
  }
}

// Folder Hook
export function useFolders() {
  const { folders, setFolders } = useStore()

  const fetchFolders = useCallback(async () => {
    const data = await folderApi.getAll()
    setFolders(data)
  }, [setFolders])

  const createFolder = useCallback(async (name: string, parentId?: string) => {
    await folderApi.create(name, parentId)
    toast.success('Folder created', { description: `"${name}" has been added.` })
  }, [])

  const updateFolder = useCallback(async (id: string, name: string) => {
    await folderApi.update(id, name)
    toast.success('Folder renamed', { description: `"${name}" has been updated.` })
  }, [])

  const deleteFolder = useCallback(async (id: string, name: string) => {
    await folderApi.delete(id)
    toast.success('Folder deleted', { description: `"${name}" has been removed.` })
  }, [])

  return {
    folders,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  }
}

// Tag Hook
export function useTags() {
  const { tags, setTags } = useStore()

  const fetchTags = useCallback(async () => {
    const data = await tagApi.getAll()
    setTags(data)
  }, [setTags])

  const createTag = useCallback(async (name: string) => {
    await tagApi.create(name)
    toast.success('Tag created', { description: `"${name}" has been added.` })
  }, [])

  const deleteTag = useCallback(async (id: string, name: string) => {
    await tagApi.delete(id)
    toast.success('Tag deleted', { description: `"${name}" has been removed.` })
  }, [])

  return {
    tags,
    fetchTags,
    createTag,
    deleteTag,
  }
}
