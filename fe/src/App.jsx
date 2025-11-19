// src/App.jsx
import { Routes, Route } from "react-router-dom";
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
import ProtectedRoute from "./components/ProtectedRoute.jsx";

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
      {/* Protected survey pages */}
      <Route path="/surveys/completed" element={
        <ProtectedRoute>
          <SurveysCompleted />
        </ProtectedRoute>
      } />
      
      <Route path="/surveys/created" element={
        <ProtectedRoute>
          <SurveysCreated />
        </ProtectedRoute>
      } />
      
      <Route path="/surveys/:surveyId/join" element={<SurveyJoin />} />
      
      <Route path="/surveys/:surveyId/overview" element={
        <ProtectedRoute>
          <SurveyOverview />
        </ProtectedRoute>
      } />
      
      <Route path="/surveys/:surveyId/raw-data" element={
        <ProtectedRoute>
          <RawDataList />
        </ProtectedRoute>
      } />
      
      <Route path="/surveys/:surveyId/responses/:responseId" element={
        <ProtectedRoute>
          <ResponseDetail />
        </ProtectedRoute>
      } />
      
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}
