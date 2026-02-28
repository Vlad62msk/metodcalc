import { useState } from 'react'
import type { LibraryElement } from '@/types/library'
import type { Category, RoleType } from '@/types/estimate'
import { CATEGORY_LABELS, ROLE_LABELS } from '@/types/estimate'

interface ElementEditorProps {
  element?: LibraryElement
  onSave: (data: Omit<LibraryElement, 'id' | 'type' | 'isBuiltIn' | 'isHidden'>) => void
  onCancel: () => void
}

export function ElementEditor({ element, onSave, onCancel }: ElementEditorProps) {
  const [name, setName] = useState(element?.name ?? '')
  const [hoursPerUnit, setHoursPerUnit] = useState(element?.hoursPerUnit ?? 2)
  const [unit, setUnit] = useState(element?.unit ?? 'шт.')
  const [category, setCategory] = useState<Category>(element?.category ?? 'content')
  const [role, setRole] = useState<RoleType>(element?.role ?? 'author')
  const [revisionable, setRevisionable] = useState(element?.revisionable ?? true)
  const [description, setDescription] = useState(element?.description ?? '')

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ name, hoursPerUnit, unit, category, role, revisionable, description })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-gray-500">Название</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1"
          placeholder="Название элемента"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">Часов на единицу</label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={hoursPerUnit}
            onChange={(e) => setHoursPerUnit(parseFloat(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Единица</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">Категория</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1"
          >
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Роль</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as RoleType)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1"
          >
            {Object.entries(ROLE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={revisionable}
          onChange={(e) => setRevisionable(e.target.checked)}
          className="text-primary-600"
        />
        <span className="text-sm text-gray-600">Подлежит правкам</span>
      </label>

      <div>
        <label className="text-xs text-gray-500">Описание</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1"
          placeholder="Краткое описание..."
        />
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
          disabled={!name.trim()}
          className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-40"
        >
          {element ? 'Сохранить' : 'Добавить'}
        </button>
      </div>
    </div>
  )
}
