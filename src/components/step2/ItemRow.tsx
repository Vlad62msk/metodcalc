import { useState } from 'react'
import type { EstimateItem } from '@/types/estimate'
import { ROLE_LABELS, CONFIDENCE_LEVELS } from '@/types/estimate'
import { useProjectStore } from '@/store/useProjectStore'
import { calcItemCost } from '@/core/calculator'
import { formatCurrency } from '@/utils/format'
import { ItemSettings } from './ItemSettings'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ItemRowProps {
  item: EstimateItem
  depth: number
  hourlyRate: number
  contextMultiplier: number
}

export function ItemRow({ item, depth, hourlyRate, contextMultiplier }: ItemRowProps) {
  const updateItem = useProjectStore((s) => s.updateItem)
  const removeItem = useProjectStore((s) => s.removeItem)
  const costOverrides = useProjectStore((s) => s.costOverrides)
  const [showSettings, setShowSettings] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const cost = item.overrides.cost
    ? costOverrides[item.id] ?? 0
    : calcItemCost(item, hourlyRate, contextMultiplier)

  const effectiveMultiplier = item.roleMultiplier * item.qualityLevel
  const showMultiplier = effectiveMultiplier !== 1.0

  return (
    <div ref={setNodeRef} style={style} className={`${depth > 0 ? 'ml-6' : ''}`}>
      <div className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg group">
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
        {/* Name */}
        <input
          type="text"
          value={item.name}
          onChange={(e) => updateItem(item.id, { name: e.target.value, clientName: item.clientName || e.target.value })}
          className="flex-1 text-sm bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary-300 rounded px-1"
          placeholder="Название..."
        />

        {/* Quantity × Hours */}
        {!item.isContainer && (
          <>
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
              className="w-12 text-sm text-center bg-transparent border border-gray-200 rounded px-1 py-0.5"
            />
            <span className="text-xs text-gray-400">×</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={item.hoursPerUnit}
              onChange={(e) =>
                updateItem(item.id, {
                  hoursPerUnit: parseFloat(e.target.value) || 0,
                  overrides: { ...item.overrides, hoursPerUnit: true },
                })
              }
              className="w-14 text-sm text-center bg-transparent border border-gray-200 rounded px-1 py-0.5"
            />
            <span className="text-xs text-gray-400">ч</span>
          </>
        )}

        {/* Unit */}
        {item.unit && (
          <span className="text-xs text-gray-400 hidden sm:inline">[{item.unit}]</span>
        )}

        {/* Role badge */}
        {item.role !== 'author' && (
          <span className="text-xs text-gray-500">{ROLE_LABELS[item.role]}</span>
        )}

        {/* Effective multiplier */}
        {showMultiplier && (
          <span className="text-xs text-primary-600" title={`Роль ×${item.roleMultiplier} · Качество ×${item.qualityLevel}`}>
            ×{effectiveMultiplier.toFixed(2)}
          </span>
        )}

        {/* Fixed price lock */}
        {(item.pricingModel === 'fixed_price' || (item.isContainer && item.containerMode === 'fixed_total')) && (
          <span className="text-xs" title="Фиксированная цена. Контекстный коэффициент не применяется.">🔒</span>
        )}

        {/* Confidence indicator */}
        {item.confidence != null && (
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
              CONFIDENCE_LEVELS.find((c) => c.value === item.confidence)?.color ?? 'bg-gray-300'
            }`}
            title={`Уверенность: ${CONFIDENCE_LEVELS.find((c) => c.value === item.confidence)?.label ?? '?'}`}
          />
        )}

        {/* Cost */}
        <span className="text-sm font-medium text-gray-700 w-24 text-right">
          {formatCurrency(cost)}
        </span>

        {/* Settings */}
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Настройки"
        >
          ⚙️
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => removeItem(item.id)}
          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Удалить"
        >
          ×
        </button>
      </div>

      {showSettings && <ItemSettings item={item} onClose={() => setShowSettings(false)} />}
    </div>
  )
}
