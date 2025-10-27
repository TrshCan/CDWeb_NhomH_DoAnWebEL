import React, { useEffect, useState } from "react";
import { getTodayEvents, getUpcomingDeadlines } from "../api/graphql/widget";

export default function WidgetSidebar() {
  const [events, setEvents] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, deadlinesData] = await Promise.all([
          getTodayEvents(),
          getUpcomingDeadlines(),
        ]);
        setEvents(eventsData);
        setDeadlines(deadlinesData);
      } catch (err) {
        console.error("Failed fetching widget data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Disable scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "auto";
  }, [showModal]);

  const getDeadlineColor = (deadlineDate) => {
    const today = new Date();
    const deadline = new Date(deadlineDate);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) return "text-red-500 border-red-400";
    if (diffDays <= 30) return "text-yellow-500 border-yellow-400";
    return "text-cyan-500 border-cyan-400";
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
    setTimeout(() => setSelectedItem(null), 200); // small delay for fade-out
  };

  if (loading) {
    return (
      <aside className="w-full lg:w-1/3 space-y-4">
        <div className="bg-white rounded-lg shadow p-4 animate-pulse h-20"></div>
        <div className="bg-white rounded-lg shadow p-4 animate-pulse h-32"></div>
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-1/3 space-y-6 p-4 sticky top-0 h-screen overflow-y-auto custom-scrollbar">
      {/* Search Box */}
      <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all">
        <input
          type="text"
          placeholder="Search events, clubs, people..."
          className="w-full bg-gray-100 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"
        />
      </div>

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
          <p className="text-gray-400 text-sm text-center">
            No deadlines soon
          </p>
        )}
      </div>

      {/* Modal */}
      {selectedItem && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-200 ${
            showModal ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={closeModal}
          ></div>

          {/* Modal content */}
          <div
            className={`bg-white rounded-xl shadow-2xl p-6 max-w-md w-full relative transform transition-all duration-300 ${
              showModal ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-cyan-600 hover:text-cyan-800 text-xl font-bold"
            >
              ✕
            </button>

            <h2 className="text-lg font-bold text-gray-800 mb-3">
              {selectedItem.title}
            </h2>

            {modalType === "event" ? (
              <>
                <p className="text-gray-600 text-sm mb-1">
                  📅{" "}
                  {new Date(selectedItem.event_date).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                {selectedItem.location && (
                  <p className="text-gray-600 text-sm mb-1">
                    📍 {selectedItem.location}
                  </p>
                )}
                {selectedItem.description && (
                  <p className="text-gray-500 text-sm mt-2">
                    {selectedItem.description}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-gray-600 text-sm mb-1">
                  ⏰ Due{" "}
                  {new Date(selectedItem.deadline_date).toLocaleDateString()}
                </p>
                {selectedItem.details && (
                  <p className="text-gray-500 text-sm mt-2">
                    {selectedItem.details}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
