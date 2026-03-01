import { create } from 'zustand'
import { temporal } from 'zundo'
import { produce } from 'immer'
import type { EstimateItem } from '@/types/estimate'
import type { ProjectState, ProjectContext, Pricing, Presentation, Snapshot, Scenario, ScenariosState } from '@/types/project'
import { createDefaultProjectState, createDefaultItem } from '@/core/defaults'
import { calcContextMultiplier, calcGrandTotal } from '@/core/calculator'
import { generateId } from '@/utils/id'

interface CostOverrides {
  [itemId: string]: number
}

interface ProjectStore extends ProjectState {
  activeTab: number
  costOverrides: CostOverrides
  selectedItemId: string | null

  setProjectType: (value: string, label: string) => void
  setDomain: (value: string, label: string, multiplier: number) => void
  setMethodology: (value: string, label: string, multiplier: number) => void
  setClient: (value: string, label: string, multiplier: number, defaultRevisionPercent: number) => void
  setDeadline: (value: string, label: string, multiplier: number) => void
  setManualMultiplier: (value: number | null) => void

  addItem: (item: Partial<EstimateItem>) => void
  addItemsFromSet: (containerName: string, items: Array<Partial<EstimateItem>>) => void
  updateItem: (id: string, changes: Partial<EstimateItem>) => void
  removeItem: (id: string) => void
  moveItem: (id: string, newParentId: string | null, newSortOrder: number) => void
  reorderItems: (orderedIds: string[]) => void

  setHourlyRate: (rate: number) => void
  setRateHelper: (changes: Partial<Pricing['rateHelper']>) => void
  setRevisionPercent: (percent: number, isManual: boolean) => void
  setDiscount: (discount: Partial<Pricing['discount']>) => void
  setTax: (tax: Partial<Pricing['tax']>) => void
  setVolumeDiscounts: (vd: Partial<Pricing['volumeDiscounts']>) => void
  addAdjustment: (label: string, amount: number) => void
  removeAdjustment: (id: string) => void
  updateAdjustment: (id: string, changes: { label?: string; amount?: number }) => void
  setTargetPrice: (tp: Partial<Pricing['targetPrice']>) => void
  setResourceBudget: (rb: Partial<Pricing['resourceBudget']>) => void
  setCostOverride: (itemId: string, cost: number) => void
  clearCostOverride: (itemId: string) => void

  setPresentation: (changes: Partial<Presentation>) => void
  setActiveTab: (tab: number) => void

  setProjectName: (name: string) => void
  resetProject: () => void
  loadProject: (state: ProjectState) => void
  saveSnapshot: (label: string) => void
  restoreSnapshot: (snapshotId: string) => void
  removeSnapshot: (snapshotId: string) => void

  setSelectedItem: (id: string | null) => void

  // Scenarios
  enableScenarios: () => void
  disableScenarios: () => void
  addScenario: (name: string, copyItems: boolean) => void
  switchScenario: (scenarioId: string) => void
  removeScenario: (scenarioId: string) => void
  renameScenario: (scenarioId: string, name: string) => void

  getGrandTotal: () => ReturnType<typeof calcGrandTotal>
  getContextMultiplier: () => number
}

function recalcMultiplier(context: ProjectContext) {
  if (!context.contextMultiplierIsManual) {
    context.contextMultiplier = calcContextMultiplier(context)
  }
}

function touchMeta(s: { meta: { updatedAt: string } }) {
  s.meta.updatedAt = new Date().toISOString()
}

export const useProjectStore = create<ProjectStore>()(
  temporal(
  (set, get) => {
    const initial = createDefaultProjectState()

    return {
      ...initial,
      activeTab: 0,
      costOverrides: {},
      selectedItemId: null,

      // === Шаг 1 ===
      setProjectType: (value, label) =>
        set(produce((s: ProjectStore) => {
          s.context.projectType = { value, label }
          recalcMultiplier(s.context)
        })),

      setDomain: (value, label, multiplier) =>
        set(produce((s: ProjectStore) => {
          s.context.domain = { value, label, multiplier }
          recalcMultiplier(s.context)
        })),

      setMethodology: (value, label, multiplier) =>
        set(produce((s: ProjectStore) => {
          s.context.methodology = { value, label, multiplier }
          recalcMultiplier(s.context)
        })),

      setClient: (value, label, multiplier, defaultRevisionPercent) =>
        set(produce((s: ProjectStore) => {
          s.context.client = { value, label, multiplier, defaultRevisionPercent }
          recalcMultiplier(s.context)
          if (!s.pricing.revisionPercentIsManual) {
            s.pricing.revisionPercent = defaultRevisionPercent
          }
        })),

      setDeadline: (value, label, multiplier) =>
        set(produce((s: ProjectStore) => {
          s.context.deadline = { value, label, multiplier }
          recalcMultiplier(s.context)
        })),

      setManualMultiplier: (value) =>
        set(produce((s: ProjectStore) => {
          if (value === null) {
            s.context.contextMultiplierIsManual = false
            s.context.contextMultiplier = calcContextMultiplier(s.context)
          } else {
            s.context.contextMultiplierIsManual = true
            s.context.contextMultiplier = value
          }
        })),

      // === Шаг 2 ===
      addItem: (partial) =>
        set(produce((s: ProjectStore) => {
          const maxOrder = s.items.reduce((max, i) => Math.max(max, i.sortOrder), -1)
          const item = createDefaultItem({
            ...partial,
            sortOrder: maxOrder + 1,
            clientName: partial.clientName || partial.name || '',
          })
          s.items.push(item)
          touchMeta(s)
        })),

      addItemsFromSet: (containerName, setItems) =>
        set(produce((s: ProjectStore) => {
          const maxOrder = s.items.reduce((max, i) => Math.max(max, i.sortOrder), -1)
          const containerId = generateId()
          const container = createDefaultItem({
            id: containerId,
            name: containerName,
            clientName: containerName,
            isContainer: true,
            containerMode: 'sum_children',
            sortOrder: maxOrder + 1,
            source: 'library_set',
          })
          s.items.push(container)
          setItems.forEach((si, idx) => {
            const child = createDefaultItem({
              ...si,
              parentId: containerId,
              sortOrder: idx,
              clientName: si.clientName || si.name || '',
              source: 'library_set',
            })
            s.items.push(child)
          })
          touchMeta(s)
        })),

      updateItem: (id, changes) =>
        set(produce((s: ProjectStore) => {
          const item = s.items.find((i) => i.id === id)
          if (item) {
            Object.assign(item, changes)
            if (changes.name && !item.clientName) {
              item.clientName = changes.name
            }
          }
          touchMeta(s)
        })),

      removeItem: (id) =>
        set(produce((s: ProjectStore) => {
          const idsToRemove = new Set<string>([id])
          let changed = true
          while (changed) {
            changed = false
            for (const item of s.items) {
              if (item.parentId && idsToRemove.has(item.parentId) && !idsToRemove.has(item.id)) {
                idsToRemove.add(item.id)
                changed = true
              }
            }
          }
          s.items = s.items.filter((i) => !idsToRemove.has(i.id))
          for (const removedId of idsToRemove) {
            delete s.costOverrides[removedId]
          }
          touchMeta(s)
        })),

      moveItem: (id, newParentId, newSortOrder) =>
        set(produce((s: ProjectStore) => {
          const item = s.items.find((i) => i.id === id)
          if (item) {
            item.parentId = newParentId
            item.sortOrder = newSortOrder
          }
          touchMeta(s)
        })),

      reorderItems: (orderedIds) =>
        set(produce((s: ProjectStore) => {
          for (let i = 0; i < orderedIds.length; i++) {
            const item = s.items.find((it) => it.id === orderedIds[i])
            if (item) item.sortOrder = i
          }
          touchMeta(s)
        })),

      // === Шаг 3 ===
      setHourlyRate: (rate) =>
        set(produce((s: ProjectStore) => { s.pricing.hourlyRate = rate })),

      setRateHelper: (changes) =>
        set(produce((s: ProjectStore) => { Object.assign(s.pricing.rateHelper, changes) })),

      setRevisionPercent: (percent, isManual) =>
        set(produce((s: ProjectStore) => {
          s.pricing.revisionPercent = percent
          s.pricing.revisionPercentIsManual = isManual
        })),

      setDiscount: (discount) =>
        set(produce((s: ProjectStore) => { Object.assign(s.pricing.discount, discount) })),

      setTax: (tax) =>
        set(produce((s: ProjectStore) => { Object.assign(s.pricing.tax, tax) })),

      setVolumeDiscounts: (vd) =>
        set(produce((s: ProjectStore) => { Object.assign(s.pricing.volumeDiscounts, vd) })),

      addAdjustment: (label, amount) =>
        set(produce((s: ProjectStore) => {
          s.pricing.additionalAdjustments.push({ id: generateId(), label, amount })
        })),

      removeAdjustment: (id) =>
        set(produce((s: ProjectStore) => {
          s.pricing.additionalAdjustments = s.pricing.additionalAdjustments.filter((a) => a.id !== id)
        })),

      updateAdjustment: (id, changes) =>
        set(produce((s: ProjectStore) => {
          const adj = s.pricing.additionalAdjustments.find((a) => a.id === id)
          if (adj) Object.assign(adj, changes)
        })),

      setTargetPrice: (tp) =>
        set(produce((s: ProjectStore) => { Object.assign(s.pricing.targetPrice, tp) })),

      setResourceBudget: (rb) =>
        set(produce((s: ProjectStore) => { Object.assign(s.pricing.resourceBudget, rb) })),

      setCostOverride: (itemId, cost) =>
        set(produce((s: ProjectStore) => {
          s.costOverrides[itemId] = cost
          const item = s.items.find((i) => i.id === itemId)
          if (item) item.overrides.cost = true
        })),

      clearCostOverride: (itemId) =>
        set(produce((s: ProjectStore) => {
          delete s.costOverrides[itemId]
          const item = s.items.find((i) => i.id === itemId)
          if (item) item.overrides.cost = false
        })),

      // === Шаг 4 ===
      setPresentation: (changes) =>
        set(produce((s: ProjectStore) => { Object.assign(s.presentation, changes) })),

      // === Навигация ===
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedItem: (id) => set({ selectedItemId: id }),

      // === Проект ===
      setProjectName: (name) =>
        set(produce((s: ProjectStore) => {
          s.meta.name = name
          touchMeta(s)
        })),

      resetProject: () => {
        const fresh = createDefaultProjectState()
        set({ ...fresh, activeTab: 0, costOverrides: {} } as Partial<ProjectStore>)
      },

      loadProject: (state) => {
        const patchedItems = state.items.map((item) => ({
          ...item,
          confidence: item.confidence ?? null,
          effortRange: item.effortRange ?? null,
          libraryElementId: item.libraryElementId ?? null,
        }))
        set({
          context: state.context,
          items: patchedItems,
          pricing: state.pricing,
          presentation: state.presentation,
          snapshots: state.snapshots ?? [],
          meta: state.meta,
          scenarios: state.scenarios ?? { enabled: false, activeScenarioId: null, list: [] },
          costOverrides: {},
          activeTab: 0,
        } as Partial<ProjectStore>)
      },

      saveSnapshot: (label) =>
        set(produce((s: ProjectStore) => {
          const snapshot: Snapshot = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            label,
            state: {
              context: JSON.parse(JSON.stringify(s.context)),
              items: JSON.parse(JSON.stringify(s.items)),
              pricing: JSON.parse(JSON.stringify(s.pricing)),
              presentation: JSON.parse(JSON.stringify(s.presentation)),
              meta: JSON.parse(JSON.stringify(s.meta)),
              scenarios: JSON.parse(JSON.stringify(s.scenarios)),
            },
          }
          s.snapshots.push(snapshot)
          if (s.snapshots.length > 20) {
            s.snapshots = s.snapshots.slice(-20)
          }
        })),

      restoreSnapshot: (snapshotId) => {
        const s = get()
        const snapshot = s.snapshots.find((sn) => sn.id === snapshotId)
        if (snapshot) {
          set({
            context: JSON.parse(JSON.stringify(snapshot.state.context)),
            items: JSON.parse(JSON.stringify(snapshot.state.items)),
            pricing: JSON.parse(JSON.stringify(snapshot.state.pricing)),
            presentation: JSON.parse(JSON.stringify(snapshot.state.presentation)),
            meta: JSON.parse(JSON.stringify(snapshot.state.meta)),
            scenarios: JSON.parse(JSON.stringify(snapshot.state.scenarios ?? { enabled: false, activeScenarioId: null, list: [] })),
            costOverrides: {},
          } as Partial<ProjectStore>)
        }
      },

      removeSnapshot: (snapshotId) =>
        set(produce((s: ProjectStore) => {
          s.snapshots = s.snapshots.filter((sn) => sn.id !== snapshotId)
        })),

      // === Сценарии ===
      enableScenarios: () =>
        set(produce((s: ProjectStore) => {
          if (s.scenarios.enabled) return
          const mainScenario: Scenario = {
            id: generateId(),
            name: 'Основной',
            description: '',
            createdAt: new Date().toISOString(),
            items: JSON.parse(JSON.stringify(s.items)),
            pricingOverrides: {},
          }
          s.scenarios = {
            enabled: true,
            activeScenarioId: mainScenario.id,
            list: [mainScenario],
          }
        })),

      disableScenarios: () =>
        set(produce((s: ProjectStore) => {
          if (!s.scenarios.enabled) return
          // Keep items from active scenario
          const active = s.scenarios.list.find((sc) => sc.id === s.scenarios.activeScenarioId)
          if (active) {
            s.items = active.items
          }
          s.scenarios = { enabled: false, activeScenarioId: null, list: [] }
        })),

      addScenario: (name, copyItems) =>
        set(produce((s: ProjectStore) => {
          if (!s.scenarios.enabled || s.scenarios.list.length >= 5) return
          // Save current items to active scenario first
          const active = s.scenarios.list.find((sc) => sc.id === s.scenarios.activeScenarioId)
          if (active) {
            active.items = JSON.parse(JSON.stringify(s.items))
          }
          const newScenario: Scenario = {
            id: generateId(),
            name,
            description: '',
            createdAt: new Date().toISOString(),
            items: copyItems ? JSON.parse(JSON.stringify(s.items)) : [],
            pricingOverrides: {},
          }
          s.scenarios.list.push(newScenario)
          s.scenarios.activeScenarioId = newScenario.id
          s.items = newScenario.items
          touchMeta(s)
        })),

      switchScenario: (scenarioId) =>
        set(produce((s: ProjectStore) => {
          if (!s.scenarios.enabled || scenarioId === s.scenarios.activeScenarioId) return
          // Save current items to active scenario
          const active = s.scenarios.list.find((sc) => sc.id === s.scenarios.activeScenarioId)
          if (active) {
            active.items = JSON.parse(JSON.stringify(s.items))
          }
          // Load target scenario items
          const target = s.scenarios.list.find((sc) => sc.id === scenarioId)
          if (target) {
            s.items = JSON.parse(JSON.stringify(target.items))
            s.scenarios.activeScenarioId = scenarioId
          }
          touchMeta(s)
        })),

      removeScenario: (scenarioId) =>
        set(produce((s: ProjectStore) => {
          if (!s.scenarios.enabled || s.scenarios.list.length <= 1) return
          s.scenarios.list = s.scenarios.list.filter((sc) => sc.id !== scenarioId)
          if (s.scenarios.activeScenarioId === scenarioId) {
            const first = s.scenarios.list[0]!
            s.scenarios.activeScenarioId = first.id
            s.items = JSON.parse(JSON.stringify(first.items))
          }
          touchMeta(s)
        })),

      renameScenario: (scenarioId, name) =>
        set(produce((s: ProjectStore) => {
          const sc = s.scenarios.list.find((x) => x.id === scenarioId)
          if (sc) sc.name = name
        })),

      // === Computed ===
      getGrandTotal: () => {
        const s = get()
        return calcGrandTotal({
          items: s.items,
          hourlyRate: s.pricing.hourlyRate,
          contextMultiplier: s.context.contextMultiplier,
          costOverrides: s.costOverrides,
          revisionPercent: s.pricing.revisionPercent,
          discount: s.pricing.discount,
          tax: s.pricing.tax,
          volumeDiscounts: s.pricing.volumeDiscounts,
          additionalAdjustments: s.pricing.additionalAdjustments,
        })
      },

      getContextMultiplier: () => {
        const s = get()
        return calcContextMultiplier(s.context)
      },
    }
  },
  {
    limit: 30,
    partialize: (state) => ({
      items: state.items,
      context: state.context,
      pricing: state.pricing,
      presentation: state.presentation,
      costOverrides: state.costOverrides,
    }),
  },
  ),
)
