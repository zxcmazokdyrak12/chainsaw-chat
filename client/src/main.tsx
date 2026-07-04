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