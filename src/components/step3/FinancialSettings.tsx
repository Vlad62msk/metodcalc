import { useMemo } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { useLibraryStore } from '@/store/useLibraryStore'
import { Collapsible } from '@/components/ui/Collapsible'
import { TAX_OPTIONS } from '@/core/defaults'
import { formatCurrency, formatNumber } from '@/utils/format'

export function FinancialSettings() {
  const pricing = useProjectStore((s) => s.pricing)
  const setDiscount = useProjectStore((s) => s.setDiscount)
  const setTax = useProjectStore((s) => s.setTax)
  const setVolumeDiscounts = useProjectStore((s) => s.setVolumeDiscounts)
  const addAdjustment = useProjectStore((s) => s.addAdjustment)
  const removeAdjustment = useProjectStore((s) => s.removeAdjustment)
  const updateAdjustment = useProjectStore((s) => s.updateAdjustment)
  const getGrandTotal = useProjectStore((s) => s.getGrandTotal)
  const elements = useLibraryStore((s) => s.elements)
  // Subscribe to state that drives grand total
  const items = useProjectStore((s) => s.items)
  const context = useProjectStore((s) => s.context)
  const costOverrides = useProjectStore((s) => s.costOverrides)

  const result = useMemo(
    () => getGrandTotal(),
    [getGrandTotal, items, pricing, context, costOverrides],
  )

  return (
    <Collapsible title="Финансовые настройки">
      <div className="space-y-5">
        {/* Скидка / Наценка */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Скидка / Наценка</label>
          <div className="flex gap-2">
            {(['none', 'percent', 'absolute'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDiscount({ type: t })}
                className={`px-3 py-1 text-xs rounded ${
                  pricing.discount.type === t
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-white border border-gray-300 text-gray-600'
                }`}
              >
                {t === 'none' ? 'Нет' : t === 'percent' ? 'Процент' : 'Сумма'}
              </button>
            ))}
          </div>
          {pricing.discount.type === 'percent' && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={pricing.discount.percentValue}
                onChange={(e) => setDiscount({ percentValue: parseFloat(e.target.value) || 0 })}
                className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <span className="text-xs text-gray-400">% (отрицательное = скидка)</span>
            </div>
          )}
          {pricing.discount.type === 'absolute' && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={pricing.discount.absoluteValue}
                onChange={(e) => setDiscount({ absoluteValue: parseFloat(e.target.value) || 0 })}
                className="w-28 border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <span className="text-xs text-gray-400">₽ (отрицательное = скидка)</span>
            </div>
          )}
        </div>

        {/* Налог */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Налоговая ставка</label>
          <div className="flex flex-wrap gap-2">
            {TAX_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTax({ rate: opt.value })}
                className={`px-3 py-1 text-xs rounded ${
                  pricing.tax.rate === opt.value
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-white border border-gray-300 text-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={pricing.tax.rate}
                onChange={(e) => setTax({ rate: parseFloat(e.target.value) || 0 })}
                className="w-16 text-xs border border-gray-300 rounded px-2 py-1"
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={pricing.tax.showSeparately}
              onChange={(e) => setTax({ showSeparately: e.target.checked })}
              className="text-primary-600"
            />
            <span className="text-xs text-gray-600">Показывать налог отдельной строкой</span>
          </label>
        </div>

        {/* Объёмные скидки */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={pricing.volumeDiscounts.enabled}
              onChange={(e) => setVolumeDiscounts({ enabled: e.target.checked })}
              className="text-primary-600"
            />
            <span className="text-sm font-medium text-gray-700">Объёмные скидки</span>
          </label>
          {pricing.volumeDiscounts.enabled && (
            <div className="space-y-2 ml-6">
              <div className="flex gap-2">
                {(['by_element', 'by_category'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setVolumeDiscounts({ mode })}
                    className={`px-3 py-1 text-xs rounded ${
                      pricing.volumeDiscounts.mode === mode
                        ? 'bg-primary-100 text-primary-700 border border-primary-300'
                        : 'bg-white border border-gray-300 text-gray-600'
                    }`}
                  >
                    {mode === 'by_element' ? 'По типу элемента' : 'По категории'}
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-400">
                Пороги: 1–5 → 0%, 6–15 → -10%, 16–30 → -20%, 31+ → -30%
              </div>
              {pricing.volumeDiscounts.mode === 'by_element' && result.volumeDiscountBreakdown.length > 0 && (
                <div className="space-y-1 mt-2">
                  <div className="text-xs font-medium text-gray-500">Группировка по элементам:</div>
                  {result.volumeDiscountBreakdown.map((group) => {
                    const libName = group.libraryElementId
                      ? elements.find((e) => e.id === group.libraryElementId)?.name
                      : null
                    return (
                      <div key={group.key} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 truncate max-w-[200px]" title={libName || group.displayName}>
                          {libName || group.displayName}
                        </span>
                        <span className="text-gray-400 whitespace-nowrap ml-2">
                          ({formatNumber(group.totalQty, 0)} шт, {group.itemCount} поз.)
                        </span>
                        {group.discountRate > 0 ? (
                          <span className="text-green-600 whitespace-nowrap ml-2">
                            -{formatNumber(group.discountRate * 100, 0)}% &minus;{formatCurrency(group.discountAmount)}
                          </span>
                        ) : (
                          <span className="text-gray-400 whitespace-nowrap ml-2">0%</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Дополнительные корректировки */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Дополнительные корректировки</label>
          {pricing.additionalAdjustments.map((adj) => (
            <div key={adj.id} className="flex items-center gap-2">
              <input
                type="text"
                value={adj.label}
                onChange={(e) => updateAdjustment(adj.id, { label: e.target.value })}
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                placeholder="Описание..."
              />
              <input
                type="number"
                value={adj.amount}
                onChange={(e) => updateAdjustment(adj.id, { amount: parseFloat(e.target.value) || 0 })}
                className="w-28 text-sm border border-gray-300 rounded px-2 py-1"
              />
              <span className="text-xs text-gray-400">₽</span>
              <button
                type="button"
                onClick={() => removeAdjustment(adj.id)}
                className="text-gray-400 hover:text-red-500"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addAdjustment('', 0)}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            + Добавить корректировку
          </button>
        </div>
      </div>
    </Collapsible>
  )
}
