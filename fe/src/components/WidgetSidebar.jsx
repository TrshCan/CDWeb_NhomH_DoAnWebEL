import { useEffect, useState } from "react";
import { getTodayEvents, getUpcomingDeadlines } from "../api/graphql/widget";
import "../assets/css/WidgetSidebar.css";
import { useNavigate } from "react-router-dom";

export default function WidgetSidebar() {
  const [events, setEvents] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventsData, deadlinesData] = await Promise.all([
          getTodayEvents(),
          getUpcomingDeadlines(),
        ]);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setDeadlines(Array.isArray(deadlinesData) ? deadlinesData : []);
      } catch (err) {
        console.error("Failed fetching widget data:", err);
        setEvents([]);
        setDeadlines([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    document.body.style.overflow = showModal || isSidebarOpen ? "hidden" : "auto";
  }, [showModal, isSidebarOpen]);

  const getDeadlineColor = (deadlineDate) => {
    const today = new Date();
    const deadline = new Date(deadlineDate);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) return "text-red-500 border-red-400";
    if (diffDays <= 30) return "text-yellow-500 border-yellow-400";
    return "text-cyan-500 border-cyan-400";
  };

  const getDeadlineGradient = (deadlineDate) => {
    const today = new Date();
    const deadline = new Date(deadlineDate);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7)
      return {
        header: "bg-gradient-to-r from-red-500 to-rose-500",
        button:
          "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600",
      };
    if (diffDays <= 30)
      return {
        header: "bg-gradient-to-r from-yellow-500 to-orange-500",
        button:
          "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600",
      };
    return {
      header: "bg-gradient-to-r from-cyan-500 to-blue-500",
      button:
        "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600",
    };
  };

  const truncateText = (text, length) =>
    text.length > length ? text.slice(0, length) + "..." : text;

  const openModal = (item, type) => {
    setSelectedItem(item);
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedItem(null), 200);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`); // ✅ redirect
    setIsSidebarOpen(false); // Close sidebar on mobile after search
  };

  // 🧱 Skeleton Loader
  if (loading) {
    return (
      <>
        {/* Mobile Toggle Button - Fixed to viewport */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden fixed bottom-6 right-6 z-[60] bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-4 rounded-full shadow-2xl hover:shadow-cyan-500/50 hover:scale-110 transition-all duration-300 active:scale-95 animate-pulse-subtle"
          aria-label="Toggle widgets"
          style={{ boxShadow: '0 10px 40px rgba(6, 182, 212, 0.4)' }}
        >
          {isSidebarOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
        </button>

        {/* Backdrop for mobile */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={toggleSidebar}
          />
        )}

        <aside className={`
          fixed lg:static top-0 right-0 h-full lg:h-screen
          w-80 lg:w-1/3 
          bg-white lg:bg-transparent
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          z-[50] lg:z-auto
          overflow-y-auto custom-scrollbar
          space-y-6 p-4
          shadow-2xl lg:shadow-none
        `}>
        {/* Search Skeleton */}
        <div className="bg-white rounded-xl shadow-md p-5 animate-pulse">
          <div className="h-9 bg-gray-200 rounded-full w-full"></div>
        </div>

        {/* Events Skeleton */}
        <div className="bg-white rounded-xl shadow-md p-5 animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 w-1/2 rounded"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-9 w-9 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Deadlines Skeleton */}
        <div className="bg-white rounded-xl shadow-md p-5 animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 w-1/2 rounded"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start space-x-4">
              <div className="h-10 w-10 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Close button for mobile */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-full p-2 transition-all"
          aria-label="Close sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </aside>
      </>
    );
  }

  // ✅ Actual Widget
  return (
    <>
      {/* Mobile Toggle Button - Fixed to viewport */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed bottom-6 right-6 z-[60] bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-4 rounded-full shadow-2xl hover:shadow-cyan-500/50 hover:scale-110 transition-all duration-300 active:scale-95 animate-pulse-subtle"
        aria-label="Toggle widgets"
        style={{ boxShadow: '0 10px 40px rgba(6, 182, 212, 0.4)' }}
      >
        {isSidebarOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
      </button>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[45] transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      <aside className={`
        fixed lg:static top-0 right-0 h-full lg:h-screen
        w-80 lg:w-1/3 
        bg-white lg:bg-transparent
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        z-[50] lg:z-auto
        overflow-y-auto custom-scrollbar
        space-y-6 p-4
        shadow-2xl lg:shadow-none
        lg:sticky lg:top-0
      `}>
      {/* Close button for mobile */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-full p-2 transition-all"
        aria-label="Close sidebar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Search Box */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all"
      >
        <input
          type="text"
          placeholder="Search events, clubs, people..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-100 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"
        />
      </form>

      {/* Events */}
      <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all">
        <div className="flex items-center mb-4">
          <svg
            className="w-6 h-6 text-cyan-600 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-cyan-800">
            Today on Campus 📅
          </h2>
        </div>

        {events.length > 0 ? (
          <ul className="space-y-3">
            {events.map((event) => (
              <li
                key={event.id}
                onClick={() => openModal(event, "event")}
                className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-cyan-50 hover:scale-[1.02] transition-all"
              >
                <div className="flex-shrink-0 bg-cyan-100 text-cyan-700 rounded-full h-9 w-9 flex items-center justify-center text-lg">
                  📍
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {event.title}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(event.event_date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    {event.location ? `• ${event.location}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-sm text-center">No events today</p>
        )}
      </div>

      {/* Deadlines */}
      <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all">
        <div className="flex items-center mb-4">
          <svg
            className="w-6 h-6 text-cyan-600 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-cyan-800">
            Upcoming Deadlines 🎓
          </h2>
        </div>

        {deadlines.length > 0 ? (
          <div className="space-y-4">
            {deadlines.map((d) => (
              <div
                key={d.id}
                onClick={() => openModal(d, "deadline")}
                className="flex items-start cursor-pointer hover:bg-cyan-50 p-2 rounded-lg hover:scale-[1.02] transition-all"
              >
                <div className="text-center w-14 flex-shrink-0 mr-4">
                  <p
                    className={`text-xs font-bold uppercase ${getDeadlineColor(
                      d.deadline_date
                    )}`}
                  >
                    {new Date(d.deadline_date).toLocaleString("default", {
                      month: "short",
                    })}
                  </p>
                  <p className="text-xl font-bold text-gray-700">
                    {new Date(d.deadline_date).getDate()}
                  </p>
                </div>
                <div
                  className={`border-l-2 pl-3 ${getDeadlineColor(
                    d.deadline_date
                  )}`}
                >
                  <p className="font-semibold text-gray-800 text-sm">
                    {d.title}
                  </p>
                  {d.details && (
                    <p className="text-xs text-gray-500">
                      {truncateText(d.details, 10)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center">No deadlines soon</p>
        )}
      </div>

      {/* Modal */}
      {selectedItem && (
        <div
          className={`widget-modal-overlay fixed inset-0 flex items-center justify-center z-50 px-4 transition-all duration-300 ${
            showModal ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Backdrop with blur */}
          <div
            className={`absolute inset-0 backdrop-blur-md bg-white/30 transition-all duration-300 ${
              showModal ? "backdrop-blur-md" : "backdrop-blur-none"
            }`}
            onClick={closeModal}
          ></div>

          {/* Modal Content */}
          <div
            className={`widget-modal-content bg-white rounded-2xl shadow-2xl max-w-lg w-full relative transform transition-all duration-300 overflow-hidden ${
              showModal ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div
              className={`${
                modalType === "event"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                  : getDeadlineGradient(selectedItem.deadline_date).header
              } p-6 pb-20 relative`}
            >
              <div className="flex items-center justify-between text-white mb-4">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    {modalType === "event" ? (
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/80 uppercase tracking-wide">
                      {modalType === "event" ? "Campus Event" : "Deadline"}
                    </p>
                    <h2 className="text-xl font-bold mt-1">
                      {selectedItem.title}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={closeModal}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-all flex-shrink-0"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 -mt-12 relative">
              <div className="bg-white rounded-xl shadow-lg p-5 space-y-4">
                {modalType === "event" ? (
                  <>
                    {/* Date & Time */}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-cyan-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                          Date & Time
                        </p>
                        <p className="text-sm text-gray-800 font-semibold mt-1">
                          {new Date(selectedItem.event_date).toLocaleString(
                            [],
                            {
                              dateStyle: "full",
                              timeStyle: "short",
                            }
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    {selectedItem.location && (
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                            Location
                          </p>
                          <p className="text-sm text-gray-800 font-semibold mt-1">
                            {selectedItem.location}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {selectedItem.description && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                          Description
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {selectedItem.description}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Deadline Date */}
                    <div className="flex items-start space-x-3">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          getDeadlineColor(selectedItem.deadline_date).includes(
                            "red"
                          )
                            ? "bg-red-100"
                            : getDeadlineColor(
                                selectedItem.deadline_date
                              ).includes("yellow")
                            ? "bg-yellow-100"
                            : "bg-cyan-100"
                        }`}
                      >
                        <svg
                          className={`w-5 h-5 ${
                            getDeadlineColor(
                              selectedItem.deadline_date
                            ).includes("red")
                              ? "text-red-600"
                              : getDeadlineColor(
                                  selectedItem.deadline_date
                                ).includes("yellow")
                              ? "text-yellow-600"
                              : "text-cyan-600"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                          Due Date
                        </p>
                        <p className="text-sm text-gray-800 font-semibold mt-1">
                          {new Date(
                            selectedItem.deadline_date
                          ).toLocaleDateString([], {
                            dateStyle: "full",
                          })}
                        </p>
                        <p
                          className={`text-xs font-medium mt-1 ${
                            getDeadlineColor(
                              selectedItem.deadline_date
                            ).includes("red")
                              ? "text-red-600"
                              : getDeadlineColor(
                                  selectedItem.deadline_date
                                ).includes("yellow")
                              ? "text-yellow-600"
                              : "text-cyan-600"
                          }`}
                        >
                          {(() => {
                            const today = new Date();
                            const deadline = new Date(
                              selectedItem.deadline_date
                            );
                            const diffTime = deadline - today;
                            const diffDays = Math.ceil(
                              diffTime / (1000 * 60 * 60 * 24)
                            );
                            if (diffDays < 0) return "Overdue!";
                            if (diffDays === 0) return "Due today!";
                            if (diffDays === 1) return "Due tomorrow";
                            return `${diffDays} days remaining`;
                          })()}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    {selectedItem.details && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                          Details
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {selectedItem.details}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
    </>
  );
}
