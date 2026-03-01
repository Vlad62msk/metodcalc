import type { EstimateItem } from '@/types/estimate'
import type { Snapshot, Pricing, ProjectContext } from '@/types/project'

export interface ItemDiff {
  status: 'added' | 'removed' | 'modified' | 'unchanged'
  name: string
  item?: EstimateItem
  oldItem?: EstimateItem
  changes: FieldChange[]
}

export interface FieldChange {
  field: string
  label: string
  oldValue: string | number
  newValue: string | number
}

export interface SettingsDiff {
  label: string
  oldValue: string | number
  newValue: string | number
}

export interface SnapshotDiffResult {
  items: ItemDiff[]
  settings: SettingsDiff[]
  summary: {
    added: number
    removed: number
    modified: number
    unchanged: number
  }
}

export function diffSnapshots(older: Snapshot, newer: Snapshot): SnapshotDiffResult {
  const olderItems = older.state.items
  const newerItems = newer.state.items

  const olderMap = new Map(olderItems.map((i) => [i.id, i]))
  const newerMap = new Map(newerItems.map((i) => [i.id, i]))

  const itemDiffs: ItemDiff[] = []

  // Find modified and unchanged
  for (const newItem of newerItems) {
    const oldItem = olderMap.get(newItem.id)
    if (!oldItem) {
      itemDiffs.push({ status: 'added', name: newItem.name, item: newItem, changes: [] })
    } else {
      const changes = diffItemFields(oldItem, newItem)
      if (changes.length > 0) {
        itemDiffs.push({ status: 'modified', name: newItem.name, item: newItem, oldItem, changes })
      } else {
        itemDiffs.push({ status: 'unchanged', name: newItem.name, item: newItem, changes: [] })
      }
    }
  }

  // Find removed
  for (const oldItem of olderItems) {
    if (!newerMap.has(oldItem.id)) {
      itemDiffs.push({ status: 'removed', name: oldItem.name, oldItem, changes: [] })
    }
  }

  // Settings diff
  const settings = diffSettings(older.state.pricing, newer.state.pricing, older.state.context, newer.state.context)

  const summary = {
    added: itemDiffs.filter((d) => d.status === 'added').length,
    removed: itemDiffs.filter((d) => d.status === 'removed').length,
    modified: itemDiffs.filter((d) => d.status === 'modified').length,
    unchanged: itemDiffs.filter((d) => d.status === 'unchanged').length,
  }

  return { items: itemDiffs, settings, summary }
}

function diffItemFields(oldItem: EstimateItem, newItem: EstimateItem): FieldChange[] {
  const changes: FieldChange[] = []
  const check = (field: string, label: string, oldVal: string | number | null, newVal: string | number | null) => {
    if (oldVal !== newVal) {
      changes.push({ field, label, oldValue: oldVal ?? '—', newValue: newVal ?? '—' })
    }
  }

  check('name', 'Название', oldItem.name, newItem.name)
  check('quantity', 'Количество', oldItem.quantity, newItem.quantity)
  check('hoursPerUnit', 'Часы/ед.', oldItem.hoursPerUnit, newItem.hoursPerUnit)
  check('unit', 'Единица', oldItem.unit, newItem.unit)
  check('category', 'Категория', oldItem.category, newItem.category)

  if (!oldItem.isContainer && !newItem.isContainer) {
    check('roleMultiplier', 'Множ. роли', oldItem.roleMultiplier, newItem.roleMultiplier)
    check('qualityLevel', 'Уровень', oldItem.qualityLevel, newItem.qualityLevel)
    check('pricingModel', 'Модель', oldItem.pricingModel, newItem.pricingModel)
    check('fixedPrice', 'Фикс. цена', oldItem.fixedPrice, newItem.fixedPrice)
    check('confidence', 'Уверенность', oldItem.confidence, newItem.confidence)
  }

  return changes
}

function diffSettings(oldP: Pricing, newP: Pricing, oldC: ProjectContext, newC: ProjectContext): SettingsDiff[] {
  const diffs: SettingsDiff[] = []
  const check = (label: string, oldVal: string | number, newVal: string | number) => {
    if (oldVal !== newVal) diffs.push({ label, oldValue: oldVal, newValue: newVal })
  }

  check('Ставка (₽/ч)', oldP.hourlyRate, newP.hourlyRate)
  check('Правки (%)', Math.round(oldP.revisionPercent * 100), Math.round(newP.revisionPercent * 100))
  check('Налог (%)', oldP.tax.rate, newP.tax.rate)
  check('Коэффициент', oldC.contextMultiplier, newC.contextMultiplier)

  if (oldP.discount.type !== newP.discount.type) {
    check('Тип скидки', oldP.discount.type, newP.discount.type)
  }
  if (oldP.discount.percentValue !== newP.discount.percentValue) {
    check('Скидка (%)', oldP.discount.percentValue, newP.discount.percentValue)
  }

  return diffs
}
