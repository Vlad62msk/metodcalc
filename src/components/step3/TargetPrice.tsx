import { useMemo } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { formatCurrency, formatNumber } from '@/utils/format'
import { calcTargetDiff } from '@/core/calculator'

export function TargetPrice() {
  const targetPrice = useProjectStore((s) => s.pricing.targetPrice)
  const setTargetPrice = useProjectStore((s) => s.setTargetPrice)
  const getGrandTotal = useProjectStore((s) => s.getGrandTotal)
  // Subscribe to state that drives grand total
  const items = useProjectStore((s) => s.items)
  const pricing = useProjectStore((s) => s.pricing)
  const context = useProjectStore((s) => s.context)
  const costOverrides = useProjectStore((s) => s.costOverrides)

  const result = useMemo(
    () => getGrandTotal(),
    [getGrandTotal, items, pricing, context, costOverrides],
  )
  const { difference, percentUsed } = targetPrice.value > 0
    ? calcTargetDiff(targetPrice.value, targetPrice.includesTax, result.grandTotal, result.afterAdjustments)
    : { difference: 0, percentUsed: 0 }
  const isOver = difference < 0

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Целевая цена</span>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={targetPrice.enabled}
            onChange={(e) => setTargetPrice({ enabled: e.target.checked })}
            className="text-primary-600"
          />
          <span className="text-xs text-gray-500">Включить</span>
        </label>
      </div>

      {targetPrice.enabled && (
        <>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={targetPrice.value || ''}
              onChange={(e) => setTargetPrice({ value: parseInt(e.target.value) || 0 })}
              placeholder="Целевая сумма"
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <span className="text-sm text-gray-500">₽</span>
          </div>

          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={!targetPrice.includesTax}
                onChange={() => setTargetPrice({ includesTax: false })}
                className="text-primary-600"
              />
              <span className="text-gray-600">до налогов</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={targetPrice.includesTax}
                onChange={() => setTargetPrice({ includesTax: true })}
                className="text-primary-600"
              />
              <span className="text-gray-600">после налогов</span>
            </label>
          </div>

          {targetPrice.value > 0 && (
            <>
              <div className="text-sm space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Расчётная цена:</span>
                  <span>{formatCurrency(result.grandTotal)}</span>
                </div>
                <div className={`flex justify-between font-medium ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                  <span>Разница:</span>
                  <span>
                    {isOver ? '' : '+'}{formatCurrency(difference)} ({isOver ? 'перерасход' : 'запас'}{' '}
                    {formatNumber(Math.abs(100 - percentUsed), 0)}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${isOver ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 text-right">
                {formatNumber(percentUsed, 0)}% использовано
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
