import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyStoredAppearance } from './lib/theme'

// Dernière apparence connue, appliquée avant le premier affichage (pas de flash).
applyStoredAppearance()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
