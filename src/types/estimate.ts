export type Category = 'content' | 'assessment' | 'service' | 'other'

export type RoleType = 'author' | 'editor' | 'reviewer' | 'custom'

export type PricingModel = 'time_based' | 'fixed_price'

export type ContainerMode = 'sum_children' | 'fixed_total'

export type ItemSource = 'manual' | 'library_element' | 'library_set'

export interface EffortRange {
  min: number | null
  expected: number | null
  max: number | null
}

export interface ItemOverrides {
  hoursPerUnit: boolean
  qualityLevel: boolean
  roleMultiplier: boolean
  fixedPrice: boolean
  cost: boolean
}

export interface EstimateItem {
  // Идентификация
  id: string
  parentId: string | null
  sortOrder: number

  // Основные поля
  name: string
  quantity: number
  hoursPerUnit: number
  unit: string
  category: Category

  // Модификаторы строки
  role: RoleType
  roleMultiplier: number
  qualityLevel: number
  revisionable: boolean

  // Модель ценообразования
  pricingModel: PricingModel
  fixedPrice: number | null

  // Контейнер
  isContainer: boolean
  containerMode: ContainerMode
  containerFixedTotal: number | null

  // Мета
  source: ItemSource
  libraryElementId: string | null
  notes: string
  clientName: string

  // Диапазон трудозатрат и уверенность
  effortRange: EffortRange | null
  confidence: number | null  // 1-5 шкала; null = не задано

  // Индикаторы ручных правок
  overrides: ItemOverrides
}

export const CONFIDENCE_LEVELS = [
  { value: 1, label: 'Очень низкая', color: 'bg-red-500' },
  { value: 2, label: 'Низкая', color: 'bg-orange-400' },
  { value: 3, label: 'Средняя', color: 'bg-yellow-400' },
  { value: 4, label: 'Хорошая', color: 'bg-lime-500' },
  { value: 5, label: 'Высокая', color: 'bg-green-500' },
] as const

export const CATEGORY_LABELS: Record<Category, string> = {
  content: 'Контент',
  assessment: 'Проверки знаний',
  service: 'Услуги сопровождения',
  other: 'Другое',
}

export const ROLE_LABELS: Record<RoleType, string> = {
  author: 'Автор',
  editor: 'Редактор',
  reviewer: 'Ревьюер',
  custom: 'Другое',
}

export const DEFAULT_ROLE_MULTIPLIERS: Record<Exclude<RoleType, 'custom'>, number> = {
  author: 1.0,
  editor: 0.5,
  reviewer: 0.3,
}

export const QUALITY_LEVELS = [
  { value: 0.7, label: 'Базовый' },
  { value: 1.0, label: 'Стандарт' },
  { value: 1.5, label: 'Премиум' },
] as const
