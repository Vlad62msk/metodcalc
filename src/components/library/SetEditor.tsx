import { useState } from 'react'
import type { LibrarySet, LibrarySetItem } from '@/types/library'
import type { Category, RoleType } from '@/types/estimate'
import { CATEGORY_LABELS, ROLE_LABELS } from '@/types/estimate'

interface SetEditorProps {
  librarySet?: LibrarySet
  onSave: (data: Omit<LibrarySet, 'id' | 'type' | 'isBuiltIn' | 'isHidden'>) => void
  onCancel: () => void
}

const emptyItem: LibrarySetItem = {
  name: '',
  hoursPerUnit: 2,
  unit: 'шт.',
  category: 'content',
  role: 'author',
  revisionable: true,
}

export function SetEditor({ librarySet, onSave, onCancel }: SetEditorProps) {
  const [name, setName] = useState(librarySet?.name ?? '')
  const [description, setDescription] = useState(librarySet?.description ?? '')
  const [items, setItems] = useState<LibrarySetItem[]>(
    librarySet?.items ?? [{ ...emptyItem }],
  )

  const updateSetItem = (idx: number, changes: Partial<LibrarySetItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...changes } : item)),
    )
  }

  const addSetItem = () => {
    setItems((prev) => [...prev, { ...emptyItem }])
  }

  const removeSetItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSave = () => {
    if (!name.trim()) return
    const validItems = items.filter((i) => i.name.trim())
    if (validItems.length === 0) return
    onSave({ name, description, items: validItems })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-gray-500">Название набора</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1"
          placeholder="Название набора"
          autoFocus
        />
      </div>

      <div>
        <label className="text-xs text-gray-500">Описание</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1"
          placeholder="Краткое описание..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-gray-500 font-medium">Элементы набора</label>
        {items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_60px_60px_80px_80px_auto] gap-1 items-center">
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateSetItem(idx, { name: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1 text-xs"
              placeholder="Название"
            />
            <input
              type="number"
              value={item.hoursPerUnit}
              onChange={(e) => updateSetItem(idx, { hoursPerUnit: parseFloat(e.target.value) || 0 })}
              className="border border-gray-300 rounded px-2 py-1 text-xs"
              title="Часов"
            />
            <input
              type="text"
              value={item.unit}
              onChange={(e) => updateSetItem(idx, { unit: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1 text-xs"
              title="Единица"
            />
            <select
              value={item.category}
              onChange={(e) => updateSetItem(idx, { category: e.target.value as Category })}
              className="border border-gray-300 rounded px-1 py-1 text-xs"
            >
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select
              value={item.role}
              onChange={(e) => updateSetItem(idx, { role: e.target.value as RoleType })}
              className="border border-gray-300 rounded px-1 py-1 text-xs"
            >
              {Object.entries(ROLE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeSetItem(idx)}
              className="text-gray-400 hover:text-red-500 text-sm px-1"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addSetItem}
          className="text-xs text-primary-600 hover:text-primary-700"
        >
          + Добавить элемент
        </button>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim() || items.filter((i) => i.name.trim()).length === 0}
          className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-40"
        >
          {librarySet ? 'Сохранить' : 'Добавить'}
        </button>
      </div>
    </div>
  )
}
