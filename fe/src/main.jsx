import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SurveySearch from './pages/SurveySearch.jsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <App /> */}
    <SurveySearch />
  </StrictMode>,
)
