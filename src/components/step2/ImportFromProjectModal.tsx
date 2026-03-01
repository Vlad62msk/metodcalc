import { useEffect, useState } from 'react'
import { listProjects, getProject } from '@/storage/projectsDb'
import { useProjectStore } from '@/store/useProjectStore'
import type { StoredProject } from '@/storage/db'
import type { EstimateItem } from '@/types/estimate'
import { generateId } from '@/utils/id'
import { formatCurrency } from '@/utils/format'

interface Props {
  open: boolean
  onClose: () => void
  currentProjectId?: string
}

export function ImportFromProjectModal({ open, onClose, currentProjectId }: Props) {
  const [projects, setProjects] = useState<StoredProject[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [projectItems, setProjectItems] = useState<EstimateItem[]>([])
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const addItem = useProjectStore((s) => s.addItem)

  useEffect(() => {
    if (!open) return
    listProjects().then((all) => {
      setProjects(all.filter((p) => p.id !== currentProjectId))
    })
  }, [open, currentProjectId])

  useEffect(() => {
    if (!selectedProjectId) {
      setProjectItems([])
      setCheckedIds(new Set())
      return
    }
    setLoading(true)
    getProject(selectedProjectId).then((p) => {
      if (p) {
        setProjectItems(p.state.items)
      }
      setLoading(false)
    })
  }, [selectedProjectId])

  if (!open) return null

  const rootItems = projectItems
    .filter((i) => !i.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const getChildren = (parentId: string) =>
    projectItems.filter((i) => i.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder)

  const toggleItem = (id: string, isContainer: boolean) => {
    const next = new Set(checkedIds)
    if (next.has(id)) {
      next.delete(id)
      if (isContainer) {
        // Uncheck all descendants
        const uncheck = (parentId: string) => {
          getChildren(parentId).forEach((c) => {
            next.delete(c.id)
            if (c.isContainer) uncheck(c.id)
          })
        }
        uncheck(id)
      }
    } else {
      next.add(id)
      if (isContainer) {
        // Check all descendants
        const check = (parentId: string) => {
          getChildren(parentId).forEach((c) => {
            next.add(c.id)
            if (c.isContainer) check(c.id)
          })
        }
        check(id)
      }
    }
    setCheckedIds(next)
  }

  const handleImport = () => {
    const selectedItems = projectItems.filter((i) => checkedIds.has(i.id))
    // Build ID mapping for new UUIDs
    const idMap = new Map<string, string>()
    selectedItems.forEach((item) => {
      idMap.set(item.id, generateId())
    })

    for (const item of selectedItems) {
      const newParentId = item.parentId && idMap.has(item.parentId) ? idMap.get(item.parentId)! : null
      addItem({
        ...item,
        id: idMap.get(item.id)!,
        parentId: newParentId,
        source: 'manual',
        libraryElementId: null,
        overrides: {
          hoursPerUnit: false,
          qualityLevel: false,
          roleMultiplier: false,
          fixedPrice: false,
          cost: false,
        },
      })
    }
    onClose()
  }

  const renderItem = (item: EstimateItem, depth: number) => {
    const children = getChildren(item.id)
    return (
      <div key={item.id}>
        <label
          className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-2"
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
        >
          <input
            type="checkbox"
            checked={checkedIds.has(item.id)}
            onChange={() => toggleItem(item.id, item.isContainer)}
            className="text-primary-600 rounded"
          />
          <span className={`text-sm ${item.isContainer ? 'font-medium' : ''}`}>
            {item.name}
          </span>
          {item.isContainer && (
            <span className="text-xs text-gray-400">({children.length})</span>
          )}
          {!item.isContainer && (
            <span className="text-xs text-gray-400 ml-auto">
              {item.hoursPerUnit}ч × {item.quantity}
            </span>
          )}
        </label>
        {children.map((child) => renderItem(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Импорт из проекта</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            &times;
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Project selector */}
          <div>
            <label className="text-sm font-medium text-gray-700">Выберите проект</label>
            <select
              value={selectedProjectId ?? ''}
              onChange={(e) => setSelectedProjectId(e.target.value || null)}
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">— Выберите —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatCurrency(p.totalAmount)})
                </option>
              ))}
            </select>
          </div>

          {/* Items tree */}
          {loading && <p className="text-sm text-gray-400">Загрузка...</p>}

          {!loading && selectedProjectId && projectItems.length === 0 && (
            <p className="text-sm text-gray-400">В проекте нет элементов</p>
          )}

          {!loading && projectItems.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-2 max-h-60 overflow-y-auto">
              <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setCheckedIds(new Set(projectItems.map((i) => i.id)))}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Выбрать все
                </button>
                <button
                  type="button"
                  onClick={() => setCheckedIds(new Set())}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Снять все
                </button>
              </div>
              {rootItems.map((item) => renderItem(item, 0))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={checkedIds.size === 0}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            Импортировать ({checkedIds.size})
          </button>
        </div>
      </div>
    </div>
  )
}
