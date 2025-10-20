import React, { useEffect, useState } from "react";
import { getTodayEvents, getUpcomingDeadlines } from "../api/graphql/widget";

export default function WidgetSidebar() {
  const [events, setEvents] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <aside className="w-full lg:w-1/3">
        <p className="text-center text-gray-500 py-10">Loading widgets...</p>
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-1/3 space-y-4">
      {/* Search Box */}
      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Search events, clubs, people..."
          className="w-full bg-gray-100 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
        />
      </div>

      {/* Events */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center mb-3">
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
          <h2 className="text-lg font-bold text-cyan-800">Today on Campus 📅</h2>
        </div>

        {events.length > 0 ? (
          <ul className="space-y-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex-shrink-0 bg-cyan-100 text-cyan-700 rounded-full h-8 w-8 flex items-center justify-center">
                  📍
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {event.title}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {event.event_date} {event.location ? `• ${event.location}` : ""}
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
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center mb-3">
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
          <h2 className="text-lg font-bold text-cyan-800">Upcoming Deadlines 🎓</h2>
        </div>

        {deadlines.length > 0 ? (
          <div className="space-y-3">
            {deadlines.map((d) => (
              <div key={d.id} className="flex items-center">
                <div className="text-center w-14 flex-shrink-0 mr-3">
                  <p className="text-xs text-cyan-500 uppercase font-bold">
                    {new Date(d.deadline_date).toLocaleString("default", { month: "short" })}
                  </p>
                  <p className="text-xl font-bold text-gray-700">
                    {new Date(d.deadline_date).getDate()}
                  </p>
                </div>
                <div className="border-l-2 border-cyan-400 pl-3">
                  <p className="font-semibold text-gray-800 text-sm">{d.title}</p>
                  {d.details && (
                    <p className="text-xs text-gray-500">{d.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center">No deadlines soon</p>
        )}
      </div>
    </aside>
  );
}
