import { useProjectStore } from '@/store/useProjectStore'

const STEPS_INFO = [
  {
    num: 1,
    tab: 1,
    title: 'Контекст проекта',
    desc: 'Опишите тип проекта, тему, методику работы, клиента и сроки. На основе этих параметров автоматически рассчитывается контекстный коэффициент сложности.',
  },
  {
    num: 2,
    tab: 2,
    title: 'Состав работ',
    desc: 'Добавляйте позиции сметы вручную или из библиотеки шаблонов. Группируйте связанные элементы в контейнеры, настраивайте количество и трудоёмкость.',
  },
  {
    num: 3,
    tab: 3,
    title: 'Ценообразование',
    desc: 'Задайте ставку за час, настройте процент на правки, скидки, наценки и налоги. Итоговая стоимость рассчитывается автоматически.',
  },
  {
    num: 4,
    tab: 4,
    title: 'Смета для клиента',
    desc: 'Настройте отображение сметы, выберите шаблон и экспортируйте в PDF, XLSX или поделитесь ссылкой.',
  },
]

const FEATURES = [
  { title: 'Библиотека шаблонов', desc: 'Готовые элементы сметы — добавляйте в один клик и создавайте свои.' },
  { title: 'Сценарии «а что если»', desc: 'Сравнивайте варианты состава работ в рамках одного проекта.' },
  { title: 'Версии и откат', desc: 'Сохраняйте снимки проекта, сравнивайте и возвращайтесь к предыдущим.' },
  { title: 'Поделиться ссылкой', desc: 'Отправьте клиенту ссылку на смету — без регистрации и серверов.' },
  { title: 'Работа офлайн', desc: 'PWA-приложение — работает без интернета, данные хранятся локально.' },
  { title: 'Горячие клавиши', desc: 'Ctrl+Z/Y, Ctrl+N, Ctrl+S и другие — для быстрой работы.' },
]

export function Step0Intro() {
  const setActiveTab = useProjectStore((s) => s.setActiveTab)

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Добро пожаловать в калькулятор!</h2>
        <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
          Профессиональный инструмент для расчёта стоимости разработки образовательных продуктов.
          Пройдите 4 шага — от описания проекта до готовой сметы для клиента.
        </p>
      </div>

      {/* Steps overview — clickable cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-tour="intro-steps">
        {STEPS_INFO.map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setActiveTab(s.tab)}
            className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex items-center justify-center shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                {s.num}
              </span>
              <span className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                {s.title}
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
          </button>
        ))}
      </div>

      {/* Quick start */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTab(1)}
          className="text-sm font-medium bg-primary-600 text-white px-5 py-2.5 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Начать с шага 1
        </button>
        <span className="text-xs text-gray-400">или нажмите на нужный шаг выше</span>
      </div>

      {/* Features grid */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Возможности калькулятора</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white border border-gray-100 rounded-lg px-4 py-3">
              <div className="text-sm font-medium text-gray-800 mb-1">{f.title}</div>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
