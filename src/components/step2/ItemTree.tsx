import { useProjectStore } from '@/store/useProjectStore'
import { ItemRow } from './ItemRow'
import { ContainerRow } from './ContainerRow'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'

export function ItemTree() {
  const items = useProjectStore((s) => s.items)
  const pricing = useProjectStore((s) => s.pricing)
  const context = useProjectStore((s) => s.context)
  const reorderItems = useProjectStore((s) => s.reorderItems)

  const rootItems = items
    .filter((i) => i.parentId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = rootItems.findIndex((i) => i.id === active.id)
    const newIndex = rootItems.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const newOrder = arrayMove(rootItems, oldIndex, newIndex).map((i) => i.id)
    reorderItems(newOrder)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={rootItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {rootItems.map((item) => {
            if (item.isContainer) {
              const children = items.filter((i) => i.parentId === item.id)
              return (
                <ContainerRow
                  key={item.id}
                  container={item}
                  children={children}
                  allItems={items}
                  depth={0}
                  hourlyRate={pricing.hourlyRate}
                  contextMultiplier={context.contextMultiplier}
                />
              )
            }
            return (
              <ItemRow
                key={item.id}
                item={item}
                depth={0}
                hourlyRate={pricing.hourlyRate}
                contextMultiplier={context.contextMultiplier}
              />
            )
          })}
          {items.length === 0 && (
            <div className="text-sm text-gray-400 py-8 text-center">
              Добавьте элементы сметы вручную или из библиотеки
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  )
}
