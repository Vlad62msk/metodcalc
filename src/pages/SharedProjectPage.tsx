import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { expandState } from '@/core/sharing'
import { calcGrandTotal, calcItemCost, calcContainerCost, calcEffectiveHours } from '@/core/calculator'
import { formatCurrency, formatHours, formatNumber } from '@/utils/format'
import { CATEGORY_LABELS, type EstimateItem } from '@/types/estimate'
import { saveProject } from '@/storage/projectsDb'
import { generateId } from '@/utils/id'

export function SharedProjectPage() {
  const { data } = useParams<{ data: string }>()
  const navigate = useNavigate()

  const shared = useMemo(() => {
    if (!data) return null
    return expandState(data)
  }, [data])

  if (!shared) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Не удалось расшифровать ссылку</p>
        <p className="text-sm text-gray-400 max-w-md text-center">
          Ссылка повреждена или имеет неверный формат. Попросите отправителя сгенерировать новую.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Перейти к своим проектам
        </button>
      </div>
    )
  }

  const { context, items, pricing } = shared

  const result = calcGrandTotal({
    items,
    hourlyRate: pricing.hourlyRate,
    contextMultiplier: context.contextMultiplier,
    costOverrides: {},
    revisionPercent: pricing.revisionPercent,
    discount: pricing.discount,
    tax: pricing.tax,
    volumeDiscounts: pricing.volumeDiscounts,
    additionalAdjustments: pricing.additionalAdjustments,
  })

  const hourlyRate = pricing.hourlyRate
  const contextMultiplier = context.contextMultiplier

  const getItemCost = (item: EstimateItem): number => {
    if (item.isContainer) return calcContainerCost(item, items, hourlyRate, contextMultiplier, {})
    return calcItemCost(item, hourlyRate, contextMultiplier)
  }

  const rootItems = items.filter(i => !i.parentId).sort((a, b) => a.sortOrder - b.sortOrder)

  const handleCopyToSelf = async () => {
    const id = generateId()
    const now = new Date().toISOString()
    await saveProject({
      id,
      updatedAt: now,
      state: {
        context,
        items,
        pricing,
        presentation: {
          showHours: true, showPricePerUnit: true, showQuantity: true,
          showUnits: true, showGroupStructure: true, showTaxSeparately: false,
          showDiscountSeparately: false, aggregateByCategory: false,
          showConditions: false, conditionsText: '', showSignature: false,
          signatureName: '', signatureContact: '',
        },
        snapshots: [],
        meta: { id, name: `${context.projectType.label} (получено)`, createdAt: now, updatedAt: now, version: '3.3' },
        scenarios: { enabled: false, activeScenarioId: null, list: [] },
      },
      totalAmount: result.grandTotal,
      totalHours: result.totalHours,
      contextMultiplier: context.contextMultiplier,
      categoryBreakdown: result.categoryTotals,
    })
    navigate(`/project/${id}`)
  }

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify({ context, items, pricing }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shared-estimate-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900">Общая смета</h1>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Просмотр</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyToSelf}
              className="text-sm px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Скопировать к себе
            </button>
            <button
              type="button"
              onClick={handleDownloadJson}
              className="text-sm px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              JSON
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-gray-700 px-2 py-2"
            >
              Мои проекты
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Context summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>{context.projectType.label}</span>
            {context.domain.label && <span>· {context.domain.label}</span>}
            {context.methodology.label && <span>· {context.methodology.label}</span>}
            <span className="text-gray-400">· Коэффициент: ×{formatNumber(context.contextMultiplier, 2)}</span>
          </div>
        </div>

        {/* Estimate table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-medium text-gray-700">Смета</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {rootItems.map(item => (
              <ItemRow key={item.id} item={item} items={items} getItemCost={getItemCost} hourlyRate={hourlyRate} contextMultiplier={contextMultiplier} depth={0} />
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Подытог</span>
              <span className="text-gray-800">{formatCurrency(result.baseTotal)}</span>
            </div>

            {result.revisions > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Правки ({formatNumber(pricing.revisionPercent * 100, 0)}%)</span>
                <span className="text-gray-800">{formatCurrency(result.revisions)}</span>
              </div>
            )}

            {result.volumeDiscountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Объёмные скидки</span>
                <span className="text-green-600">-{formatCurrency(result.volumeDiscountAmount)}</span>
              </div>
            )}

            {result.discountAmount !== 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{result.discountAmount > 0 ? 'Наценка' : 'Скидка'}</span>
                <span className={result.discountAmount > 0 ? 'text-amber-600' : 'text-green-600'}>
                  {formatCurrency(Math.abs(result.discountAmount))}
                </span>
              </div>
            )}

            {result.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Налог ({pricing.tax.rate}%)</span>
                <span className="text-gray-800">{formatCurrency(result.taxAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold border-t border-gray-300 pt-2 mt-2">
              <span className="text-gray-900">Итого</span>
              <span className="text-gray-900">{formatCurrency(result.grandTotal)}</span>
            </div>

            <div className="text-xs text-gray-400">
              {formatHours(result.totalHours)} · {items.filter(i => !i.isContainer).length} позиций
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ItemRow({
  item,
  items,
  getItemCost,
  hourlyRate,
  contextMultiplier,
  depth,
}: {
  item: EstimateItem
  items: EstimateItem[]
  getItemCost: (item: EstimateItem) => number
  hourlyRate: number
  contextMultiplier: number
  depth: number
}) {
  const children = items.filter(i => i.parentId === item.id).sort((a, b) => a.sortOrder - b.sortOrder)
  const cost = getItemCost(item)
  const name = item.clientName || item.name

  return (
    <>
      <div
        className={`flex items-center justify-between px-4 py-2.5 ${
          item.isContainer ? 'bg-gray-50 font-medium' : ''
        }`}
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-gray-800 truncate">{name}</span>
          {!item.isContainer && (
            <span className="text-xs text-gray-400 shrink-0">
              {formatNumber(item.quantity)} {item.unit}
              {item.pricingModel === 'time_based' && (
                <> · {formatHours(calcEffectiveHours(item) * item.quantity)}</>
              )}
            </span>
          )}
          <span className="text-xs text-gray-300 shrink-0">
            {CATEGORY_LABELS[item.category]}
          </span>
        </div>
        <span className={`text-sm shrink-0 ml-3 ${item.isContainer ? 'font-medium text-gray-800' : 'text-gray-700'}`}>
          {formatCurrency(cost)}
        </span>
      </div>
      {children.map(child => (
        <ItemRow key={child.id} item={child} items={items} getItemCost={getItemCost} hourlyRate={hourlyRate} contextMultiplier={contextMultiplier} depth={depth + 1} />
      ))}
    </>
  )
}
