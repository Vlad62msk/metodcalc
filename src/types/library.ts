import type { Category, RoleType } from './estimate'

export interface LibraryElement {
  id: string
  type: 'element'
  name: string
  hoursPerUnit: number
  unit: string
  category: Category
  role: RoleType
  revisionable: boolean
  description: string
  isBuiltIn: boolean
  isHidden: boolean
}

export interface LibrarySetItem {
  name: string
  hoursPerUnit: number
  unit: string
  category: Category
  role: RoleType
  revisionable: boolean
}

export interface LibrarySet {
  id: string
  type: 'set'
  name: string
  description: string
  items: LibrarySetItem[]
  isBuiltIn: boolean
  isHidden: boolean
}

export type LibraryEntry = LibraryElement | LibrarySet

export interface UserLibrary {
  elements: LibraryElement[]
  sets: LibrarySet[]
  meta: {
    lastModified: string
    version: '1.0'
  }
}
