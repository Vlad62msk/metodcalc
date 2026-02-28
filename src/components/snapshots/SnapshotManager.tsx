import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { Modal } from '@/components/ui/Modal'
import { formatDate, formatCurrency } from '@/utils/format'

interface SnapshotManagerProps {
  open: boolean
  onClose: () => void
}

export function SnapshotManager({ open, onClose }: SnapshotManagerProps) {
  const [label, setLabel] = useState('')
  const snapshots = useProjectStore((s) => s.snapshots)
  const saveSnapshot = useProjectStore((s) => s.saveSnapshot)
  const restoreSnapshot = useProjectStore((s) => s.restoreSnapshot)
  const removeSnapshot = useProjectStore((s) => s.removeSnapshot)

  const handleSave = () => {
    const snapshotLabel = label.trim() || `Версия ${snapshots.length + 1}`
    saveSnapshot(snapshotLabel)
    setLabel('')
  }

  const handleRestore = (id: string) => {
    if (confirm('Восстановить эту версию? Текущие данные будут заменены.')) {
      restoreSnapshot(id)
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Версии проекта">
      <div className="space-y-4">
        {/* Сохранение */}
        <div className="flex gap-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Название версии (опционально)"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Сохранить
          </button>
        </div>

        {/* Список */}
        {snapshots.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-6">
            Нет сохранённых версий
          </div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {[...snapshots].reverse().map((snap) => (
              <div
                key={snap.id}
                className="flex items-center gap-3 px-3 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{snap.label}</div>
                  <div className="text-xs text-gray-400">
                    {formatDate(snap.timestamp)} · {snap.state.items.length} элементов
                    {snap.state.pricing.hourlyRate > 0 && ` · ${formatCurrency(snap.state.pricing.hourlyRate)}/ч`}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleRestore(snap.id)}
                    className="text-xs text-primary-600 hover:text-primary-700 px-3 py-1 border border-primary-200 rounded"
                  >
                    Восстановить
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Удалить "${snap.label}"?`)) removeSnapshot(snap.id)
                    }}
                    className="text-xs text-gray-400 hover:text-red-500 px-2 py-1"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400">
          Хранится до 20 последних версий. Старые версии удаляются автоматически.
        </p>
      </div>
    </Modal>
  )
}
