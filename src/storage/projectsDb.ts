import { db, type StoredProject, type StoredSnapshot } from './db'
import type { ProjectState } from '@/types/project'
import { generateId } from '@/utils/id'
import { calcGrandTotal, calcTotalHours, calcContextMultiplier } from '@/core/calculator'
import { createDefaultProjectState } from '@/core/defaults'

function computeCachedFields(state: ProjectState) {
  const result = calcGrandTotal({
    items: state.items,
    hourlyRate: state.pricing.hourlyRate,
    contextMultiplier: state.context.contextMultiplier,
    costOverrides: {},
    revisionPercent: state.pricing.revisionPercent,
    discount: state.pricing.discount,
    tax: state.pricing.tax,
    volumeDiscounts: state.pricing.volumeDiscounts,
    additionalAdjustments: state.pricing.additionalAdjustments,
  })
  return {
    totalAmount: result.grandTotal,
    totalHours: result.totalHours,
    contextMultiplier: calcContextMultiplier(state.context),
    categoryBreakdown: result.categoryTotals,
  }
}

export async function listProjects(): Promise<StoredProject[]> {
  return db.projects.orderBy('updatedAt').reverse().toArray()
}

export async function getProject(id: string): Promise<StoredProject | undefined> {
  return db.projects.get(id)
}

export async function saveProject(
  id: string,
  state: ProjectState,
  costOverrides: Record<string, number> = {},
): Promise<void> {
  const cached = computeCachedFields(state)
  // Recompute with costOverrides for accuracy
  if (Object.keys(costOverrides).length > 0) {
    const result = calcGrandTotal({
      items: state.items,
      hourlyRate: state.pricing.hourlyRate,
      contextMultiplier: state.context.contextMultiplier,
      costOverrides,
      revisionPercent: state.pricing.revisionPercent,
      discount: state.pricing.discount,
      tax: state.pricing.tax,
      volumeDiscounts: state.pricing.volumeDiscounts,
      additionalAdjustments: state.pricing.additionalAdjustments,
    })
    cached.totalAmount = result.grandTotal
    cached.totalHours = result.totalHours
    cached.categoryBreakdown = result.categoryTotals
  }

  const stored: StoredProject = {
    id,
    name: state.meta.name,
    createdAt: state.meta.createdAt,
    updatedAt: new Date().toISOString(),
    state,
    ...cached,
  }
  await db.projects.put(stored)
}

export async function deleteProject(id: string): Promise<void> {
  await db.transaction('rw', db.projects, db.snapshots, async () => {
    await db.projects.delete(id)
    await db.snapshots.where('projectId').equals(id).delete()
  })
}

export async function duplicateProject(id: string): Promise<string | null> {
  const original = await db.projects.get(id)
  if (!original) return null

  const newId = generateId()
  const now = new Date().toISOString()
  const newState = structuredClone(original.state)
  newState.meta.id = newId
  newState.meta.name = original.name + ' (копия)'
  newState.meta.createdAt = now
  newState.meta.updatedAt = now
  newState.snapshots = [] // Snapshots are NOT copied

  const cached = computeCachedFields(newState)
  const stored: StoredProject = {
    id: newId,
    name: newState.meta.name,
    createdAt: now,
    updatedAt: now,
    state: newState,
    ...cached,
  }
  await db.projects.put(stored)
  return newId
}

export async function renameProject(id: string, name: string): Promise<void> {
  const project = await db.projects.get(id)
  if (!project) return
  project.name = name
  project.state.meta.name = name
  project.updatedAt = new Date().toISOString()
  await db.projects.put(project)
}

export async function createProject(name?: string): Promise<string> {
  const state = createDefaultProjectState()
  if (name) {
    state.meta.name = name
  }
  // Apply saved settings
  try {
    const raw = localStorage.getItem('metod-calc-settings')
    if (raw) {
      const parsed = JSON.parse(raw)
      const saved = parsed?.state
      if (saved?.defaultHourlyRate) state.pricing.hourlyRate = saved.defaultHourlyRate
      if (saved?.rateSalary) state.pricing.rateHelper.salary = saved.rateSalary
      if (saved?.rateHoursPerMonth) state.pricing.rateHelper.hoursPerMonth = saved.rateHoursPerMonth
      if (saved?.rateProjectType) state.pricing.rateHelper.projectType = saved.rateProjectType
      if (saved?.rateMultiplier) state.pricing.rateHelper.multiplier = saved.rateMultiplier
    }
  } catch { /* ignore */ }

  await saveProject(state.meta.id, state)
  return state.meta.id
}

// === Snapshots ===

export async function saveSnapshot(
  projectId: string,
  label: string,
  state: Omit<ProjectState, 'snapshots'>,
): Promise<string> {
  const snapshot: StoredSnapshot = {
    id: generateId(),
    projectId,
    timestamp: new Date().toISOString(),
    label,
    state: structuredClone(state),
  }
  await db.snapshots.put(snapshot)
  return snapshot.id
}

export async function getSnapshots(projectId: string): Promise<StoredSnapshot[]> {
  return db.snapshots.where('projectId').equals(projectId).sortBy('timestamp')
}

export async function deleteSnapshot(id: string): Promise<void> {
  await db.snapshots.delete(id)
}

// === Export/Import ===

export async function exportProject(id: string): Promise<string | null> {
  const project = await db.projects.get(id)
  if (!project) return null
  const snapshots = await getSnapshots(id)
  return JSON.stringify({
    version: '4.0',
    type: 'project',
    project: project.state,
    snapshots: snapshots.map((s) => ({
      id: s.id,
      timestamp: s.timestamp,
      label: s.label,
      state: s.state,
    })),
  }, null, 2)
}

export async function importProject(json: string): Promise<string | null> {
  try {
    const data = JSON.parse(json)
    let state: ProjectState

    if (data.type === 'project' && data.project) {
      state = data.project as ProjectState
    } else if (data.context && data.items && data.pricing) {
      // v3.x format — direct ProjectState
      state = data as ProjectState
    } else {
      return null
    }

    // Assign new ID
    const newId = generateId()
    state.meta.id = newId
    state.meta.updatedAt = new Date().toISOString()

    // Patch missing fields for backward compat
    state.items = state.items.map((item) => ({
      ...item,
      confidence: item.confidence ?? null,
      effortRange: item.effortRange ?? null,
      libraryElementId: item.libraryElementId ?? null,
    }))

    await saveProject(newId, state)

    // Import snapshots if present
    if (data.snapshots && Array.isArray(data.snapshots)) {
      for (const snap of data.snapshots) {
        await db.snapshots.put({
          id: generateId(),
          projectId: newId,
          timestamp: snap.timestamp,
          label: snap.label,
          state: snap.state,
        })
      }
    }

    return newId
  } catch {
    return null
  }
}

export async function exportAllData(): Promise<string> {
  const projects = await db.projects.toArray()
  const allSnapshots = await db.snapshots.toArray()

  let library = null
  try {
    const raw = localStorage.getItem('metod-calc-library')
    if (raw) library = JSON.parse(raw)?.state
  } catch { /* ignore */ }

  let settings = null
  try {
    const raw = localStorage.getItem('metod-calc-settings')
    if (raw) settings = JSON.parse(raw)?.state
  } catch { /* ignore */ }

  return JSON.stringify({
    version: '4.0',
    type: 'full_backup',
    exportedAt: new Date().toISOString(),
    projects: projects.map((p) => ({
      state: p.state,
      snapshots: allSnapshots
        .filter((s) => s.projectId === p.id)
        .map((s) => ({ id: s.id, timestamp: s.timestamp, label: s.label, state: s.state })),
    })),
    library,
    settings,
  }, null, 2)
}
