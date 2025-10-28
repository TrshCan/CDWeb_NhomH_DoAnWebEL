import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Kiểm tra xem có token trong localStorage không
    const checkLoginStatus = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    };

    // Kiểm tra khi component mount và khi location thay đổi
    checkLoginStatus();

    // Lắng nghe sự kiện storage thay đổi (khi đăng nhập/đăng xuất ở tab khác)
    const handleStorageChange = () => {
      checkLoginStatus();
    };

    window.addEventListener("storage", handleStorageChange);

    // Tạo custom event để cập nhật khi login trong cùng tab
    const handleLoginChange = () => {
      checkLoginStatus();
    };

    window.addEventListener("tokenChanged", handleLoginChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("tokenChanged", handleLoginChange);
    };
  }, [location]);

  const allLinks = [
    { label: "Home", path: "/", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { label: "Explore", path: "/explore", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
    { label: "Notifications", path: "/notifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
    { label: "Surveys", path: "/surveys", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
    {
      label: "Profile",
      path: "/profile",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      requiresAuth: true
    },
  ];

  // Lọc các link dựa trên trạng thái đăng nhập
  const links = allLinks.filter(link => !link.requiresAuth || isLoggedIn);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    // Dispatch event để cập nhật state
    window.dispatchEvent(new Event("tokenChanged"));
    navigate("/login");
  };

  return (
    <aside className="w-16 lg:w-1/4 bg-white rounded-r-lg shadow p-4 flex flex-col space-y-2 sticky top-0 h-screen overflow-y-auto custom-scrollbar">
      <nav className="flex flex-col space-y-2">
        {links.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className="flex items-center space-x-2 text-cyan-600 hover:bg-cyan-50 p-2 rounded-lg"
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
          </Link>
        ))}

        {/* Nút Đăng nhập hoặc Đăng xuất */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          {!isLoggedIn ? (
            <Link
              to="/login"
              className="flex items-center space-x-2 text-white bg-indigo-600 hover:bg-indigo-700 p-2 rounded-lg justify-center transition-colors"
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
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                ></path>
              </svg>
              <span className="hidden lg:inline font-medium">Đăng nhập</span>
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 text-white hover:text-red-600 cursor-pointer transition-colors"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                ></path>
              </svg>
              <span className="hidden lg:inline font-medium">Đăng Xuất</span>
            </button>
          )}
        </div>
      </nav>
    </aside>
  );
}