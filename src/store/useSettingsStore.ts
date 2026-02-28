import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSettings } from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/core/defaults'

interface SettingsStore extends UserSettings {
  updateSettings: (changes: Partial<UserSettings>) => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      updateSettings: (changes) =>
        set((s) => ({ ...s, ...changes })),

      resetSettings: () =>
        set(() => ({ ...DEFAULT_SETTINGS }) as SettingsStore),
    }),
    {
      name: 'metod-calc-settings',
      partialize: (state) => {
        const { updateSettings, resetSettings, ...data } = state
        return data
      },
    },
  ),
)
