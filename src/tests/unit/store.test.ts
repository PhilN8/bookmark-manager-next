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
    useStore.setState({
      user: null,
      selectedWorkspaceId: null,
      selectedFolderId: null,
      selectedTagId: null,
      searchQuery: '',
      showArchived: false,
    })
  })

  describe('initial state', () => {
    it('should have no user by default', () => {
      const { user } = useStore.getState()
      expect(user).toBeNull()
    })

    it('should have no selected workspace by default', () => {
      const { selectedWorkspaceId } = useStore.getState()
      expect(selectedWorkspaceId).toBeNull()
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
  })

  describe('setters', () => {
    it('should set user', () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test' }
      useStore.getState().setUser(mockUser)
      expect(useStore.getState().user).toEqual(mockUser)
    })

    it('should clear user', () => {
      useStore.getState().setUser({ id: 'user-1', email: 'test@example.com', name: null })
      useStore.getState().setUser(null)
      expect(useStore.getState().user).toBeNull()
    })

    it('should set selected workspace ID', () => {
      useStore.getState().setSelectedWorkspaceId('ws-1')
      expect(useStore.getState().selectedWorkspaceId).toBe('ws-1')
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
