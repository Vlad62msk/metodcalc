import { useState, useMemo } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { formatCurrency, formatHours } from '@/utils/format'
import { Sidebar } from './Sidebar'

export function MobileBottomBar() {
  const [expanded, setExpanded] = useState(false)
  const getGrandTotal = useProjectStore((s) => s.getGrandTotal)
  // Subscribe to state that drives grand total — ensures re-render on data changes
  const items = useProjectStore((s) => s.items)
  const pricing = useProjectStore((s) => s.pricing)
  const contextMultiplier = useProjectStore((s) => s.context.contextMultiplier)
  const costOverrides = useProjectStore((s) => s.costOverrides)

  const result = useMemo(
    () => getGrandTotal(),
    [getGrandTotal, items, pricing, contextMultiplier, costOverrides],
  )

  return (
    <>
      {expanded && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setExpanded(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto bg-white rounded-t-xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar />
          </div>
        </div>
      )}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white glass-solid border-t border-gray-200 px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">{formatCurrency(result.grandTotal)}</span>
            <span className="text-sm text-gray-500">{formatHours(result.totalHours)}</span>
          </div>
          <span className="text-sm text-primary-600">Смета ▸</span>
        </button>
      </div>
    </>
  )
}
