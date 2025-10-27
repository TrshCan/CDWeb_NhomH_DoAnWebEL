import React from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function Sidebar() {
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("token");

  const links = [
    {
      label: "Home",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      path: "/",
    },
    {
      label: "Explore",
      icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
      path: "/explore",
    },
    {
      label: "Notifications",
      icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
      path: "/notifications",
    },
    {
      label: "Surveys",
      icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      path: "/surveys",
      requiresAuth: true,
    },
    {
      label: "Profile",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      path: "/profile",
      requiresAuth: true,
    },
  ];

  const handleLinkClick = (path, requiresAuth) => {
    if (requiresAuth && !isLoggedIn) {
      toast.error("Bruh, you gotta log in first 😭", {
        style: {
          background: "#1e293b",
          color: "#fff",
          borderRadius: "8px",
        },
        icon: "🔒",
      });
      return;
    }
    navigate(path);
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <aside className="w-16 lg:w-1/4 bg-white rounded-r-lg shadow p-4 flex flex-col space-y-2 sticky top-0 h-screen overflow-y-auto custom-scrollbar">
        <nav className="flex flex-col space-y-2">
          {links.map((item, index) => (
            <button
              key={index}
              onClick={() => handleLinkClick(item.path, item.requiresAuth)}
              className="flex items-center space-x-2 text-cyan-600 hover:bg-cyan-50 p-2 rounded-lg cursor-pointer transition-all duration-150"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={item.icon}
                ></path>
              </svg>
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
