import { z } from 'zod'

// Bookmark URL validation
export const bookmarkUrlSchema = z.object({
  url: z.url(),
  isPrimary: z.boolean().optional(),
  label: z.string().optional(),
})

// Create bookmark validation
export const createBookmarkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(2000).optional(),
  folderId: z.uuid().nullish(),
  tags: z.array(z.uuid()).optional(),
  urls: z.array(bookmarkUrlSchema).min(1, 'At least one URL is required'),
  workspaceId: z.string().optional(),
})

// Update bookmark validation
export const updateBookmarkSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  folderId: z.uuid().nullish(),
  tags: z.array(z.uuid()).optional(),
  urls: z.array(bookmarkUrlSchema).optional(),
  archived: z.boolean().optional(),
})

// Folder validation
export const createFolderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  parentId: z.uuid().nullish(),
  workspaceId: z.string().optional(),
})

export const updateFolderSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(100).optional(),
  parentId: z.uuid().nullish(),
  order: z.number().int().optional(),
})

// Tag validation
export const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  workspaceId: z.string().optional(),
})

// Auth validation
export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Sanitize search query - prevent injection and tsquery syntax errors
export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/#/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .replace(/:/g, '')   // colon causes invalid tsquery syntax (e.g. "foo:bar")
    .trim()
}
