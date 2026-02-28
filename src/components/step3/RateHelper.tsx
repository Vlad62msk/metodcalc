import { useProjectStore } from '@/store/useProjectStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { Collapsible } from '@/components/ui/Collapsible'
import { formatCurrency } from '@/utils/format'
import { RATE_PROJECT_TYPES } from '@/core/defaults'

export function RateHelper() {
  const rateHelper = useProjectStore((s) => s.pricing.rateHelper)
  const setRateHelper = useProjectStore((s) => s.setRateHelper)
  const setHourlyRate = useProjectStore((s) => s.setHourlyRate)
  const updateSettings = useSettingsStore((s) => s.updateSettings)

  const salaryRate = rateHelper.salary && rateHelper.hoursPerMonth > 0
    ? rateHelper.salary / rateHelper.hoursPerMonth
    : 0
  const recommendedRate = salaryRate * rateHelper.multiplier

  const selectedType = RATE_PROJECT_TYPES.find((t) => t.value === rateHelper.projectType)

  const applyRate = () => {
    if (recommendedRate > 0) {
      setHourlyRate(Math.round(recommendedRate))
      updateSettings({
        defaultHourlyRate: Math.round(recommendedRate),
        rateSalary: rateHelper.salary,
        rateHoursPerMonth: rateHelper.hoursPerMonth,
        rateProjectType: rateHelper.projectType,
        rateMultiplier: rateHelper.multiplier,
      })
    }
  }

  return (
    <Collapsible title="Помощник ставки" defaultOpen={true}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500">Зарплата на руки, ₽/мес</label>
            <input
              type="number"
              value={rateHelper.salary ?? ''}
              onChange={(e) => setRateHelper({ salary: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="160 000"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Рабочих часов в месяце</label>
            <input
              type="number"
              value={rateHelper.hoursPerMonth}
              onChange={(e) => setRateHelper({ hoursPerMonth: parseInt(e.target.value) || 160 })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1"
            />
          </div>
        </div>

        {salaryRate > 0 && (
          <div className="text-sm text-gray-600">
            Зарплатная ставка: <strong>{formatCurrency(salaryRate)}/час</strong>
          </div>
        )}

        <div>
          <label className="text-xs text-gray-500">Тип проекта</label>
          <div className="space-y-1 mt-1">
            {RATE_PROJECT_TYPES.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer ${
                  rateHelper.projectType === opt.value
                    ? 'bg-primary-50 border border-primary-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <input
                  type="radio"
                  name="rateProjectType"
                  checked={rateHelper.projectType === opt.value}
                  onChange={() => {
                    const mid = (opt.rangeMin + opt.rangeMax) / 2
                    setRateHelper({ projectType: opt.value, multiplier: mid })
                  }}
                  className="text-primary-600"
                />
                <span className="text-sm text-gray-700 flex-1">{opt.label}</span>
                <span className="text-xs text-gray-400">
                  ×{opt.rangeMin}–{opt.rangeMax}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500">
            Множитель: ×{rateHelper.multiplier.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.3"
            max="3.0"
            step="0.05"
            value={rateHelper.multiplier}
            onChange={(e) => setRateHelper({ multiplier: parseFloat(e.target.value) })}
            className="w-full mt-1"
          />
          {selectedType && (
            <div className="text-xs text-gray-400 mt-1">
              Рекомендуется: ×{selectedType.rangeMin}–×{selectedType.rangeMax}
            </div>
          )}
        </div>

        {recommendedRate > 0 && (
          <div className="flex items-center justify-between bg-primary-50 rounded-lg px-4 py-3">
            <div className="text-sm">
              Рекомендуемая ставка: <strong>{formatCurrency(Math.round(recommendedRate))}/час</strong>
            </div>
            <button
              type="button"
              onClick={applyRate}
              className="text-sm bg-primary-600 text-white px-4 py-1.5 rounded hover:bg-primary-700"
            >
              Применить
            </button>
          </div>
        )}
      </div>
    </Collapsible>
  )
}
