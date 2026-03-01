import { saveProject } from './projectsDb'
import { db } from './db'
import type { ProjectState } from '@/types/project'
import { generateId } from '@/utils/id'

const MIGRATION_FLAG = 'migrated_to_v2'

export async function migrateFromLocalStorage(): Promise<string | null> {
  // Already migrated
  if (localStorage.getItem(MIGRATION_FLAG)) return null

  const raw = localStorage.getItem('metod-calc-project')
  if (!raw) {
    localStorage.setItem(MIGRATION_FLAG, 'true')
    return null
  }

  try {
    const parsed = JSON.parse(raw)
    const state = parsed?.state as ProjectState | undefined
    if (!state || !state.context || !state.items || !state.pricing) {
      localStorage.setItem(MIGRATION_FLAG, 'true')
      return null
    }

    // Ensure meta exists
    if (!state.meta) {
      (state as any).meta = {
        id: generateId(),
        name: 'Imported project',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '3.3',
      }
    }

    const projectId = state.meta.id || generateId()
    state.meta.id = projectId

    // Patch missing fields
    state.items = state.items.map((item) => ({
      ...item,
      confidence: item.confidence ?? null,
      effortRange: item.effortRange ?? null,
      libraryElementId: item.libraryElementId ?? null,
    }))

    // Extract costOverrides if present
    const costOverrides = parsed?.state?.costOverrides ?? {}

    // Save project (without snapshots in the state — they'll be migrated separately)
    const snapshots = state.snapshots || []
    state.snapshots = []
    await saveProject(projectId, state, costOverrides)

    // Migrate snapshots to IndexedDB
    for (const snap of snapshots) {
      await db.snapshots.put({
        id: snap.id || generateId(),
        projectId,
        timestamp: snap.timestamp,
        label: snap.label,
        state: snap.state,
      })
    }

    // Mark as migrated (keep old data as backup)
    localStorage.setItem(MIGRATION_FLAG, 'true')
    return projectId
  } catch (e) {
    console.error('Migration failed:', e)
    localStorage.setItem(MIGRATION_FLAG, 'true')
    return null
  }
}
