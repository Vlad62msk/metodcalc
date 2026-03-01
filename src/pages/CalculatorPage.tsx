import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/store/useProjectStore'
import { getProject } from '@/storage/projectsDb'
import { useAutosave } from '@/hooks/useAutosave'
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
import { HotkeysModal } from '@/components/ui/HotkeysModal'
import { StepNavigation } from '@/components/ui/StepNavigation'
import { useHotkeys } from '@/hooks/useHotkeys'
import { OnboardingTour } from '@/components/onboarding/OnboardingTour'
import { ScenarioBar } from '@/components/scenarios/ScenarioBar'
import { ShareModal } from '@/components/ui/ShareModal'
import { useSettingsStore } from '@/store/useSettingsStore'

const steps = [Step1Context, Step2Items, Step3Pricing, Step4Export]

type SaveStatus = 'saved' | 'saving' | 'unsaved'

export function CalculatorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')

  const activeTab = useProjectStore((s) => s.activeTab)
  const projectName = useProjectStore((s) => s.meta.name)
  const setProjectName = useProjectStore((s) => s.setProjectName)
  const loadProject = useProjectStore((s) => s.loadProject)

  const [showLibrary, setShowLibrary] = useState(false)
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showHotkeys, setShowHotkeys] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding)

  useHotkeys()

  // Auto-trigger onboarding for first-time users
  useEffect(() => {
    if (!loading && !notFound && !hasCompletedOnboarding) {
      const timer = setTimeout(() => setShowOnboarding(true), 500)
      return () => clearTimeout(timer)
    }
  }, [loading, notFound, hasCompletedOnboarding])

  const handleStatusChange = useCallback((status: SaveStatus) => {
    setSaveStatus(status)
  }, [])

  const { saveNow } = useAutosave(id ?? null, handleStatusChange)

  // Load project from IndexedDB on mount
  useEffect(() => {
    if (!id) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const stored = await getProject(id)
      if (cancelled) return

      if (!stored) {
        setNotFound(true)
        setLoading(false)
        return
      }

      loadProject(stored.state)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [id, loadProject])

  // Save before navigating away
  const handleBack = async () => {
    await saveNow()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Загрузка проекта...</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Проект не найден</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Вернуться к списку
        </button>
      </div>
    )
  }

  const StepComponent = steps[activeTab]!

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white glass-solid border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-gray-500 hover:text-gray-700 mr-1"
              title="Вернуться к проектам"
            >
              &larr;
            </button>
            <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">Калькулятор методиста</h1>
            <span className="text-xs text-gray-400">v4.0</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="text-sm border border-transparent hover:border-gray-300 focus:border-primary-400 rounded px-2 py-1 bg-transparent focus:bg-white focus:outline-none max-w-[200px]"
              placeholder="Название проекта"
            />
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              saveStatus === 'saved' ? 'text-gray-400' :
              saveStatus === 'saving' ? 'text-gray-400 animate-pulse' :
              'text-amber-500'
            }`}>
              {saveStatus === 'saved' ? 'Сохранено' :
               saveStatus === 'saving' ? 'Сохранение...' :
               'Не сохранено'}
            </span>
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
              data-tour="library"
            >
              Библиотека
            </button>
            <button
              type="button"
              onClick={() => setShowHotkeys(true)}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded"
              title="Горячие клавиши"
            >
              ⌨
            </button>
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded"
              title="Обзор интерфейса"
            >
              🎓
            </button>
            <button
              type="button"
              onClick={() => setShowShare(true)}
              className="text-xs text-primary-600 hover:text-primary-700 px-2 py-1 border border-primary-200 rounded"
              title="Поделиться"
            >
              Поделиться
            </button>
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded"
              title="Инструкция"
            >
              ?
            </button>
          </div>
        </div>
      </header>

      <TabNavigation />
      <ScenarioBar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <main className="flex-1 min-w-0">
            <StepComponent />
            <StepNavigation />
          </main>

          <aside className="hidden lg:block w-80 shrink-0" data-tour="sidebar">
            <div className="sticky top-[120px]">
              <Sidebar />
            </div>
          </aside>
        </div>
      </div>

      <MobileBottomBar />

      <LibraryManager open={showLibrary} onClose={() => setShowLibrary(false)} />
      <SnapshotManager open={showSnapshots} onClose={() => setShowSnapshots(false)} />
      <HelpGuide open={showHelp} onClose={() => setShowHelp(false)} />
      <HotkeysModal open={showHotkeys} onClose={() => setShowHotkeys(false)} />
      <OnboardingTour open={showOnboarding} onClose={() => setShowOnboarding(false)} />
      <ShareModal open={showShare} onClose={() => setShowShare(false)} />

      <div className="h-16 lg:hidden" />
    </div>
  )
}
