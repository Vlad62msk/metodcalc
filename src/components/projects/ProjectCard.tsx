import { useState, useRef, useEffect } from 'react'
import type { ProjectSummary } from '@/store/useProjectsStore'
import { formatCurrency, formatHours, formatRelativeDate, formatMultiplier } from '@/utils/format'

interface ProjectCardProps {
  project: ProjectSummary
  onOpen: () => void
  onRename: (name: string) => void
  onDuplicate: () => void
  onExport: () => void
  onDelete: () => void
}

export function ProjectCard({
  project,
  onOpen,
  onRename,
  onDuplicate,
  onExport,
  onDelete,
}: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(project.name)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [renaming])

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== project.name) {
      onRename(trimmed)
    }
    setRenaming(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {renaming ? (
            <input
              ref={inputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit()
                if (e.key === 'Escape') setRenaming(false)
              }}
              className="text-sm font-semibold w-full border border-primary-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          ) : (
            <button
              type="button"
              onClick={onOpen}
              className="text-sm font-semibold text-gray-900 hover:text-primary-600 text-left truncate block w-full"
            >
              {project.name}
            </button>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {formatRelativeDate(project.updatedAt)}
          </p>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-400 hover:text-gray-600 px-1 py-0.5 text-lg leading-none"
          >
            &#x22EF;
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
              <button
                type="button"
                onClick={() => { setMenuOpen(false); setRenameValue(project.name); setRenaming(true) }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Переименовать
              </button>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onDuplicate() }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Дублировать
              </button>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onExport() }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Экспорт JSON
              </button>
              <hr className="my-1 border-gray-100" />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  if (confirm(`Удалить проект «${project.name}»?`)) onDelete()
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Удалить
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
        <span className="font-medium text-gray-700">{formatCurrency(project.totalAmount)}</span>
        <span>{formatHours(project.totalHours)}</span>
        <span>{formatMultiplier(project.contextMultiplier)}</span>
      </div>
    </div>
  )
}
