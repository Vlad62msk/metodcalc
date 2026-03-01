import { useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '@/store/useSettingsStore'

const STEPS = [
  {
    target: '[data-tour="intro"]',
    title: 'Главная страница',
    content: 'Здесь — обзор калькулятора и быстрый доступ к каждому шагу. Вы всегда можете вернуться сюда.',
  },
  {
    target: '[data-tour="step1"]',
    title: 'Шаг 1: Контекст проекта',
    content: 'Начните с описания проекта. Параметры влияют на контекстный коэффициент, который автоматически учитывается в стоимости.',
  },
  {
    target: '[data-tour="step2"]',
    title: 'Шаг 2: Состав работ',
    content: 'Добавляйте элементы сметы вручную или из библиотеки готовых шаблонов. Группируйте связанные позиции в контейнеры.',
  },
  {
    target: '[data-tour="library"]',
    title: 'Библиотека шаблонов',
    content: 'Здесь хранятся шаблоны элементов и наборов. Добавляйте готовые блоки одним кликом и создавайте свои.',
  },
  {
    target: '[data-tour="step3"]',
    title: 'Шаг 3: Стоимость',
    content: 'Укажите ставку, настройте правки, скидки и налоги. Итог рассчитается автоматически.',
  },
  {
    target: '[data-tour="step4"]',
    title: 'Шаг 4: Смета для клиента',
    content: 'Настройте вид сметы, выберите шаблон отображения и экспортируйте в PDF, XLSX или поделитесь ссылкой.',
  },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function OnboardingTour({ open, onClose }: Props) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const updateSettings = useSettingsStore((s) => s.updateSettings)

  const updatePosition = useCallback(() => {
    if (!open) return
    const currentStep = STEPS[step]
    if (!currentStep) return

    const target = document.querySelector(currentStep.target)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      // Small delay for scroll to finish
      requestAnimationFrame(() => {
        setRect(target.getBoundingClientRect())
      })
    } else {
      setRect(null)
    }
  }, [open, step])

  useEffect(() => {
    updatePosition()
    // Re-measure after a short delay for scroll to settle
    const timer = setTimeout(updatePosition, 150)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('resize', updatePosition)
      clearTimeout(timer)
    }
  }, [updatePosition])

  // Reset step when opening
  useEffect(() => {
    if (open) setStep(0)
  }, [open])

  if (!open) return null

  const current = STEPS[step]
  if (!current) return null

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

  // Calculate tooltip position — ensure it stays in viewport
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 60,
  }

  if (rect) {
    const tooltipWidth = 320
    const tooltipHeight = 160 // approximate
    const gap = 12
    const vw = window.innerWidth
    const vh = window.innerHeight

    // Horizontal: center on target, clamp to viewport
    const targetCenterX = rect.left + rect.width / 2
    let left = targetCenterX - tooltipWidth / 2
    left = Math.max(12, Math.min(left, vw - tooltipWidth - 12))
    tooltipStyle.left = left
    tooltipStyle.width = tooltipWidth

    // Vertical: prefer below, fallback above, fallback center
    const spaceBelow = vh - (rect.bottom + gap)
    const spaceAbove = rect.top - gap

    if (spaceBelow >= tooltipHeight) {
      tooltipStyle.top = rect.bottom + gap
    } else if (spaceAbove >= tooltipHeight) {
      tooltipStyle.bottom = vh - rect.top + gap
    } else {
      // Not enough space above or below — place in center of viewport
      tooltipStyle.top = Math.max(12, (vh - tooltipHeight) / 2)
    }
  } else {
    // No target found — center on screen
    tooltipStyle.top = '50%'
    tooltipStyle.left = '50%'
    tooltipStyle.transform = 'translate(-50%, -50%)'
    tooltipStyle.width = 320
  }

  return (
    <>
      {/* Overlay — transparent, only catches clicks */}
      <div className="fixed inset-0 z-50" onClick={handleSkip} />

      {/* Highlight — box-shadow creates the dark surround with a cutout */}
      {rect && (
        <div
          className="fixed z-50 border-2 border-primary-400 rounded-lg pointer-events-none"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
          }}
        />
      )}

      {/* Tooltip — solid white background directly on element */}
      <div
        style={{ ...tooltipStyle, backgroundColor: '#ffffff' }}
        className="fixed z-[60] rounded-xl p-5"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: '#9333ea' }}>
            {step + 1} из {STEPS.length}
          </span>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: i <= step ? '#9333ea' : '#d1d5db' }}
              />
            ))}
          </div>
        </div>
        <h3 className="text-sm font-bold mb-1.5" style={{ color: '#111827' }}>{current.title}</h3>
        <p className="text-sm leading-relaxed mb-4" style={{ color: '#4b5563' }}>{current.content}</p>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs hover:underline"
            style={{ color: '#9ca3af' }}
          >
            Пропустить
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ color: '#374151', border: '1px solid #d1d5db' }}
              >
                Назад
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="text-xs px-4 py-1.5 rounded-lg font-medium"
              style={{ backgroundColor: '#9333ea', color: '#ffffff' }}
            >
              {isLast ? 'Готово!' : 'Далее'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
