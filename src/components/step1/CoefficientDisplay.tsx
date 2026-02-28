import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { formatMultiplier } from '@/utils/format'
import { getContextWarning } from '@/core/calculator'
import { WarningBanner } from '@/components/ui/WarningBanner'
import { OverrideIndicator } from '@/components/ui/OverrideIndicator'

export function CoefficientDisplay() {
  const context = useProjectStore((s) => s.context)
  const setManualMultiplier = useProjectStore((s) => s.setManualMultiplier)
  const [editing, setEditing] = useState(false)
  const [manualValue, setManualValue] = useState(String(context.contextMultiplier))

  const warning = getContextWarning(context.contextMultiplier)

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Контекстный коэффициент</div>
          <div className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {formatMultiplier(context.contextMultiplier)}
            {context.contextMultiplierIsManual && (
              <OverrideIndicator onReset={() => setManualMultiplier(null)} />
            )}
          </div>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(true)
              setManualValue(String(context.contextMultiplier))
            }}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Изменить вручную
          </button>
        )}
      </div>

      <div className="text-xs text-gray-400">
        Домен {formatMultiplier(context.domain.multiplier)} · Методика{' '}
        {formatMultiplier(context.methodology.multiplier)} · Клиент{' '}
        {formatMultiplier(context.client.multiplier)} · Сроки{' '}
        {formatMultiplier(context.deadline.multiplier)}
      </div>

      {editing && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            min="0.1"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            className="w-24 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="button"
            onClick={() => {
              const val = parseFloat(manualValue)
              if (!isNaN(val) && val > 0) setManualMultiplier(val)
              setEditing(false)
            }}
            className="text-sm bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700"
          >
            Применить
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false)
              if (context.contextMultiplierIsManual) setManualMultiplier(null)
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Отмена
          </button>
        </div>
      )}

      {warning && <WarningBanner level={warning.level} message={warning.message} />}
    </div>
  )
}
