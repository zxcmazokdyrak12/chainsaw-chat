import './fonts.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App' 
import './index.css'

const rootElement = document.getElementById('root')

// TypeScript guard to ensure 'root' element exists in DOM
if (!rootElement) {
  throw new Error('Failed to find the root element. Chainsaw engine halted! ⛓️')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// installable app + push notifications (production only: the dev server would fight the cache)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}) })
}
