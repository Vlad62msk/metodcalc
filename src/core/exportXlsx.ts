import * as XLSX from 'xlsx'
import type { EstimateItem } from '@/types/estimate'
import type { Presentation, Pricing, ProjectContext, ProjectMeta } from '@/types/project'
import { CATEGORY_LABELS } from '@/types/estimate'
import { calcItemCost, calcContainerCost, calcEffectiveHours, calcGrandTotal, type CategoryTotals } from './calculator'
import { formatNumber } from '@/utils/format'

interface ExportParams {
  items: EstimateItem[]
  pricing: Pricing
  context: ProjectContext
  presentation: Presentation
  costOverrides: Record<string, number>
  meta: ProjectMeta
}

export function exportToXlsx(params: ExportParams) {
  const { items, pricing, context, presentation, costOverrides, meta } = params
  const hourlyRate = pricing.hourlyRate
  const contextMultiplier = context.contextMultiplier

  const result = calcGrandTotal({
    items,
    hourlyRate,
    contextMultiplier,
    costOverrides,
    revisionPercent: pricing.revisionPercent,
    discount: pricing.discount,
    tax: pricing.tax,
    volumeDiscounts: pricing.volumeDiscounts,
    additionalAdjustments: pricing.additionalAdjustments,
  })

  const getItemCost = (item: EstimateItem): number => {
    if (item.overrides.cost && costOverrides[item.id] != null) return costOverrides[item.id]!
    if (item.isContainer) return calcContainerCost(item, items, hourlyRate, contextMultiplier, costOverrides)
    return calcItemCost(item, hourlyRate, contextMultiplier)
  }

  // Build rows
  const rows: Record<string, unknown>[] = []

  if (presentation.aggregateByCategory) {
    // Category aggregation mode
    const cats = result.categoryTotals as CategoryTotals
    for (const [key, amount] of Object.entries(cats)) {
      if (amount > 0) {
        const row: Record<string, unknown> = {
          'Позиция': CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS] || key,
          'Стоимость': amount,
        }
        rows.push(row)
      }
    }
  } else {
    const renderItem = (item: EstimateItem, indent: number) => {
      const cost = getItemCost(item)
      const name = (indent > 0 ? '  '.repeat(indent) : '') + (item.clientName || item.name)
      const row: Record<string, unknown> = { 'Позиция': name }

      if (presentation.showQuantity && !item.isContainer) {
        row['Количество'] = item.quantity
        if (presentation.showUnits && item.unit) {
          row['Ед.изм.'] = item.unit
        }
      }

      if (presentation.showHours && !item.isContainer && item.pricingModel === 'time_based') {
        row['Часы'] = Math.round(calcEffectiveHours(item) * item.quantity * 100) / 100
      }

      if (presentation.showPricePerUnit && !item.isContainer) {
        row['За единицу'] = item.quantity > 0 ? Math.round((cost / item.quantity) * 100) / 100 : 0
      }

      row['Стоимость'] = Math.round(cost * 100) / 100
      rows.push(row)

      if (presentation.showGroupStructure) {
        const children = items
          .filter((i) => i.parentId === item.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)
        children.forEach((child) => renderItem(child, indent + 1))
      }
    }

    const rootItems = items
      .filter((i) => !i.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    if (presentation.showGroupStructure) {
      rootItems.forEach((item) => renderItem(item, 0))
    } else {
      items
        .filter((i) => !i.isContainer || i.containerMode === 'fixed_total')
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .forEach((item) => renderItem(item, 0))
    }
  }

  // Add empty separator row
  rows.push({})

  // Totals
  rows.push({ 'Позиция': 'Подытог', 'Стоимость': Math.round(result.baseTotal * 100) / 100 })

  if (result.revisions > 0) {
    rows.push({
      'Позиция': `Правки (${formatNumber(pricing.revisionPercent * 100, 0)}%)`,
      'Стоимость': Math.round(result.revisions * 100) / 100,
    })
  }

  if (result.volumeDiscountAmount > 0) {
    rows.push({
      'Позиция': 'Объёмные скидки',
      'Стоимость': -Math.round(result.volumeDiscountAmount * 100) / 100,
    })
  }

  if (result.discountAmount !== 0) {
    rows.push({
      'Позиция': result.discountAmount > 0 ? 'Наценка' : 'Скидка',
      'Стоимость': Math.round(result.discountAmount * 100) / 100,
    })
  }

  if (presentation.showTaxSeparately && result.taxAmount > 0) {
    rows.push({
      'Позиция': `Налог (${pricing.tax.rate}%)`,
      'Стоимость': Math.round(result.taxAmount * 100) / 100,
    })
  }

  rows.push({ 'Позиция': 'ИТОГО', 'Стоимость': Math.round(result.grandTotal * 100) / 100 })

  // Build worksheet
  const ws = XLSX.utils.json_to_sheet(rows)

  // Set column widths
  ws['!cols'] = [
    { wch: 40 }, // Позиция
    { wch: 12 }, // Количество
    { wch: 10 }, // Ед.изм.
    { wch: 10 }, // Часы
    { wch: 14 }, // За единицу
    { wch: 16 }, // Стоимость
  ]

  // Create workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Смета')

  // Generate filename
  const date = new Date().toISOString().slice(0, 10)
  const fileName = `${meta.name || 'Смета'}_${date}.xlsx`

  // Download
  XLSX.writeFile(wb, fileName)
}
