import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useProjectStore } from '@/store/useProjectStore'
import { useStore } from 'zustand'
import { ItemTree } from './ItemTree'
import { AddItemForm } from './AddItemForm'
import { LibraryPanel } from './LibraryPanel'
import { ImportFromProjectModal } from './ImportFromProjectModal'
import { ChecklistModal } from '@/components/checklist/ChecklistModal'

export function Step2Items() {
  const { id: projectId } = useParams<{ id: string }>()
  const addItem = useProjectStore((s) => s.addItem)
  const [showLibrary, setShowLibrary] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)

  const { undo, redo, pastStates, futureStates } = useStore(useProjectStore.temporal)
  const canUndo = pastStates.length > 0
  const canRedo = futureStates.length > 0

  const handleAddGroup = () => {
    addItem({
      name: 'Новая группа',
      clientName: 'Новая группа',
      isContainer: true,
      containerMode: 'sum_children',
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Что делаем?</h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => undo()}
            disabled={!canUndo}
            className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Отменить (Ctrl+Z)"
          >
            ↩ Отменить
          </button>
          <button
            type="button"
            onClick={() => redo()}
            disabled={!canRedo}
            className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Повторить (Ctrl+Shift+Z)"
          >
            ↪ Повторить
          </button>
        </div>
      </div>
      <div className="text-sm text-gray-500 space-y-1.5">
        <p>
          Соберите список работ. Добавляйте элементы вручную или из библиотеки готовых шаблонов.
          Группируйте связанные позиции. Для каждого элемента укажите количество и трудоёмкость в часах.
        </p>
        <p>
          Если у вас есть затруднения в определении состава работ, используйте{' '}
          <button
            type="button"
            onClick={() => setShowChecklist(true)}
            className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
          >
            📋 чек-лист методиста
          </button>
        </p>
      </div>

      <ItemTree />

      <div className="flex flex-wrap gap-2 pt-2">
        <AddItemForm />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleAddGroup}
          className="text-sm text-gray-600 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50"
        >
          + Добавить группу
        </button>
        <button
          type="button"
          onClick={() => setShowLibrary(!showLibrary)}
          className="text-sm text-primary-600 border border-primary-300 rounded px-3 py-1.5 hover:bg-primary-50"
        >
          Из библиотеки
        </button>
        <button
          type="button"
          onClick={() => setShowImport(true)}
          className="text-sm text-gray-600 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50"
        >
          Из проекта
        </button>
      </div>

      {showLibrary && <LibraryPanel onClose={() => setShowLibrary(false)} />}
      <ImportFromProjectModal
        open={showImport}
        onClose={() => setShowImport(false)}
        currentProjectId={projectId}
      />
      <ChecklistModal open={showChecklist} onClose={() => setShowChecklist(false)} />
    </div>
  )
}
