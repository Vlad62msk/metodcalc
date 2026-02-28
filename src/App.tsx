import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { TabNavigation } from '@/components/layout/TabNavigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomBar } from '@/components/layout/MobileBottomBar'
import { Step1Context } from '@/components/step1/Step1Context'
import { Step2Items } from '@/components/step2/Step2Items'
import { Step3Pricing } from '@/components/step3/Step3Pricing'
import { Step4Export } from '@/components/step4/Step4Export'
import { LibraryManager } from '@/components/library/LibraryManager'
import { SnapshotManager } from '@/components/snapshots/SnapshotManager'
import { HelpGuide } from '@/components/help/HelpGuide'
import { StepNavigation } from '@/components/ui/StepNavigation'

const steps = [Step1Context, Step2Items, Step3Pricing, Step4Export]

export default function App() {
  const activeTab = useProjectStore((s) => s.activeTab)
  const projectName = useProjectStore((s) => s.meta.name)
  const setProjectName = useProjectStore((s) => s.setProjectName)
  const resetProject = useProjectStore((s) => s.resetProject)

  const [showLibrary, setShowLibrary] = useState(false)
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const StepComponent = steps[activeTab]!

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-white glass-solid border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">Калькулятор методиста</h1>
            <span className="text-xs text-gray-400">v3.3</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="text-sm border border-transparent hover:border-gray-300 focus:border-primary-400 rounded px-2 py-1 bg-transparent focus:bg-white focus:outline-none max-w-[200px]"
              placeholder="Название проекта"
            />
            <button
              type="button"
              onClick={() => setShowSnapshots(true)}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded"
              title="Версии проекта"
            >
              Версии
            </button>
            <button
              type="button"
              onClick={() => setShowLibrary(true)}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded"
              title="Управление библиотекой"
            >
              Библиотека
            </button>
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded"
              title="Инструкция"
            >
              ?
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Сбросить проект? Все данные будут потеряны.')) resetProject()
              }}
              className="text-xs text-gray-400 hover:text-red-500 px-2 py-1"
              title="Новый проект"
            >
              Сбросить
            </button>
          </div>
        </div>
      </header>

      {/* Табы */}
      <TabNavigation />

      {/* Контент + Sidebar */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Основной контент */}
          <main className="flex-1 min-w-0">
            <StepComponent />
            <StepNavigation />
          </main>

          {/* Sidebar (десктоп) */}
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-[120px]">
              <Sidebar />
            </div>
          </aside>
        </div>
      </div>

      {/* Мобильная нижняя панель */}
      <MobileBottomBar />

      {/* Модалки */}
      <LibraryManager open={showLibrary} onClose={() => setShowLibrary(false)} />
      <SnapshotManager open={showSnapshots} onClose={() => setShowSnapshots(false)} />
      <HelpGuide open={showHelp} onClose={() => setShowHelp(false)} />

      {/* Паддинг для мобильной панели */}
      <div className="h-16 lg:hidden" />
    </div>
  )
}
