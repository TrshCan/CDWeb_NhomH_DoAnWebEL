// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
import Register from "./pages/Register";
import Login from "./pages/Login.jsx";
import Feed from "./components/Feed.jsx";
import Profile from "./pages/Profile.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import SurveysCreated from "./pages/SurveysCreated.jsx";
import RawDataList from "./pages/RawDataList.jsx";
import SurveyOverview from "./pages/SurveyOverview.jsx";
import ResponseDetail from "./pages/ResponseDetail.jsx";
import SurveysCompleted from "./pages/SurveysCompleted.jsx";
import SurveyJoin from "./pages/SurveyJoin.jsx";

export default function App() {
  return (
    <Routes>
      {/* Layout chính */}
      <Route path="/" element={<MainLayout />}>
        {/* các route con  */}
        <Route index element={<Feed />} /> {/* mặc định là Feed */}
        <Route path="profile" element={<Profile />} />
        {/* sau này sẽ thêm các route như profile expole v.v*/}
      </Route>
      {/* Independent pages outside MainLayout */}
      <Route path="/surveys/completed" element={<SurveysCompleted />} />
      
      {/* Independent pages outside MainLayout */}
      <Route path="/surveys/created" element={<SurveysCreated />} />
      <Route path="/surveys/:surveyId/join" element={<SurveyJoin />} />
      <Route path="/surveys/:surveyId/overview" element={<SurveyOverview />} />
      <Route path="/surveys/:surveyId/raw-data" element={<RawDataList />} />
      <Route path="/surveys/:surveyId/responses/:responseId" element={<ResponseDetail />} />
      
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}
