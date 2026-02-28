import { useState, useMemo } from 'react'
import { useLibraryStore } from '@/store/useLibraryStore'
import { useProjectStore } from '@/store/useProjectStore'
import type { LibraryElement, LibrarySet } from '@/types/library'

interface LibraryPanelProps {
  onClose: () => void
}

export function LibraryPanel({ onClose }: LibraryPanelProps) {
  const allElements = useLibraryStore((s) => s.elements)
  const allSets = useLibraryStore((s) => s.sets)
  const elements = useMemo(() => allElements.filter((e) => !e.isHidden), [allElements])
  const sets = useMemo(() => allSets.filter((e) => !e.isHidden), [allSets])
  const addItem = useProjectStore((s) => s.addItem)
  const addItemsFromSet = useProjectStore((s) => s.addItemsFromSet)
  const [tab, setTab] = useState<'elements' | 'sets'>('elements')
  const [search, setSearch] = useState('')

  const filtered =
    tab === 'elements'
      ? elements.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
      : sets.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))

  const handleAddElement = (el: LibraryElement) => {
    addItem({
      name: el.name,
      hoursPerUnit: el.hoursPerUnit,
      unit: el.unit,
      category: el.category,
      role: el.role,
      revisionable: el.revisionable,
      libraryElementId: el.id,
      source: 'library_element',
      clientName: el.name,
    })
  }

  const handleAddSet = (set: LibrarySet) => {
    addItemsFromSet(
      set.name,
      set.items.map((si) => ({
        name: si.name,
        hoursPerUnit: si.hoursPerUnit,
        unit: si.unit,
        category: si.category,
        role: si.role,
        revisionable: si.revisionable,
        clientName: si.name,
      })),
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Библиотека</h3>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setTab('elements')}
          className={`px-3 py-1 text-xs rounded ${
            tab === 'elements' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          Элементы ({elements.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('sets')}
          className={`px-3 py-1 text-xs rounded ${
            tab === 'sets' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          Наборы ({sets.length})
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск..."
        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
      />

      <div className="max-h-80 overflow-y-auto space-y-1">
        {tab === 'elements' &&
          (filtered as LibraryElement[]).map((el) => (
            <div
              key={el.id}
              className="flex items-center justify-between px-2 py-2 hover:bg-gray-50 rounded text-sm"
            >
              <div>
                <div className="font-medium text-gray-700">{el.name}</div>
                <div className="text-xs text-gray-400">
                  {el.hoursPerUnit} ч / {el.unit}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleAddElement(el)}
                className="text-xs text-primary-600 hover:text-primary-700 px-2 py-1 border border-primary-200 rounded"
              >
                + Добавить
              </button>
            </div>
          ))}
        {tab === 'sets' &&
          (filtered as LibrarySet[]).map((set) => (
            <div
              key={set.id}
              className="flex items-center justify-between px-2 py-2 hover:bg-gray-50 rounded text-sm"
            >
              <div>
                <div className="font-medium text-gray-700">{set.name}</div>
                <div className="text-xs text-gray-400">
                  {set.items.length} элемент{set.items.length === 1 ? '' : set.items.length < 5 ? 'а' : 'ов'}
                  {set.description && ` · ${set.description}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleAddSet(set)}
                className="text-xs text-primary-600 hover:text-primary-700 px-2 py-1 border border-primary-200 rounded"
              >
                + Добавить
              </button>
            </div>
          ))}
        {filtered.length === 0 && (
          <div className="text-sm text-gray-400 py-4 text-center">Ничего не найдено</div>
        )}
      </div>
    </div>
  )
}
