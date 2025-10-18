import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SurveyFilter from './pages/SurveyFilter.jsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <App /> */}
    <SurveyFilter />
  </StrictMode>,
)
