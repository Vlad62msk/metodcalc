import { useState, useMemo } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { Modal } from '@/components/ui/Modal'
import { getShareUrl } from '@/core/sharing'

interface Props {
  open: boolean
  onClose: () => void
}

export function ShareModal({ open, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const context = useProjectStore((s) => s.context)
  const items = useProjectStore((s) => s.items)
  const pricing = useProjectStore((s) => s.pricing)

  const shareUrl = useMemo(() => {
    if (!open) return ''
    return getShareUrl(context, items, pricing)
  }, [open, context, items, pricing])

  const urlLength = shareUrl.length
  const isLong = urlLength > 2000

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = shareUrl
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleExportJson = () => {
    const state = { context, items, pricing }
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shared-estimate-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} title="Поделиться сметой">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Ссылка содержит все данные проекта в сжатом виде. Получатель увидит смету в режиме просмотра
          и сможет скопировать её к себе.
        </p>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 text-xs border border-gray-300 rounded px-3 py-2 bg-gray-50 truncate"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {copied ? 'Скопировано!' : 'Копировать'}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className={`${isLong ? 'text-amber-500' : 'text-gray-400'}`}>
              {urlLength} символов
            </span>
            {isLong && (
              <span className="text-amber-500">
                URL очень длинный — может не работать в некоторых браузерах
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Ссылка фиксирует текущее состояние — при изменении проекта нужно сгенерировать новую.
        </p>

        <div className="border-t border-gray-200 pt-3">
          <button
            type="button"
            onClick={handleExportJson}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Или скачать JSON-файл для передачи вручную
          </button>
        </div>
      </div>
    </Modal>
  )
}
