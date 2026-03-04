import { create } from 'zustand'

interface AppState {
  user: { id: string; email: string; name: string | null } | null
  selectedWorkspaceId: string | null
  selectedFolderId: string | null
  selectedTagId: string | null
  searchQuery: string
  showArchived: boolean

  setUser: (user: { id: string; email: string; name: string | null } | null) => void
  setSelectedWorkspaceId: (id: string | null) => void
  setSelectedFolderId: (id: string | null) => void
  setSelectedTagId: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setShowArchived: (show: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  user: null,
  selectedWorkspaceId: null,
  selectedFolderId: null,
  selectedTagId: null,
  searchQuery: '',
  showArchived: false,

  setUser: (user) => set({ user }),
  setSelectedWorkspaceId: (id) => set({ selectedWorkspaceId: id }),
  setSelectedFolderId: (id) => set({ selectedFolderId: id }),
  setSelectedTagId: (id) => set({ selectedTagId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setShowArchived: (show) => set({ showArchived: show }),
}))
