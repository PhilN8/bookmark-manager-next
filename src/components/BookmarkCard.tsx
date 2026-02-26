'use client'

import { Link, Edit, Trash2, ExternalLink, Folder, Tag } from 'lucide-react'
import { Bookmark } from '@/lib/store'
import { cn } from '@/lib/utils'

import { useState } from 'react'

interface BookmarkCardProps {
  bookmark: Bookmark
  folders: { id: string; name: string }[]
  tags: { id: string; name: string }[]
  onEdit: (bookmark: Bookmark) => void
  onDelete: (id: string) => void
  onMoveFolder: (bookmarkId: string, folderId: string) => void
  onToggleTag: (bookmarkId: string, tagId: string) => void
}

export function BookmarkCard({ bookmark, folders, tags, onEdit, onDelete, onMoveFolder, onToggleTag }: BookmarkCardProps) {
  const primaryUrl = bookmark.urls.find((u) => u.isPrimary) || bookmark.urls[0]
  const [showFolderSelect, setShowFolderSelect] = useState(false)

  return (
    <div className="group bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {bookmark.title}
          </h3>
          {bookmark.description && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
              {bookmark.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-1 transition-opacity duration-200">
          {primaryUrl && (
            <a
              href={primaryUrl.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              title="Open URL"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => onEdit(bookmark)}
            className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(bookmark.id)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
            title="Archive"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {bookmark.urls.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {bookmark.urls.slice(0, 3).map((url) => (
            <div key={url.id} className="flex items-center gap-2 text-sm">
              <Link className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className={cn('truncate text-muted-foreground', url.isPrimary && 'text-foreground font-medium')}>
                {url.label || url.url}
              </span>
              {url.isPrimary && (
                <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">
                  Primary
                </span>
              )}
            </div>
          ))}
          {bookmark.urls.length > 3 && (
            <p className="text-xs text-muted-foreground">+{bookmark.urls.length - 3} more</p>
          )}
        </div>
      )}

      {bookmark.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {bookmark.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {bookmark.folder && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Folder className="w-3 h-3" />
          <span>{bookmark.folder.name}</span>
        </div>
      )}
      
      {/* Quick Folder Change */}
      <div className="mt-3 relative">
        <button
          onClick={() => setShowFolderSelect(!showFolderSelect)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Folder className="w-3 h-3" />
          <span>{bookmark.folder ? 'Move to...' : 'Add to folder...'}</span>
        </button>
        {showFolderSelect && (
          <div className="absolute z-10 mt-1 py-1 bg-card border border-border rounded-lg shadow-lg min-w-32">
            <button
              onClick={() => { onMoveFolder(bookmark.id, ''); setShowFolderSelect(false) }}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-secondary"
            >
              No folder
            </button>
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => { onMoveFolder(bookmark.id, folder.id); setShowFolderSelect(false) }}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-secondary"
              >
                {folder.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Quick Tag Toggle */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.map(tag => {
          const hasTag = bookmark.tags.some(t => t.tag.id === tag.id)
          return (
            <button
              key={tag.id}
              onClick={() => onToggleTag(bookmark.id, tag.id)}
              className={`text-xs px-2 py-1 rounded-full font-medium transition-all ${
                hasTag 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {tag.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
