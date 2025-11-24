// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login.jsx";
import Feed from "./components/Feed.jsx";
import Profile from "./pages/Profile.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import PostDetail from "./pages/PostDetail.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import EmailVerificationResult from "./pages/EmailVerificationResult.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import Survey from "./pages/SurveyFilter.jsx";
import StateManagement from "./pages/StatusManagement.jsx";
import Tab1 from "./pages/admin/StatusManagementAdmin.jsx";
import Tab2 from "./pages/admin/Tab2.jsx";
import Tab3 from "./pages/admin/Event.jsx";
import Tab4 from "./pages/admin/Deadline.jsx";
import Tab5 from "./pages/admin/SurveysAdmin.jsx";
import Tab6 from "./pages/admin/Tab6.jsx";
import PermissionManagement from "./pages/admin/PermissionManagement.jsx";
import AdminUserManagement from "./pages/admin/AdminUserManagement.jsx";
import AdminBadgeManagement from "./pages/admin/AdminBadgeManagement.jsx";
import SurveysCreated from "./pages/SurveysCreated.jsx";
import RawDataList from "./pages/RawDataList.jsx";
import SurveyOverview from "./pages/SurveyOverview.jsx";
import ResponseDetail from "./pages/ResponseDetail.jsx";
import SurveysCompleted from "./pages/SurveysCompleted.jsx";
import SurveyJoin from "./pages/SurveyJoin.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Search from "./components/SearchResult";
import Group from "./components/Group";
import GroupDetail from "./components/GroupDetail";

export default function App() {
  return (
    <Routes>
      {/* Layout chính */}
      <Route path="/" element={<MainLayout />}>
        <Route path="group" element={<Group />} />
        <Route path="group/:groupId" element={<GroupDetail />} />
        <Route path="explore" element={<Search />} />
        <Route path="search" element={<Search />} />
        {/* các route con  */}
        <Route index element={<Feed />} /> {/* mặc định là Feed */}
        <Route path="profile" element={<Profile />} />
        <Route path="edit-profile" element={<UserManagement />} />
        <Route path="post/:id" element={<PostDetail />} />
        {/* sau này sẽ thêm các route như profile expole v.v*/}
      </Route>

      {/* Protected survey pages */}
      <Route
        path="/surveys/completed"
        element={
          <ProtectedRoute>
            <SurveysCompleted />
          </ProtectedRoute>
        }
      />

      <Route
        path="/surveys/created"
        element={
          <ProtectedRoute>
            <SurveysCreated />
          </ProtectedRoute>
        }
      />
      <Route
        path="/surveys/all"
        element={<ProtectedRoute>{<Survey />}</ProtectedRoute>}
      />
      <Route path="/surveys" element={<Survey />} />
      <Route path="/surveys/:surveyId/join" element={<SurveyJoin />} />

      <Route
        path="/surveys/:surveyId/overview"
        element={
          <ProtectedRoute>
            <SurveyOverview />
          </ProtectedRoute>
        }
      />

      <Route
        path="/surveys/:surveyId/raw-data"
        element={
          <ProtectedRoute>
            <RawDataList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/surveys/:surveyId/responses/:responseId"
        element={
          <ProtectedRoute>
            <ResponseDetail />
          </ProtectedRoute>
        }
      />

      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/email-verified" element={<EmailVerificationResult />} />

      <Route path="/statemanagement" element={<StateManagement />} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<AdminUserManagement />} />
      <Route path="/admin/badges" element={<AdminBadgeManagement />} />
      <Route path="/admin/tab1" element={<Tab1 />} />
      <Route path="/admin/tab2" element={<Tab2 />} />
      <Route path="/admin/tab3" element={<Tab3 />} />
      <Route path="/admin/tab4" element={<Tab4 />} />
      <Route path="/admin/tab5" element={<Tab5 />} />
      <Route path="/admin/tab6" element={<Tab6 />} />
      <Route path="/admin/permissions" element={<PermissionManagement />} />
    </Routes>
  );
}
