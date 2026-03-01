import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSettings } from '@/types/settings'
import type { PresentationPreset } from '@/core/presentationPresets'
import { DEFAULT_SETTINGS } from '@/core/defaults'

interface SettingsStore extends UserSettings {
  updateSettings: (changes: Partial<UserSettings>) => void
  resetSettings: () => void
  addPreset: (preset: PresentationPreset) => boolean
  removePreset: (id: string) => void
}

const MAX_CUSTOM_PRESETS = 5

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      updateSettings: (changes) =>
        set((s) => ({ ...s, ...changes })),

      resetSettings: () =>
        set(() => ({ ...DEFAULT_SETTINGS }) as SettingsStore),

      addPreset: (preset) => {
        const current = get().customPresets
        if (current.length >= MAX_CUSTOM_PRESETS) return false
        set({ customPresets: [...current, preset] })
        return true
      },

      removePreset: (id) => {
        set((s) => ({
          customPresets: s.customPresets.filter((p) => p.id !== id),
        }))
      },
    }),
    {
      name: 'metod-calc-settings',
      partialize: (state) => {
        const { updateSettings, resetSettings, addPreset, removePreset, ...data } = state
        return data
      },
    },
  ),
)
