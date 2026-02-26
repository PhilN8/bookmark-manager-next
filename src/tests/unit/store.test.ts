import { useStore } from '@/lib/store'

// Mock localStorage for Zustand
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(global, 'localStorage', { value: mockLocalStorage })

describe('Store', () => {
  beforeEach(() => {
    // Reset store state
    useStore.setState({
      bookmarks: [],
      folders: [],
      tags: [],
      selectedFolderId: null,
      selectedTagId: null,
      searchQuery: '',
      showArchived: false,
      isLoading: false,
    })
  })

  describe('initial state', () => {
    it('should have empty bookmarks', () => {
      const { bookmarks } = useStore.getState()
      expect(bookmarks).toEqual([])
    })

    it('should have empty folders', () => {
      const { folders } = useStore.getState()
      expect(folders).toEqual([])
    })

    it('should have empty tags', () => {
      const { tags } = useStore.getState()
      expect(tags).toEqual([])
    })

    it('should have no selected folder', () => {
      const { selectedFolderId } = useStore.getState()
      expect(selectedFolderId).toBeNull()
    })

    it('should have no selected tag', () => {
      const { selectedTagId } = useStore.getState()
      expect(selectedTagId).toBeNull()
    })

    it('should have empty search query', () => {
      const { searchQuery } = useStore.getState()
      expect(searchQuery).toBe('')
    })

    it('should not show archived by default', () => {
      const { showArchived } = useStore.getState()
      expect(showArchived).toBe(false)
    })

    it('should not be loading by default', () => {
      const { isLoading } = useStore.getState()
      expect(isLoading).toBe(false)
    })
  })

  describe('setters', () => {
    it('should set bookmarks', () => {
      const mockBookmarks = [{ id: '1', title: 'Test', description: null, folderId: null, workspaceId: 'test', archived: false, createdAt: '', updatedAt: '', urls: [], tags: [], folder: null }]
      useStore.getState().setBookmarks(mockBookmarks)
      expect(useStore.getState().bookmarks).toEqual(mockBookmarks)
    })

    it('should set folders', () => {
      const mockFolders = [{ id: '1', name: 'Test Folder', parentId: null, order: 0, children: [] }]
      useStore.getState().setFolders(mockFolders)
      expect(useStore.getState().folders).toEqual(mockFolders)
    })

    it('should set tags', () => {
      const mockTags = [{ id: '1', name: 'Test Tag' }]
      useStore.getState().setTags(mockTags)
      expect(useStore.getState().tags).toEqual(mockTags)
    })

    it('should set selected folder ID', () => {
      useStore.getState().setSelectedFolderId('folder-1')
      expect(useStore.getState().selectedFolderId).toBe('folder-1')
    })

    it('should set selected tag ID', () => {
      useStore.getState().setSelectedTagId('tag-1')
      expect(useStore.getState().selectedTagId).toBe('tag-1')
    })

    it('should set search query', () => {
      useStore.getState().setSearchQuery('test query')
      expect(useStore.getState().searchQuery).toBe('test query')
    })

    it('should set show archived', () => {
      useStore.getState().setShowArchived(true)
      expect(useStore.getState().showArchived).toBe(true)
    })

    it('should set is loading', () => {
      useStore.getState().setIsLoading(true)
      expect(useStore.getState().isLoading).toBe(true)
    })
  })

  describe('clear selection', () => {
    it('should clear selected folder when set to null', () => {
      useStore.getState().setSelectedFolderId('folder-1')
      useStore.getState().setSelectedFolderId(null)
      expect(useStore.getState().selectedFolderId).toBeNull()
    })

    it('should clear selected tag when set to null', () => {
      useStore.getState().setSelectedTagId('tag-1')
      useStore.getState().setSelectedTagId(null)
      expect(useStore.getState().selectedTagId).toBeNull()
    })
  })
})
