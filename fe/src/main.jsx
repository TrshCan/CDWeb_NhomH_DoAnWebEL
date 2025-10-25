import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import CreateSurveyQuestion from './pages/CreateSurveyQuestion.jsx' 
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <App /> */}
    <CreateSurveyQuestion />
  </StrictMode>,
)
