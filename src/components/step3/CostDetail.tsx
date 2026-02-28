import { useProjectStore } from '@/store/useProjectStore'
import { calcItemCost, calcEffectiveHours, calcContainerCost } from '@/core/calculator'
import { formatCurrency, formatHours, formatNumber } from '@/utils/format'
import { CATEGORY_LABELS, ROLE_LABELS, type EstimateItem } from '@/types/estimate'
import { OverrideIndicator } from '@/components/ui/OverrideIndicator'

export function CostDetail() {
  const items = useProjectStore((s) => s.items)
  const hourlyRate = useProjectStore((s) => s.pricing.hourlyRate)
  const contextMultiplier = useProjectStore((s) => s.context.contextMultiplier)
  const costOverrides = useProjectStore((s) => s.costOverrides)
  const setCostOverride = useProjectStore((s) => s.setCostOverride)
  const clearCostOverride = useProjectStore((s) => s.clearCostOverride)

  const rootItems = items
    .filter((i) => !i.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  if (rootItems.length === 0) {
    return (
      <div className="text-sm text-gray-400 py-6 text-center">
        Нет элементов. Добавьте их на шаге 2.
      </div>
    )
  }

  const getItemCost = (item: EstimateItem): number => {
    if (item.overrides.cost && costOverrides[item.id] != null) {
      return costOverrides[item.id]!
    }
    if (item.isContainer) {
      return calcContainerCost(item, items, hourlyRate, contextMultiplier, costOverrides)
    }
    return calcItemCost(item, hourlyRate, contextMultiplier)
  }

  const renderCostCell = (item: EstimateItem, cost: number) => (
    <div className="flex items-center justify-end gap-1">
      {item.overrides.cost ? (
        <>
          <input
            type="number"
            value={costOverrides[item.id] ?? cost}
            onChange={(e) => setCostOverride(item.id, parseFloat(e.target.value) || 0)}
            className="w-24 text-sm text-right border border-amber-300 bg-amber-50 rounded px-2 py-0.5"
          />
          <OverrideIndicator
            isOverridden={true}
            onReset={() => clearCostOverride(item.id)}
            tooltip="Сбросить ручную стоимость"
          />
        </>
      ) : (
        <button
          type="button"
          onClick={() => setCostOverride(item.id, Math.round(cost))}
          className="text-sm text-gray-700 hover:text-primary-600 text-right min-w-[80px]"
          title="Нажмите для ручной правки"
        >
          {formatCurrency(cost)}
        </button>
      )}
    </div>
  )

  const renderRow = (item: EstimateItem, depth: number) => {
    const cost = getItemCost(item)
    const children = items
      .filter((i) => i.parentId === item.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const isContainer = item.isContainer

    return (
      <div key={item.id}>
        {/* Desktop row */}
        <div
          className={`hidden md:grid grid-cols-[1fr_80px_80px_120px] gap-2 items-center py-2 px-3 ${
            isContainer ? 'bg-gray-50 font-medium' : 'hover:bg-gray-50'
          } ${depth > 0 ? 'border-l-2 border-gray-200' : ''}`}
          style={{ paddingLeft: `${12 + depth * 20}px` }}
        >
          <div className="text-sm text-gray-800 truncate">
            {isContainer && <span className="text-gray-400 mr-1">📁</span>}
            {item.name}
            {!isContainer && (
              <span className="text-xs text-gray-400 ml-2">
                {CATEGORY_LABELS[item.category]}
                {item.role !== 'author' && ` · ${ROLE_LABELS[item.role]}`}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 text-right">
            {!isContainer && item.pricingModel === 'time_based' && (
              <span>{formatNumber(item.quantity)} × {formatNumber(item.hoursPerUnit, 1)}</span>
            )}
            {!isContainer && item.pricingModel === 'fixed_price' && (
              <span className="text-xs text-gray-400">фикс.</span>
            )}
          </div>
          <div className="text-sm text-gray-600 text-right">
            {!isContainer && item.pricingModel === 'time_based' && (
              <span>{formatHours(calcEffectiveHours(item) * item.quantity)}</span>
            )}
          </div>
          {renderCostCell(item, cost)}
        </div>

        {/* Mobile row */}
        <div
          className={`md:hidden flex items-center justify-between py-2 px-3 gap-2 ${
            isContainer ? 'bg-gray-50 font-medium' : 'hover:bg-gray-50'
          } ${depth > 0 ? 'border-l-2 border-gray-200' : ''}`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <div className="min-w-0 flex-1">
            <div className="text-sm text-gray-800 truncate">
              {isContainer && <span className="text-gray-400 mr-1">📁</span>}
              {item.name}
            </div>
            {!isContainer && item.pricingModel === 'time_based' && (
              <div className="text-xs text-gray-400">
                {formatNumber(item.quantity)} × {formatNumber(item.hoursPerUnit, 1)} ч = {formatHours(calcEffectiveHours(item) * item.quantity)}
              </div>
            )}
          </div>
          {renderCostCell(item, cost)}
        </div>

        {children.length > 0 && children.map((child) => renderRow(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">Детализация стоимости</h3>

      {/* Desktop header */}
      <div className="hidden md:grid grid-cols-[1fr_80px_80px_120px] gap-2 px-3 py-2 bg-gray-100 rounded-t text-xs text-gray-500 font-medium">
        <div>Позиция</div>
        <div className="text-right">Кол-во × Ч</div>
        <div className="text-right">Часы</div>
        <div className="text-right">Стоимость</div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden flex justify-between px-3 py-2 bg-gray-100 rounded-t text-xs text-gray-500 font-medium">
        <div>Позиция</div>
        <div>Стоимость</div>
      </div>

      <div className="border border-gray-200 rounded-b divide-y divide-gray-100">
        {rootItems.map((item) => renderRow(item, 0))}
      </div>

      <p className="text-xs text-gray-400">
        Нажмите на стоимость, чтобы задать вручную. Ручные правки помечаются ✏️.
      </p>
    </div>
  )
}
