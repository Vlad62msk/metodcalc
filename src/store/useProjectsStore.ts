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
    try {
      const projects = await projectsDb.listProjects()
      set({ projects: projects.map(toSummary), loading: false })
    } catch (e) {
      console.error('Failed to load projects:', e)
      set({ loading: false })
    }
  },

  createProject: async (name) => {
    try {
      const id = await projectsDb.createProject(name)
      const projects = await projectsDb.listProjects()
      set({ projects: projects.map(toSummary) })
      return id
    } catch (e) {
      console.error('Failed to create project:', e)
      throw e
    }
  },

  deleteProject: async (id) => {
    try {
      await projectsDb.deleteProject(id)
      const projects = await projectsDb.listProjects()
      set({ projects: projects.map(toSummary) })
    } catch (e) {
      console.error('Failed to delete project:', e)
      throw e
    }
  },

  duplicateProject: async (id) => {
    try {
      const newId = await projectsDb.duplicateProject(id)
      if (newId) {
        const projects = await projectsDb.listProjects()
        set({ projects: projects.map(toSummary) })
      }
      return newId
    } catch (e) {
      console.error('Failed to duplicate project:', e)
      return null
    }
  },

  renameProject: async (id, name) => {
    try {
      await projectsDb.renameProject(id, name)
      const projects = await projectsDb.listProjects()
      set({ projects: projects.map(toSummary) })
    } catch (e) {
      console.error('Failed to rename project:', e)
      throw e
    }
  },

  importProject: async (json) => {
    try {
      const id = await projectsDb.importProject(json)
      if (id) {
        const projects = await projectsDb.listProjects()
        set({ projects: projects.map(toSummary) })
      }
      return id
    } catch (e) {
      console.error('Failed to import project:', e)
      return null
    }
  },

  exportProject: async (id) => {
    try {
      return await projectsDb.exportProject(id)
    } catch (e) {
      console.error('Failed to export project:', e)
      return null
    }
  },

  exportAllData: async () => {
    return projectsDb.exportAllData()
  },
}))
