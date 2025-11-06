// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
import Register from "./pages/Register";
import Login from "./pages/Login.jsx";
import Feed from "./components/Feed.jsx";
import Profile from "./pages/Profile.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import SurveysMade from "./pages/SurveysMade.jsx";
import SurveysDid from "./pages/SurveysDid.jsx";

export default function App() {
  return (
    <Routes>
      {/* Layout chính */}
      <Route path="/" element={<MainLayout />}>
        {/* các route con  */}
        <Route index element={<Feed />} /> {/* mặc định là Feed */}
        <Route path="profile" element={<Profile />} />
        <Route path="surveys/made" element={<SurveysMade />} />
        <Route path="surveys/did" element={<SurveysDid />} />
        {/* sau này sẽ thêm các route như profile expole v.v*/}
      </Route>
      
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}
