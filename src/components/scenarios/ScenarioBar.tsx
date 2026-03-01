import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { formatCurrency } from '@/utils/format'
import { calcGrandTotal } from '@/core/calculator'
import { ScenarioCompareModal } from './ScenarioCompareModal'

export function ScenarioBar() {
  const scenarios = useProjectStore((s) => s.scenarios)
  const items = useProjectStore((s) => s.items)
  const pricing = useProjectStore((s) => s.pricing)
  const context = useProjectStore((s) => s.context)
  const costOverrides = useProjectStore((s) => s.costOverrides)
  const enableScenarios = useProjectStore((s) => s.enableScenarios)
  const disableScenarios = useProjectStore((s) => s.disableScenarios)
  const addScenario = useProjectStore((s) => s.addScenario)
  const switchScenario = useProjectStore((s) => s.switchScenario)
  const removeScenario = useProjectStore((s) => s.removeScenario)
  const renameScenario = useProjectStore((s) => s.renameScenario)

  const [showCompare, setShowCompare] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [showMenu, setShowMenu] = useState<string | null>(null)

  if (!scenarios.enabled) {
    return (
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <button
          type="button"
          onClick={enableScenarios}
          className="text-xs text-gray-500 hover:text-primary-600"
        >
          + Включить сценарии «а что если»
        </button>
      </div>
    )
  }

  const getScenarioTotal = (scenarioItems: typeof items) => {
    const result = calcGrandTotal({
      items: scenarioItems,
      hourlyRate: pricing.hourlyRate,
      contextMultiplier: context.contextMultiplier,
      costOverrides,
      revisionPercent: pricing.revisionPercent,
      discount: pricing.discount,
      tax: pricing.tax,
      volumeDiscounts: pricing.volumeDiscounts,
      additionalAdjustments: pricing.additionalAdjustments,
    })
    return result.grandTotal
  }

  const handleAdd = () => {
    const name = `Сценарий ${scenarios.list.length + 1}`
    addScenario(name, true)
  }

  const handleDisable = () => {
    if (confirm('Выключить сценарии? Останутся только элементы из текущего сценария.')) {
      disableScenarios()
    }
  }

  const startRename = (id: string, name: string) => {
    setEditingId(id)
    setEditName(name)
    setShowMenu(null)
  }

  const finishRename = () => {
    if (editingId && editName.trim()) {
      renameScenario(editingId, editName.trim())
    }
    setEditingId(null)
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {scenarios.list.map((sc) => {
          const isActive = sc.id === scenarios.activeScenarioId
          const total = isActive ? getScenarioTotal(items) : getScenarioTotal(sc.items)

          return (
            <div key={sc.id} className="relative flex-shrink-0">
              {editingId === sc.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={finishRename}
                  onKeyDown={(e) => e.key === 'Enter' && finishRename()}
                  className="text-xs border border-primary-400 rounded px-2 py-1.5 w-32"
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onClick={() => switchScenario(sc.id)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setShowMenu(showMenu === sc.id ? null : sc.id)
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-500 mr-1.5 align-middle" />}
                  {sc.name}
                  <span className="ml-1.5 text-gray-400">{formatCurrency(total)}</span>
                </button>
              )}

              {/* Context menu */}
              {showMenu === sc.id && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(null)} />
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[140px]">
                    <button
                      type="button"
                      onClick={() => startRename(sc.id, sc.name)}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Переименовать
                    </button>
                    {scenarios.list.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(null)
                          if (confirm(`Удалить сценарий «${sc.name}»?`)) {
                            removeScenario(sc.id)
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}

        {scenarios.list.length < 5 && (
          <button
            type="button"
            onClick={handleAdd}
            className="text-xs text-gray-400 hover:text-primary-600 px-2 py-1.5 border border-dashed border-gray-300 rounded-lg whitespace-nowrap flex-shrink-0"
          >
            + Новый
          </button>
        )}

        {scenarios.list.length >= 2 && (
          <button
            type="button"
            onClick={() => setShowCompare(true)}
            className="text-xs text-primary-600 hover:text-primary-700 px-2 py-1.5 whitespace-nowrap flex-shrink-0"
          >
            Сравнить
          </button>
        )}

        <button
          type="button"
          onClick={handleDisable}
          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 whitespace-nowrap flex-shrink-0 ml-auto"
        >
          Выключить
        </button>
      </div>

      <ScenarioCompareModal open={showCompare} onClose={() => setShowCompare(false)} />
    </>
  )
}
