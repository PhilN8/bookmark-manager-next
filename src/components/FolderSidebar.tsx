'use client'

import { useState } from 'react'
import { Folder, FolderOpen, Plus, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Folder as FolderType } from '@/lib/store'

interface FolderTreeProps {
  folders: FolderType[]
  selectedFolderId: string | null
  onSelectFolder: (id: string | null) => void
  onCreateFolder: (name: string, parentId?: string) => void
}

export function FolderTree({ folders, selectedFolderId, onSelectFolder, onCreateFolder }: FolderTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [isCreating, setIsCreating] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const handleCreateFolder = (parentId?: string) => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), parentId)
      setNewFolderName('')
      setIsCreating(null)
    }
  }

  const renderFolder = (folder: FolderType, depth: number = 0) => {
    const hasChildren = folder.children && folder.children.length > 0
    const isExpanded = expandedIds.has(folder.id)
    const isSelected = selectedFolderId === folder.id

    return (
      <div key={folder.id}>
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm',
            'hover:bg-slate-100 dark:hover:bg-slate-800',
            isSelected && 'bg-blue-100 dark:bg-blue-900 text-blue-700'
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => onSelectFolder(folder.id)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpand(folder.id) }}
              className="p-0.5 hover:bg-slate-200 rounded"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : <span className="w-5" />}
          {isExpanded ? <FolderOpen className="w-4 h-4 text-slate-500" /> : <Folder className="w-4 h-4 text-slate-500" />}
          <span className="truncate flex-1">{folder.name}</span>
          <span className="text-xs text-slate-400">{folder._count?.bookmarks || 0}</span>
        </div>
        {isExpanded && hasChildren && (
          <div>{folder.children.map((child) => renderFolder(child, depth + 1))}</div>
        )}
        {isCreating === folder.id && (
          <div className="flex items-center gap-1 px-2 py-1" style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder(folder.id)
                if (e.key === 'Escape') setIsCreating(null)
              }}
              className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        )}
      </div>
    )
  }

  const rootFolders = folders.filter((f) => !f.parentId)

  return (
    <div className="p-2">
      <div className="flex items-center justify-between px-2 py-1 mb-2">
        <h3 className="font-semibold text-sm text-slate-600">Folders</h3>
        <button onClick={() => setIsCreating('root')} className="p-1 hover:bg-slate-100 rounded" title="New folder">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm',
          'hover:bg-slate-100',
          selectedFolderId === null && 'bg-blue-100'
        )}
        onClick={() => onSelectFolder(null)}
      >
        <Folder className="w-4 h-4 text-slate-500" />
        <span className="flex-1">All Bookmarks</span>
      </div>
      {rootFolders.map((folder) => renderFolder(folder))}
      {isCreating === 'root' && (
        <div className="flex items-center gap-1 px-2 py-1 mt-1">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder()
              if (e.key === 'Escape') setIsCreating(null)
            }}
            placeholder="Folder name"
            className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      )}
    </div>
  )
}
