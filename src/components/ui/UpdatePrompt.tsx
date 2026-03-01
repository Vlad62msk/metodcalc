import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 max-w-sm">
      <p className="text-sm text-gray-700 mb-3">Доступно обновление приложения.</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="text-sm bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Обновить
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
        >
          Позже
        </button>
      </div>
    </div>
  )
}
