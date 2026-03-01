import { useState } from 'react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { CURRENCY_PRESETS } from '@/core/currencies'
import type { CurrencyConfig } from '@/core/currencies'

export function CurrencySelector() {
  const currency = useSettingsStore((s) => s.currency)
  const updateSettings = useSettingsStore((s) => s.updateSettings)

  const isCustom = !CURRENCY_PRESETS.some((p) => p.code === currency?.code)
  const [showCustom, setShowCustom] = useState(isCustom)

  const handlePresetSelect = (preset: typeof CURRENCY_PRESETS[number]) => {
    setShowCustom(false)
    updateSettings({
      currency: {
        code: preset.code,
        symbol: preset.symbol,
        locale: preset.locale,
        symbolPosition: preset.symbolPosition,
      },
    })
  }

  const handleCustom = () => {
    setShowCustom(true)
    updateSettings({
      currency: {
        code: 'custom',
        symbol: currency?.symbol || '¤',
        locale: currency?.locale || 'ru-RU',
        symbolPosition: currency?.symbolPosition || 'after',
      },
    })
  }

  const handleCustomChange = (changes: Partial<CurrencyConfig>) => {
    updateSettings({
      currency: { ...currency, ...changes, code: 'custom' },
    })
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Валюта</label>
      <div className="flex flex-wrap gap-1.5">
        {CURRENCY_PRESETS.map((preset) => (
          <button
            key={preset.code}
            type="button"
            onClick={() => handlePresetSelect(preset)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              currency?.code === preset.code && !showCustom
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {preset.symbol} {preset.label.split(' ')[0]}
          </button>
        ))}
        <button
          type="button"
          onClick={handleCustom}
          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
            showCustom
              ? 'bg-primary-100 text-primary-700 border border-primary-300'
              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Другая...
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-3 mt-2">
          <div>
            <label className="text-xs text-gray-500">Символ</label>
            <input
              type="text"
              value={currency?.symbol || ''}
              onChange={(e) => handleCustomChange({ symbol: e.target.value.slice(0, 4) })}
              className="w-16 border border-gray-300 rounded px-2 py-1 text-sm mt-0.5"
              placeholder="¥"
              maxLength={4}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Позиция</label>
            <select
              value={currency?.symbolPosition || 'after'}
              onChange={(e) => handleCustomChange({ symbolPosition: e.target.value as 'before' | 'after' })}
              className="border border-gray-300 rounded px-2 py-1 text-sm mt-0.5"
            >
              <option value="after">После числа (100 ¤)</option>
              <option value="before">До числа (¤100)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
