import { useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '@/store/useSettingsStore'

const STEPS = [
  {
    target: '[data-tour="step1"]',
    title: 'Шаг 1: Контекст проекта',
    content: 'Начните с описания проекта. Параметры влияют на контекстный коэффициент, который учитывается в стоимости.',
  },
  {
    target: '[data-tour="step2"]',
    title: 'Шаг 2: Состав работ',
    content: 'Добавляйте элементы сметы вручную или из библиотеки готовых шаблонов. Группируйте связанные позиции.',
  },
  {
    target: '[data-tour="library"]',
    title: 'Библиотека',
    content: 'Здесь хранятся шаблоны элементов и наборов. Добавляйте готовые блоки одним кликом.',
  },
  {
    target: '[data-tour="step3"]',
    title: 'Шаг 3: Стоимость',
    content: 'Укажите ставку, настройте правки, скидки и налоги. Итог рассчитается автоматически.',
  },
  {
    target: '[data-tour="sidebar"]',
    title: 'Боковая панель',
    content: 'Здесь всегда видна итоговая стоимость, разбивка по категориям и диагностика.',
  },
  {
    target: '[data-tour="step4"]',
    title: 'Шаг 4: Смета для клиента',
    content: 'Настройте вид сметы, выберите шаблон отображения и экспортируйте в PDF или XLSX.',
  },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function OnboardingTour({ open, onClose }: Props) {
  const [step, setStep] = useState(0)
  const [position, setPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const updateSettings = useSettingsStore((s) => s.updateSettings)

  const updatePosition = useCallback(() => {
    if (!open) return
    const target = document.querySelector(STEPS[step].target)
    if (target) {
      const rect = target.getBoundingClientRect()
      setPosition({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
    } else {
      setPosition(null)
    }
  }, [open, step])

  useEffect(() => {
    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [updatePosition])

  if (!open) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const handleNext = () => {
    if (isLast) {
      updateSettings({ hasCompletedOnboarding: true })
      onClose()
    } else {
      setStep(step + 1)
    }
  }

  const handleSkip = () => {
    updateSettings({ hasCompletedOnboarding: true })
    onClose()
  }

  // Calculate tooltip position
  const tooltipStyle: React.CSSProperties = {}
  if (position) {
    const isBottom = position.top < 300
    tooltipStyle.position = 'fixed'
    tooltipStyle.left = Math.max(16, Math.min(position.left, window.innerWidth - 320))
    tooltipStyle.zIndex = 60

    if (isBottom) {
      tooltipStyle.top = position.top + position.height + 12
    } else {
      tooltipStyle.bottom = window.innerHeight - position.top + 12
    }
  }

  return (
    <>
      {/* Overlay — transparent, only catches clicks */}
      <div className="fixed inset-0 z-50" onClick={handleSkip} />

      {/* Highlight — box-shadow creates the dark surround with a cutout */}
      {position && (
        <div
          className="fixed z-50 border-2 border-primary-500 rounded-lg pointer-events-none"
          style={{
            top: position.top - 4,
            left: position.left - 4,
            width: position.width + 8,
            height: position.height + 8,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-[60] bg-white rounded-xl shadow-xl p-4 w-[300px]"
        style={tooltipStyle}
      >
        <div className="text-xs text-gray-400 mb-1">
          {step + 1} / {STEPS.length}
        </div>
        <h3 className="text-sm font-bold text-gray-900 mb-1">{current.title}</h3>
        <p className="text-sm text-gray-600 mb-3">{current.content}</p>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Пропустить
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg"
              >
                Назад
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700"
            >
              {isLast ? 'Готово' : 'Далее'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
