// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
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
import AdminUserManagement from "./pages/admin/AdminUserManagement.jsx";
import Tab1 from "./pages/admin/Tab1.jsx";
import Tab2 from "./pages/admin/Tab2.jsx";
import Tab3 from "./pages/admin/Tab3.jsx";
import Tab4 from "./pages/admin/Tab4.jsx";
import Tab5 from "./pages/admin/Tab5.jsx";
import Tab6 from "./pages/admin/Tab6.jsx";
import PermissionManagement from "./pages/admin/PermissionManagement.jsx";

export default function App() {
  return (
    <Routes>
      {/* Layout chính */}
      <Route path="/" element={<MainLayout />}>
        {/* các route con  */}
        <Route index element={<Feed />} /> {/* mặc định là Feed */}
        <Route path="profile" element={<Profile />} />
        <Route path="edit-profile" element={<UserManagement />} />
        <Route path="post/:id" element={<PostDetail />} />
        {/* sau này sẽ thêm các route như profile expole v.v*/}
      </Route>

      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/email-verified" element={<EmailVerificationResult />} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<AdminUserManagement />} />
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
