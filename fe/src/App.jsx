// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login.jsx";
import MainLayout from "./layouts/MainLayout";
import Feed from "./components/Feed";
import Group from "./components/Group";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Nested pages render inside <Outlet /> */}
        <Route index element={<Feed />} />
        <Route path="group" element={<Group />} />
        {/* Add more */}
      </Route>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}
