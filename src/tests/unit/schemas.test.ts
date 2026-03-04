import {
  bookmarkUrlSchema,
  createBookmarkSchema,
  createFolderSchema,
  updateFolderSchema,
  createTagSchema,
  sanitizeSearchQuery,
} from '@/lib/schemas'

describe('Zod Schemas', () => {
  describe('bookmarkUrlSchema', () => {
    describe('valid URLs', () => {
      it('should parse a valid URL', () => {
        const result = bookmarkUrlSchema.safeParse({
          url: 'https://example.com',
        })
        expect(result.success).toBe(true)
      })

      it('should parse URL with isPrimary flag', () => {
        const result = bookmarkUrlSchema.safeParse({
          url: 'https://example.com',
          isPrimary: true,
        })
        expect(result.success).toBe(true)
      })

      it('should parse URL with label', () => {
        const result = bookmarkUrlSchema.safeParse({
          url: 'https://example.com',
          label: 'My Website',
        })
        expect(result.success).toBe(true)
      })

      it('should parse URL with all optional fields', () => {
        const result = bookmarkUrlSchema.safeParse({
          url: 'https://example.com',
          isPrimary: false,
          label: 'Test',
        })
        expect(result.success).toBe(true)
      })
    })

    describe('invalid URLs', () => {
      it('should fail for invalid URL format', () => {
        const result = bookmarkUrlSchema.safeParse({
          url: 'not-a-url',
        })
        expect(result.success).toBe(false)
      })

      it('should fail for missing URL', () => {
        const result = bookmarkUrlSchema.safeParse({})
        expect(result.success).toBe(false)
      })

      it('should fail for empty URL', () => {
        const result = bookmarkUrlSchema.safeParse({
          url: '',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('createBookmarkSchema', () => {
    describe('valid input', () => {
      it('should parse valid bookmark data', () => {
        const result = createBookmarkSchema.safeParse({
          title: 'My Bookmark',
          urls: [{ url: 'https://example.com' }],
        })
        expect(result.success).toBe(true)
      })

      it('should parse with all optional fields', () => {
        const result = createBookmarkSchema.safeParse({
          title: 'My Bookmark',
          description: 'A description',
          folderId: '123e4567-e89b-12d3-a456-426614174000',
          tags: ['123e4567-e89b-12d3-a456-426614174001'],
          urls: [{ url: 'https://example.com', isPrimary: true, label: 'Main' }],
        })
        expect(result.success).toBe(true)
      })
    })

    describe('invalid input', () => {
      it('should fail for missing title', () => {
        const result = createBookmarkSchema.safeParse({
          urls: [{ url: 'https://example.com' }],
        })
        expect(result.success).toBe(false)
      })

      it('should fail for empty title', () => {
        const result = createBookmarkSchema.safeParse({
          title: '',
          urls: [{ url: 'https://example.com' }],
        })
        expect(result.success).toBe(false)
      })

      it('should fail for title exceeding max length', () => {
        const result = createBookmarkSchema.safeParse({
          title: 'a'.repeat(501),
          urls: [{ url: 'https://example.com' }],
        })
        expect(result.success).toBe(false)
      })

      it('should fail for description exceeding max length', () => {
        const result = createBookmarkSchema.safeParse({
          title: 'Test',
          description: 'a'.repeat(2001),
          urls: [{ url: 'https://example.com' }],
        })
        expect(result.success).toBe(false)
      })

      it('should fail for empty URLs array', () => {
        const result = createBookmarkSchema.safeParse({
          title: 'Test',
          urls: [],
        })
        expect(result.success).toBe(false)
      })

      it('should fail for invalid URL in array', () => {
        const result = createBookmarkSchema.safeParse({
          title: 'Test',
          urls: [{ url: 'invalid' }],
        })
        expect(result.success).toBe(false)
      })

      it('should fail for invalid UUID in tags', () => {
        const result = createBookmarkSchema.safeParse({
          title: 'Test',
          tags: ['not-a-uuid'],
          urls: [{ url: 'https://example.com' }],
        })
        expect(result.success).toBe(false)
      })

      it('should accept folderId as null', () => {
        const result = createBookmarkSchema.safeParse({
          title: 'Test',
          folderId: null,
          urls: [{ url: 'https://example.com' }],
        })
        expect(result.success).toBe(true)
      })

      it('should accept folderId as undefined', () => {
        const result = createBookmarkSchema.safeParse({
          title: 'Test',
          urls: [{ url: 'https://example.com' }],
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID folderId', () => {
        const result = createBookmarkSchema.safeParse({
          title: 'Test',
          folderId: 'not-a-uuid',
          urls: [{ url: 'https://example.com' }],
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('createFolderSchema', () => {
    describe('valid input', () => {
      it('should parse valid folder data', () => {
        const result = createFolderSchema.safeParse({
          name: 'My Folder',
        })
        expect(result.success).toBe(true)
      })

      it('should parse with optional fields', () => {
        const result = createFolderSchema.safeParse({
          name: 'My Folder',
          parentId: '123e4567-e89b-12d3-a456-426614174000',
          workspaceId: '123e4567-e89b-12d3-a456-426614174001',
        })
        expect(result.success).toBe(true)
      })
    })

    describe('invalid input', () => {
      it('should fail for missing name', () => {
        const result = createFolderSchema.safeParse({})
        expect(result.success).toBe(false)
      })

      it('should fail for empty name', () => {
        const result = createFolderSchema.safeParse({
          name: '',
        })
        expect(result.success).toBe(false)
      })

      it('should fail for name exceeding max length', () => {
        const result = createFolderSchema.safeParse({
          name: 'a'.repeat(101),
        })
        expect(result.success).toBe(false)
      })

      it('should fail for invalid parentId UUID', () => {
        const result = createFolderSchema.safeParse({
          name: 'Test',
          parentId: 'invalid',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('updateFolderSchema', () => {
    describe('valid input', () => {
      it('should parse with all fields', () => {
        const result = updateFolderSchema.safeParse({
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Updated Folder',
          parentId: '123e4567-e89b-12d3-a456-426614174001',
          order: 1,
        })
        expect(result.success).toBe(true)
      })

      it('should parse with only id', () => {
        const result = updateFolderSchema.safeParse({
          id: '123e4567-e89b-12d3-a456-426614174000',
        })
        expect(result.success).toBe(true)
      })
    })

    describe('invalid input', () => {
      it('should fail for missing id', () => {
        const result = updateFolderSchema.safeParse({
          name: 'Test',
        })
        expect(result.success).toBe(false)
      })

      it('should fail for invalid id UUID', () => {
        const result = updateFolderSchema.safeParse({
          id: 'not-a-uuid',
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('createTagSchema', () => {
    describe('valid input', () => {
      it('should parse valid tag', () => {
        const result = createTagSchema.safeParse({
          name: 'javascript',
        })
        expect(result.success).toBe(true)
      })
    })

    describe('invalid input', () => {
      it('should fail for missing name', () => {
        const result = createTagSchema.safeParse({})
        expect(result.success).toBe(false)
      })

      it('should fail for empty name', () => {
        const result = createTagSchema.safeParse({
          name: '',
        })
        expect(result.success).toBe(false)
      })

      it('should fail for name exceeding max length', () => {
        const result = createTagSchema.safeParse({
          name: 'a'.repeat(51),
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('sanitizeSearchQuery', () => {
    it('should return empty string for empty input', () => {
      expect(sanitizeSearchQuery('')).toBe('')
    })

    it('should remove SQL injection patterns', () => {
      expect(sanitizeSearchQuery("'; DROP TABLE users;--")).toBe('DROP TABLE users')
    })

    it('should remove comment patterns', () => {
      expect(sanitizeSearchQuery('test /* comment */ -- more')).toBe('test  comment   more')
    })

    it('should remove quotes and semicolons', () => {
      expect(sanitizeSearchQuery('test "quoted" ; semicolon')).toBe('test quoted  semicolon')
    })

    it('should trim whitespace', () => {
      expect(sanitizeSearchQuery('  test  ')).toBe('test')
    })

    it('should preserve valid search terms', () => {
      expect(sanitizeSearchQuery('javascript tutorial')).toBe('javascript tutorial')
    })

    it('should strip colons to avoid invalid tsquery syntax', () => {
      expect(sanitizeSearchQuery('foo:bar')).toBe('foobar')
    })

    it('should handle mixed tsquery-hostile input', () => {
      expect(sanitizeSearchQuery('react:hooks OR next:js')).toBe('reacthooks OR nextjs')
    })
  })
})
