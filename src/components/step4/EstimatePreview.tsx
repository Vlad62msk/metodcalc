import { useMemo } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { calcContainerCost, calcItemCost, calcEffectiveHours } from '@/core/calculator'
import { formatCurrency, formatHours, formatNumber } from '@/utils/format'
import type { EstimateItem } from '@/types/estimate'

export function EstimatePreview() {
  const items = useProjectStore((s) => s.items)
  const presentation = useProjectStore((s) => s.presentation)
  const pricing = useProjectStore((s) => s.pricing)
  const context = useProjectStore((s) => s.context)
  const costOverrides = useProjectStore((s) => s.costOverrides)
  const meta = useProjectStore((s) => s.meta)
  const getGrandTotal = useProjectStore((s) => s.getGrandTotal)
  const updateItem = useProjectStore((s) => s.updateItem)

  const result = useMemo(
    () => getGrandTotal(),
    [getGrandTotal, items, pricing, context, costOverrides],
  )
  const hourlyRate = pricing.hourlyRate
  const contextMultiplier = context.contextMultiplier

  const getItemCost = (item: EstimateItem): number => {
    if (item.overrides.cost && costOverrides[item.id] != null) {
      return costOverrides[item.id]!
    }
    if (item.isContainer) {
      return calcContainerCost(item, items, hourlyRate, contextMultiplier, costOverrides)
    }
    return calcItemCost(item, hourlyRate, contextMultiplier)
  }

  const rootItems = items
    .filter((i) => !i.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const renderItemRow = (item: EstimateItem, depth: number) => {
    const cost = getItemCost(item)
    const children = items
      .filter((i) => i.parentId === item.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const isContainer = item.isContainer
    const displayName = item.clientName || item.name

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-3 py-2 ${
            isContainer ? 'font-medium' : ''
          }`}
          style={{ paddingLeft: `${depth * 24}px` }}
        >
          {/* Имя (редактируемое clientName) */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={displayName}
              onChange={(e) => updateItem(item.id, { clientName: e.target.value })}
              className="w-full text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-400 focus:outline-none px-0 py-0.5"
              title="Нажмите, чтобы переименовать для клиента"
            />
          </div>

          {/* Количество */}
          {presentation.showQuantity && !isContainer && (
            <div className="hidden sm:block text-sm text-gray-500 w-12 text-right shrink-0">
              {formatNumber(item.quantity)}
              {presentation.showUnits && item.unit && (
                <span className="text-xs text-gray-400 ml-0.5">{item.unit}</span>
              )}
            </div>
          )}

          {/* Часы */}
          {presentation.showHours && !isContainer && item.pricingModel === 'time_based' && (
            <div className="hidden sm:block text-sm text-gray-500 w-16 text-right shrink-0">
              {formatHours(calcEffectiveHours(item) * item.quantity)}
            </div>
          )}

          {/* Цена за ед. */}
          {presentation.showPricePerUnit && !isContainer && (
            <div className="hidden sm:block text-sm text-gray-500 w-24 text-right shrink-0">
              {item.quantity > 0 ? formatCurrency(cost / item.quantity) : '—'}
            </div>
          )}

          {/* Стоимость */}
          <div className="text-sm font-medium text-gray-800 w-28 text-right shrink-0">
            {formatCurrency(cost)}
          </div>
        </div>

        {/* Дочерние (если показываем структуру) */}
        {presentation.showGroupStructure && children.length > 0 && (
          <div>
            {children.map((child) => renderItemRow(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div id="estimate-preview" className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      {/* Заголовок */}
      <div className="text-center space-y-1 pb-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">
          Смета: {meta.name || 'Проект'}
        </h2>
        <p className="text-xs text-gray-400">
          {context.projectType.label}
          {context.domain.value !== 'general' && ` · ${context.domain.label}`}
        </p>
      </div>

      {/* Заголовок таблицы */}
      <div className="flex items-center gap-3 text-xs text-gray-400 font-medium border-b border-gray-100 pb-2">
        <div className="flex-1">Позиция</div>
        {presentation.showQuantity && <div className="hidden sm:block w-12 text-right">Кол-во</div>}
        {presentation.showHours && <div className="hidden sm:block w-16 text-right">Часы</div>}
        {presentation.showPricePerUnit && <div className="hidden sm:block w-24 text-right">За ед.</div>}
        <div className="w-28 text-right">Стоимость</div>
      </div>

      {/* Строки */}
      <div className="divide-y divide-gray-50">
        {presentation.showGroupStructure
          ? rootItems.map((item) => renderItemRow(item, 0))
          : items
              .filter((i) => !i.isContainer || i.containerMode === 'fixed_total')
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item) => renderItemRow(item, 0))
        }
      </div>

      {/* Итоги */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        {/* Подытог (базовая стоимость без правок/скидок) */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Подытог</span>
          <span>{formatCurrency(result.baseTotal)}</span>
        </div>

        {/* Правки */}
        {result.revisions > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">
              Правки ({formatNumber(pricing.revisionPercent * 100, 0)}%)
            </span>
            <span>{formatCurrency(result.revisions)}</span>
          </div>
        )}

        {/* Объёмные скидки */}
        {result.volumeDiscountAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Объёмные скидки</span>
            <span className="text-green-600">-{formatCurrency(result.volumeDiscountAmount)}</span>
          </div>
        )}

        {/* Скидка/наценка */}
        {presentation.showDiscountSeparately && result.discountAmount !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">
              {result.discountAmount > 0 ? 'Наценка' : 'Скидка'}
            </span>
            <span className={result.discountAmount > 0 ? 'text-red-600' : 'text-green-600'}>
              {result.discountAmount > 0 ? '+' : ''}{formatCurrency(result.discountAmount)}
            </span>
          </div>
        )}

        {/* Корректировки */}
        {pricing.additionalAdjustments.map((adj) => (
          adj.amount !== 0 && (
            <div key={adj.id} className="flex justify-between text-sm">
              <span className="text-gray-500">{adj.label || 'Корректировка'}</span>
              <span>{adj.amount > 0 ? '+' : ''}{formatCurrency(adj.amount)}</span>
            </div>
          )
        ))}

        {/* Налог */}
        {presentation.showTaxSeparately && result.taxAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Налог ({pricing.tax.rate}%)</span>
            <span>{formatCurrency(result.taxAmount)}</span>
          </div>
        )}

        {/* Итого */}
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
          <span>Итого</span>
          <span className="text-primary-700">{formatCurrency(result.grandTotal)}</span>
        </div>
      </div>

      {/* Условия */}
      {presentation.showConditions && presentation.conditionsText && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Условия</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{presentation.conditionsText}</p>
        </div>
      )}

      {/* Подпись */}
      {presentation.showSignature && (presentation.signatureName || presentation.signatureContact) && (
        <div className="border-t border-gray-200 pt-4 text-right">
          {presentation.signatureName && (
            <div className="text-sm font-medium text-gray-800">{presentation.signatureName}</div>
          )}
          {presentation.signatureContact && (
            <div className="text-xs text-gray-500">{presentation.signatureContact}</div>
          )}
        </div>
      )}
    </div>
  )
}
