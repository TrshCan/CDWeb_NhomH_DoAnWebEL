import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// 1. ĐỔI TÊN KHI IMPORT: "c" thành "C"
import CreateSurveyQuestion from './pages/CreateSurveyQuestion.jsx' 
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <App /> */}
    {/* 2. ĐỔI TÊN KHI RENDER: "c" thành "C" */}
    <CreateSurveyQuestion />
  </StrictMode>,
)
