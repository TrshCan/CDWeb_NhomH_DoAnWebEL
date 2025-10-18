import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Register from './pages/Register.jsx'
import Event from './pages/Event.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>

    <Event />
    
  </StrictMode>,
)
