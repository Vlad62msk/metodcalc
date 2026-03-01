import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { BUILT_IN_PRESETS, matchesPreset, type PresentationPreset } from '@/core/presentationPresets'
import { generateId } from '@/utils/id'
import type { Presentation } from '@/types/project'

export function DisplaySettings() {
  const presentation = useProjectStore((s) => s.presentation)
  const setPresentation = useProjectStore((s) => s.setPresentation)
  const customPresets = useSettingsStore((s) => s.customPresets)
  const addPreset = useSettingsStore((s) => s.addPreset)
  const removePreset = useSettingsStore((s) => s.removePreset)

  const [showSavePreset, setShowSavePreset] = useState(false)
  const [presetName, setPresetName] = useState('')

  const allPresets = [...BUILT_IN_PRESETS, ...customPresets]

  const activePresetId = allPresets.find((p) => matchesPreset(presentation, p))?.id ?? null

  const applyPreset = (preset: PresentationPreset) => {
    setPresentation(preset.settings as Partial<Presentation>)
  }

  const handleSavePreset = () => {
    if (!presetName.trim()) return
    const preset: PresentationPreset = {
      id: `custom-${generateId()}`,
      name: presetName.trim(),
      description: 'Пользовательский пресет',
      isBuiltIn: false,
      settings: {
        showHours: presentation.showHours,
        showPricePerUnit: presentation.showPricePerUnit,
        showQuantity: presentation.showQuantity,
        showUnits: presentation.showUnits,
        showGroupStructure: presentation.showGroupStructure,
        showTaxSeparately: presentation.showTaxSeparately,
        showDiscountSeparately: presentation.showDiscountSeparately,
        aggregateByCategory: presentation.aggregateByCategory,
      },
    }
    const success = addPreset(preset)
    if (!success) {
      alert('Максимум 5 пользовательских пресетов')
      return
    }
    setPresetName('')
    setShowSavePreset(false)
  }

  const options: Array<{ key: keyof Presentation; label: string }> = [
    { key: 'showHours', label: 'Показывать часы' },
    { key: 'showPricePerUnit', label: 'Показывать цену за единицу' },
    { key: 'showQuantity', label: 'Показывать количество' },
    { key: 'showUnits', label: 'Показывать единицы измерения' },
    { key: 'showGroupStructure', label: 'Показывать структуру групп' },
    { key: 'showTaxSeparately', label: 'Показывать налог отдельно' },
    { key: 'showDiscountSeparately', label: 'Показывать скидку отдельно' },
    { key: 'aggregateByCategory', label: 'Агрегировать по категориям' },
  ]

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Настройки отображения</h3>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {allPresets.map((preset) => (
          <div key={preset.id} className="flex items-center">
            <button
              type="button"
              onClick={() => applyPreset(preset)}
              className={`text-xs px-3 py-1.5 border transition-colors ${
                activePresetId === preset.id
                  ? 'bg-primary-100 border-primary-400 text-primary-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              } ${!preset.isBuiltIn ? 'rounded-l' : 'rounded'}`}
              title={preset.description}
            >
              {preset.name}
            </button>
            {!preset.isBuiltIn && (
              <button
                type="button"
                onClick={() => removePreset(preset.id)}
                className="text-xs px-1.5 py-1.5 border border-l-0 border-gray-200 rounded-r text-gray-400 hover:text-red-500 hover:bg-red-50"
                title="Удалить пресет"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setShowSavePreset(true)}
          className="text-xs px-3 py-1.5 rounded border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50"
          title={`Сохранить текущие настройки (${customPresets.length}/5)`}
        >
          + Сохранить
        </button>
      </div>

      {/* Save preset inline form */}
      {showSavePreset && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Название пресета..."
            className="text-sm border border-gray-300 rounded px-2 py-1 flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSavePreset()
              if (e.key === 'Escape') setShowSavePreset(false)
            }}
          />
          <button
            type="button"
            onClick={handleSavePreset}
            disabled={!presetName.trim()}
            className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
          >
            Сохранить
          </button>
          <button
            type="button"
            onClick={() => setShowSavePreset(false)}
            className="text-xs px-2 py-1.5 text-gray-500 hover:text-gray-700"
          >
            Отмена
          </button>
        </div>
      )}

      {/* Toggle options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => (
          <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={presentation[opt.key] as boolean}
              onChange={(e) => setPresentation({ [opt.key]: e.target.checked })}
              className="text-primary-600 rounded"
            />
            <span className="text-sm text-gray-600">{opt.label}</span>
          </label>
        ))}
      </div>

      {/* Условия */}
      <div className="space-y-2 pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={presentation.showConditions}
            onChange={(e) => setPresentation({ showConditions: e.target.checked })}
            className="text-primary-600 rounded"
          />
          <span className="text-sm font-medium text-gray-700">Блок «Условия»</span>
        </label>
        {presentation.showConditions && (
          <textarea
            value={presentation.conditionsText}
            onChange={(e) => setPresentation({ conditionsText: e.target.value })}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Сроки, условия оплаты, дополнительные примечания..."
          />
        )}
      </div>

      {/* Подпись */}
      <div className="space-y-2 pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={presentation.showSignature}
            onChange={(e) => setPresentation({ showSignature: e.target.checked })}
            className="text-primary-600 rounded"
          />
          <span className="text-sm font-medium text-gray-700">Подпись</span>
        </label>
        {presentation.showSignature && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-6">
            <div>
              <label className="text-xs text-gray-500">Имя</label>
              <input
                type="text"
                value={presentation.signatureName}
                onChange={(e) => setPresentation({ signatureName: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm mt-1"
                placeholder="Иван Иванов"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Контакт</label>
              <input
                type="text"
                value={presentation.signatureContact}
                onChange={(e) => setPresentation({ signatureContact: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm mt-1"
                placeholder="email или телефон"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
