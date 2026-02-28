import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { produce } from 'immer'
import type { LibraryElement, LibrarySet, UserLibrary } from '@/types/library'
import { createDefaultLibrary, BUILT_IN_ELEMENTS, BUILT_IN_SETS } from '@/core/defaults'
import { generateId } from '@/utils/id'

interface LibraryStore extends UserLibrary {
  addElement: (el: Omit<LibraryElement, 'id' | 'type' | 'isBuiltIn' | 'isHidden'>) => void
  updateElement: (id: string, changes: Partial<LibraryElement>) => void
  removeElement: (id: string) => void
  hideElement: (id: string, hidden: boolean) => void

  addSet: (s: Omit<LibrarySet, 'id' | 'type' | 'isBuiltIn' | 'isHidden'>) => void
  updateSet: (id: string, changes: Partial<LibrarySet>) => void
  removeSet: (id: string) => void
  hideSet: (id: string, hidden: boolean) => void

  resetBuiltIn: () => void
  importLibrary: (lib: UserLibrary) => void
  exportLibrary: () => UserLibrary

  getVisibleElements: () => LibraryElement[]
  getVisibleSets: () => LibrarySet[]
  getAllEntries: () => (LibraryElement | LibrarySet)[]
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => {
      const initial = createDefaultLibrary()

      return {
        ...initial,

        addElement: (el) =>
          set(produce((s: LibraryStore) => {
            s.elements.push({
              ...el,
              id: generateId(),
              type: 'element',
              isBuiltIn: false,
              isHidden: false,
            })
            s.meta.lastModified = new Date().toISOString()
          })),

        updateElement: (id, changes) =>
          set(produce((s: LibraryStore) => {
            const el = s.elements.find((e) => e.id === id)
            if (el) Object.assign(el, changes)
            s.meta.lastModified = new Date().toISOString()
          })),

        removeElement: (id) =>
          set(produce((s: LibraryStore) => {
            const el = s.elements.find((e) => e.id === id)
            if (el && !el.isBuiltIn) {
              s.elements = s.elements.filter((e) => e.id !== id)
            }
            s.meta.lastModified = new Date().toISOString()
          })),

        hideElement: (id, hidden) =>
          set(produce((s: LibraryStore) => {
            const el = s.elements.find((e) => e.id === id)
            if (el) el.isHidden = hidden
            s.meta.lastModified = new Date().toISOString()
          })),

        addSet: (setData) =>
          set(produce((s: LibraryStore) => {
            s.sets.push({
              ...setData,
              id: generateId(),
              type: 'set',
              isBuiltIn: false,
              isHidden: false,
            })
            s.meta.lastModified = new Date().toISOString()
          })),

        updateSet: (id, changes) =>
          set(produce((s: LibraryStore) => {
            const st = s.sets.find((e) => e.id === id)
            if (st) Object.assign(st, changes)
            s.meta.lastModified = new Date().toISOString()
          })),

        removeSet: (id) =>
          set(produce((s: LibraryStore) => {
            const st = s.sets.find((e) => e.id === id)
            if (st && !st.isBuiltIn) {
              s.sets = s.sets.filter((e) => e.id !== id)
            }
            s.meta.lastModified = new Date().toISOString()
          })),

        hideSet: (id, hidden) =>
          set(produce((s: LibraryStore) => {
            const st = s.sets.find((e) => e.id === id)
            if (st) st.isHidden = hidden
            s.meta.lastModified = new Date().toISOString()
          })),

        resetBuiltIn: () => {
          const s = get()
          set({
            elements: [
              ...s.elements.filter((e) => !e.isBuiltIn),
              ...BUILT_IN_ELEMENTS.map((e) => ({ ...e })),
            ],
            sets: [
              ...s.sets.filter((e) => !e.isBuiltIn),
              ...BUILT_IN_SETS.map((e) => ({ ...e, items: e.items.map((i) => ({ ...i })) })),
            ],
            meta: { ...s.meta, lastModified: new Date().toISOString() },
          } as Partial<LibraryStore>)
        },

        importLibrary: (lib) =>
          set({ elements: lib.elements, sets: lib.sets, meta: lib.meta } as Partial<LibraryStore>),

        exportLibrary: () => {
          const s = get()
          return {
            elements: JSON.parse(JSON.stringify(s.elements)),
            sets: JSON.parse(JSON.stringify(s.sets)),
            meta: { ...s.meta },
          }
        },

        getVisibleElements: () => get().elements.filter((e) => !e.isHidden),
        getVisibleSets: () => get().sets.filter((s) => !s.isHidden),
        getAllEntries: () => {
          const s = get()
          return [...s.elements, ...s.sets]
        },
      }
    },
    {
      name: 'metod-calc-library',
      partialize: (state) => ({
        elements: state.elements,
        sets: state.sets,
        meta: state.meta,
      }),
    },
  ),
)
