import { create } from 'zustand'
import { Bookmark, Folder, Tag, Workspace } from './types'

interface AppState {
  bookmarks: Bookmark[]
  folders: Folder[]
  tags: Tag[]
  workspaces: Workspace[]
  selectedWorkspaceId: string | null
  selectedFolderId: string | null
  selectedTagId: string | null
  searchQuery: string
  showArchived: boolean
  isLoading: boolean
  
  setBookmarks: (bookmarks: Bookmark[]) => void
  setFolders: (folders: Folder[]) => void
  setTags: (tags: Tag[]) => void
  setWorkspaces: (workspaces: Workspace[]) => void
  setSelectedWorkspaceId: (id: string | null) => void
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
  workspaces: [],
  selectedWorkspaceId: null,
  selectedFolderId: null,
  selectedTagId: null,
  searchQuery: '',
  showArchived: false,
  isLoading: false,
  
  setBookmarks: (bookmarks) => set({ bookmarks }),
  setFolders: (folders) => set({ folders }),
  setTags: (tags) => set({ tags }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  setSelectedWorkspaceId: (id) => set({ selectedWorkspaceId: id }),
  setSelectedFolderId: (id) => set({ selectedFolderId: id }),
  setSelectedTagId: (id) => set({ selectedTagId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setShowArchived: (show) => set({ showArchived: show }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}))
