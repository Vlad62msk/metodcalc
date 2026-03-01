import Dexie, { type EntityTable } from 'dexie'
import type { ProjectState } from '@/types/project'

export interface StoredProject {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  state: ProjectState
  // Cached fields for list display (updated on every save)
  totalAmount: number
  totalHours: number
  contextMultiplier: number
  categoryBreakdown: {
    content: number
    assessment: number
    service: number
    other: number
  }
}

export interface StoredSnapshot {
  id: string
  projectId: string
  timestamp: string
  label: string
  state: Omit<ProjectState, 'snapshots'>
}

class MetodCalcDB extends Dexie {
  projects!: EntityTable<StoredProject, 'id'>
  snapshots!: EntityTable<StoredSnapshot, 'id'>

  constructor() {
    super('metod-calc-db')
    this.version(1).stores({
      projects: 'id, updatedAt',
      snapshots: 'id, projectId',
    })
  }
}

export const db = new MetodCalcDB()
