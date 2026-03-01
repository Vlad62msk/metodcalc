import { HashRouter, Routes, Route } from 'react-router-dom'
import { ProjectListPage } from '@/pages/ProjectListPage'
import { CalculatorPage } from '@/pages/CalculatorPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { SharedProjectPage } from '@/pages/SharedProjectPage'
import { UpdatePrompt } from '@/components/ui/UpdatePrompt'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export default function App() {
  const isOnline = useOnlineStatus()

  return (
    <HashRouter>
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-center text-xs py-1">
          Офлайн — данные сохраняются локально
        </div>
      )}
      <Routes>
        <Route path="/" element={<ProjectListPage />} />
        <Route path="/project/:id" element={<CalculatorPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/shared/:data" element={<SharedProjectPage />} />
      </Routes>
      <UpdatePrompt />
    </HashRouter>
  )
}
