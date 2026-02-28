import { useMemo } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { formatNumber, formatCurrency } from '@/utils/format'
import { calcResourceBudget } from '@/core/calculator'

export function ResourceBudget() {
  const rb = useProjectStore((s) => s.pricing.resourceBudget)
  const setResourceBudget = useProjectStore((s) => s.setResourceBudget)
  const hourlyRate = useProjectStore((s) => s.pricing.hourlyRate)
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
  const budget = rb.enabled
    ? calcResourceBudget(rb.periodMonthsMin, rb.periodMonthsMax, rb.hoursPerWeekMin, rb.hoursPerWeekMax, hourlyRate, result.totalHours)
    : null

  const colorMap = { fits: 'text-green-600', borderline: 'text-yellow-600', exceeds: 'text-red-600' } as const
  const iconMap = { fits: '✓', borderline: '~', exceeds: '✗' } as const
  const labelMap = { fits: 'Смета укладывается в бюджет времени', borderline: 'На границе бюджета', exceeds: 'Смета не укладывается в бюджет' } as const

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Бюджет времени</span>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={rb.enabled}
            onChange={(e) => setResourceBudget({ enabled: e.target.checked })}
            className="text-primary-600"
          />
          <span className="text-xs text-gray-500">Включить</span>
        </label>
      </div>

      {rb.enabled && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Период (месяцы)</label>
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={rb.periodMonthsMin}
                  onChange={(e) => setResourceBudget({ periodMonthsMin: parseFloat(e.target.value) || 0.5 })}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                  title="Минимум"
                />
                <span className="text-xs text-gray-400">мин –</span>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={rb.periodMonthsMax}
                  onChange={(e) => setResourceBudget({ periodMonthsMax: parseFloat(e.target.value) || 1 })}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                  title="Максимум"
                />
                <span className="text-xs text-gray-400">макс</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">Часов в неделю</label>
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  min="1"
                  value={rb.hoursPerWeekMin}
                  onChange={(e) => setResourceBudget({ hoursPerWeekMin: parseInt(e.target.value) || 1 })}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                  title="Минимум"
                />
                <span className="text-xs text-gray-400">мин –</span>
                <input
                  type="number"
                  min="1"
                  value={rb.hoursPerWeekMax}
                  onChange={(e) => setResourceBudget({ hoursPerWeekMax: parseInt(e.target.value) || 5 })}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                  title="Максимум"
                />
                <span className="text-xs text-gray-400">макс</span>
              </div>
            </div>
          </div>

          {budget && (
            <div className="text-sm space-y-2">
              <div className="text-gray-600">
                Доступное время: {formatNumber(budget.minHours, 0)} <span className="text-gray-400">(мин)</span> – {formatNumber(budget.maxHours, 0)} <span className="text-gray-400">(макс)</span> часов
              </div>
              {hourlyRate > 0 && (
                <div className="text-gray-600">
                  Стоимость: {formatCurrency(budget.minCost)} <span className="text-gray-400">(мин)</span> – {formatCurrency(budget.maxCost)} <span className="text-gray-400">(макс)</span>
                </div>
              )}
              <div className="text-gray-600">
                Расчётные трудозатраты: {formatNumber(result.totalHours, 0)} ч
              </div>
              <div className={`font-medium ${colorMap[budget.fitsInBudget]}`}>
                {iconMap[budget.fitsInBudget]} {labelMap[budget.fitsInBudget]}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
