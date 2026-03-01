import { useMemo } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { formatCurrency, formatHours, formatMultiplier, formatNumber } from '@/utils/format'
import { calcTargetDiff, calcResourceBudget, getContextWarning } from '@/core/calculator'
import type { CostRange } from '@/core/calculator'
import { CATEGORY_LABELS, CONFIDENCE_LEVELS } from '@/types/estimate'

function pluralize(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100
  const lastDigit = abs % 10
  if (abs > 10 && abs < 20) return many
  if (lastDigit > 1 && lastDigit < 5) return few
  if (lastDigit === 1) return one
  return many
}

export function Sidebar() {
  const context = useProjectStore((s) => s.context)
  const pricing = useProjectStore((s) => s.pricing)
  const items = useProjectStore((s) => s.items)
  const costOverrides = useProjectStore((s) => s.costOverrides)
  const getGrandTotal = useProjectStore((s) => s.getGrandTotal)

  // Subscribe to all state that drives grand total — ensures re-render on data changes
  const result = useMemo(
    () => getGrandTotal(),
    [getGrandTotal, items, pricing, context, costOverrides],
  )

  const overrideCount =
    items.reduce((count, item) => {
      return count + Object.values(item.overrides).filter(Boolean).length
    }, 0) +
    (context.contextMultiplierIsManual ? 1 : 0) +
    (pricing.revisionPercentIsManual ? 1 : 0)

  const warning = getContextWarning(context.contextMultiplier)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div>
        <div className="text-2xl font-bold text-gray-900">{formatCurrency(result.grandTotal)}</div>
        <div className="text-sm text-gray-500 mt-1">Трудозатраты: {formatHours(result.totalHours)}</div>
        {result.costRange && (
          <div className="text-xs text-gray-400 mt-0.5 space-y-0.5">
            <div>Часы: {formatNumber(result.costRange.minHours, 0)}–{formatNumber(result.costRange.maxHours, 0)} ч</div>
            <div>Диапазон: {formatCurrency(result.costRange.minCost)} — {formatCurrency(result.costRange.maxCost)}</div>
          </div>
        )}
        {result.aggregateConfidence != null && (
          <ConfidenceIndicator value={result.aggregateConfidence} />
        )}
      </div>

      <div className="text-sm space-y-1 text-gray-600">
        <div className="flex justify-between">
          <span>Ставка:</span>
          <span className="font-medium">{formatCurrency(pricing.hourlyRate)}/час</span>
        </div>
        <div className="flex justify-between">
          <span>Коэффициент:</span>
          <span className="font-medium">{formatMultiplier(context.contextMultiplier)}</span>
        </div>
        <div className="text-xs text-gray-400">
          Домен {formatMultiplier(context.domain.multiplier)} · Методика{' '}
          {formatMultiplier(context.methodology.multiplier)} · Клиент{' '}
          {formatMultiplier(context.client.multiplier)} · Сроки{' '}
          {formatMultiplier(context.deadline.multiplier)}
        </div>
      </div>

      {warning && (
        <div
          className={`text-xs px-3 py-2 rounded ${
            warning.level === 'red' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
          }`}
        >
          {warning.message}
        </div>
      )}

      <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
        {(Object.entries(result.categoryTotals) as [string, number][])
          .filter(([, v]) => v > 0)
          .map(([cat, val]) => (
            <div key={cat} className="flex justify-between text-gray-600">
              <span>{CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat}</span>
              <span>{formatCurrency(val)}</span>
            </div>
          ))}
        {result.revisions > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Правки ({formatNumber(pricing.revisionPercent * 100, 0)}%)</span>
            <span>+{formatCurrency(result.revisions)}</span>
          </div>
        )}
        {result.volumeDiscountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Объёмная скидка</span>
            <span>-{formatCurrency(result.volumeDiscountAmount)}</span>
          </div>
        )}
        {result.taxAmount > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Налог ({formatNumber(pricing.tax.rate, 0)}%)</span>
            <span>+{formatCurrency(result.taxAmount)}</span>
          </div>
        )}
      </div>

      {pricing.targetPrice.enabled && pricing.targetPrice.value > 0 && (
        <TargetPriceIndicator
          targetValue={pricing.targetPrice.value}
          includesTax={pricing.targetPrice.includesTax}
          grandTotal={result.grandTotal}
          afterAdjustments={result.afterAdjustments}
          costRange={result.costRange}
        />
      )}

      {pricing.resourceBudget.enabled && (
        <ResourceBudgetIndicator
          budget={pricing.resourceBudget}
          hourlyRate={pricing.hourlyRate}
          estimateHours={result.totalHours}
        />
      )}

      {overrideCount > 0 && (
        <div className="border-t border-gray-100 pt-3 text-sm text-amber-600 flex items-center gap-1">
          <span className="text-amber-500">⚙</span>
          <span>
            {overrideCount} {pluralize(overrideCount, 'значение', 'значения', 'значений')}{' '}
            {pluralize(overrideCount, 'изменено', 'изменены', 'изменено')} вручную
          </span>
        </div>
      )}
    </div>
  )
}

function TargetPriceIndicator({
  targetValue,
  includesTax,
  grandTotal,
  afterAdjustments,
  costRange,
}: {
  targetValue: number
  includesTax: boolean
  grandTotal: number
  afterAdjustments: number
  costRange: CostRange | null
}) {
  const { difference, percentUsed } = calcTargetDiff(targetValue, includesTax, grandTotal, afterAdjustments)
  const isOver = difference < 0

  // Определяем попадание целевой цены в диапазон стоимости
  let rangeHint: { text: string; color: string } | null = null
  if (costRange) {
    if (targetValue < costRange.minCost) {
      rangeHint = { text: 'Целевая цена ниже минимума диапазона', color: 'text-red-600' }
    } else if (targetValue > costRange.maxCost) {
      rangeHint = { text: 'Целевая цена выше максимума диапазона', color: 'text-yellow-600' }
    } else {
      rangeHint = { text: 'Целевая цена попадает в диапазон', color: 'text-green-600' }
    }
  }

  return (
    <div className="border-t border-gray-100 pt-3 text-sm space-y-1">
      <div className="text-gray-500">Целевая: {formatCurrency(targetValue)}</div>
      <div className={`font-medium ${isOver ? 'text-red-600' : 'text-green-600'}`}>
        {isOver ? '🔴 Перерасход' : '🟢 Запас'}: {formatCurrency(Math.abs(difference))} (
        {formatNumber(Math.abs(100 - percentUsed), 0)}%)
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${isOver ? 'bg-red-500' : 'bg-green-500'}`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>
      {rangeHint && (
        <div className={`text-xs ${rangeHint.color}`}>{rangeHint.text}</div>
      )}
    </div>
  )
}

function ResourceBudgetIndicator({
  budget,
  hourlyRate,
  estimateHours,
}: {
  budget: { periodMonthsMin: number; periodMonthsMax: number; hoursPerWeekMin: number; hoursPerWeekMax: number }
  hourlyRate: number
  estimateHours: number
}) {
  const rb = calcResourceBudget(
    budget.periodMonthsMin,
    budget.periodMonthsMax,
    budget.hoursPerWeekMin,
    budget.hoursPerWeekMax,
    hourlyRate,
    estimateHours,
  )

  const colorMap = { fits: 'text-green-600', borderline: 'text-yellow-600', exceeds: 'text-red-600' } as const
  const iconMap = { fits: '🟢', borderline: '🟡', exceeds: '🔴' } as const
  const labelMap = { fits: 'Укладывается', borderline: 'На границе', exceeds: 'Не укладывается' } as const

  return (
    <div className="border-t border-gray-100 pt-3 text-sm space-y-1">
      <div className="text-gray-500">
        Бюджет: {formatNumber(rb.minHours, 0)}–{formatNumber(rb.maxHours, 0)} ч
      </div>
      <div className={`font-medium ${colorMap[rb.fitsInBudget]}`}>
        {iconMap[rb.fitsInBudget]} Смета {formatNumber(estimateHours, 0)} ч — {labelMap[rb.fitsInBudget]}
      </div>
    </div>
  )
}

function ConfidenceIndicator({ value }: { value: number }) {
  if (!Number.isFinite(value)) return null
  const rounded = Math.round(value)
  const clampedIndex = Math.max(0, Math.min(4, rounded - 1))
  const level = CONFIDENCE_LEVELS[clampedIndex] ?? CONFIDENCE_LEVELS[0]

  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <div className="flex gap-0.5">
        {CONFIDENCE_LEVELS.map((l, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${i < rounded ? level.color : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500">
        {value.toFixed(1)}/5 — {level.label}
      </span>
    </div>
  )
}
