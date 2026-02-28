import { describe, it, expect } from 'vitest'
import {
  calcContextMultiplier,
  calcItemCost,
  calcEffectiveHours,
  calcPertHours,
  calcCostRange,
  getLeaves,
  calcAllLeafCosts,
  calcCategoryTotals,
  calcTotalHours,
  calcRevisions,
  lookupDiscount,
  calcVolumeDiscounts,
  calcGrandTotal,
  calcResourceBudget,
  calcTargetDiff,
  getContextWarning,
} from './calculator'
import type { EstimateItem } from '@/types/estimate'
import type { ProjectContext } from '@/types/project'

function makeItem(overrides: Partial<EstimateItem> = {}): EstimateItem {
  return {
    id: 'item-1',
    parentId: null,
    sortOrder: 0,
    name: 'Test Item',
    quantity: 1,
    hoursPerUnit: 2,
    unit: 'шт',
    category: 'content',
    role: 'author',
    roleMultiplier: 1.0,
    qualityLevel: 1.0,
    revisionable: true,
    pricingModel: 'time_based',
    fixedPrice: null,
    isContainer: false,
    containerMode: 'sum_children',
    containerFixedTotal: null,
    source: 'manual',
    libraryElementId: null,
    notes: '',
    clientName: 'Test Item',
    effortRange: null,
    confidence: null,
    overrides: {
      hoursPerUnit: false,
      qualityLevel: false,
      roleMultiplier: false,
      fixedPrice: false,
      cost: false,
    },
    ...overrides,
  }
}

function makeContext(overrides: Partial<ProjectContext> = {}): ProjectContext {
  return {
    projectType: { value: 'new_course', label: 'Новый курс' },
    domain: { value: 'familiar', label: 'Знакомая тема', multiplier: 1.0 },
    methodology: { value: 'own', label: 'Своя методика', multiplier: 1.0 },
    client: { value: 'regular', label: 'Постоянный', multiplier: 1.0, defaultRevisionPercent: 0.1 },
    deadline: { value: 'standard', label: 'Стандартные', multiplier: 1.0 },
    contextMultiplier: 1.0,
    contextMultiplierIsManual: false,
    estimateConfidence: null,
    ...overrides,
  }
}

describe('calcContextMultiplier', () => {
  it('returns product of all multipliers', () => {
    const ctx = makeContext({
      domain: { value: 'new', label: '', multiplier: 1.3 },
      methodology: { value: 'adapt', label: '', multiplier: 1.2 },
      client: { value: 'new', label: '', multiplier: 1.1, defaultRevisionPercent: 0.2 },
      deadline: { value: 'tight', label: '', multiplier: 1.2 },
    })
    expect(calcContextMultiplier(ctx)).toBeCloseTo(1.3 * 1.2 * 1.1 * 1.2, 4)
  })

  it('returns manual value when isManual is true', () => {
    const ctx = makeContext({
      contextMultiplier: 2.5,
      contextMultiplierIsManual: true,
    })
    expect(calcContextMultiplier(ctx)).toBe(2.5)
  })
})

describe('getContextWarning', () => {
  it('returns null for normal values', () => {
    expect(getContextWarning(1.5)).toBeNull()
    expect(getContextWarning(3.0)).toBeNull()
  })

  it('returns yellow for > 3.0', () => {
    expect(getContextWarning(3.1)?.level).toBe('yellow')
  })

  it('returns red for > 5.0', () => {
    expect(getContextWarning(5.1)?.level).toBe('red')
  })
})

describe('calcPertHours', () => {
  it('returns null when effortRange is null', () => {
    expect(calcPertHours(makeItem())).toBeNull()
  })

  it('returns null when min is null', () => {
    expect(calcPertHours(makeItem({ effortRange: { min: null, expected: null, max: 8 } }))).toBeNull()
  })

  it('returns null when max is null', () => {
    expect(calcPertHours(makeItem({ effortRange: { min: 2, expected: null, max: null } }))).toBeNull()
  })

  it('calculates PERT using hoursPerUnit as expected when expected is null', () => {
    const item = makeItem({ hoursPerUnit: 4, effortRange: { min: 2, expected: null, max: 8 } })
    // (2 + 4*4 + 8) / 6 = 26/6 ≈ 4.333
    expect(calcPertHours(item)).toBeCloseTo((2 + 4 * 4 + 8) / 6)
  })

  it('calculates PERT using explicit expected value', () => {
    const item = makeItem({ hoursPerUnit: 4, effortRange: { min: 1, expected: 3, max: 9 } })
    // (1 + 4*3 + 9) / 6 = 22/6 ≈ 3.667
    expect(calcPertHours(item)).toBeCloseTo((1 + 4 * 3 + 9) / 6)
  })
})

describe('calcEffectiveHours', () => {
  it('multiplies hoursPerUnit by role and quality', () => {
    const item = makeItem({ hoursPerUnit: 2.5, roleMultiplier: 0.5, qualityLevel: 1.5 })
    expect(calcEffectiveHours(item)).toBeCloseTo(2.5 * 0.5 * 1.5)
  })

  it('uses PERT when effortRange is set and hoursPerUnit is not overridden', () => {
    const item = makeItem({
      hoursPerUnit: 4,
      effortRange: { min: 2, expected: null, max: 8 },
      overrides: { hoursPerUnit: false, qualityLevel: false, roleMultiplier: false, fixedPrice: false, cost: false },
    })
    const pert = (2 + 4 * 4 + 8) / 6
    expect(calcEffectiveHours(item)).toBeCloseTo(pert * 1.0 * 1.0)
  })

  it('ignores PERT when hoursPerUnit is overridden', () => {
    const item = makeItem({
      hoursPerUnit: 4,
      effortRange: { min: 2, expected: null, max: 8 },
      overrides: { hoursPerUnit: true, qualityLevel: false, roleMultiplier: false, fixedPrice: false, cost: false },
    })
    // Should use 4 (manual value), not PERT
    expect(calcEffectiveHours(item)).toBeCloseTo(4 * 1.0 * 1.0)
  })
})

describe('calcItemCost', () => {
  it('calculates time_based cost correctly', () => {
    const item = makeItem({ hoursPerUnit: 2, quantity: 5 })
    // 2 * 1.0 * 1.0 * 5 * 1000 * 1.5 = 15000
    expect(calcItemCost(item, 1000, 1.5)).toBe(15000)
  })

  it('calculates fixed_price cost without context multiplier', () => {
    const item = makeItem({
      pricingModel: 'fixed_price',
      fixedPrice: 5000,
      quantity: 3,
    })
    expect(calcItemCost(item, 1000, 1.5)).toBe(15000)
  })

  it('returns containerFixedTotal for fixed_total containers', () => {
    const item = makeItem({
      isContainer: true,
      containerMode: 'fixed_total',
      containerFixedTotal: 20000,
    })
    expect(calcItemCost(item, 1000, 1.5)).toBe(20000)
  })
})

describe('getLeaves', () => {
  it('returns atomic items as leaves', () => {
    const items = [makeItem({ id: '1' }), makeItem({ id: '2' })]
    expect(getLeaves(items)).toHaveLength(2)
  })

  it('excludes sum_children containers', () => {
    const items = [
      makeItem({ id: 'c1', isContainer: true, containerMode: 'sum_children' }),
      makeItem({ id: '1', parentId: 'c1' }),
      makeItem({ id: '2', parentId: 'c1' }),
    ]
    const leaves = getLeaves(items)
    expect(leaves).toHaveLength(2)
    expect(leaves.map((l) => l.id)).toEqual(['1', '2'])
  })

  it('includes fixed_total containers as leaves', () => {
    const items = [
      makeItem({ id: 'c1', isContainer: true, containerMode: 'fixed_total', containerFixedTotal: 15000 }),
      makeItem({ id: '1', parentId: 'c1' }),
    ]
    const leaves = getLeaves(items)
    expect(leaves).toHaveLength(1)
    expect(leaves[0]!.id).toBe('c1')
  })

  it('excludes children of fixed_total containers', () => {
    const items = [
      makeItem({ id: 'c1', isContainer: true, containerMode: 'fixed_total', containerFixedTotal: 15000 }),
      makeItem({ id: '1', parentId: 'c1' }),
      makeItem({ id: '2' }),
    ]
    const leaves = getLeaves(items)
    expect(leaves).toHaveLength(2)
    expect(leaves.map((l) => l.id).sort()).toEqual(['2', 'c1'])
  })
})

describe('calcCategoryTotals', () => {
  it('groups costs by category', () => {
    const leafCosts = [
      { item: makeItem({ category: 'content' }), cost: 1000 },
      { item: makeItem({ category: 'content' }), cost: 2000 },
      { item: makeItem({ category: 'assessment' }), cost: 500 },
      { item: makeItem({ category: 'service' }), cost: 300 },
      { item: makeItem({ category: 'other' }), cost: 200 },
    ]
    const totals = calcCategoryTotals(leafCosts)
    expect(totals.content).toBe(3000)
    expect(totals.assessment).toBe(500)
    expect(totals.service).toBe(300)
    expect(totals.other).toBe(200)
  })
})

describe('calcTotalHours', () => {
  it('sums effective hours of time_based leaves', () => {
    const items = [
      makeItem({ id: '1', hoursPerUnit: 2, quantity: 5, roleMultiplier: 1.0 }),
      makeItem({ id: '2', hoursPerUnit: 3, quantity: 2, roleMultiplier: 0.5 }),
      makeItem({ id: '3', pricingModel: 'fixed_price', fixedPrice: 5000, quantity: 1, hoursPerUnit: 10 }),
    ]
    // item 1: 2 * 1.0 * 1.0 * 5 = 10
    // item 2: 3 * 0.5 * 1.0 * 2 = 3
    // item 3: fixed_price — not counted
    expect(calcTotalHours(items)).toBeCloseTo(13)
  })
})

describe('calcRevisions', () => {
  it('calculates revision cost based on revisionable items', () => {
    const leafCosts = [
      { item: makeItem({ revisionable: true }), cost: 10000 },
      { item: makeItem({ revisionable: false }), cost: 5000 },
      { item: makeItem({ revisionable: true }), cost: 3000 },
    ]
    // (10000 + 3000) * 0.2 = 2600
    expect(calcRevisions(leafCosts, 0.2)).toBe(2600)
  })
})

describe('lookupDiscount', () => {
  const tiers = [
    { minQty: 1, discountPercent: 0 },
    { minQty: 6, discountPercent: 10 },
    { minQty: 16, discountPercent: 20 },
    { minQty: 31, discountPercent: 30 },
  ]

  it('returns 0 for small quantities', () => {
    expect(lookupDiscount(3, tiers)).toBe(0)
  })

  it('returns correct discount for mid quantities', () => {
    expect(lookupDiscount(10, tiers)).toBe(0.1)
  })

  it('returns highest discount for large quantities', () => {
    expect(lookupDiscount(50, tiers)).toBe(0.3)
  })
})

describe('calcGrandTotal', () => {
  it('calculates full pipeline correctly', () => {
    const items = [
      makeItem({ id: '1', hoursPerUnit: 2, quantity: 5, category: 'content', revisionable: true }),
      makeItem({ id: '2', hoursPerUnit: 3, quantity: 2, category: 'assessment', revisionable: true }),
      makeItem({ id: '3', hoursPerUnit: 4, quantity: 1, category: 'service', revisionable: false }),
    ]

    const result = calcGrandTotal({
      items,
      hourlyRate: 1000,
      contextMultiplier: 1.0,
      costOverrides: {},
      revisionPercent: 0.2,
      discount: { type: 'none', percentValue: 0, absoluteValue: 0, comment: '' },
      tax: { rate: 0, showSeparately: false },
      volumeDiscounts: { enabled: false, mode: 'by_element', tiers: [] },
      additionalAdjustments: [],
    })

    // content: 2*1*1 * 5 * 1000 = 10000
    // assessment: 3*1*1 * 2 * 1000 = 6000
    // service: 4*1*1 * 1 * 1000 = 4000
    // subtotal base = 20000
    // revisions: (10000 + 6000) * 0.2 = 3200
    // subtotal = 20000 + 3200 = 23200
    expect(result.categoryTotals.content).toBe(10000)
    expect(result.categoryTotals.assessment).toBe(6000)
    expect(result.categoryTotals.service).toBe(4000)
    expect(result.revisions).toBe(3200)
    expect(result.grandTotal).toBe(23200)
  })

  it('applies tax correctly', () => {
    const items = [makeItem({ hoursPerUnit: 10, quantity: 1, revisionable: false })]
    const result = calcGrandTotal({
      items,
      hourlyRate: 1000,
      contextMultiplier: 1.0,
      costOverrides: {},
      revisionPercent: 0,
      discount: { type: 'none', percentValue: 0, absoluteValue: 0, comment: '' },
      tax: { rate: 6, showSeparately: true },
      volumeDiscounts: { enabled: false, mode: 'by_element', tiers: [] },
      additionalAdjustments: [],
    })
    // 10000 * 1.06 = 10600
    expect(result.grandTotal).toBeCloseTo(10600)
    expect(result.taxAmount).toBeCloseTo(600)
  })
})

describe('calcResourceBudget', () => {
  it('calculates budget range correctly', () => {
    const result = calcResourceBudget(1.5, 2, 10, 15, 1350, 91)
    // min: 1.5 * 10 * 4.3 = 64.5
    // max: 2 * 15 * 4.3 = 129
    expect(result.minHours).toBeCloseTo(64.5)
    expect(result.maxHours).toBeCloseTo(129)
    expect(result.fitsInBudget).toBe('borderline')
  })

  it('reports fits when estimate is below min', () => {
    const result = calcResourceBudget(2, 3, 20, 30, 1000, 50)
    expect(result.fitsInBudget).toBe('fits')
  })

  it('reports exceeds when estimate is above max', () => {
    const result = calcResourceBudget(1, 1, 5, 5, 1000, 100)
    expect(result.fitsInBudget).toBe('exceeds')
  })
})

describe('calcTargetDiff', () => {
  it('calculates difference after tax', () => {
    const result = calcTargetDiff(120000, true, 98400, 90000)
    expect(result.difference).toBe(120000 - 98400)
    expect(result.percentUsed).toBeCloseTo(82, 0)
  })

  it('calculates difference before tax', () => {
    const result = calcTargetDiff(100000, false, 106000, 100000)
    expect(result.difference).toBe(0)
  })
})

describe('calcCostRange', () => {
  it('returns null when no items have effortRange', () => {
    const items = [makeItem({ hoursPerUnit: 4, quantity: 5 })]
    expect(calcCostRange(items, 1000, 1.0, {})).toBeNull()
  })

  it('returns null when effortRange exists but hoursPerUnit is overridden', () => {
    const items = [makeItem({
      hoursPerUnit: 4,
      quantity: 5,
      effortRange: { min: 2, expected: null, max: 8 },
      overrides: { hoursPerUnit: true, qualityLevel: false, roleMultiplier: false, fixedPrice: false, cost: false },
    })]
    expect(calcCostRange(items, 1000, 1.0, {})).toBeNull()
  })

  it('calculates min/max cost from effortRange', () => {
    const items = [makeItem({
      hoursPerUnit: 4,
      quantity: 5,
      effortRange: { min: 2, expected: null, max: 8 },
      overrides: { hoursPerUnit: false, qualityLevel: false, roleMultiplier: false, fixedPrice: false, cost: false },
    })]
    const result = calcCostRange(items, 1000, 1.5, {})
    // min: 2 * 1.0 * 1.0 * 5 * 1000 * 1.5 = 15000
    // max: 8 * 1.0 * 1.0 * 5 * 1000 * 1.5 = 60000
    expect(result).not.toBeNull()
    expect(result!.minCost).toBeCloseTo(15000)
    expect(result!.maxCost).toBeCloseTo(60000)
  })

  it('includes fixed_price items as equal min/max', () => {
    const items = [
      makeItem({
        id: '1',
        hoursPerUnit: 4,
        quantity: 2,
        effortRange: { min: 2, expected: null, max: 6 },
        overrides: { hoursPerUnit: false, qualityLevel: false, roleMultiplier: false, fixedPrice: false, cost: false },
      }),
      makeItem({
        id: '2',
        pricingModel: 'fixed_price',
        fixedPrice: 5000,
        quantity: 1,
      }),
    ]
    const result = calcCostRange(items, 1000, 1.0, {})
    // item 1 min: 2 * 1 * 1 * 2 * 1000 * 1.0 = 4000
    // item 1 max: 6 * 1 * 1 * 2 * 1000 * 1.0 = 12000
    // item 2: 5000 both
    expect(result).not.toBeNull()
    expect(result!.minCost).toBeCloseTo(9000)
    expect(result!.maxCost).toBeCloseTo(17000)
  })
})
