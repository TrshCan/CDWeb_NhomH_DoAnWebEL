// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Feed from './components/Feed';
import Register from './pages/Register';
import Search from './components/SearchResult';
import MainLayout from './layouts/MainLayout';
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
         <Route path="/" element={<MainLayout />}>
          {/* 👇 These are children rendered inside <Outlet /> */}
          <Route index element={<Feed />} />           {/* / */}
          <Route path="explore" element={<Search />} />
        </Route>
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </BrowserRouter>
  );
}