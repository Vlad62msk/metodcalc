import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Force-initialize persisted stores before first render
// to avoid React 19 useSyncExternalStore tearing during persist rehydration
import { useLibraryStore } from './store/useLibraryStore'
import { useSettingsStore } from './store/useSettingsStore'
useLibraryStore.getState()
useSettingsStore.getState()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
