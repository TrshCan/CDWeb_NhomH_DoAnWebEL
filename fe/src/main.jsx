import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import DuplicateSurvey from './pages/DuplicateSurvey.jsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <App /> */}
    <DuplicateSurvey />
  </StrictMode>,
)
