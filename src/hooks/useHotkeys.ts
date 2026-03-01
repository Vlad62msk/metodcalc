import { useEffect } from 'react'
import { useProjectStore } from '@/store/useProjectStore'

export function useHotkeys() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      const ctrl = e.ctrlKey || e.metaKey

      // Ctrl+Z — Undo (works even in inputs)
      if (ctrl && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        useProjectStore.temporal.getState().undo()
        return
      }

      // Ctrl+Shift+Z or Ctrl+Y — Redo (works even in inputs)
      if ((ctrl && e.shiftKey && e.key === 'z') || (ctrl && e.key === 'y')) {
        e.preventDefault()
        useProjectStore.temporal.getState().redo()
        return
      }

      // Ctrl+S — Save snapshot (works even in inputs)
      if (ctrl && e.key === 's') {
        e.preventDefault()
        useProjectStore.getState().saveSnapshot('')
        return
      }

      // Skip remaining shortcuts when inside input/textarea
      if (isInput) return

      const state = useProjectStore.getState()

      // Delete — remove selected item (only on Step 2, which is tab index 2)
      if (e.key === 'Delete' && state.activeTab === 2 && state.selectedItemId) {
        e.preventDefault()
        useProjectStore.getState().removeItem(state.selectedItemId)
        useProjectStore.getState().setSelectedItem(null)
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
