import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createInitialManager } from './utils/setupManager.ts'

// Make setup function available globally for initial manager creation
(window as any).createInitialManager = createInitialManager;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)