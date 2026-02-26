// Bookmark Types
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

// Form Types
export interface BookmarkFormData {
  title: string
  description?: string
  folderId?: string | null
  urls: { url: string; isPrimary: boolean; label?: string }[]
  tags: string[]
}

// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: string
}

// Modal Types
export interface ConfirmModalState {
  isOpen: boolean
  type: "archive" | "restore"
  bookmarkId: string
  bookmarkTitle: string
}
