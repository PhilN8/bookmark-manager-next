'use client'

import { Link, Edit, Trash2, ExternalLink } from 'lucide-react'
import { Bookmark } from '@/lib/store'
import { cn } from '@/lib/utils'

interface BookmarkCardProps {
  bookmark: Bookmark
  onEdit: (bookmark: Bookmark) => void
  onDelete: (id: string) => void
}

export function BookmarkCard({ bookmark, onEdit, onDelete }: BookmarkCardProps) {
  const primaryUrl = bookmark.urls.find((u) => u.isPrimary) || bookmark.urls[0]

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{bookmark.title}</h3>
          {bookmark.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{bookmark.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {primaryUrl && (
            <a
              href={primaryUrl.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
              title="Open URL"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => onEdit(bookmark)}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(bookmark.id)}
            className="p-1.5 hover:bg-red-50 rounded text-red-500"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {bookmark.urls.length > 0 && (
        <div className="mt-3 space-y-1">
          {bookmark.urls.slice(0, 3).map((url) => (
            <div key={url.id} className="flex items-center gap-2 text-sm">
              <Link className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className={cn('truncate', url.isPrimary && 'font-medium')}>
                {url.label || url.url}
              </span>
              {url.isPrimary && (
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Primary</span>
              )}
            </div>
          ))}
          {bookmark.urls.length > 3 && (
            <p className="text-xs text-slate-400">+{bookmark.urls.length - 3} more URLs</p>
          )}
        </div>
      )}

      {bookmark.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {bookmark.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {bookmark.folder && (
        <div className="mt-2 text-xs text-slate-400">
          Folder: {bookmark.folder.name}
        </div>
      )}
    </div>
  )
}
