import type { PresentationPreset } from '@/core/presentationPresets'

export type InterfaceMode = 'simple' | 'standard' | 'pro'

export interface UserSettings {
  // Ставка
  defaultHourlyRate: number
  rateSalary: number | null
  rateHoursPerMonth: number
  rateProjectType: string
  rateMultiplier: number

  // Налоги
  defaultTaxRate: number
  defaultTaxShowSeparately: boolean

  // Подпись
  signatureName: string
  signatureContact: string

  // Интерфейс
  interfaceMode: InterfaceMode

  // Роли
  defaultRoleMultipliers: {
    author: number
    editor: number
    reviewer: number
  }

  // Скидки
  volumeDiscountMode: 'by_element' | 'by_category'

  // Пресеты отображения
  customPresets: PresentationPreset[]

  // Онбординг
  hasCompletedOnboarding: boolean

  // Бэкап
  lastBackupReminder: string
}
