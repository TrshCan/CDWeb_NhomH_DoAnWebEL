import { useState } from 'react'
import reactLogo from './assets/react.svg'
import React from "react";
import viteLogo from '/vite.svg'
import './App.css'
import {useNavigate} from 'react-router-dom';

function App() {
  const [count, setCount] = useState(0)
const navigate =useNavigate()
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
          <button onClick={()=>navigate('/login')} >Đăng nhập</button>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <h1 className='text-3xl font-bold text-red-900'>Nguyên đẹp trai</h1>
        <h2 className='bg-blue-300'>Con cawcj</h2>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
