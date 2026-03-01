import { create } from 'zustand'
import type { StoredProject } from '@/storage/db'
import * as projectsDb from '@/storage/projectsDb'

export interface ProjectSummary {
  id: string
  name: string
  createdAt: string
  updatedAt: string
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

interface ProjectsStore {
  projects: ProjectSummary[]
  loading: boolean

  loadProjects: () => Promise<void>
  createProject: (name?: string) => Promise<string>
  deleteProject: (id: string) => Promise<void>
  duplicateProject: (id: string) => Promise<string | null>
  renameProject: (id: string, name: string) => Promise<void>
  importProject: (json: string) => Promise<string | null>
  exportProject: (id: string) => Promise<string | null>
  exportAllData: () => Promise<string>
}

function toSummary(p: StoredProject): ProjectSummary {
  return {
    id: p.id,
    name: p.name,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    totalAmount: p.totalAmount,
    totalHours: p.totalHours,
    contextMultiplier: p.contextMultiplier,
    categoryBreakdown: p.categoryBreakdown,
  }
}

export const useProjectsStore = create<ProjectsStore>()((set) => ({
  projects: [],
  loading: true,

  loadProjects: async () => {
    set({ loading: true })
    const projects = await projectsDb.listProjects()
    set({ projects: projects.map(toSummary), loading: false })
  },

  createProject: async (name) => {
    const id = await projectsDb.createProject(name)
    const projects = await projectsDb.listProjects()
    set({ projects: projects.map(toSummary) })
    return id
  },

  deleteProject: async (id) => {
    await projectsDb.deleteProject(id)
    const projects = await projectsDb.listProjects()
    set({ projects: projects.map(toSummary) })
  },

  duplicateProject: async (id) => {
    const newId = await projectsDb.duplicateProject(id)
    if (newId) {
      const projects = await projectsDb.listProjects()
      set({ projects: projects.map(toSummary) })
    }
    return newId
  },

  renameProject: async (id, name) => {
    await projectsDb.renameProject(id, name)
    const projects = await projectsDb.listProjects()
    set({ projects: projects.map(toSummary) })
  },

  importProject: async (json) => {
    const id = await projectsDb.importProject(json)
    if (id) {
      const projects = await projectsDb.listProjects()
      set({ projects: projects.map(toSummary) })
    }
    return id
  },

  exportProject: async (id) => {
    return projectsDb.exportProject(id)
  },

  exportAllData: async () => {
    return projectsDb.exportAllData()
  },
}))
