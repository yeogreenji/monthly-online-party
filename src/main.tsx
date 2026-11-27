import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import OnlineMeetingPreview from './components/OnlineMeetingPreview'
import './polish.css'
import './world-ui.css'
import './console.css'
import './craft.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <OnlineMeetingPreview />
  </StrictMode>,
)
