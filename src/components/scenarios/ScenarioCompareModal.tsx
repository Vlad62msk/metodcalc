import { useMemo } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { Modal } from '@/components/ui/Modal'
import { calcGrandTotal } from '@/core/calculator'
import { formatCurrency, formatHours } from '@/utils/format'

interface Props {
  open: boolean
  onClose: () => void
}

export function ScenarioCompareModal({ open, onClose }: Props) {
  const scenarios = useProjectStore((s) => s.scenarios)
  const items = useProjectStore((s) => s.items)
  const pricing = useProjectStore((s) => s.pricing)
  const context = useProjectStore((s) => s.context)
  const costOverrides = useProjectStore((s) => s.costOverrides)

  const comparisons = useMemo(() => {
    if (!scenarios.enabled) return []

    return scenarios.list.map((sc) => {
      const scenarioItems = sc.id === scenarios.activeScenarioId ? items : sc.items
      const result = calcGrandTotal({
        items: scenarioItems,
        hourlyRate: pricing.hourlyRate,
        contextMultiplier: context.contextMultiplier,
        costOverrides,
        revisionPercent: pricing.revisionPercent,
        discount: pricing.discount,
        tax: pricing.tax,
        volumeDiscounts: pricing.volumeDiscounts,
        additionalAdjustments: pricing.additionalAdjustments,
      })

      // Collect unique item names
      const itemNames = scenarioItems
        .filter((i) => !i.isContainer)
        .map((i) => ({ name: i.name, cost: 0 }))

      return {
        id: sc.id,
        name: sc.name,
        grandTotal: result.grandTotal,
        totalHours: result.totalHours,
        itemCount: scenarioItems.filter((i) => !i.isContainer).length,
        categoryTotals: result.categoryTotals,
        items: scenarioItems,
      }
    })
  }, [scenarios, items, pricing, context, costOverrides])

  if (!open) return null

  // Collect all unique item names across scenarios
  const allItemNames = new Set<string>()
  comparisons.forEach((c) => {
    c.items
      .filter((i) => !i.isContainer)
      .forEach((i) => allItemNames.add(i.name))
  })

  const minTotal = Math.min(...comparisons.map((c) => c.grandTotal))

  return (
    <Modal open={open} onClose={onClose} title="Сравнение сценариев">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-3 py-2 font-medium text-gray-600">Показатель</th>
              {comparisons.map((c) => (
                <th key={c.id} className="text-right px-3 py-2 font-medium text-gray-600 min-w-[100px]">
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="px-3 py-2 text-gray-600">Итого</td>
              {comparisons.map((c) => (
                <td
                  key={c.id}
                  className={`px-3 py-2 text-right font-bold ${
                    c.grandTotal === minTotal ? 'text-green-600' : 'text-gray-800'
                  }`}
                >
                  {formatCurrency(c.grandTotal)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-3 py-2 text-gray-600">Часы</td>
              {comparisons.map((c) => (
                <td key={c.id} className="px-3 py-2 text-right text-gray-800">
                  {formatHours(c.totalHours)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-3 py-2 text-gray-600">Позиций</td>
              {comparisons.map((c) => (
                <td key={c.id} className="px-3 py-2 text-right text-gray-800">
                  {c.itemCount}
                </td>
              ))}
            </tr>

            {/* Separator */}
            <tr>
              <td colSpan={comparisons.length + 1} className="px-3 py-1 text-xs text-gray-400 font-medium bg-gray-50">
                Позиции
              </td>
            </tr>

            {/* Items comparison */}
            {[...allItemNames].map((name) => (
              <tr key={name}>
                <td className="px-3 py-1.5 text-gray-600 text-xs">{name}</td>
                {comparisons.map((c) => {
                  const found = c.items.find((i) => i.name === name && !i.isContainer)
                  return (
                    <td key={c.id} className="px-3 py-1.5 text-right text-xs">
                      {found ? (
                        <span className="text-gray-700">
                          {found.quantity} {found.unit}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}
