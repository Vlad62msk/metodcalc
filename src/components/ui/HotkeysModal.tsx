interface HotkeysModalProps {
  open: boolean
  onClose: () => void
}

const shortcuts = [
  { keys: 'Ctrl+Z', desc: 'Отменить последнее действие' },
  { keys: 'Ctrl+Shift+Z', desc: 'Повторить отменённое действие' },
  { keys: 'Ctrl+Y', desc: 'Повторить (альтернатива)' },
  { keys: 'Ctrl+S', desc: 'Сохранить версию (снапшот)' },
  { keys: 'Delete', desc: 'Удалить выбранный элемент (шаг 2)' },
]

export function HotkeysModal({ open, onClose }: HotkeysModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Горячие клавиши</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            &times;
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map(({ keys, desc }) => (
            <div key={keys} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-gray-600">{desc}</span>
              <kbd className="text-xs bg-gray-100 border border-gray-200 rounded px-2 py-0.5 font-mono text-gray-700">
                {keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
