import { generateId } from '@/utils/id'
import type { EstimateItem } from '@/types/estimate'
import type { ProjectState, ProjectContext, Pricing, Presentation } from '@/types/project'
import type { LibraryElement, LibrarySet, UserLibrary } from '@/types/library'
import type { UserSettings } from '@/types/settings'
import { DEFAULT_CURRENCY } from '@/core/currencies'

// === Дефолтный контекст ===

export const DEFAULT_CONTEXT: ProjectContext = {
  projectType: { value: 'new_course', label: 'Новый курс с нуля' },
  domain: { value: 'familiar', label: 'Работал с этой темой', multiplier: 1.0 },
  methodology: { value: 'own', label: 'Своя проверенная методика', multiplier: 1.0 },
  client: { value: 'regular', label: 'Постоянный клиент', multiplier: 1.0, defaultRevisionPercent: 0.1 },
  deadline: { value: 'standard', label: 'Стандартные', multiplier: 1.0 },
  contextMultiplier: 1.0,
  contextMultiplierIsManual: false,
  estimateConfidence: null,
}

// === Дефолтный pricing ===

export const DEFAULT_PRICING: Pricing = {
  hourlyRate: 0,
  rateHelper: {
    salary: null,
    hoursPerMonth: 160,
    projectType: 'freelance',
    multiplier: 1.5,
  },
  resourceBudget: {
    enabled: false,
    periodMonthsMin: 1,
    periodMonthsMax: 2,
    hoursPerWeekMin: 10,
    hoursPerWeekMax: 20,
  },
  revisionPercent: 0.1,
  revisionPercentIsManual: false,
  discount: {
    type: 'none',
    percentValue: 0,
    absoluteValue: 0,
    comment: '',
  },
  tax: {
    rate: 0,
    showSeparately: false,
  },
  volumeDiscounts: {
    enabled: false,
    mode: 'by_element',
    tiers: [
      { minQty: 1, discountPercent: 0 },
      { minQty: 6, discountPercent: 10 },
      { minQty: 16, discountPercent: 20 },
      { minQty: 31, discountPercent: 30 },
    ],
  },
  additionalAdjustments: [],
  targetPrice: {
    enabled: false,
    value: 0,
    includesTax: true,
  },
}

// === Дефолтная презентация ===

export const DEFAULT_PRESENTATION: Presentation = {
  showHours: false,
  showPricePerUnit: false,
  showQuantity: true,
  showUnits: false,
  showGroupStructure: false,
  showTaxSeparately: false,
  showDiscountSeparately: false,
  aggregateByCategory: false,
  showConditions: true,
  conditionsText:
    '• Оплата по факту выполнения этапов\n• Сроки уточняются при заключении договора\n• Расчёт действителен 30 дней',
  showSignature: false,
  signatureName: '',
  signatureContact: '',
}

// === Дефолтная строка ===

export function createDefaultItem(overrides: Partial<EstimateItem> = {}): EstimateItem {
  return {
    id: generateId(),
    parentId: null,
    sortOrder: 0,
    name: '',
    quantity: 1,
    hoursPerUnit: 0,
    unit: '',
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
    clientName: '',
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

// === Дефолтный ProjectState ===

export function createDefaultProjectState(): ProjectState {
  return {
    context: { ...DEFAULT_CONTEXT },
    items: [],
    pricing: { ...DEFAULT_PRICING },
    presentation: { ...DEFAULT_PRESENTATION },
    snapshots: [],
    meta: {
      id: generateId(),
      name: 'Новый проект',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '3.3',
    },
    scenarios: {
      enabled: false,
      activeScenarioId: null,
      list: [],
    },
  }
}

// === Встроенная библиотека ===

export const BUILT_IN_ELEMENTS: LibraryElement[] = [
  { id: 'blib-longread', type: 'element', name: 'Лонгрид', hoursPerUnit: 2.5, unit: '~1 стр А4', category: 'content', role: 'author', revisionable: true, description: 'Структурированный текстовый материал', isBuiltIn: true, isHidden: false },
  { id: 'blib-script', type: 'element', name: 'Скрипт для видеозаписи', hoursPerUnit: 4.0, unit: '~15 мин видео', category: 'content', role: 'author', revisionable: true, description: 'Сценарий для видеоурока', isBuiltIn: true, isHidden: false },
  { id: 'blib-presentation', type: 'element', name: 'Презентация', hoursPerUnit: 6.0, unit: '~30 слайдов', category: 'content', role: 'author', revisionable: true, description: 'Слайды для урока или вебинара', isBuiltIn: true, isHidden: false },
  { id: 'blib-exercises', type: 'element', name: 'Упражнения', hoursPerUnit: 1.0, unit: 'шт', category: 'content', role: 'author', revisionable: true, description: 'Практическое задание', isBuiltIn: true, isHidden: false },
  { id: 'blib-illustrations', type: 'element', name: 'Иллюстрации (подбор и упаковка)', hoursPerUnit: 0.5, unit: 'комплект', category: 'content', role: 'author', revisionable: true, description: 'Подбор и оформление иллюстративного материала', isBuiltIn: true, isHidden: false },
  { id: 'blib-quiz', type: 'element', name: 'Квизы', hoursPerUnit: 1.5, unit: '~7 вопросов', category: 'content', role: 'author', revisionable: true, description: 'Интерактивная проверка знаний', isBuiltIn: true, isHidden: false },
  { id: 'blib-instructions', type: 'element', name: 'Пошаговые инструкции', hoursPerUnit: 3.0, unit: 'шт', category: 'content', role: 'author', revisionable: true, description: 'Детальные пошаговые инструкции', isBuiltIn: true, isHidden: false },
  { id: 'blib-templates', type: 'element', name: 'Шаблоны / Канвасы', hoursPerUnit: 2.0, unit: 'шт', category: 'content', role: 'author', revisionable: true, description: 'Рабочие шаблоны для студентов', isBuiltIn: true, isHidden: false },
  { id: 'blib-example', type: 'element', name: 'Разбор примера', hoursPerUnit: 2.0, unit: 'шт', category: 'content', role: 'author', revisionable: true, description: 'Детальный разбор примера', isBuiltIn: true, isHidden: false },
  { id: 'blib-case', type: 'element', name: 'Описание кейса', hoursPerUnit: 3.0, unit: 'шт', category: 'content', role: 'author', revisionable: true, description: 'Описание практического кейса', isBuiltIn: true, isHidden: false },
  { id: 'blib-analysis-questions', type: 'element', name: 'Вопросы для анализа', hoursPerUnit: 1.0, unit: 'комплект', category: 'content', role: 'author', revisionable: true, description: 'Вопросы для рефлексии и анализа', isBuiltIn: true, isHidden: false },
  { id: 'blib-solution', type: 'element', name: 'Разбор решения', hoursPerUnit: 1.0, unit: 'шт', category: 'content', role: 'author', revisionable: true, description: 'Разбор эталонного решения', isBuiltIn: true, isHidden: false },
  { id: 'blib-engagement', type: 'element', name: 'Механики вовлечения', hoursPerUnit: 2.0, unit: 'комплект', category: 'content', role: 'author', revisionable: true, description: 'Интерактивные механики для вовлечения', isBuiltIn: true, isHidden: false },
  { id: 'blib-test-current', type: 'element', name: 'Текущая проверка (тесты)', hoursPerUnit: 2.0, unit: '~10-15 вопросов', category: 'assessment', role: 'author', revisionable: true, description: 'Промежуточный тест', isBuiltIn: true, isHidden: false },
  { id: 'blib-test-mid', type: 'element', name: 'Промежуточная проверка', hoursPerUnit: 4.0, unit: 'шт', category: 'assessment', role: 'author', revisionable: true, description: 'Промежуточная аттестация', isBuiltIn: true, isHidden: false },
  { id: 'blib-test-final', type: 'element', name: 'Итоговая проверка', hoursPerUnit: 6.0, unit: 'шт', category: 'assessment', role: 'author', revisionable: true, description: 'Финальная аттестация', isBuiltIn: true, isHidden: false },
  { id: 'blib-research', type: 'element', name: 'Кабинетное исследование', hoursPerUnit: 6.0, unit: 'проект', category: 'service', role: 'author', revisionable: false, description: 'Исследование предметной области', isBuiltIn: true, isHidden: false },
  { id: 'blib-audit', type: 'element', name: 'Методический аудит', hoursPerUnit: 6.0, unit: 'проект', category: 'service', role: 'author', revisionable: false, description: 'Анализ существующего курса', isBuiltIn: true, isHidden: false },
  { id: 'blib-artifacts', type: 'element', name: 'Методические артефакты', hoursPerUnit: 5.0, unit: 'комплект', category: 'service', role: 'author', revisionable: false, description: 'Карты компетенций, матрицы и т.д.', isBuiltIn: true, isHidden: false },
  { id: 'blib-speaker', type: 'element', name: 'Подготовка спикера', hoursPerUnit: 4.0, unit: 'сессия', category: 'service', role: 'author', revisionable: false, description: 'Подготовка и репетиция со спикером', isBuiltIn: true, isHidden: false },
]

export const BUILT_IN_SETS: LibrarySet[] = [
  {
    id: 'bset-text-lesson',
    type: 'set',
    name: 'Текстовый урок (~30 мин)',
    description: 'Стандартный текстовый урок с упражнениями',
    isBuiltIn: true,
    isHidden: false,
    items: [
      { name: 'Лонгрид', hoursPerUnit: 2.5, unit: '~1 стр А4', category: 'content', role: 'author', revisionable: true },
      { name: 'Упражнения', hoursPerUnit: 1.0, unit: 'шт', category: 'content', role: 'author', revisionable: true },
      { name: 'Иллюстрации (подбор и упаковка)', hoursPerUnit: 0.5, unit: 'комплект', category: 'content', role: 'author', revisionable: true },
      { name: 'Квизы', hoursPerUnit: 1.5, unit: '~7 вопросов', category: 'content', role: 'author', revisionable: true },
    ],
  },
  {
    id: 'bset-video-lesson',
    type: 'set',
    name: 'Видеоурок (~60 мин)',
    description: 'Видеоурок со скриптом и презентацией',
    isBuiltIn: true,
    isHidden: false,
    items: [
      { name: 'Скрипт для видеозаписи', hoursPerUnit: 4.0, unit: '~15 мин видео', category: 'content', role: 'author', revisionable: true },
      { name: 'Презентация', hoursPerUnit: 6.0, unit: '~30 слайдов', category: 'content', role: 'author', revisionable: true },
      { name: 'Иллюстрации (подбор и упаковка)', hoursPerUnit: 0.5, unit: 'комплект', category: 'content', role: 'author', revisionable: true },
    ],
  },
  {
    id: 'bset-webinar',
    type: 'set',
    name: 'Вебинар (~90 мин)',
    description: 'Живой вебинар с механиками вовлечения',
    isBuiltIn: true,
    isHidden: false,
    items: [
      { name: 'Презентация', hoursPerUnit: 6.0, unit: '~30 слайдов', category: 'content', role: 'author', revisionable: true },
      { name: 'Иллюстрации (подбор и упаковка)', hoursPerUnit: 0.5, unit: 'комплект', category: 'content', role: 'author', revisionable: true },
      { name: 'Механики вовлечения', hoursPerUnit: 2.0, unit: 'комплект', category: 'content', role: 'author', revisionable: true },
    ],
  },
  {
    id: 'bset-practicum',
    type: 'set',
    name: 'Практикум (~60 мин)',
    description: 'Практическое занятие с инструкциями и шаблонами',
    isBuiltIn: true,
    isHidden: false,
    items: [
      { name: 'Пошаговые инструкции', hoursPerUnit: 3.0, unit: 'шт', category: 'content', role: 'author', revisionable: true },
      { name: 'Шаблоны / Канвасы', hoursPerUnit: 2.0, unit: 'шт', category: 'content', role: 'author', revisionable: true },
      { name: 'Упражнения', hoursPerUnit: 1.0, unit: 'шт', category: 'content', role: 'author', revisionable: true },
      { name: 'Разбор примера', hoursPerUnit: 2.0, unit: 'шт', category: 'content', role: 'author', revisionable: true },
    ],
  },
  {
    id: 'bset-case-study',
    type: 'set',
    name: 'Кейс-стади (~45 мин)',
    description: 'Изучение кейса с анализом и разбором',
    isBuiltIn: true,
    isHidden: false,
    items: [
      { name: 'Описание кейса', hoursPerUnit: 3.0, unit: 'шт', category: 'content', role: 'author', revisionable: true },
      { name: 'Вопросы для анализа', hoursPerUnit: 1.0, unit: 'комплект', category: 'content', role: 'author', revisionable: true },
      { name: 'Разбор решения', hoursPerUnit: 1.0, unit: 'шт', category: 'content', role: 'author', revisionable: true },
    ],
  },
]

export function createDefaultLibrary(): UserLibrary {
  return {
    elements: [...BUILT_IN_ELEMENTS],
    sets: [...BUILT_IN_SETS],
    meta: {
      lastModified: new Date().toISOString(),
      version: '1.0',
    },
  }
}

// === Дефолтные настройки ===

export const DEFAULT_SETTINGS: UserSettings = {
  defaultHourlyRate: 0,
  rateSalary: null,
  rateHoursPerMonth: 160,
  rateProjectType: 'freelance',
  rateMultiplier: 1.5,
  defaultTaxRate: 0,
  defaultTaxShowSeparately: false,
  signatureName: '',
  signatureContact: '',
  interfaceMode: 'standard',
  defaultRoleMultipliers: {
    author: 1.0,
    editor: 0.5,
    reviewer: 0.3,
  },
  volumeDiscountMode: 'by_element',
  customPresets: [],
  hasCompletedOnboarding: false,
  lastBackupReminder: '',
  currency: { ...DEFAULT_CURRENCY },
}

// === Опции для шага 1 ===

export const PROJECT_TYPE_OPTIONS = [
  { value: 'new_course', label: 'Новый курс с нуля' },
  { value: 'rework', label: 'Переработка существующего курса' },
  { value: 'standalone', label: 'Отдельные материалы (не курс)' },
  { value: 'support', label: 'Методическое сопровождение' },
] as const

export const DOMAIN_OPTIONS = [
  { value: 'familiar', label: 'Работал с этой темой', multiplier: 1.0, description: 'Вы уже работали с этой темой и знаете предметную область' },
  { value: 'adjacent', label: 'Смежная область', multiplier: 1.15, description: 'Тема смежная — потребуется время на погружение' },
  { value: 'new', label: 'Совершенно новая тема', multiplier: 1.3, description: 'Тема совершенно незнакомая — нужно глубокое исследование' },
] as const

export const METHODOLOGY_OPTIONS = [
  { value: 'own', label: 'Своя проверенная методика', multiplier: 1.0, description: 'Используете собственную отработанную методологию' },
  { value: 'adapt', label: 'Адаптация чужой методики', multiplier: 1.2, description: 'Берёте чужую методику и адаптируете под проект' },
  { value: 'new', label: 'Разработка новой методики', multiplier: 1.4, description: 'Разработка новой методики с нуля' },
] as const

export const CLIENT_OPTIONS = [
  { value: 'regular', label: 'Постоянный клиент', multiplier: 1.0, defaultRevisionPercent: 0.1, description: 'Вы уже работали вместе, процессы отлажены' },
  { value: 'new', label: 'Новый клиент', multiplier: 1.1, defaultRevisionPercent: 0.2, description: 'Первый проект — нужно больше времени на коммуникацию' },
  { value: 'complex', label: 'Сложный контекст (бюрократия, согласования)', multiplier: 1.2, defaultRevisionPercent: 0.25, description: 'Многоуровневые согласования, формальные процедуры' },
] as const

export const DEADLINE_OPTIONS = [
  { value: 'standard', label: 'Стандартные', multiplier: 1.0, description: 'Достаточно времени для спокойной работы' },
  { value: 'tight', label: 'Сжатые', multiplier: 1.2, description: 'Сроки поджимают, но реалистичны' },
  { value: 'urgent', label: 'Срочные', multiplier: 1.5, description: 'Нужно быстро, придётся ускоряться' },
  { value: 'emergency', label: 'Экстренные', multiplier: 2.0, description: 'Экстренные сроки — всё бросаем и делаем' },
] as const

export const REVISION_OPTIONS = [
  { value: 0, label: 'Без правок' },
  { value: 0.1, label: 'Минимальные (10%)' },
  { value: 0.2, label: 'Стандартные (20%)' },
  { value: 0.25, label: 'Повышенные (25%)' },
  { value: 0.3, label: 'Повышенные (30%)' },
] as const

export const TAX_OPTIONS = [
  { value: 0, label: 'Без налогов' },
  { value: 4, label: 'Самозанятый (4%)' },
  { value: 6, label: 'ИП (6%)' },
  { value: 13, label: 'НДФЛ (13%)' },
  { value: 15, label: 'УСН (15%)' },
  { value: 20, label: 'НДС (20%)' },
] as const

export const RATE_PROJECT_TYPES = [
  { value: 'freelance', label: 'Фриланс / внешний клиент', rangeMin: 1.5, rangeMax: 2.0 },
  { value: 'side_job', label: 'Подработка / шабашка', rangeMin: 1.2, rangeMax: 1.5 },
  { value: 'portfolio', label: 'Для портфолио / по дружбе', rangeMin: 0.8, rangeMax: 1.0 },
  { value: 'volunteer', label: 'Внутренний проект / волонтёрство', rangeMin: 0.5, rangeMax: 0.8 },
] as const
