import { useState } from 'react'

interface Option {
  value: string
  label: string
  multiplier?: number
  defaultRevisionPercent?: number
  description?: string
}

interface OptionSelectorProps {
  label: string
  options: readonly Option[]
  selectedValue: string
  onSelect: (option: Option) => void
  showMultiplier?: boolean
  showCustom?: boolean
  customFields?: { multiplier?: boolean; revisionPercent?: boolean }
}

export function OptionSelector({
  label,
  options,
  selectedValue,
  onSelect,
  showMultiplier = false,
  showCustom = true,
  customFields = {},
}: OptionSelectorProps) {
  const [isCustom, setIsCustom] = useState(selectedValue === 'custom')
  const [customLabel, setCustomLabel] = useState('')
  const [customMultiplier, setCustomMultiplier] = useState(1.0)
  const [customRevision, setCustomRevision] = useState(0.15)

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="space-y-1">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-start gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              selectedValue === opt.value && !isCustom
                ? 'bg-primary-50 border border-primary-200'
                : 'hover:bg-gray-50 border border-transparent'
            }`}
          >
            <input
              type="radio"
              name={label}
              checked={selectedValue === opt.value && !isCustom}
              onChange={() => {
                setIsCustom(false)
                onSelect(opt)
              }}
              className="text-primary-600 focus:ring-primary-500 mt-1"
            />
            <div className="flex-1">
              <span className="text-sm text-gray-700">{opt.label}</span>
              {opt.description && (
                <div className="text-xs text-gray-400 mt-0.5">{opt.description}</div>
              )}
            </div>
            {showMultiplier && opt.multiplier !== undefined && (
              <span className="text-xs text-gray-400 shrink-0">{'\u00D7'}{opt.multiplier}</span>
            )}
          </label>
        ))}
        {showCustom && (
          <label
            className={`flex items-start gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              isCustom
                ? 'bg-primary-50 border border-primary-200'
                : 'hover:bg-gray-50 border border-transparent'
            }`}
          >
            <input
              type="radio"
              name={label}
              checked={isCustom}
              onChange={() => setIsCustom(true)}
              className="text-primary-600 focus:ring-primary-500 mt-1"
            />
            <div className="flex-1 space-y-2">
              <span className="text-sm text-gray-700">Другое</span>
              {isCustom && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="Описание..."
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="flex gap-2">
                    {(showMultiplier || customFields.multiplier) && (
                      <div>
                        <div className="text-xs text-gray-500">Множитель</div>
                        <input
                          type="number"
                          step="0.05"
                          min="0.1"
                          value={customMultiplier}
                          onChange={(e) => setCustomMultiplier(parseFloat(e.target.value) || 1)}
                          className="w-20 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    )}
                    {customFields.revisionPercent && (
                      <div>
                        <div className="text-xs text-gray-500">% правок</div>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          max="100"
                          value={Math.round(customRevision * 100)}
                          onChange={(e) => setCustomRevision((parseInt(e.target.value) || 0) / 100)}
                          className="w-20 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onSelect({
                        value: 'custom',
                        label: customLabel || 'Другое',
                        multiplier: customMultiplier,
                        defaultRevisionPercent: customRevision,
                      })
                    }
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Применить
                  </button>
                </div>
              )}
            </div>
          </label>
        )}
      </div>
    </div>
  )
}
