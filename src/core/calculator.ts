import type { EstimateItem, Category } from '@/types/estimate'
import type { ProjectContext, Pricing, VolumeDiscountTier } from '@/types/project'

// === Контекстный коэффициент ===

export function calcContextMultiplier(context: ProjectContext): number {
  if (context.contextMultiplierIsManual) {
    return context.contextMultiplier
  }
  return (
    context.domain.multiplier *
    context.methodology.multiplier *
    context.client.multiplier *
    context.deadline.multiplier
  )
}

export function getContextWarning(multiplier: number): { level: 'yellow' | 'red'; message: string } | null {
  if (multiplier > 5.0) {
    return {
      level: 'red',
      message: `Коэффициент ${formatMult(multiplier)} — экстремальное значение. Возможно, стоит пересмотреть условия проекта.`,
    }
  }
  if (multiplier > 3.0) {
    return {
      level: 'yellow',
      message: `Коэффициент ${formatMult(multiplier)} — это значительная наценка. Убедитесь, что это отражает реальную сложность.`,
    }
  }
  return null
}

function formatMult(v: number): string {
  return '×' + v.toFixed(2)
}

// === PERT-оценка ===

export function calcPertHours(item: EstimateItem): number | null {
  const range = item.effortRange
  if (!range || range.min == null || range.max == null) return null
  const expected = range.expected ?? item.hoursPerUnit
  return (range.min + 4 * expected + range.max) / 6
}

// === Стоимость строки ===

export function calcEffectiveHours(item: EstimateItem): number {
  let baseHours = item.hoursPerUnit
  // PERT используется ТОЛЬКО если часы НЕ перебиты вручную
  if (!item.overrides.hoursPerUnit) {
    baseHours = calcPertHours(item) ?? item.hoursPerUnit
  }
  return baseHours * item.roleMultiplier * item.qualityLevel
}

export function calcItemCost(
  item: EstimateItem,
  hourlyRate: number,
  contextMultiplier: number,
): number {
  if (item.overrides.cost) {
    // Вручную заданное значение — не пересчитывается
    // Возвращаем текущее значение; caller должен хранить его отдельно
    return 0 // будет использоваться costOverrideValue из store
  }

  if (item.isContainer) {
    // Контейнер fixed_total
    if (item.containerMode === 'fixed_total' && item.containerFixedTotal != null) {
      return item.containerFixedTotal
    }
    // sum_children считается отдельно
    return 0
  }

  if (item.pricingModel === 'fixed_price' && item.fixedPrice != null) {
    return item.fixedPrice * item.quantity
  }

  // time_based
  const effectiveHours = calcEffectiveHours(item)
  return effectiveHours * item.quantity * hourlyRate * contextMultiplier
}

// === Дерево: получение «листьев» ===

/**
 * «Листья» — атомарные строки + контейнеры fixed_total.
 * Потомки fixed_total контейнера игнорируются.
 * Контейнеры sum_children не включаются — это только визуальная группировка.
 */
export function getLeaves(items: EstimateItem[]): EstimateItem[] {
  const fixedTotalIds = new Set(
    items
      .filter((i) => i.isContainer && i.containerMode === 'fixed_total')
      .map((i) => i.id),
  )

  return items.filter((item) => {
    // Потомок fixed_total контейнера — исключаем
    if (item.parentId && fixedTotalIds.has(item.parentId)) {
      return false
    }
    // Также проверяем «дедушку»
    if (item.parentId) {
      const parent = items.find((i) => i.id === item.parentId)
      if (parent?.parentId && fixedTotalIds.has(parent.parentId)) {
        return false
      }
    }

    // fixed_total контейнер — это лист
    if (item.isContainer && item.containerMode === 'fixed_total') {
      return true
    }

    // sum_children контейнер — НЕ лист
    if (item.isContainer && item.containerMode === 'sum_children') {
      return false
    }

    // Атомарная строка
    return true
  })
}

// === Стоимости всех листьев ===

export interface LeafCost {
  item: EstimateItem
  cost: number
}

export function calcAllLeafCosts(
  items: EstimateItem[],
  hourlyRate: number,
  contextMultiplier: number,
  costOverrides: Record<string, number>,
): LeafCost[] {
  const leaves = getLeaves(items)
  return leaves.map((item) => {
    if (item.overrides.cost && costOverrides[item.id] != null) {
      return { item, cost: costOverrides[item.id]! }
    }
    return { item, cost: calcItemCost(item, hourlyRate, contextMultiplier) }
  })
}

// === Суммы по категориям ===

export interface CategoryTotals {
  content: number
  assessment: number
  service: number
  other: number
}

export function calcCategoryTotals(leafCosts: LeafCost[]): CategoryTotals {
  const totals: CategoryTotals = { content: 0, assessment: 0, service: 0, other: 0 }
  for (const { item, cost } of leafCosts) {
    const cat = item.category as Category
    if (cat in totals) {
      totals[cat] += cost
    } else {
      totals.other += cost
    }
  }
  return totals
}

// === Общие часы ===

export function calcTotalHours(items: EstimateItem[]): number {
  const leaves = getLeaves(items)
  let total = 0
  for (const item of leaves) {
    if (!item.isContainer && item.pricingModel === 'time_based') {
      total += calcEffectiveHours(item) * item.quantity
    }
  }
  return total
}

// === Правки ===

export function calcRevisions(
  leafCosts: LeafCost[],
  revisionPercent: number,
): number {
  let revisionableTotal = 0
  for (const { item, cost } of leafCosts) {
    if (item.revisionable) {
      revisionableTotal += cost
    }
  }
  return revisionableTotal * revisionPercent
}

// === Объёмные скидки ===

export function lookupDiscount(qty: number, tiers: VolumeDiscountTier[]): number {
  const sorted = [...tiers].sort((a, b) => b.minQty - a.minQty)
  for (const tier of sorted) {
    if (qty >= tier.minQty) {
      return tier.discountPercent / 100
    }
  }
  return 0
}

export function calcVolumeDiscounts(
  leafCosts: LeafCost[],
  mode: 'by_element' | 'by_category',
  tiers: VolumeDiscountTier[],
): number {
  let totalDiscount = 0

  if (mode === 'by_element') {
    // Группировка по libraryElementId или name
    const groups = new Map<string, { totalQty: number; costs: LeafCost[] }>()
    for (const lc of leafCosts) {
      if (lc.item.isContainer || lc.item.pricingModel !== 'time_based') continue
      const key = lc.item.libraryElementId || lc.item.name
      const group = groups.get(key) || { totalQty: 0, costs: [] }
      group.totalQty += lc.item.quantity
      group.costs.push(lc)
      groups.set(key, group)
    }
    for (const group of groups.values()) {
      const rate = lookupDiscount(group.totalQty, tiers)
      for (const lc of group.costs) {
        totalDiscount += lc.cost * rate
      }
    }
  } else {
    // by_category
    const catGroups = new Map<string, { totalQty: number; costs: LeafCost[] }>()
    for (const lc of leafCosts) {
      if (lc.item.isContainer || lc.item.pricingModel !== 'time_based') continue
      const group = catGroups.get(lc.item.category) || { totalQty: 0, costs: [] }
      group.totalQty += lc.item.quantity
      group.costs.push(lc)
      catGroups.set(lc.item.category, group)
    }
    for (const group of catGroups.values()) {
      const rate = lookupDiscount(group.totalQty, tiers)
      for (const lc of group.costs) {
        totalDiscount += lc.cost * rate
      }
    }
  }

  return totalDiscount
}

// === Стоимость контейнера sum_children ===

export function calcContainerCost(
  container: EstimateItem,
  items: EstimateItem[],
  hourlyRate: number,
  contextMultiplier: number,
  costOverrides: Record<string, number>,
): number {
  if (container.containerMode === 'fixed_total' && container.containerFixedTotal != null) {
    return container.containerFixedTotal
  }

  // sum_children: суммируем прямых дочерних
  const children = items.filter((i) => i.parentId === container.id)
  let total = 0
  for (const child of children) {
    if (child.isContainer) {
      total += calcContainerCost(child, items, hourlyRate, contextMultiplier, costOverrides)
    } else if (child.overrides.cost && costOverrides[child.id] != null) {
      total += costOverrides[child.id]!
    } else {
      total += calcItemCost(child, hourlyRate, contextMultiplier)
    }
  }
  return total
}

// === Диапазон стоимости ===

export interface CostRange {
  minCost: number
  maxCost: number
  minHours: number
  maxHours: number
}

export function calcCostRange(
  items: EstimateItem[],
  hourlyRate: number,
  contextMultiplier: number,
  costOverrides: Record<string, number>,
): CostRange | null {
  const leaves = getLeaves(items)
  let hasActiveRange = false
  let minTotal = 0
  let maxTotal = 0
  let minHoursTotal = 0
  let maxHoursTotal = 0

  for (const item of leaves) {
    // Cost override — фиксированная стоимость
    if (item.overrides.cost && costOverrides[item.id] != null) {
      const c = costOverrides[item.id]!
      minTotal += c
      maxTotal += c
      continue
    }
    // Контейнер fixed_total
    if (item.isContainer && item.containerMode === 'fixed_total' && item.containerFixedTotal != null) {
      minTotal += item.containerFixedTotal
      maxTotal += item.containerFixedTotal
      continue
    }
    // Fixed price
    if (item.pricingModel === 'fixed_price' && item.fixedPrice != null) {
      const c = item.fixedPrice * item.quantity
      minTotal += c
      maxTotal += c
      continue
    }
    // Time-based с effortRange (и без override на часы)
    const range = item.effortRange
    if (!item.overrides.hoursPerUnit && range?.min != null && range?.max != null) {
      hasActiveRange = true
      const minH = range.min * item.roleMultiplier * item.qualityLevel * item.quantity
      const maxH = range.max * item.roleMultiplier * item.qualityLevel * item.quantity
      minHoursTotal += minH
      maxHoursTotal += maxH
      minTotal += minH * hourlyRate * contextMultiplier
      maxTotal += maxH * hourlyRate * contextMultiplier
    } else {
      const c = calcItemCost(item, hourlyRate, contextMultiplier)
      const h = calcEffectiveHours(item) * item.quantity
      minTotal += c
      maxTotal += c
      minHoursTotal += h
      maxHoursTotal += h
    }
  }

  return hasActiveRange ? { minCost: minTotal, maxCost: maxTotal, minHours: minHoursTotal, maxHours: maxHoursTotal } : null
}

// === Breakdown объёмных скидок ===

export interface VolumeDiscountGroup {
  key: string
  libraryElementId: string | null
  displayName: string
  totalQty: number
  totalCost: number
  discountRate: number
  discountAmount: number
  itemCount: number
}

export function calcVolumeDiscountBreakdown(
  leafCosts: LeafCost[],
  mode: 'by_element' | 'by_category',
  tiers: VolumeDiscountTier[],
): VolumeDiscountGroup[] {
  if (mode !== 'by_element') return []

  const groups = new Map<string, {
    libraryElementId: string | null
    names: Set<string>
    totalQty: number
    costs: LeafCost[]
  }>()

  for (const lc of leafCosts) {
    if (lc.item.isContainer || lc.item.pricingModel !== 'time_based') continue
    const key = lc.item.libraryElementId || lc.item.name
    const group = groups.get(key) || {
      libraryElementId: lc.item.libraryElementId,
      names: new Set<string>(),
      totalQty: 0,
      costs: [],
    }
    group.names.add(lc.item.name)
    group.totalQty += lc.item.quantity
    group.costs.push(lc)
    groups.set(key, group)
  }

  const result: VolumeDiscountGroup[] = []
  for (const [key, group] of groups.entries()) {
    const rate = lookupDiscount(group.totalQty, tiers)
    const totalCost = group.costs.reduce((sum, lc) => sum + lc.cost, 0)
    const discountAmount = totalCost * rate
    result.push({
      key,
      libraryElementId: group.libraryElementId,
      displayName: Array.from(group.names).join(', '),
      totalQty: group.totalQty,
      totalCost,
      discountRate: rate,
      discountAmount,
      itemCount: group.costs.length,
    })
  }

  return result.sort((a, b) => b.discountAmount - a.discountAmount)
}

// === Итоговый расчёт ===

export interface GrandTotalParams {
  items: EstimateItem[]
  hourlyRate: number
  contextMultiplier: number
  costOverrides: Record<string, number>
  revisionPercent: number
  discount: Pricing['discount']
  tax: Pricing['tax']
  volumeDiscounts: Pricing['volumeDiscounts']
  additionalAdjustments: Pricing['additionalAdjustments']
}

export interface GrandTotalResult {
  leafCosts: LeafCost[]
  categoryTotals: CategoryTotals
  totalHours: number
  baseTotal: number
  subtotal: number
  revisions: number
  volumeDiscountAmount: number
  volumeDiscountBreakdown: VolumeDiscountGroup[]
  afterDiscounts: number
  discountAmount: number
  afterAdjustments: number
  taxAmount: number
  grandTotal: number
  costRange: CostRange | null
  aggregateConfidence: number | null  // Средневзвешенная 1-5 по стоимости
}

export function calcGrandTotal(params: GrandTotalParams): GrandTotalResult {
  const {
    items,
    hourlyRate,
    contextMultiplier,
    costOverrides,
    revisionPercent,
    discount,
    tax,
    volumeDiscounts,
    additionalAdjustments,
  } = params

  const leafCosts = calcAllLeafCosts(items, hourlyRate, contextMultiplier, costOverrides)
  const categoryTotals = calcCategoryTotals(leafCosts)
  const totalHours = calcTotalHours(items)

  const baseTotal = categoryTotals.content + categoryTotals.assessment + categoryTotals.service + categoryTotals.other

  // Объёмные скидки
  let volumeDiscountAmount = 0
  let volumeDiscountBreakdown: VolumeDiscountGroup[] = []
  if (volumeDiscounts.enabled) {
    volumeDiscountAmount = calcVolumeDiscounts(leafCosts, volumeDiscounts.mode, volumeDiscounts.tiers)
    volumeDiscountBreakdown = calcVolumeDiscountBreakdown(leafCosts, volumeDiscounts.mode, volumeDiscounts.tiers)
  }

  // Диапазон стоимости
  const costRange = calcCostRange(items, hourlyRate, contextMultiplier, costOverrides)

  // Агрегированная уверенность (средневзвешенная по стоимости)
  let aggregateConfidence: number | null = null
  {
    let weightedSum = 0
    let totalWeight = 0
    for (const lc of leafCosts) {
      if (lc.item.confidence != null && lc.cost > 0) {
        weightedSum += lc.item.confidence * lc.cost
        totalWeight += lc.cost
      }
    }
    if (totalWeight > 0) {
      aggregateConfidence = weightedSum / totalWeight
    }
  }

  const afterVolumeDiscounts = baseTotal - volumeDiscountAmount

  // Правки
  const revisions = calcRevisions(leafCosts, revisionPercent)

  // Подытог
  const subtotal = afterVolumeDiscounts + revisions

  // Процентная скидка/наценка
  let discountAmount = 0
  let afterDiscounts = subtotal
  if (discount.type === 'percent') {
    discountAmount = subtotal * (discount.percentValue / 100)
    afterDiscounts = subtotal + discountAmount
  } else if (discount.type === 'absolute') {
    discountAmount = discount.absoluteValue
    afterDiscounts = subtotal + discountAmount
  }

  // Абсолютные корректировки
  const adjustmentsTotal = additionalAdjustments.reduce((sum, a) => sum + a.amount, 0)
  const afterAdjustments = afterDiscounts + adjustmentsTotal

  // Налог
  const taxAmount = afterAdjustments * (tax.rate / 100)
  const grandTotal = afterAdjustments + taxAmount

  return {
    leafCosts,
    categoryTotals,
    totalHours,
    baseTotal,
    subtotal,
    revisions,
    volumeDiscountAmount,
    volumeDiscountBreakdown,
    afterDiscounts,
    discountAmount,
    afterAdjustments,
    taxAmount,
    grandTotal,
    costRange,
    aggregateConfidence,
  }
}

// === Бюджет времени ===

export interface ResourceBudgetResult {
  minHours: number
  maxHours: number
  minCost: number
  maxCost: number
  fitsInBudget: 'fits' | 'borderline' | 'exceeds'
}

export function calcResourceBudget(
  periodMonthsMin: number,
  periodMonthsMax: number,
  hoursPerWeekMin: number,
  hoursPerWeekMax: number,
  hourlyRate: number,
  estimateHours: number,
): ResourceBudgetResult {
  const WEEKS_PER_MONTH = 4.3
  const minHours = periodMonthsMin * hoursPerWeekMin * WEEKS_PER_MONTH
  const maxHours = periodMonthsMax * hoursPerWeekMax * WEEKS_PER_MONTH

  const minCost = minHours * hourlyRate
  const maxCost = maxHours * hourlyRate

  let fitsInBudget: ResourceBudgetResult['fitsInBudget']
  if (estimateHours <= minHours) {
    fitsInBudget = 'fits'
  } else if (estimateHours <= maxHours) {
    fitsInBudget = 'borderline'
  } else {
    fitsInBudget = 'exceeds'
  }

  return { minHours, maxHours, minCost, maxCost, fitsInBudget }
}

// === Целевая цена ===

export interface TargetPriceResult {
  difference: number
  percentUsed: number
}

export function calcTargetDiff(
  targetValue: number,
  includesTax: boolean,
  grandTotal: number,
  afterAdjustments: number,
): TargetPriceResult {
  const compareWith = includesTax ? grandTotal : afterAdjustments
  const difference = targetValue - compareWith
  const percentUsed = targetValue > 0 ? (compareWith / targetValue) * 100 : 0

  return { difference, percentUsed }
}
