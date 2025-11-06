import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { getUserProfile } from "../api/graphql/user";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showSurveysDropdown, setShowSurveysDropdown] = useState(false);
  const surveysDropdownRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        surveysDropdownRef.current &&
        !surveysDropdownRef.current.contains(event.target)
      ) {
        setShowSurveysDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
      label: "Profile",
      icon: "M12 12a5 5 0 100-10 5 5 0 000 10zm-7 8a7 7 0 0114 0H5z",
      path: "/profile",
      requiresAuth: true,
    },
  ];

  // Filter links based on auth
  const visibleLinks = allLinks.filter(
    (link) => !link.requiresAuth || isLoggedIn
  );

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

    // Handle Surveys dropdown
    if (isSurveys && isLoggedIn) {
      e.preventDefault();
      setShowSurveysDropdown(!showSurveysDropdown);
      return;
    }

    navigate(path);
  };

  // Handle survey dropdown option click
  const handleSurveyOptionClick = (path) => {
    setShowSurveysDropdown(false);
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
      <Toaster position="top-center" reverseOrder={false} />

      <aside className="w-16 lg:w-1/4 bg-white rounded-r-lg shadow p-4 flex flex-col space-y-2 sticky top-0 h-screen overflow-y-auto custom-scrollbar">
        <nav className="flex flex-col space-y-2 flex-grow">
          {visibleLinks.map((item, index) => {
            // Special handling for Surveys dropdown
            if (item.label === "Surveys" && isLoggedIn) {
              const isLecturerOrAdmin =
                userRole === "lecturer" || userRole === "admin";

              return (
                <div key={index} ref={surveysDropdownRef} className="relative">
                  <button
                    onClick={(e) =>
                      handleLinkClick(e, item.path, item.requiresAuth, true)
                    }
                    className="w-full flex items-center space-x-2 text-cyan-600 hover:bg-cyan-50 p-2 rounded-lg cursor-pointer transition-all duration-150"
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
                      />
                    </svg>
                    <span className="hidden lg:inline flex-1 text-left">
                      {item.label}
                    </span>
                    <svg
                      className={`w-4 h-4 hidden lg:block transition-transform ${
                        showSurveysDropdown ? "rotate-180" : ""
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

                  {/* Dropdown Menu */}
                  {showSurveysDropdown && (
                    <div className="absolute left-0 mt-1 w-full lg:w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        {isLecturerOrAdmin && (
                          <button
                            onClick={() =>
                              handleSurveyOptionClick("/surveys/made")
                            }
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
                          >
                            Surveys I Made
                          </button>
                        )}
                        <button
                          onClick={() => handleSurveyOptionClick("/surveys/did")}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
                        >
                          Surveys I Did
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Regular link
            return (
              <Link
                key={index}
                to={item.path}
                onClick={(e) =>
                  handleLinkClick(e, item.path, item.requiresAuth)
                }
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
                  />
                </svg>
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Auth Section */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          {!isLoggedIn ? (
            <Link
              to="/login"
              className="w-full flex items-center justify-center text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg p-2 transition-all duration-150"
            >
              <span className="hidden lg:inline font-medium">Login</span>
              <svg
                className="w-5 h-5 lg:ml-2"
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
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center text-white bg-rose-600 hover:bg-rose-700 rounded-lg p-2 transition-all duration-150"
            >
              <span className="hidden lg:inline font-medium">Logout</span>
              <svg
                className="w-5 h-5 lg:ml-2"
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
            </button>
          )}
        </div>
      </aside>
    </>
  );
}