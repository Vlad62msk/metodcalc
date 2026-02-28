import { useProjectStore } from '@/store/useProjectStore'

export function DisplaySettings() {
  const presentation = useProjectStore((s) => s.presentation)
  const setPresentation = useProjectStore((s) => s.setPresentation)

  const options: Array<{ key: keyof typeof presentation; label: string }> = [
    { key: 'showHours', label: 'Показывать часы' },
    { key: 'showPricePerUnit', label: 'Показывать цену за единицу' },
    { key: 'showQuantity', label: 'Показывать количество' },
    { key: 'showUnits', label: 'Показывать единицы измерения' },
    { key: 'showGroupStructure', label: 'Показывать структуру групп' },
    { key: 'showTaxSeparately', label: 'Показывать налог отдельно' },
    { key: 'showDiscountSeparately', label: 'Показывать скидку отдельно' },
  ]

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Настройки отображения</h3>
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
