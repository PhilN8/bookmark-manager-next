# Bookmark Manager - Development Guidelines

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4 |
| State | Zustand 5 |
| Auth | BetterAuth |
| Database | Prisma (SQLite dev / PostgreSQL prod) |
| Validation | Zod + React Hook Form |
| Testing | Jest + React Testing Library |
| Icons | Lucide React |
| Toasts | Sonner |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/               # API endpoints
│   │   ├── auth/          # Authentication routes
│   │   ├── bookmarks/     # Bookmark CRUD
│   │   ├── folders/       # Folder CRUD
│   │   ├── tags/         # Tag CRUD
│   │   └── workspaces/   # Workspace CRUD
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main dashboard
├── components/            # React components
│   ├── AuthProvider.tsx
│   ├── BookmarkCard.tsx
│   ├── BookmarkForm.tsx
│   ├── ConfirmModal.tsx
│   ├── FolderSidebar.tsx
│   ├── LoadingScreen.tsx
│   ├── ThemeProvider.tsx
│   ├── ThemeToggle.tsx
│   └── WorkspaceSwitcher.tsx
├── lib/                   # Utilities & core logic
│   ├── api.ts            # API client functions
│   ├── auth.ts           # BetterAuth configuration
│   ├── hooks.ts          # Custom hooks
│   ├── prisma.ts         # Prisma client
│   ├── schemas.ts        # Zod validation schemas
│   ├── store.ts          # Zustand store
│   ├── theme.ts          # Theme configuration
│   ├── types.ts          # TypeScript interfaces
│   ├── useDebounce.ts    # Debounce hook
│   └── utils.ts          # Utility functions (cn)
└── tests/                 # Test files
    ├── components/        # Component tests
    ├── feature/          # Feature/integration tests
    └── unit/             # Unit tests
```

## Database Schema Patterns

### Core Models

- **User**: BetterAuth user model with sessions/accounts
- **Workspace**: User-scoped container for data (supports future multi-tenancy)
- **Bookmark**: Core entity with soft-delete via `archived` flag
- **BookmarkUrl**: Multiple URLs per bookmark, exactly one `isPrimary`
- **Folder**: Hierarchical with `parentId` self-reference
- **Tag**: Workspace-scoped, unique per workspace
- **BookmarkTag**: Many-to-many join table

### Key Constraints

- `BookmarkUrl.isPrimary` - unique per bookmark (only one primary)
- Workspace isolation via foreign keys and indexes
- Cascade deletes for related entities

## API Patterns

### Route Structure

```typescript
// GET /api/[resource] - List with query params
// POST /api/[resource] - Create
// GET /api/[resource]/:id - Read single
// PUT /api/[resource]/:id - Update
// DELETE /api/[resource]/:id - Soft delete / archive
```

### Request Handling

1. Extract params from `request.url` or JSON body
2. Validate input with Zod schemas
3. Perform Prisma operations with error handling
4. Return appropriate status codes (200, 201, 400, 404, 500)

### Example

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json()
  const validation = createBookmarkSchema.safeParse(body)
  
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  
  try {
    const bookmark = await prisma.bookmark.create({ ... })
    return NextResponse.json(bookmark, { status: 201 })
  } catch (error) {
    console.error('Error creating bookmark:', error)
    return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 })
  }
}
```

## State Management (Zustand)

### Store Pattern

```typescript
interface AppState {
  bookmarks: Bookmark[]
  // ...other state
  setBookmarks: (bookmarks: Bookmark[]) => void
  // ...other actions
}

export const useStore = create<AppState>((set) => ({
  bookmarks: [],
  // ...initial state
  setBookmarks: (bookmarks) => set({ bookmarks }),
  // ...other actions
}))
```

### Usage in Components

```typescript
const { bookmarks, setBookmarks } = useStore()
```

## Component Patterns

### Client Components

Mark components with `"use client"` directive when they use:
- React hooks (useState, useEffect, useCallback)
- Browser APIs
- Event handlers
- Zustand store

### UI Component Structure

```typescript
"use client";

import { SomeIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ComponentProps {
  // props
}

export function Component({ prop1, prop2 }: ComponentProps) {
  return (
    <div className={cn("base-class", "conditional-class")}>
      {/* content */}
    </div>
  )
}
```

### Forms

- Use React Hook Form with Zod resolver
- Validate on submit
- Display errors inline

## Styling (Tailwind CSS 4)

### CSS Variables

The project uses CSS variables for theming (shadcn-like pattern):

```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  /* ... more variables */
}

.dark {
  --background: 222.2 84% 4.9%;
  /* ... dark mode variants */
}
```

### Utility Function

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Validation (Zod)

### Schema Pattern

```typescript
export const createBookmarkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(2000).optional(),
  folderId: z.uuid().nullish(),
  tags: z.array(z.uuid()).optional(),
  urls: z.array(bookmarkUrlSchema).min(1, 'At least one URL is required'),
})
```

### Search Query Sanitization

```typescript
export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/['";\\]/g, '')
    .replace(/(--|#|\/\*|\*\/)/g, '')
    .trim()
}
```

## Authentication (BetterAuth)

- JWT-based sessions with 7-day expiry
- Cookie-based token storage
- Protected routes check session on mount
- Redirect to `/login` if unauthenticated

## Testing (Jest)

### Test Structure

```
tests/
├── unit/           # Pure function tests
├── components/     # React component tests
└── feature/        # Integration/API tests
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:coverage # Run with coverage
```

## Key Conventions

1. **File Naming**: PascalCase for components, camelCase for utilities
2. **Imports**: Use `@/` alias for src directory
3. **Error Handling**: Always wrap async operations in try/catch
4. **Validation**: Validate all user input with Zod
5. **Types**: Define shared types in `src/lib/types.ts`
6. **API Responses**: Consistent `{ error: string }` format for errors
7. **Soft Delete**: Use `archived` flag instead of hard deletes
8. **Icons**: Use Lucide React for all icons

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm test         # Run tests
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth secret key
- `BETTER_AUTH_URL` - Production URL
- `TRUSTED_ORIGINS` - Comma-separated allowed origins
