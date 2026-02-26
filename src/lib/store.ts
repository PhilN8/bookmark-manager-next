import { create } from 'zustand'

export interface BookmarkUrl {
  id: string
  url: string
  isPrimary: boolean
  label: string | null
}

export interface Tag {
  id: string
  name: string
  _count?: { bookmarkTags: number }
}

export interface Bookmark {
  id: string
  title: string
  description: string | null
  folderId: string | null
  workspaceId: string
  archived: boolean
  createdAt: string
  updatedAt: string
  urls: BookmarkUrl[]
  tags: { tag: Tag }[]
  folder: { id: string; name: string } | null
}

export interface Folder {
  id: string
  name: string
  parentId: string | null
  order: number
  children: Folder[]
  _count?: { bookmarks: number }
}

interface AppState {
  bookmarks: Bookmark[]
  folders: Folder[]
  tags: Tag[]
  selectedFolderId: string | null
  selectedTagId: string | null
  searchQuery: string
  showArchived: boolean
  isLoading: boolean
  
  setBookmarks: (bookmarks: Bookmark[]) => void
  setFolders: (folders: Folder[]) => void
  setTags: (tags: Tag[]) => void
  setSelectedFolderId: (id: string | null) => void
  setSelectedTagId: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setShowArchived: (show: boolean) => void
  setIsLoading: (loading: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  bookmarks: [],
  folders: [],
  tags: [],
  selectedFolderId: null,
  selectedTagId: null,
  searchQuery: '',
  showArchived: false,
  isLoading: false,
  
  setBookmarks: (bookmarks) => set({ bookmarks }),
  setFolders: (folders) => set({ folders }),
  setTags: (tags) => set({ tags }),
  setSelectedFolderId: (id) => set({ selectedFolderId: id }),
  setSelectedTagId: (id) => set({ selectedTagId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setShowArchived: (show) => set({ showArchived: show }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}))
