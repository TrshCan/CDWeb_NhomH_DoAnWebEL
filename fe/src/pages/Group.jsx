import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import WidgetSidebar from "../components/WidgetSidebar";
import Group from "../components/Group";
import "../assets/css/group-page.css";

export default function GroupPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check authentication
    const checkAuthentication = () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        toast.error("Please log in to access this page");
        navigate("/login", { replace: true });
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      setIsAuthenticated(true);
      setIsChecking(false);
    };

    checkAuthentication();
  }, [navigate]);

  useEffect(() => {
    // Add "group-page" class to body to override global background
    document.body.classList.add("group-page");

    // Cleanup on unmount
    return () => {
      document.body.classList.remove("group-page");
    };
  }, []);

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="font-sans">
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="font-sans">
      <div className="flex min-h-screen">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Wrapper */}
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Group */}
          <Group />

          {/* Right Sidebar */}
          <WidgetSidebar />
        </div>
      </div>
    </div>
  );
}
