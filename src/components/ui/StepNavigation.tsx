import { useProjectStore } from '@/store/useProjectStore'

const TAB_LABELS = ['Главная', 'Контекст', 'Состав работ', 'Стоимость', 'Экспорт']

export function StepNavigation() {
  const activeTab = useProjectStore((s) => s.activeTab)
  const setActiveTab = useProjectStore((s) => s.setActiveTab)

  const isFirst = activeTab === 0
  const isLast = activeTab === TAB_LABELS.length - 1

  return (
    <div className="flex items-center justify-between pt-6">
      {!isFirst ? (
        <button
          type="button"
          onClick={() => setActiveTab(activeTab - 1)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {TAB_LABELS[activeTab - 1]}
        </button>
      ) : (
        <div />
      )}
      {!isLast ? (
        <button
          type="button"
          onClick={() => setActiveTab(activeTab + 1)}
          className="flex items-center gap-1 text-sm text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg"
        >
          {TAB_LABELS[activeTab + 1]}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ) : (
        <div />
      )}
    </div>
  )
}
