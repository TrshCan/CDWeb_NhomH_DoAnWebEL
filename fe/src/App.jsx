// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import Register from './pages/Register';
import Login from './pages/Login.jsx';

export default function App() {
  return (

      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
      </Routes>

  );
}