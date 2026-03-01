import { useEffect, useRef, useState, useCallback } from 'react'
import { CHECKLIST_SECTIONS } from './checklistContent'
import type { ChecklistItem as ChecklistItemType } from './checklistContent'

interface ChecklistModalProps {
  open: boolean
  onClose: () => void
}

export function ChecklistModal({ open, onClose }: ChecklistModalProps) {
  const [activeSection, setActiveSection] = useState(1)
  const contentRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  // Handle Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // IntersectionObserver for active section tracking
  useEffect(() => {
    if (!open) return

    const observers: IntersectionObserver[] = []
    const container = contentRef.current
    if (!container) return

    sectionRefs.current.forEach((el, num) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(num)
          }
        },
        {
          root: container,
          rootMargin: '-10% 0px -80% 0px',
          threshold: 0,
        },
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [open])

  const scrollToSection = useCallback((num: number) => {
    const el = sectionRefs.current.get(num)
    if (el && contentRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const setSectionRef = useCallback((num: number, el: HTMLDivElement | null) => {
    if (el) sectionRefs.current.set(num, el)
    else sectionRefs.current.delete(num)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white glass-solid rounded-xl shadow-xl w-[95vw] max-w-4xl h-[90vh] flex flex-col mx-4 no-text-shadow">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Чек-лист подготовки к проекту</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Список вопросов, которые помогут приступить к разработке образовательной программы.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation bar */}
        <div className="flex gap-1 px-6 py-2.5 border-b border-gray-100 shrink-0 overflow-x-auto">
          {CHECKLIST_SECTIONS.map((section) => (
            <button
              key={section.number}
              type="button"
              onClick={() => scrollToSection(section.number)}
              className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
                activeSection === section.number
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              {section.number}. {section.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-8 max-w-3xl">
            {CHECKLIST_SECTIONS.map((section) => (
              <div
                key={section.id}
                ref={(el) => setSectionRef(section.number, el)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-bold shrink-0">
                    {section.number}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                </div>
                <div className="border-b border-gray-200 mb-4" />
                <div className="space-y-4 ml-11">
                  {section.items.map((item, idx) => (
                    <ChecklistItem key={idx} item={item} />
                  ))}
                </div>
              </div>
            ))}

            {/* Author credit */}
            <div className="border-t border-gray-200 pt-6 mt-8 text-sm text-gray-500 text-center">
              Адаптировал методологию:{' '}
              <a
                href="https://vladimirkruglov.notion.site/f673b9a0ddbd467ba5f37f31b137b4bf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                Владимир Круглов
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChecklistItem({ item }: { item: ChecklistItemType }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-800 mb-1">{item.title}</h4>
      {item.question && (
        <p className="text-sm text-gray-600">{item.question}</p>
      )}
      {item.questions && (
        <ul className="text-sm text-gray-600 space-y-0.5 list-disc pl-5">
          {item.questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      )}
      {item.example && (
        <div className="mt-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
          <span className="mr-1">💡</span> {item.example}
        </div>
      )}
      {item.examples && (
        <div className="mt-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-lg space-y-0.5">
          {item.examples.map((ex, i) => (
            <div key={i}><span className="mr-1">💡</span> {ex}</div>
          ))}
        </div>
      )}
    </div>
  )
}
