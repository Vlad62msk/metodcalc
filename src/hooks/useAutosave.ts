import { useEffect, useRef, useCallback } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { saveProject } from '@/storage/projectsDb'

type SaveStatus = 'saved' | 'saving' | 'unsaved'

export function useAutosave(
  projectId: string | null,
  onStatusChange?: (status: SaveStatus) => void,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const statusRef = useRef<SaveStatus>('saved')

  const setStatus = useCallback(
    (s: SaveStatus) => {
      statusRef.current = s
      onStatusChange?.(s)
    },
    [onStatusChange],
  )

  const saveNow = useCallback(async () => {
    if (!projectId) return
    const state = useProjectStore.getState()
    const projectState = {
      context: state.context,
      items: state.items,
      pricing: state.pricing,
      presentation: state.presentation,
      snapshots: [], // Snapshots stored separately
      meta: state.meta,
    }
    setStatus('saving')
    try {
      await saveProject(projectId, projectState, state.costOverrides)
      setStatus('saved')
    } catch (e) {
      console.error('Autosave failed:', e)
      setStatus('unsaved')
    }
  }, [projectId, setStatus])

  // Subscribe to store changes with debounce
  useEffect(() => {
    if (!projectId) return

    const unsub = useProjectStore.subscribe(() => {
      setStatus('unsaved')
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        saveNow()
      }, 2000)
    })

    return () => {
      unsub()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [projectId, saveNow, setStatus])

  // Save on beforeunload
  useEffect(() => {
    if (!projectId) return

    const handleBeforeUnload = () => {
      if (statusRef.current !== 'saved') {
        // Synchronous save attempt — use sendBeacon or just save
        const state = useProjectStore.getState()
        const projectState = {
          context: state.context,
          items: state.items,
          pricing: state.pricing,
          presentation: state.presentation,
          snapshots: [],
          meta: state.meta,
        }
        // Dexie transactions are async, but we trigger the save
        saveProject(projectId, projectState, state.costOverrides)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [projectId])

  return { saveNow }
}
