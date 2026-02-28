import type { EstimateItem } from './estimate'

// === Шаг 1: Контекст ===

export interface ContextOption {
  value: string
  label: string
  multiplier: number
}

export interface ClientOption extends ContextOption {
  defaultRevisionPercent: number
}

export interface ProjectContext {
  projectType: {
    value: string
    label: string
  }
  domain: ContextOption
  methodology: ContextOption
  client: ClientOption
  deadline: ContextOption
  contextMultiplier: number
  contextMultiplierIsManual: boolean
  estimateConfidence: 'low' | 'medium' | 'high' | null
}

// === Шаг 3: Стоимость ===

export interface RateHelper {
  salary: number | null
  hoursPerMonth: number
  projectType: string
  multiplier: number
}

export interface ResourceBudget {
  enabled: boolean
  periodMonthsMin: number
  periodMonthsMax: number
  hoursPerWeekMin: number
  hoursPerWeekMax: number
}

export interface Discount {
  type: 'percent' | 'absolute' | 'none'
  percentValue: number
  absoluteValue: number
  comment: string
}

export interface Tax {
  rate: number
  showSeparately: boolean
}

export interface VolumeDiscountTier {
  minQty: number
  discountPercent: number
}

export interface VolumeDiscounts {
  enabled: boolean
  mode: 'by_element' | 'by_category'
  tiers: VolumeDiscountTier[]
}

export interface AdditionalAdjustment {
  id: string
  label: string
  amount: number
}

export interface TargetPrice {
  enabled: boolean
  value: number
  includesTax: boolean
}

export interface Pricing {
  hourlyRate: number
  rateHelper: RateHelper
  resourceBudget: ResourceBudget
  revisionPercent: number
  revisionPercentIsManual: boolean
  discount: Discount
  tax: Tax
  volumeDiscounts: VolumeDiscounts
  additionalAdjustments: AdditionalAdjustment[]
  targetPrice: TargetPrice
}

// === Шаг 4: Презентация ===

export interface Presentation {
  showHours: boolean
  showPricePerUnit: boolean
  showQuantity: boolean
  showUnits: boolean
  showGroupStructure: boolean
  showTaxSeparately: boolean
  showDiscountSeparately: boolean
  showConditions: boolean
  conditionsText: string
  showSignature: boolean
  signatureName: string
  signatureContact: string
}

// === Снапшоты ===

export interface Snapshot {
  id: string
  timestamp: string
  label: string
  state: Omit<ProjectState, 'snapshots'>
}

// === Мета ===

export interface ProjectMeta {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  version: '3.3'
}

// === Полное состояние проекта ===

export interface ProjectState {
  context: ProjectContext
  items: EstimateItem[]
  pricing: Pricing
  presentation: Presentation
  snapshots: Snapshot[]
  meta: ProjectMeta
}
