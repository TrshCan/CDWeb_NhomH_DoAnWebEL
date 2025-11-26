import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { getUserProfile } from "../api/graphql/user";
import JoinSurveyModal from "./JoinSurveyModal";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showSurveysExpanded, setShowSurveysExpanded] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Check login status based on token
  const checkLoginStatus = async () => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    // Fetch user role if logged in
    if (token) {
      const userId = localStorage.getItem("userId");
      if (userId) {
        try {
          const userProfile = await getUserProfile(parseInt(userId));
          setUserRole(userProfile?.role || null);
        } catch (error) {
          console.error("Failed to fetch user role:", error);
          setUserRole(null);
        }
      }
    } else {
      setUserRole(null);
    }
  };

  useEffect(() => {
    checkLoginStatus(); // Initial check

    // Listen for changes in localStorage (cross-tab)
    const handleStorageChange = () => checkLoginStatus();
    window.addEventListener("storage", handleStorageChange);

    // Listen for same-tab login/logout via custom event
    const handleTokenChange = () => checkLoginStatus();
    window.addEventListener("tokenChanged", handleTokenChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("tokenChanged", handleTokenChange);
    };
  }, [location]); // Re-check when route changes (optional but safe)

  // Auto-expand Surveys if on a surveys route or statemanagement
  useEffect(() => {
    if (location.pathname.startsWith("/surveys") || location.pathname === "/statemanagement") {
      setShowSurveysExpanded(true);
    }
  }, [location]);

  // Sidebar links
  const allLinks = [
    {
      label: "Home",
      icon: "M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z",
      path: "/",
    },
    {
      label: "Groups",
      icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6 5.87v-2a4 4 0 00-3-3.87m6 0A4 4 0 0112 9a4 4 0 013 3.13m6 0A4 4 0 0015 9m0 0a4 4 0 00-3 3.13",
      path: "/group",
      requiresAuth: true,
    },
    {
      label: "Explore",
      icon: "M12 2a10 10 0 100 20 10 10 0 000-20zm4 5l-5 2-2 5 5-2 2-5z",
      path: "/explore",
    },
    {
      label: "Surveys",
      icon: "M9 17v-2h6v2H9zm-4 4h14a1 1 0 001-1V4a1 1 0 00-1-1H5a1 1 0 00-1 1v16a1 1 0 001 1zM7 7h10v2H7V7z",
      path: "/surveys",
      requiresAuth: true,
    },
    {
      label: "Admin Dashboard",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      path: "/admin/dashboard",
      requiresAuth: true,
      requiresAdmin: true,
    },
    {
      label: "Profile",
      icon: "M12 12a5 5 0 100-10 5 5 0 000 10zm-7 8a7 7 0 0114 0H5z",
      path: "/profile",
      requiresAuth: true,
    },
  ];

  // Filter links based on auth and role
  const visibleLinks = allLinks.filter((link) => {
    if (link.requiresAuth && !isLoggedIn) return false;
    if (link.requiresAdmin && userRole !== "admin") return false;
    return true;
  });

  // Handle navigation with auth check
  const handleLinkClick = (e, path, requiresAuth, isSurveys = false) => {
    if (requiresAuth && !isLoggedIn) {
      e.preventDefault();
      toast.error("Bruh, you gotta log in first", {
        style: {
          background: "#1e293b",
          color: "#fff",
          borderRadius: "8px",
        },
        icon: "Locked",
      });
      return;
    }

    // Handle Surveys expand/collapse
    if (isSurveys && isLoggedIn) {
      e.preventDefault();
      setShowSurveysExpanded(!showSurveysExpanded);
      return;
    }

    navigate(path);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    setIsLoggedIn(false);

    // Trigger update across tabs
    window.dispatchEvent(new Event("tokenChanged"));

    toast.success("Logged out successfully", {
      style: {
        background: "#1e293b",
        color: "#fff",
        borderRadius: "8px",
      },
    });

    navigate("/");
  };

  return (
    <>
      <aside className="w-16 md:w-20 lg:w-64 bg-white rounded-r-lg shadow p-3 lg:p-4 flex flex-col space-y-2 sticky top-0 h-screen overflow-y-auto custom-scrollbar">
        <nav className="flex flex-col space-y-2 flex-grow">
          {visibleLinks.map((item, index) => {
            // Special handling for Surveys expandable section
            if (item.label === "Surveys" && isLoggedIn) {
              const isLecturerOrAdmin =
                userRole === "lecturer" || userRole === "admin";
              const isActiveSurveysRoute = location.pathname.startsWith("/surveys");

              return (
                <div key={index} className="flex flex-col">
                  <button
                    onClick={(e) =>
                      handleLinkClick(e, item.path, item.requiresAuth, true)
                    }
                    className={`w-full flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-all duration-150 ${
                      isActiveSurveysRoute
                        ? "bg-cyan-100 text-cyan-700"
                        : "text-cyan-600 hover:bg-cyan-50"
                    }`}
                  >
                    <svg
                      className="w-5 h-5 flex-shrink-0"
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
                      />
                    </svg>
                    <span className="hidden lg:inline flex-1 text-left text-sm">
                      {item.label}
                    </span>
                    <svg
                      className={`w-4 h-4 hidden lg:block transition-transform duration-200 flex-shrink-0 ${
                        showSurveysExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Expanded Sub-items */}
                  {showSurveysExpanded && (
                    <div className="hidden lg:flex flex-col space-y-1 mt-1 ml-4 border-l-2 border-cyan-200 pl-2">
                      {isLecturerOrAdmin && (
                        <Link
                          to="/surveys/created"
                          onClick={() => setShowSurveysExpanded(true)}
                          className={`flex items-center space-x-2 p-1.5 rounded-lg transition-all duration-150 ${
                            location.pathname === "/surveys/created"
                              ? "bg-cyan-100 text-cyan-700 font-medium"
                              : "text-gray-600 hover:bg-cyan-50 hover:text-cyan-600"
                          }`}
                        >
                          <svg
                            className="w-4 h-4 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="text-xs">Surveys I Made</span>
                        </Link>
                      )}
                      <Link
                        to="/surveys/completed"
                        onClick={() => setShowSurveysExpanded(true)}
                        className={`flex items-center space-x-2 p-1.5 rounded-lg transition-all duration-150 ${
                          location.pathname === "/surveys/did"
                            ? "bg-cyan-100 text-cyan-700 font-medium"
                            : "text-gray-600 hover:bg-cyan-50 hover:text-cyan-600"
                        }`}
                      >
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                          />
                        </svg>
                        <span className="text-xs">Surveys I Did</span>
                      </Link>
                      <button
                        onClick={() => setShowJoinModal(true)}
                        className="flex items-center space-x-2 p-1.5 rounded-lg transition-all duration-150 text-gray-600 hover:bg-cyan-50 hover:text-cyan-600 w-full text-left cursor-pointer"
                      >
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        <span className="text-xs">Join Survey</span>
                      </button>
                      {isLecturerOrAdmin && (
                        <Link
                          to="/statemanagement"
                          onClick={() => setShowSurveysExpanded(true)}
                          className={`flex items-center space-x-2 p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                            location.pathname === "/statemanagement"
                              ? "bg-cyan-100 text-cyan-700 font-medium"
                              : "text-gray-600 hover:bg-cyan-50 hover:text-cyan-600"
                          }`}
                        >
                          <svg
                            className="w-4 h-4 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                            />
                          </svg>
                          <span className="text-xs">Survey Status</span>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // Regular link
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={index}
                to={item.path}
                onClick={(e) =>
                  handleLinkClick(e, item.path, item.requiresAuth)
                }
                className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-all duration-150 ${
                  isActive
                    ? "bg-cyan-100 text-cyan-700"
                    : "text-cyan-600 hover:bg-cyan-50"
                }`}
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
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
                  />
                </svg>
                <span className="hidden lg:inline text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Auth Section */}
        <div className="mt-auto pt-3 border-t border-gray-200">
          {!isLoggedIn ? (
            <Link
              to="/login"
              className="w-full flex items-center justify-center lg:justify-start lg:space-x-2 text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg p-2 transition-all duration-150"
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12H3m12 0l-4 4m4-4l-4-4m6 8V4a1 1 0 011-1h3a1 1 0 011 1v16a1 1 0 01-1 1h-3a1 1 0 01-1-1z"
                />
              </svg>
              <span className="hidden lg:inline font-medium text-sm">Login</span>
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center lg:justify-start lg:space-x-2 text-white bg-rose-600 hover:bg-rose-700 rounded-lg p-2 transition-all duration-150"
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h12m0 0l-4-4m4 4l-4 4M5 20h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="hidden lg:inline font-medium text-sm">Logout</span>
            </button>
          )}
        </div>
      </aside>

      <JoinSurveyModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </>
  );
}