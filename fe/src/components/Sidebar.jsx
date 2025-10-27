import React from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function Sidebar() {
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("token");

  const links = [
    {
      label: "Home",
      icon: "M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z", // house icon
      path: "/",
    },
    {
      label: "Groups",
      icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6 5.87v-2a4 4 0 00-3-3.87m6 0A4 4 0 0112 9a4 4 0 013 3.13m6 0A4 4 0 0015 9m0 0a4 4 0 00-3 3.13", // multiple users icon
      path: "/groups",
    },
    {
      label: "Explore",
      icon: "M12 2a10 10 0 100 20 10 10 0 000-20zm4 5l-5 2-2 5 5-2 2-5z", // compass icon
      path: "/explore",
    },
    {
      label: "Surveys",
      icon: "M9 17v-2h6v2H9zm-4 4h14a1 1 0 001-1V4a1 1 0 00-1-1H5a1 1 0 00-1 1v16a1 1 0 001 1zM7 7h10v2H7V7z", // clipboard/survey form
      path: "/surveys",
      requiresAuth: true,
    },
    {
      label: "Profile",
      icon: "M12 12a5 5 0 100-10 5 5 0 000 10zm-7 8a7 7 0 0114 0H5z", // user icon
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
