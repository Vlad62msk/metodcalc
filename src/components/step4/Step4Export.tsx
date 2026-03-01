import { EstimatePreview } from './EstimatePreview'
import { DisplaySettings } from './DisplaySettings'
import { ExportButtons } from './ExportButtons'

export function Step4Export() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Смета для клиента</h2>
      <p className="text-sm text-gray-500">
        Нажмите на название позиции в предпросмотре, чтобы переименовать её для клиента.
        Настройте отображение и экспортируйте результат как текст, JSON или PDF.
      </p>

      {/* Предпросмотр сметы */}
      <EstimatePreview />

      {/* Что дополнительно отобразить в смете */}
      <DisplaySettings />

      {/* Экспорт */}
      <ExportButtons />
    </div>
  )
}
