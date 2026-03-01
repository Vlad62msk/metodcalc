import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectsStore } from '@/store/useProjectsStore'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { CreateProjectModal } from '@/components/projects/CreateProjectModal'

export function ProjectListPage() {
  const navigate = useNavigate()
  const { projects, loading, loadProjects, createProject, deleteProject, duplicateProject, renameProject, importProject, exportProject, exportAllData } = useProjectsStore()
  const [showCreate, setShowCreate] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleCreate = async (name: string) => {
    const id = await createProject(name)
    navigate(`/project/${id}`)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const id = await importProject(text)
      if (id) {
        navigate(`/project/${id}`)
      } else {
        alert('Не удалось импортировать файл. Проверьте формат.')
      }
    } catch {
      alert('Ошибка чтения файла.')
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleExport = async (id: string) => {
    const json = await exportProject(id)
    if (!json) return
    const project = projects.find((p) => p.id === id)
    const name = project?.name || 'project'
    downloadJson(json, `${name}.json`)
  }

  const handleExportAll = async () => {
    const json = await exportAllData()
    downloadJson(json, `metod-calc-backup-${new Date().toISOString().slice(0, 10)}.json`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white glass-solid border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900">Калькулятор методиста</h1>
            <span className="text-xs text-gray-400">v4.0</span>
          </div>
          <div className="flex gap-2">
            {projects.length >= 2 && (
              <button
                type="button"
                onClick={() => navigate('/analytics')}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded"
                title="Аналитика по проектам"
              >
                Аналитика
              </button>
            )}
            <button
              type="button"
              onClick={handleExportAll}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded"
              title="Экспорт всех данных"
            >
              Бэкап
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Проекты</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2 border border-gray-200 rounded-lg"
            >
              Импорт JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="text-sm bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              + Новый проект
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Загрузка...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-2">Нет проектов</p>
            <p className="text-sm text-gray-400 mb-6">Создайте первый проект или импортируйте JSON.</p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="text-sm bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              + Создать проект
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={() => navigate(`/project/${project.id}`)}
                onRename={(name) => renameProject(project.id, name)}
                onDuplicate={() => duplicateProject(project.id)}
                onExport={() => handleExport(project.id)}
                onDelete={() => deleteProject(project.id)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}

function downloadJson(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
