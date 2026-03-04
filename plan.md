# Bookmark Manager MVP: A Next.js SaaS for Organizing URLs

## 🎯 Objective

Build a single-user bookmark manager allowing users to store multiple URLs per bookmark, organize into folders, tag for discovery, and search across all bookmarks. Validate core bookmark management UX before adding import or snapshots later.

---

## 🏗️ 1. Architecture Design

**Stack:**
- **Frontend**: Next.js 14+ (App Router), React 18+, Tailwind + ShadcnUI
- **Backend**: Next.js API routes, TypeScript, Prisma 5+
- **Database**: PostgreSQL 14+ with ts_vector full-text search
- **Storage**: S3-compatible (AWS or MinIO) for HTML snapshots
- **Auth**: Email/password (bcryptjs) for MVP
- **Utilities**: @node-html-parser (import), node-fetch (snapshot capture)

Single-user workspace initially; no RBAC or multi-tenant complexity.

---

## 🗄️ 2. Database Schema

| Table | Fields | Notes |
|-------|--------|-------|
| **Bookmarks** | id, title, description, folderId (FK), workspaceId (FK), archived, createdAt, updatedAt | Soft-delete via `archived` |
| **BookmarkURLs** | id, bookmarkId (FK), url, isPrimary (UNIQUE per bookmark), label (nullable), addedAt | **Key: Multiple URLs per bookmark** |
| **Folders** | id, workspaceId (FK), name, parentId (FK, nullable), order, createdAt | Hierarchical; reorderable |
| **Tags** | id, workspaceId (FK), name, createdAt | Unique per workspace |
| **BookmarkTags** | bookmarkId (FK), tagId (FK) | Many-to-many |
| **Snapshots** | id, bookmarkUrlId (FK), capturedAt, storageUrl, contentSize, createdAt | Links to URLs, not bookmarks |
| **Users** | id, email, passwordHash, createdAt | Minimal MV |
| **Workspaces** | id, name, userId (FK), createdAt | One per user initially |

**Key Constraints:**
- BookmarkURLs: ONE isPrimary=true per bookmark
- Snapshots: **OUT OF MVP** (post-launch feature)
- GIN index on `ts_vector(bookmarks.title, bookmarks.description, bookmarkUrls.url)`

---

## ✨ 3. Core Feature (MVP Only)

### Bookmarks with Multiple URLs + Tags, Folders & Search

**Capabilities:**
- Create bookmark: title, description, 1+ URLs (each with optional label; one primary)
- Organize into hierarchical folders; drag-drop reorder
- Tag bookmarks; filter by tag or folder in search
- Full-text search across title, description, all URLs
- Edit: add/remove/reorder URLs while enforcing primary URL constraint
- Soft-delete to Archived folder

**API:**
- `POST /api/bookmarks` – { title, description?, folderId?, tags: [tagIds], urls: [{ url, isPrimary, label? }] }
- `GET /api/bookmarks?q=text&tag=tagId&folder=folderId&archived=false` – List with filters
- `GET /api/bookmarks/:id` – Single bookmark + all URLs
- `PUT /api/bookmarks/:id` – Update fields, folder, tags, URL list
- `DELETE /api/bookmarks/:id` – Soft-delete
- `POST /api/bookmarks/:id/urls` – Add URL
- `DELETE /api/bookmarks/:id/urls/:urlId` – Remove URL
- `POST/PUT/DELETE /api/folders` – CRUD folders

**UI:**
- BookmarkList: paginated cards, sortable, quick actions
- BookmarkDetailModal: full editor with URL list, tags, folder picker
- FolderTree: collapsible, drag-drop, quick-add
- SearchBar: text + live facets

**Optimization:**
- GIN index on `ts_vector(title || description || url)`
- Index on (workspaceId, folderId)
- Constraint: one isPrimary=true per bookmark

---

## 🎓 Success Criteria

By the end of MVP:

✅ Create bookmark with multiple URLs and metadata  
✅ Organize into hierarchical folders with drag-drop reordering  
✅ Tag and search (title, description, URLs) with filters  
✅ Edit: add/remove/reorder URLs without breaking integrity  

**Technical skills:**
- PostgreSQL full-text search + GIN indexing
- Multi-URL data model with constraints
- React component architecture (modals, trees, search)
- Next.js API routes with Prisma

---

## 📋 Completed

- Next.js 16 App Router scaffold with TypeScript strict mode
- PostgreSQL/SQLite Prisma schema (Users, Workspaces, Bookmarks, BookmarkUrls, Folders, Tags, Snapshots)
- Full REST API: bookmarks, folders, tags, workspaces, auth
- Custom JWT cookie auth (jose + bcryptjs); middleware guards all `/api/*` routes
- React Query v5 for all server state; Zustand v5 for UI state only
- Feature-scoped architecture: `features/{auth,bookmarks,folders,tags,workspaces}/`
- Full UI: sidebar (workspace switcher, folder tree, tag list), bookmark grid, search, archive toggle
- Soft-delete (archive/restore) for bookmarks
- Hierarchical folders with parent-child nesting
- Per-workspace tags with create/delete
- Workspace CRUD with auto-selection
- Jest 30 + Testing Library test suite (unit, component, feature/DB integration)
- AGENTS.md documenting architecture, patterns and conventions

---

## 🚀 Next Steps

1. **Migrate `useFolders` and `useTags` to typed API wrappers** — replace remaining inline `fetch` calls in those hooks with `folderApi` / `tagApi` from `src/lib/api.ts` to match the rest of the codebase.

2. **Remove or repurpose `src/components/AuthProvider.tsx`** — it wires `better-auth`'s React client but the app uses custom JWT auth; it is dead code that adds confusion.

3. **Adopt `react-hook-form` in `BookmarkForm`** — the library is installed but forms still use plain `useState`; migration would simplify validation, error display, and dirty-state tracking.

4. **Full-text search via GIN index** — a PostgreSQL GIN index on `ts_vector(title, description, url)` is noted in the schema design but not yet created; would improve search performance at scale.

5. **Hard delete for bookmarks** — only soft-archive is implemented; a "permanently delete" action from the archived view is the natural follow-on.

6. **Extend rate limiting** — currently only `POST /api/auth/login` is rate-limited; apply the same guard to `/api/auth/register` and high-frequency write endpoints.

7. **Pagination for the bookmark list** — all bookmarks in a workspace are fetched in a single query; add cursor-based or offset pagination before datasets grow large.

8. **Unit tests for feature hooks** — `useBookmarks`, `useFolders`, `useTags`, `useWorkspaces` have no unit tests; cover them with `renderHook` + `QueryClientProvider` to reach the 100% coverage target on new code.

9. **Nested folder picker in `BookmarkForm`** — the folder selector is currently a flat indented list; replace it with the real `FolderTree` component for consistency and usability with deep hierarchies.

10. **URL sub-resource management (Snapshots groundwork)** — the schema has `Snapshot` and `bookmarks/[id]/urls` is already stubbed in the API; implementing per-URL add/remove in the UI unblocks the snapshot capture feature.
