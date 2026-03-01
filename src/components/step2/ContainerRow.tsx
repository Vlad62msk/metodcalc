import { useState } from 'react'
import type { EstimateItem } from '@/types/estimate'
import { useProjectStore } from '@/store/useProjectStore'
import { calcContainerCost } from '@/core/calculator'
import { formatCurrency } from '@/utils/format'
import { ItemRow } from './ItemRow'
import { ItemSettings } from './ItemSettings'
import { AddItemForm } from './AddItemForm'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'

interface ContainerRowProps {
  container: EstimateItem
  children: EstimateItem[]
  allItems: EstimateItem[]
  depth: number
  hourlyRate: number
  contextMultiplier: number
}

export function ContainerRow({
  container,
  children,
  allItems,
  depth,
  hourlyRate,
  contextMultiplier,
}: ContainerRowProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const updateItem = useProjectStore((s) => s.updateItem)
  const removeItem = useProjectStore((s) => s.removeItem)
  const costOverrides = useProjectStore((s) => s.costOverrides)
  const reorderItems = useProjectStore((s) => s.reorderItems)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: container.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const childSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const cost = calcContainerCost(container, allItems, hourlyRate, contextMultiplier, costOverrides)
  const isFixed = container.containerMode === 'fixed_total'

  const sortedChildren = [...children].sort((a, b) => a.sortOrder - b.sortOrder)

  const handleChildDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sortedChildren.findIndex((i) => i.id === active.id)
    const newIndex = sortedChildren.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const newOrder = arrayMove(sortedChildren, oldIndex, newIndex).map((i) => i.id)
    reorderItems(newOrder)
  }

  return (
    <div ref={setNodeRef} style={style} className={`${depth > 0 ? 'ml-6' : ''}`}>
      <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg group">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none"
          title="Перетащить"
        >
          ⠿
        </button>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-gray-600"
        >
          {collapsed ? '▸' : '▾'}
        </button>

        <input
          type="text"
          value={container.name}
          onChange={(e) => updateItem(container.id, { name: e.target.value, clientName: container.clientName || e.target.value })}
          className="flex-1 text-sm font-medium bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary-300 rounded px-1"
          placeholder="Название группы..."
        />

        {isFixed && <span className="text-xs" title="Фиксированная сумма">🔒</span>}

        <span className="text-sm font-medium text-gray-700 w-24 text-right">
          {formatCurrency(cost)}
        </span>

        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="text-gray-400 hover:text-gray-600 sm:opacity-0 sm:group-hover:opacity-100"
          title="Настройки"
        >
          ⚙️
        </button>

        <button
          type="button"
          onClick={() => removeItem(container.id)}
          className="text-gray-400 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
          title="Удалить группу"
        >
          ×
        </button>
      </div>

      {showSettings && <ItemSettings item={container} onClose={() => setShowSettings(false)} />}

      {!collapsed && (
        <DndContext sensors={childSensors} collisionDetection={closestCenter} onDragEnd={handleChildDragEnd}>
          <SortableContext items={sortedChildren.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="border-l-2 border-gray-200 ml-4">
              {sortedChildren.map((child) => {
                if (child.isContainer) {
                  const grandchildren = allItems.filter((i) => i.parentId === child.id)
                  return (
                    <ContainerRow
                      key={child.id}
                      container={child}
                      children={grandchildren}
                      allItems={allItems}
                      depth={depth + 1}
                      hourlyRate={hourlyRate}
                      contextMultiplier={contextMultiplier}
                    />
                  )
                }
                return (
                  <ItemRow
                    key={child.id}
                    item={child}
                    depth={depth + 1}
                    hourlyRate={hourlyRate}
                    contextMultiplier={contextMultiplier}
                  />
                )
              })}
              <div className="ml-6 py-1">
                <AddItemForm parentId={container.id} compact />
              </div>
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
