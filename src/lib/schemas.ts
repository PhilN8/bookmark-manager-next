import { z } from 'zod'

// Bookmark URL validation
export const bookmarkUrlSchema = z.object({
  url: z.string().url('Invalid URL format'),
  isPrimary: z.boolean().optional(),
  label: z.string().optional(),
})

// Create bookmark validation
export const createBookmarkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(2000).optional(),
  folderId: z.string().optional().nullable(),
  tags: z.array(z.string().uuid()).optional(),
  urls: z.array(bookmarkUrlSchema).min(1, 'At least one URL is required'),
  workspaceId: z.string().optional(),
})

// Update bookmark validation
export const updateBookmarkSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  folderId: z.string().optional().nullable(),
  tags: z.array(z.string().uuid()).optional(),
  urls: z.array(bookmarkUrlSchema).optional(),
  archived: z.boolean().optional(),
})

// Folder validation
export const createFolderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  parentId: z.string().uuid().optional().nullable(),
  workspaceId: z.string().optional(),
})

export const updateFolderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  parentId: z.string().uuid().optional().nullable(),
  order: z.number().int().optional(),
})

// Tag validation
export const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  workspaceId: z.string().optional(),
})

// Sanitize search query - prevent injection
export function sanitizeSearchQuery(query: string): string {
  // Remove potential SQL injection patterns
  return query
    .replace(/['";\\]/g, '') // Remove quotes and semicolons
    .replace(/(--|#|\/\*|\*\/)/g, '') // Remove comment patterns
    .trim()
}
