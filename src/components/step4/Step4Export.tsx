import { EstimatePreview } from './EstimatePreview'
import { DisplaySettings } from './DisplaySettings'
import { ExportButtons } from './ExportButtons'

export function Step4Export() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Смета для клиента</h2>
      <p className="text-sm text-gray-500">
        Настройте, что показывать клиенту. Нажмите на название позиции в предпросмотре, чтобы переименовать
        её для клиента. Экспортируйте результат как текст, JSON или PDF.
      </p>

      {/* Настройки */}
      <DisplaySettings />

      {/* Экспорт */}
      <ExportButtons />

      {/* Предпросмотр */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Предпросмотр</h3>
        <EstimatePreview />
      </div>
    </div>
  )
}
