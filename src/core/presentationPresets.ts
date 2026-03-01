import type { Presentation } from '@/types/project'

export interface PresentationPreset {
  id: string
  name: string
  description: string
  isBuiltIn: boolean
  settings: Partial<Presentation>
}

/** Детальная: всё показано */
const PRESET_DETAILED: PresentationPreset = {
  id: 'preset-detailed',
  name: 'Детальная',
  description: 'Полная смета: часы, цена за единицу, количество, группы, налог, скидка',
  isBuiltIn: true,
  settings: {
    showHours: true,
    showPricePerUnit: true,
    showQuantity: true,
    showUnits: true,
    showGroupStructure: true,
    showTaxSeparately: true,
    showDiscountSeparately: true,
  },
}

/** Компактная: позиции + цены, без деталей */
const PRESET_COMPACT: PresentationPreset = {
  id: 'preset-compact',
  name: 'Компактная',
  description: 'Список работ и цены, без количества, единиц и структуры',
  isBuiltIn: true,
  settings: {
    showHours: false,
    showPricePerUnit: false,
    showQuantity: false,
    showUnits: false,
    showGroupStructure: false,
    showTaxSeparately: false,
    showDiscountSeparately: false,
  },
}

/** Минимальная: агрегация по категориям */
const PRESET_MINIMAL: PresentationPreset = {
  id: 'preset-minimal',
  name: 'Минимальная',
  description: 'Агрегация по категориям — одна строка на категорию',
  isBuiltIn: true,
  settings: {
    showHours: false,
    showPricePerUnit: false,
    showQuantity: false,
    showUnits: false,
    showGroupStructure: false,
    showTaxSeparately: false,
    showDiscountSeparately: false,
    aggregateByCategory: true,
  },
}

export const BUILT_IN_PRESETS: PresentationPreset[] = [
  PRESET_DETAILED,
  PRESET_COMPACT,
  PRESET_MINIMAL,
]

/** Check if current presentation matches a preset */
export function matchesPreset(
  presentation: Presentation,
  preset: PresentationPreset,
): boolean {
  for (const [key, value] of Object.entries(preset.settings)) {
    if ((presentation as Record<string, unknown>)[key] !== value) {
      return false
    }
  }
  return true
}
