import { useRef, useEffect, useMemo } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { formatCurrency, formatHours, formatMultiplier } from '@/utils/format'
import { Badge } from '@/components/ui/Badge'

const TABS = [
  { label: 'Главная', shortLabel: 'Главная', key: 'intro', tour: 'intro', isHome: true },
  { label: 'Что за проект?', shortLabel: 'Проект', key: 'context', tour: 'step1', isHome: false },
  { label: 'Что делаем?', shortLabel: 'Работы', key: 'items', tour: 'step2', isHome: false },
  { label: 'Сколько стоит?', shortLabel: 'Цена', key: 'pricing', tour: 'step3', isHome: false },
  { label: 'Смета для клиента', shortLabel: 'Экспорт', key: 'export', tour: 'step4', isHome: false },
] as const

export function TabNavigation() {
  const activeTab = useProjectStore((s) => s.activeTab)
  const setActiveTab = useProjectStore((s) => s.setActiveTab)
  const context = useProjectStore((s) => s.context)
  const items = useProjectStore((s) => s.items)
  const pricing = useProjectStore((s) => s.pricing)
  const costOverrides = useProjectStore((s) => s.costOverrides)
  const getGrandTotal = useProjectStore((s) => s.getGrandTotal)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Subscribe to all state that drives grand total — ensures re-render on data changes
  const result = useMemo(
    () => getGrandTotal(),
    [getGrandTotal, items, pricing, context, costOverrides],
  )
  const itemCount = items.filter((i) => !i.isContainer).length

  const badges = [
    '', // Home — no badge
    formatMultiplier(context.contextMultiplier),
    `${itemCount} поз., ${formatHours(result.totalHours)}`,
    formatCurrency(result.grandTotal),
    result.grandTotal > 0 ? 'Готово к экспорту' : '',
  ]

  useEffect(() => {
    tabRefs.current[activeTab]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [activeTab])

  return (
    <nav className="border-b border-gray-200 bg-white glass-solid sticky top-[53px] z-30">
      <div className="flex justify-center overflow-x-auto scrollbar-hide">
        {TABS.map((tab, idx) => (
          <button
            key={tab.key}
            ref={(el) => { tabRefs.current[idx] = el }}
            type="button"
            onClick={() => setActiveTab(idx)}
            data-tour={tab.tour}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === idx
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.isHome ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
              </svg>
            ) : (
              <span className="text-xs text-gray-400">{idx}.</span>
            )}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
            {badges[idx] && <span className="hidden sm:inline-flex"><Badge text={badges[idx]!} /></span>}
          </button>
        ))}
      </div>
    </nav>
  )
}
