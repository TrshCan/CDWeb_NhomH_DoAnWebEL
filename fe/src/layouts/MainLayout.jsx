// src/layouts/MainLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import WidgetSidebar from "../components/WidgetSidebar";

export default function MainLayout() {
  return (
    <div className="font-sans">
      <div className="flex min-h-screen">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Wrapper */}
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          {/* 🔥 This is where pages render */}
          <Outlet />

          {/* Right Sidebar */}
          <WidgetSidebar />
        </div>
      </div>
    </div>
  );
}
