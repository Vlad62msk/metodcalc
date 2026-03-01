import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import type { ProjectContext, Pricing, Discount, Tax, VolumeDiscounts } from '@/types/project'
import type { EstimateItem, EffortRange, ItemOverrides } from '@/types/estimate'

// Key maps for minification
const CTX_KEYS: Record<string, string> = {
  projectType: 'pt', domain: 'd', methodology: 'm', client: 'cl',
  deadline: 'dl', contextMultiplier: 'cm', contextMultiplierIsManual: 'cmi',
  estimateConfidence: 'ec',
}

const ITEM_KEYS: Record<string, string> = {
  id: 'i', parentId: 'p', sortOrder: 'so', name: 'n', quantity: 'q',
  hoursPerUnit: 'h', unit: 'u', category: 'c', role: 'r', roleMultiplier: 'rm',
  qualityLevel: 'ql', revisionable: 'rv', pricingModel: 'pm', fixedPrice: 'fp',
  isContainer: 'ic', containerMode: 'cm', containerFixedTotal: 'cft',
  source: 's', libraryElementId: 'lid', notes: 'nt', clientName: 'cn',
  effortRange: 'er', confidence: 'cf', overrides: 'ov',
}

const PRICING_KEYS: Record<string, string> = {
  hourlyRate: 'hr', revisionPercent: 'rp', revisionPercentIsManual: 'rpm',
  discount: 'dc', tax: 'tx', volumeDiscounts: 'vd',
  additionalAdjustments: 'aa', targetPrice: 'tp',
}

// Default values for comparison (skip if matches default)
const DEFAULT_ITEM_VALUES: Record<string, unknown> = {
  parentId: null, quantity: 1, unit: 'шт.', category: 'content',
  role: 'author', roleMultiplier: 1, qualityLevel: 1, revisionable: true,
  pricingModel: 'time_based', fixedPrice: null, isContainer: false,
  containerMode: 'sum_children', containerFixedTotal: null,
  source: 'manual', libraryElementId: null, notes: '', clientName: '',
  effortRange: null, confidence: null,
}

const DEFAULT_OVERRIDES: ItemOverrides = {
  hoursPerUnit: false, qualityLevel: false, roleMultiplier: false,
  fixedPrice: false, cost: false,
}

function isDefaultOverrides(ov: ItemOverrides): boolean {
  return !ov.hoursPerUnit && !ov.qualityLevel && !ov.roleMultiplier && !ov.fixedPrice && !ov.cost
}

function minifyOption(opt: { value: string; label: string; multiplier?: number; defaultRevisionPercent?: number }) {
  const r: Record<string, unknown> = { v: opt.value, l: opt.label }
  if ('multiplier' in opt && opt.multiplier !== 1) r.x = opt.multiplier
  if ('defaultRevisionPercent' in opt && opt.defaultRevisionPercent) r.drp = opt.defaultRevisionPercent
  return r
}

function expandOption(o: Record<string, unknown>): { value: string; label: string; multiplier: number; defaultRevisionPercent: number } {
  return {
    value: String(o.v ?? ''),
    label: String(o.l ?? ''),
    multiplier: Number(o.x ?? 1),
    defaultRevisionPercent: Number(o.drp ?? 0),
  }
}

function minifyItem(item: EstimateItem): Record<string, unknown> {
  const m: Record<string, unknown> = {}

  for (const [key, shortKey] of Object.entries(ITEM_KEYS)) {
    if (key === 'overrides') continue
    const val = (item as Record<string, unknown>)[key]
    // Skip defaults
    if (key in DEFAULT_ITEM_VALUES && val === DEFAULT_ITEM_VALUES[key]) continue
    // Skip null effortRange
    if (key === 'effortRange' && val === null) continue
    m[shortKey] = val
  }

  // Only include overrides if non-default
  if (!isDefaultOverrides(item.overrides)) {
    const ov: string[] = []
    if (item.overrides.hoursPerUnit) ov.push('h')
    if (item.overrides.qualityLevel) ov.push('q')
    if (item.overrides.roleMultiplier) ov.push('r')
    if (item.overrides.fixedPrice) ov.push('f')
    if (item.overrides.cost) ov.push('c')
    m.ov = ov.join('')
  }

  return m
}

function expandItem(m: Record<string, unknown>): EstimateItem {
  const reverseKeys = Object.fromEntries(Object.entries(ITEM_KEYS).map(([k, v]) => [v, k]))

  const item: Record<string, unknown> = { ...DEFAULT_ITEM_VALUES }

  for (const [shortKey, val] of Object.entries(m)) {
    if (shortKey === 'ov') continue
    const fullKey = reverseKeys[shortKey]
    if (fullKey) item[fullKey] = val
  }

  // Expand overrides
  const ovStr = String(m.ov ?? '')
  item.overrides = {
    hoursPerUnit: ovStr.includes('h'),
    qualityLevel: ovStr.includes('q'),
    roleMultiplier: ovStr.includes('r'),
    fixedPrice: ovStr.includes('f'),
    cost: ovStr.includes('c'),
  }

  return item as unknown as EstimateItem
}

function minifyDiscount(d: Discount) {
  if (d.type === 'none') return null
  return { t: d.type, pv: d.percentValue, av: d.absoluteValue, cm: d.comment || undefined }
}

function expandDiscount(d: Record<string, unknown> | null): Discount {
  if (!d) return { type: 'none', percentValue: 0, absoluteValue: 0, comment: '' }
  return {
    type: (d.t as Discount['type']) ?? 'none',
    percentValue: Number(d.pv ?? 0),
    absoluteValue: Number(d.av ?? 0),
    comment: String(d.cm ?? ''),
  }
}

interface MinifiedState {
  v: string
  ctx: Record<string, unknown>
  it: Record<string, unknown>[]
  pr: Record<string, unknown>
}

export function minifyState(context: ProjectContext, items: EstimateItem[], pricing: Pricing): string {
  const state: MinifiedState = {
    v: '1',
    ctx: {
      [CTX_KEYS.projectType]: { v: context.projectType.value, l: context.projectType.label },
      [CTX_KEYS.domain]: minifyOption(context.domain),
      [CTX_KEYS.methodology]: minifyOption(context.methodology),
      [CTX_KEYS.client]: minifyOption(context.client),
      [CTX_KEYS.deadline]: minifyOption(context.deadline),
      [CTX_KEYS.contextMultiplier]: context.contextMultiplier,
      [CTX_KEYS.contextMultiplierIsManual]: context.contextMultiplierIsManual ? 1 : 0,
    },
    it: items.map(minifyItem),
    pr: {
      [PRICING_KEYS.hourlyRate]: pricing.hourlyRate,
      [PRICING_KEYS.revisionPercent]: pricing.revisionPercent,
    },
  }

  // Optional pricing fields
  if (pricing.revisionPercentIsManual) {
    state.pr[PRICING_KEYS.revisionPercentIsManual] = 1
  }
  const dc = minifyDiscount(pricing.discount)
  if (dc) state.pr[PRICING_KEYS.discount] = dc

  if (pricing.tax.rate > 0) {
    state.pr[PRICING_KEYS.tax] = { r: pricing.tax.rate, s: pricing.tax.showSeparately ? 1 : 0 }
  }

  if (pricing.volumeDiscounts.enabled) {
    state.pr[PRICING_KEYS.volumeDiscounts] = {
      m: pricing.volumeDiscounts.mode,
      t: pricing.volumeDiscounts.tiers,
    }
  }

  if (pricing.additionalAdjustments.length > 0) {
    state.pr[PRICING_KEYS.additionalAdjustments] = pricing.additionalAdjustments.map(a => ({
      l: a.label, a: a.amount,
    }))
  }

  if (context.estimateConfidence) {
    state.ctx[CTX_KEYS.estimateConfidence] = context.estimateConfidence
  }

  return compressToEncodedURIComponent(JSON.stringify(state))
}

export interface ExpandedSharedState {
  context: ProjectContext
  items: EstimateItem[]
  pricing: Pricing
}

export function expandState(compressed: string): ExpandedSharedState | null {
  try {
    const json = decompressFromEncodedURIComponent(compressed)
    if (!json) return null

    const state: MinifiedState = JSON.parse(json)
    if (!state.v || !state.ctx || !state.it || !state.pr) return null

    const ctx = state.ctx
    const pr = state.pr

    const ptObj = ctx[CTX_KEYS.projectType] as Record<string, unknown>
    const context: ProjectContext = {
      projectType: { value: String(ptObj?.v ?? ''), label: String(ptObj?.l ?? '') },
      domain: expandOption(ctx[CTX_KEYS.domain] as Record<string, unknown> ?? {}),
      methodology: expandOption(ctx[CTX_KEYS.methodology] as Record<string, unknown> ?? {}),
      client: expandOption(ctx[CTX_KEYS.client] as Record<string, unknown> ?? {}),
      deadline: expandOption(ctx[CTX_KEYS.deadline] as Record<string, unknown> ?? {}),
      contextMultiplier: Number(ctx[CTX_KEYS.contextMultiplier] ?? 1),
      contextMultiplierIsManual: ctx[CTX_KEYS.contextMultiplierIsManual] === 1,
      estimateConfidence: (ctx[CTX_KEYS.estimateConfidence] as ProjectContext['estimateConfidence']) ?? null,
    }

    const items = state.it.map(expandItem)

    const txObj = pr[PRICING_KEYS.tax] as Record<string, unknown> | undefined
    const vdObj = pr[PRICING_KEYS.volumeDiscounts] as Record<string, unknown> | undefined
    const aaArr = pr[PRICING_KEYS.additionalAdjustments] as Record<string, unknown>[] | undefined

    const pricing: Pricing = {
      hourlyRate: Number(pr[PRICING_KEYS.hourlyRate] ?? 0),
      rateHelper: { salary: null, hoursPerMonth: 160, projectType: '', multiplier: 1 },
      resourceBudget: { enabled: false, periodMonthsMin: 1, periodMonthsMax: 3, hoursPerWeekMin: 10, hoursPerWeekMax: 40 },
      revisionPercent: Number(pr[PRICING_KEYS.revisionPercent] ?? 0),
      revisionPercentIsManual: pr[PRICING_KEYS.revisionPercentIsManual] === 1,
      discount: expandDiscount(pr[PRICING_KEYS.discount] as Record<string, unknown> | null ?? null),
      tax: txObj ? { rate: Number(txObj.r ?? 0), showSeparately: txObj.s === 1 } : { rate: 0, showSeparately: false },
      volumeDiscounts: vdObj
        ? { enabled: true, mode: (vdObj.m as VolumeDiscounts['mode']) ?? 'by_element', tiers: (vdObj.t as VolumeDiscounts['tiers']) ?? [] }
        : { enabled: false, mode: 'by_element', tiers: [] },
      additionalAdjustments: aaArr
        ? aaArr.map((a, i) => ({ id: `adj_${i}`, label: String(a.l ?? ''), amount: Number(a.a ?? 0) }))
        : [],
      targetPrice: { enabled: false, value: 0, includesTax: false },
    }

    return { context, items, pricing }
  } catch {
    return null
  }
}

export function getShareUrl(context: ProjectContext, items: EstimateItem[], pricing: Pricing, baseUrl?: string): string {
  const compressed = minifyState(context, items, pricing)
  const base = baseUrl ?? window.location.origin + window.location.pathname
  return `${base}#/shared/${compressed}`
}
