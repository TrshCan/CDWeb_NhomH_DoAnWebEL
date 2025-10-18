import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ForgotPWD from './pages/ForgotPassword.jsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <App /> */}
    <ForgotPWD />
  </StrictMode>,
)
