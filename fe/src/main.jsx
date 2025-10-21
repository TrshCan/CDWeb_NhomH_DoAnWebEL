import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import UserManagement from './pages/UserManagement.jsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <App /> */}
    <UserManagement />
  </StrictMode>,
)
