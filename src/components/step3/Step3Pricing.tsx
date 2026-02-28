import { useProjectStore } from '@/store/useProjectStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { formatCurrency } from '@/utils/format'
import { RateHelper } from './RateHelper'
import { CostDetail } from './CostDetail'
import { RevisionSettings } from './RevisionSettings'
import { TargetPrice } from './TargetPrice'
import { ResourceBudget } from './ResourceBudget'
import { FinancialSettings } from './FinancialSettings'

export function Step3Pricing() {
  const hourlyRate = useProjectStore((s) => s.pricing.hourlyRate)
  const setHourlyRate = useProjectStore((s) => s.setHourlyRate)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const items = useProjectStore((s) => s.items)

  const handleRateChange = (value: number) => {
    setHourlyRate(value)
    updateSettings({ defaultHourlyRate: value })
  }

  const hasItems = items.length > 0

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Сколько стоит?</h2>
      <p className="text-sm text-gray-500">
        Задайте вашу часовую ставку (или рассчитайте через помощник). Проверьте детализацию — стоимость
        каждой позиции можно скорректировать вручную. Ниже — финансовые настройки: правки, скидки, налоги.
      </p>

      {/* Помощник ставки */}
      <RateHelper />

      {/* Ставка */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <label className="text-sm font-medium text-gray-700">Ставка, ₽/час</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            value={hourlyRate || ''}
            onChange={(e) => handleRateChange(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="w-40 border border-gray-300 rounded-lg px-4 py-2.5 text-lg font-semibold"
          />
          {hourlyRate > 0 && (
            <span className="text-sm text-gray-500">
              = {formatCurrency(hourlyRate)} / час
            </span>
          )}
        </div>
        {hourlyRate === 0 && (
          <p className="text-xs text-amber-600">
            Укажите ставку или воспользуйтесь помощником выше.
          </p>
        )}
      </div>

      {/* Детализация */}
      {hasItems && <CostDetail />}

      {!hasItems && (
        <div className="text-sm text-gray-400 text-center py-8 border border-dashed border-gray-300 rounded-lg">
          Добавьте элементы на шаге 2, чтобы увидеть детализацию
        </div>
      )}

      {/* Правки */}
      <RevisionSettings />

      {/* Целевая цена */}
      <TargetPrice />

      {/* Бюджет времени */}
      <ResourceBudget />

      {/* Финансовые настройки */}
      <FinancialSettings />
    </div>
  )
}
