import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { diffSnapshots, type SnapshotDiffResult } from '@/core/snapshotDiff'
import type { Snapshot } from '@/types/project'

interface Props {
  open: boolean
  onClose: () => void
  snapshots: Snapshot[]
}

export function SnapshotDiffModal({ open, onClose, snapshots }: Props) {
  const [olderId, setOlderId] = useState<string | null>(null)
  const [newerId, setNewerId] = useState<string | null>(null)
  const [showUnchanged, setShowUnchanged] = useState(false)

  if (!open) return null

  const older = snapshots.find((s) => s.id === olderId)
  const newer = snapshots.find((s) => s.id === newerId)
  const diff = older && newer ? diffSnapshots(older, newer) : null

  const reversed = [...snapshots].reverse()

  return (
    <Modal open={open} onClose={onClose} title="Сравнение версий">
      <div className="space-y-4">
        {/* Selectors */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Старая версия</label>
            <select
              value={olderId ?? ''}
              onChange={(e) => setOlderId(e.target.value || null)}
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">— Выберите —</option>
              {reversed.map((s) => (
                <option key={s.id} value={s.id} disabled={s.id === newerId}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Новая версия</label>
            <select
              value={newerId ?? ''}
              onChange={(e) => setNewerId(e.target.value || null)}
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">— Выберите —</option>
              {reversed.map((s) => (
                <option key={s.id} value={s.id} disabled={s.id === olderId}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Diff result */}
        {diff && <DiffView diff={diff} showUnchanged={showUnchanged} onToggleUnchanged={() => setShowUnchanged(!showUnchanged)} />}

        {!diff && olderId && newerId && (
          <p className="text-sm text-gray-400 text-center py-4">Выберите две разные версии</p>
        )}
        {!diff && (!olderId || !newerId) && (
          <p className="text-sm text-gray-400 text-center py-4">Выберите две версии для сравнения</p>
        )}
      </div>
    </Modal>
  )
}

function DiffView({
  diff,
  showUnchanged,
  onToggleUnchanged,
}: {
  diff: SnapshotDiffResult
  showUnchanged: boolean
  onToggleUnchanged: () => void
}) {
  const { items, settings, summary } = diff

  return (
    <div className="space-y-4 max-h-[50vh] overflow-y-auto">
      {/* Summary */}
      <div className="flex gap-3 text-xs">
        {summary.added > 0 && (
          <span className="text-green-600 bg-green-50 px-2 py-1 rounded">+{summary.added} добавлено</span>
        )}
        {summary.removed > 0 && (
          <span className="text-red-600 bg-red-50 px-2 py-1 rounded">-{summary.removed} удалено</span>
        )}
        {summary.modified > 0 && (
          <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded">~{summary.modified} изменено</span>
        )}
        {summary.unchanged > 0 && (
          <span className="text-gray-500 bg-gray-50 px-2 py-1 rounded">{summary.unchanged} без изменений</span>
        )}
      </div>

      {/* Settings changes */}
      {settings.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-500 mb-2">Настройки</h4>
          <div className="space-y-1">
            {settings.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">{s.label}:</span>
                <span className="text-red-500 line-through">{s.oldValue}</span>
                <span className="text-gray-400">→</span>
                <span className="text-green-600">{s.newValue}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Item changes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-gray-500">Элементы</h4>
          {summary.unchanged > 0 && (
            <button
              type="button"
              onClick={onToggleUnchanged}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              {showUnchanged ? 'Скрыть без изменений' : 'Показать все'}
            </button>
          )}
        </div>
        <div className="space-y-1">
          {items
            .filter((d) => showUnchanged || d.status !== 'unchanged')
            .map((d, i) => (
              <div
                key={i}
                className={`text-sm px-3 py-2 rounded border ${
                  d.status === 'added'
                    ? 'border-green-200 bg-green-50'
                    : d.status === 'removed'
                      ? 'border-red-200 bg-red-50'
                      : d.status === 'modified'
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium ${
                      d.status === 'added'
                        ? 'text-green-600'
                        : d.status === 'removed'
                          ? 'text-red-600'
                          : d.status === 'modified'
                            ? 'text-amber-600'
                            : 'text-gray-400'
                    }`}
                  >
                    {d.status === 'added' ? '+' : d.status === 'removed' ? '-' : d.status === 'modified' ? '~' : '='}
                  </span>
                  <span className={d.status === 'removed' ? 'text-red-700 line-through' : 'text-gray-800'}>
                    {d.name}
                  </span>
                </div>
                {d.changes.length > 0 && (
                  <div className="mt-1 pl-5 space-y-0.5">
                    {d.changes.map((c, j) => (
                      <div key={j} className="text-xs text-gray-500">
                        {c.label}: <span className="text-red-500 line-through">{c.oldValue}</span>{' '}
                        <span className="text-gray-400">→</span>{' '}
                        <span className="text-green-600">{c.newValue}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
