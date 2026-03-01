import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectsStore } from '@/store/useProjectsStore'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { CreateProjectModal } from '@/components/projects/CreateProjectModal'

const FEATURES = [
  {
    icon: '1',
    title: 'Контекст проекта',
    desc: 'Опишите тип, тему, методику — коэффициент сложности рассчитается автоматически',
  },
  {
    icon: '2',
    title: 'Состав работ',
    desc: 'Добавляйте позиции вручную или из библиотеки шаблонов, группируйте в контейнеры',
  },
  {
    icon: '3',
    title: 'Ценообразование',
    desc: 'Задайте ставку, настройте правки, скидки и налоги — итог считается на лету',
  },
  {
    icon: '4',
    title: 'Смета для клиента',
    desc: 'Выберите шаблон отображения и экспортируйте в PDF, XLSX или поделитесь ссылкой',
  },
]

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
      {/* Hero section */}
      <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white">
        <div className="max-w-5xl mx-auto px-4 pt-10 pb-12">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold">Калькулятор методиста</h1>
            <span className="text-xs px-2 py-0.5 rounded" style={{ color: '#c4b5fd', backgroundColor: 'rgba(255,255,255,0.1)' }}>v4.0</span>
          </div>
          <p className="max-w-2xl text-sm sm:text-base leading-relaxed mb-8" style={{ color: '#c4b5fd' }}>
            Профессиональный инструмент для расчёта стоимости разработки образовательных продуктов.
            Составьте обоснованную смету за 4 шага — от описания проекта до готового документа для клиента.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {FEATURES.map((f) => (
              <div key={f.icon} className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {f.icon}
                  </span>
                  <span className="text-sm font-semibold text-white">{f.title}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#ddd6fe' }}>{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="text-sm font-medium bg-white text-primary-900 px-5 py-2.5 rounded-lg hover:bg-primary-50 transition-colors"
            >
              + Новый проект
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm hover:text-white px-4 py-2.5 rounded-lg transition-colors"
              style={{ color: '#c4b5fd', borderWidth: 1, borderStyle: 'solid', borderColor: '#7c3aed' }}
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
            <div className="flex gap-2 ml-auto">
              {projects.length >= 2 && (
                <button
                  type="button"
                  onClick={() => navigate('/analytics')}
                  className="text-xs hover:text-white px-2 py-1.5 rounded transition-colors"
                  style={{ color: '#a5b4fc', borderWidth: 1, borderStyle: 'solid', borderColor: '#5b21b6' }}
                >
                  Аналитика
                </button>
              )}
              <button
                type="button"
                onClick={handleExportAll}
                className="text-xs hover:text-white px-2 py-1.5 rounded transition-colors"
                style={{ color: '#a5b4fc', borderWidth: 1, borderStyle: 'solid', borderColor: '#5b21b6' }}
                title="Экспорт всех данных"
              >
                Бэкап
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Projects section */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Загрузка...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3 opacity-30">&#128203;</div>
            <p className="text-gray-500 mb-1">Пока нет проектов</p>
            <p className="text-sm text-gray-400 mb-5">
              Создайте первый проект, чтобы начать работу с калькулятором,
              или импортируйте готовый JSON-файл.
            </p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="text-sm bg-primary-600 text-white px-5 py-2.5 rounded-lg hover:bg-primary-700"
            >
              + Создать первый проект
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Проекты
                <span className="text-sm font-normal text-gray-400 ml-2">{projects.length}</span>
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          </>
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
