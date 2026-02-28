import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { ItemTree } from './ItemTree'
import { AddItemForm } from './AddItemForm'
import { LibraryPanel } from './LibraryPanel'

export function Step2Items() {
  const addItem = useProjectStore((s) => s.addItem)
  const [showLibrary, setShowLibrary] = useState(false)

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
      <h2 className="text-xl font-semibold text-gray-900">Что делаем?</h2>
      <p className="text-sm text-gray-500">
        Соберите список работ. Добавляйте элементы вручную или из библиотеки готовых шаблонов.
        Группируйте связанные позиции. Для каждого элемента укажите количество и трудоёмкость в часах.
      </p>

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
      </div>

      {showLibrary && <LibraryPanel onClose={() => setShowLibrary(false)} />}
    </div>
  )
}
