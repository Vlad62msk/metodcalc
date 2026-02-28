import { useState } from 'react'
import { useLibraryStore } from '@/store/useLibraryStore'
import { Modal } from '@/components/ui/Modal'
import { ElementEditor } from './ElementEditor'
import { SetEditor } from './SetEditor'
import { CATEGORY_LABELS } from '@/types/estimate'
import type { LibraryElement, LibrarySet } from '@/types/library'

interface LibraryManagerProps {
  open: boolean
  onClose: () => void
}

type Tab = 'elements' | 'sets'
type EditMode = { type: 'none' } | { type: 'element'; element?: LibraryElement } | { type: 'set'; set?: LibrarySet }

export function LibraryManager({ open, onClose }: LibraryManagerProps) {
  const [tab, setTab] = useState<Tab>('elements')
  const [editMode, setEditMode] = useState<EditMode>({ type: 'none' })
  const [search, setSearch] = useState('')

  const elements = useLibraryStore((s) => s.elements)
  const sets = useLibraryStore((s) => s.sets)
  const addElement = useLibraryStore((s) => s.addElement)
  const updateElement = useLibraryStore((s) => s.updateElement)
  const removeElement = useLibraryStore((s) => s.removeElement)
  const hideElement = useLibraryStore((s) => s.hideElement)
  const addSet = useLibraryStore((s) => s.addSet)
  const updateSet = useLibraryStore((s) => s.updateSet)
  const removeSet = useLibraryStore((s) => s.removeSet)
  const hideSet = useLibraryStore((s) => s.hideSet)
  const resetBuiltIn = useLibraryStore((s) => s.resetBuiltIn)
  const exportLibrary = useLibraryStore((s) => s.exportLibrary)
  const importLibrary = useLibraryStore((s) => s.importLibrary)

  const filteredElements = elements.filter(
    (e) => e.name.toLowerCase().includes(search.toLowerCase()),
  )
  const filteredSets = sets.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()),
  )

  const handleExport = () => {
    const lib = exportLibrary()
    const blob = new Blob([JSON.stringify(lib, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `library-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const lib = JSON.parse(ev.target?.result as string)
          if (lib.elements && lib.sets && lib.meta) {
            importLibrary(lib)
          } else {
            alert('Неверный формат файла библиотеки')
          }
        } catch {
          alert('Ошибка чтения файла')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <Modal open={open} onClose={onClose} title="Управление библиотекой" wide>
      {editMode.type === 'element' ? (
        <ElementEditor
          element={editMode.element}
          onSave={(data) => {
            if (editMode.element) {
              updateElement(editMode.element.id, data)
            } else {
              addElement(data)
            }
            setEditMode({ type: 'none' })
          }}
          onCancel={() => setEditMode({ type: 'none' })}
        />
      ) : editMode.type === 'set' ? (
        <SetEditor
          librarySet={editMode.set}
          onSave={(data) => {
            if (editMode.set) {
              updateSet(editMode.set.id, data)
            } else {
              addSet(data)
            }
            setEditMode({ type: 'none' })
          }}
          onCancel={() => setEditMode({ type: 'none' })}
        />
      ) : (
        <div className="space-y-4">
          {/* Табы */}
          <div className="flex gap-2">
            {(['elements', 'sets'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-sm rounded ${
                  tab === t
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t === 'elements' ? `Элементы (${elements.length})` : `Наборы (${sets.length})`}
              </button>
            ))}
          </div>

          {/* Поиск */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />

          {/* Список */}
          {tab === 'elements' ? (
            <div className="space-y-1 max-h-[50vh] overflow-y-auto">
              {filteredElements.map((el) => (
                <div
                  key={el.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded ${
                    el.isHidden ? 'opacity-50 bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {el.name}
                      {el.isBuiltIn && <span className="text-xs text-gray-400 ml-2">встроенный</span>}
                    </div>
                    <div className="text-xs text-gray-400">
                      {el.hoursPerUnit} ч/{el.unit} · {CATEGORY_LABELS[el.category]}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => hideElement(el.id, !el.isHidden)}
                      className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                      title={el.isHidden ? 'Показать' : 'Скрыть'}
                    >
                      {el.isHidden ? '👁' : '🙈'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode({ type: 'element', element: el })}
                      className="text-xs text-gray-400 hover:text-primary-600 px-2 py-1"
                    >
                      ✏️
                    </button>
                    {!el.isBuiltIn && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Удалить "${el.name}"?`)) removeElement(el.id)
                        }}
                        className="text-xs text-gray-400 hover:text-red-500 px-2 py-1"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredElements.length === 0 && (
                <div className="text-sm text-gray-400 text-center py-4">Ничего не найдено</div>
              )}
            </div>
          ) : (
            <div className="space-y-1 max-h-[50vh] overflow-y-auto">
              {filteredSets.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded ${
                    s.isHidden ? 'opacity-50 bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {s.name}
                      {s.isBuiltIn && <span className="text-xs text-gray-400 ml-2">встроенный</span>}
                    </div>
                    <div className="text-xs text-gray-400">
                      {s.items.length} элементов · {s.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => hideSet(s.id, !s.isHidden)}
                      className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                    >
                      {s.isHidden ? '👁' : '🙈'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode({ type: 'set', set: s })}
                      className="text-xs text-gray-400 hover:text-primary-600 px-2 py-1"
                    >
                      ✏️
                    </button>
                    {!s.isBuiltIn && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Удалить набор "${s.name}"?`)) removeSet(s.id)
                        }}
                        className="text-xs text-gray-400 hover:text-red-500 px-2 py-1"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredSets.length === 0 && (
                <div className="text-sm text-gray-400 text-center py-4">Ничего не найдено</div>
              )}
            </div>
          )}

          {/* Действия */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() =>
                setEditMode(tab === 'elements' ? { type: 'element' } : { type: 'set' })
              }
              className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              + {tab === 'elements' ? 'Новый элемент' : 'Новый набор'}
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Экспорт
            </button>
            <button
              type="button"
              onClick={handleImport}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Импорт
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Сбросить встроенные элементы и наборы?')) resetBuiltIn()
              }}
              className="px-3 py-1.5 text-sm text-gray-400 border border-gray-200 rounded hover:bg-gray-50"
            >
              Сброс встроенных
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
