import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Police Source Sans 3 (licence OFL), servie avec l'application : aucun appel extérieur.
import '@fontsource-variable/source-sans-3'
import './styles/tokens.css'
import './styles/base.css'

import App from './App.tsx'
import { applyStoredAppearance } from './lib/theme'

// Dernière apparence connue, appliquée avant le premier affichage (pas de flash).
applyStoredAppearance()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
