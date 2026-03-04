# AGENTS.md

This file provides guidance to AI assistants working in this repository.

---

## Project Overview

**Pearl** — a personal bookmark manager built with Next.js 16 (App Router). Users organise bookmarks into workspaces, folders and tags, with per-workspace search and archive/restore. The aesthetic draws from the Pearl Framer template: clean, minimal, characterful.

---

## Architecture at a Glance

```
src/
├── app/                  # Next.js routes (pages + API)
│   ├── layout.tsx        # Provider chain: ReactQuery → Theme → Auth
│   ├── page.tsx          # Main app UI (orchestrates feature hooks/components)
│   ├── login/            # Login page
│   ├── register/         # Register page
│   └── api/              # REST API routes
│       ├── auth/         # login, register, logout, me
│       ├── bookmarks/    # CRUD + archive/restore + tag operations
│       ├── folders/      # CRUD with parent-child hierarchy
│       ├── tags/         # CRUD scoped to workspace
│       └── workspaces/   # CRUD with ownership checks
├── features/             # Feature-scoped code (hooks + components + barrel exports)
│   ├── auth/
│   ├── bookmarks/
│   ├── folders/
│   ├── tags/
│   └── workspaces/
├── components/           # Shared cross-feature UI
│   └── ui/               # shadcn/ui primitives
├── lib/                  # Shared utilities and infrastructure
│   ├── api.ts            # Typed fetch wrappers for every resource
│   ├── auth.ts           # JWT helpers (createToken, verifyToken, getAuthUser)
│   ├── prisma.ts         # Singleton PrismaClient
│   ├── schemas.ts        # All Zod schemas
│   ├── store.ts          # Zustand — UI state only
│   ├── theme.ts          # Zustand persisted theme store
│   ├── types.ts          # Shared TypeScript interfaces
│   ├── useDebounce.ts    # Generic debounce hook
│   └── utils.ts          # cn() class merge utility
├── middleware.ts          # JWT auth guard for all /api/* routes
└── tests/
    ├── unit/
    ├── components/
    └── feature/
```

---

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16 |
| Language | TypeScript (strict mode) | 5 |
| Database / ORM | Prisma + PostgreSQL (SQLite for local dev) | 5.22 |
| Auth | Custom JWT via `jose` + `bcryptjs`; `better-auth` present but secondary | — |
| Server state | `@tanstack/react-query` v5 | 5.90 |
| Client UI state | Zustand v5 | 5.0 |
| Validation | Zod v4 | 4.3 |
| Styling | Tailwind CSS v4 + shadcn/ui + Radix UI | — |
| Icons | lucide-react | — |
| Toasts | sonner | — |
| Testing | Jest 30 + Testing Library | — |

---

## Development Commands

```bash
npm run dev            # Start development server
npm run build          # Production build
npm run build:local    # Build with local env
npm run build:prod     # Build with production env
npm run db:setup       # Run migrations (initial setup)
npm run db:migrate     # Deploy pending migrations
npm run db:push        # Push schema changes (dev only)
npm run lint           # ESLint
npm test               # Run all tests
npm run test:coverage  # Tests with coverage report
```

---

## Auth System

The app uses **custom JWT cookie auth**. `better-auth` is installed but is not the primary auth path.

### Flow
1. `POST /api/auth/login` — verifies password with `bcryptjs`, signs a HS256 JWT (7d), sets `auth-token` httpOnly cookie.
2. `src/middleware.ts` — runs on all `/api/*` routes; verifies the cookie JWT via `jose`, injects `x-user-id` / `x-user-email` headers. Public paths that bypass: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me`.
3. Protected API routes call `getAuthUser()` from `lib/auth.ts` which reads the cookie, verifies the JWT, and returns the full user from DB.
4. The client session is managed by `useAuth` (in `features/auth/`) which queries `GET /api/auth/me`.

### Key helpers — `src/lib/auth.ts`
- `getAuthUser()` — call this in every protected API route handler. Returns `null` if unauthenticated; return `401` immediately.
- `createToken(payload)` / `verifyToken(token)` — JWT sign/verify.
- `setAuthCookie(token)` / `clearAuthCookie()` — cookie config objects for responses.

### API Route Auth Pattern
```ts
const user = await getAuthUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```
All resource routes must also enforce **ownership**: verify the requested resource belongs to `user.id` before returning or mutating it.

---

## State Management

State is split cleanly between server state (React Query) and client UI state (Zustand). **Never mix them.**

### React Query — server state
All data fetched from the API lives here. No manual `fetch`/`useEffect`/`setIsLoading` patterns.

**Query key conventions:**
```ts
["auth", "session"]
["workspaces", userId]
["bookmarks", workspaceId, { q, folder, tag, archived }]
["folders", workspaceId]
["tags", workspaceId]
```

**Global defaults** (in `ReactQueryProvider.tsx`):
- `staleTime: 30s`, `gcTime: 5min`, `retry: 1`, `refetchOnWindowFocus: false`

**Mutation + invalidation pattern:**
```ts
const createX = useMutation({
  mutationFn: (data) => xApi.create(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["x", workspaceId] }),
});
```
Always invalidate after mutations. Scope invalidation to the current workspace.

**v5 syntax rules:**
- Use `isPending` (not `isLoading`) on mutations.
- Use `gcTime` (not `cacheTime`).
- Options are object-only (no positional overloads).

### Zustand — client UI state only
`src/lib/store.ts` holds **only** UI selection state and user identity. It does **not** hold server data arrays.

```ts
// What belongs in useStore:
user                  // Identity mirror — synced from React Query via useEffect in useAuth
selectedWorkspaceId   // Active workspace
selectedFolderId      // Active folder filter
selectedTagId         // Active tag filter
searchQuery           // Live search input value
showArchived          // Archive view toggle
```

**Do not add** `bookmarks`, `folders`, `tags`, `workspaces`, `isLoading`, or any server data to the Zustand store. React Query owns that.

`src/lib/theme.ts` is a separate persisted Zustand store for the `light`/`dark`/`system` theme preference. Do not merge it with `useStore`.

---

## Feature Structure

Each feature lives in `src/features/<name>/` and follows this structure:

```
features/<name>/
├── components/     # UI components owned by this feature
├── hooks/
│   ├── use<Name>.ts   # The primary data hook
│   └── index.ts       # Barrel: export { use<Name> }
├── server/         # (reserved) Server Actions, if added
└── index.ts        # Feature barrel: export { Component, useHook }
```

### Rules
- Always create `hooks/index.ts` and `index.ts` barrel exports.
- Hooks use `useStore` for workspace/filter/user context, and React Query for data fetching.
- Components import from their own feature hooks, not from sibling features.
- `page.tsx` imports from feature barrels only — no deep imports into feature internals.

### Existing features

| Feature | Hook | Components | Query key |
|---|---|---|---|
| `auth` | `useAuth` | — | `["auth", "session"]` |
| `bookmarks` | `useBookmarks` | `BookmarkCard`, `BookmarkForm` | `["bookmarks", workspaceId, filters]` |
| `folders` | `useFolders` | `FolderTree` | `["folders", workspaceId]` |
| `tags` | `useTags` | `TagList` | `["tags", workspaceId]` |
| `workspaces` | `useWorkspaces` | `WorkspaceSwitcher` | `["workspaces", userId]` |

---

## API Layer — `src/lib/api.ts`

Typed fetch wrapper objects exist for every resource: `bookmarkApi`, `folderApi`, `tagApi`, `workspaceApi`, `authApi`. Use these in hooks instead of writing raw `fetch` calls.

```ts
// Prefer:
bookmarkApi.create(data)
// Over:
fetch('/api/bookmarks', { method: 'POST', body: JSON.stringify(data), ... })
```

Currently `useFolders` and `useTags` use inline `fetch`. When touching those hooks, migrate them to `folderApi` / `tagApi`.

---

## Database

### Schema highlights
- `Workspace` scopes all data — every `Bookmark`, `Folder`, and `Tag` belongs to a workspace.
- Bookmarks are **soft-deleted** (`archived: true`). Hard delete is not implemented.
- `Tag.name` is unique per workspace (`@@unique([workspaceId, name])`).
- `Folder` is self-referential with `parentId`; deleting a folder moves its bookmarks to root via `$transaction`.
- `BookmarkUrl.isPrimary` is enforced in application logic, not a DB constraint.

### Rules
- Use `getAuthUser()` + ownership checks in all API routes — never trust a resource ID without verifying it belongs to the authenticated user.
- Write migrations for all schema changes. Never use `db:push` in production.
- Use `$transaction` when an operation involves multiple writes that must be atomic.
- Test database operations in `src/tests/feature/` using `describeIfDatabase` (skips gracefully when `DATABASE_URL` is absent).

---

## Validation

All validation uses Zod. Schemas live in `src/lib/schemas.ts`.

```ts
// Always safeParse — never parse (never throw on invalid input)
const result = createBookmarkSchema.safeParse(body);
if (!result.success) {
  return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
}
```

- Define reusable schemas in `src/lib/schemas.ts`, not inline in route handlers.
- Write custom error messages for user-facing validation failures.
- Test both valid and invalid cases, including boundary conditions (max lengths, empty strings, invalid formats).

---

## Testing

### Organisation

| Directory | Environment | Dependencies | Purpose |
|---|---|---|---|
| `src/tests/unit/` | default (jsdom) | none | Hooks, utils, schemas, store |
| `src/tests/components/` | `@jest-environment jsdom` (pragma) | mocked | React components in isolation |
| `src/tests/feature/` | `@jest-environment jsdom` (pragma) | Prisma or mocked fetch | DB integration + full-page render |

### Rules
- All tests are TypeScript (`.test.ts` or `.test.tsx`).
- No `console.log` or `debugger` in tests or production code.
- Every new feature and every bug fix must include tests. Features without tests are incomplete.
- Coverage targets: **50%+ statements overall; 100% on new/changed code**.

### DB integration tests
```ts
const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;
describeIfDatabase("Bookmarks API", () => { ... });
```

### Component tests with React Query
Any test that renders a component using `useQuery` or `useMutation` must be wrapped in a `QueryClientProvider`:
```ts
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderWithQueryClient(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>{ui}</QueryClientProvider>
  );
}
```

### Async assertions
Use `screen.findBy*()` (not `getBy*()`) when the element appears asynchronously (e.g., after a React Query fetch resolves):
```ts
// Correct — waits for async data
const tag = await screen.findByText("React", {}, { timeout: 5000 });

// Wrong — will fail if data hasn't loaded yet
const tag = screen.getByText("React");
```

### Mocking the Zustand store in tests
The store is mocked at the module level; provide a `dynamicStore` object with the **lean** interface (only the fields that currently exist in `useStore`):
```ts
jest.mock("@/lib/store", () => ({ useStore: jest.fn() }));
const useStoreMock = useStore as jest.MockedFunction<typeof useStore>;
useStoreMock.mockImplementation(() => dynamicStore);
```
Pre-populate `user` and `selectedWorkspaceId` in test store state so React Query hooks are enabled (they gate on `!!user && !!selectedWorkspaceId`).

### Additional Jest best practices
- Use `jest.useFakeTimers()` + `act()` for debounce/throttle tests; restore with `jest.useRealTimers()` in `afterEach`.
- Mock `useRouter()` from `next/navigation` in all component tests.
- Prefer `screen.getByRole()` / `screen.getByText()` over container refs.

---

## Component Development

### Design Direction
The app is named **Pearl**. The aesthetic is clean, modern, and minimal — generous whitespace, monochromatic palette with sharp accent pops, distinctive typography (Geist display/mono), subtle depth through shadows and borders. It should feel considered and calm, not cluttered.

Before writing any component:
1. **Understand the purpose** — what does this solve? for whom?
2. **Commit to the aesthetic** — restraint, precision, deliberate spacing.
3. **Consider motion** — hover states, transitions, micro-interactions; CSS-only where possible.
4. **Every component should feel designed**, not generated.

### Practical rules
- Use `cn()` from `src/lib/utils.ts` for all conditional class merging.
- Use CSS variables (Tailwind theme tokens: `bg-background`, `text-foreground`, `border-border`, etc.) — never hard-coded colours.
- Support both light and dark themes; test both.
- Toasts use `sonner`. Archive/restore confirmations use `ConfirmModal`. Do not use `window.confirm` except in folder delete (which already does so).
- shadcn/ui components live in `src/components/ui/`. Add new ones via the shadcn CLI. Do not hand-roll primitives that shadcn already provides.

### What to avoid
- Generic AI-generated aesthetics.
- Overused fonts (Inter, Roboto, Arial, system-ui). The project uses Geist.
- Clichéd color schemes (purple gradients on white).
- Predictable, cookie-cutter layouts.
- Render-phase side effects — never call `setState` / `setUser` / `router.push` directly in the render body of a hook or component. Use `useEffect`.

---

## Code Style

- TypeScript strict mode throughout. No `any` unless absolutely necessary with a comment explaining why.
- `@/` path alias maps to `src/`. Use it for all internal imports.
- No `console.log` in production code.
- Centralise validation in `src/lib/schemas.ts` and API helpers in `src/lib/api.ts`.
- Follow existing naming conventions: `useX` for hooks, `XProvider` for context providers, `XList`/`XCard`/`XForm` for components.
- `src/lib/hooks.ts` has been deleted — do not recreate it. Feature hooks live in their feature folder.
