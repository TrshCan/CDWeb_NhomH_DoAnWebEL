export default function WidgetSidebar() {
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

      {/* Today on Campus */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center mb-3">
          <svg className="w-6 h-6 text-cyan-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h2 className="text-lg font-bold text-cyan-800">Today on Campus 📅</h2>
        </div>

        <ul className="space-y-3">
          {[
            { icon: "📚", title: "Guest Lecture: AI Ethics", time: "1:00 PM - Engleman Hall A120", color: "cyan" },
            { icon: "🎭", title: "Theater Dept. Auditions", time: "4:00 PM - Fine Arts Center", color: "yellow" },
            { icon: "🏐", title: "Volleyball Game vs. State U", time: "6:00 PM - Gymnasium", color: "red" },
          ].map((event, i) => (
            <li
              key={i}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div
                className={`flex-shrink-0 bg-${event.color}-100 text-${event.color}-700 rounded-full h-8 w-8 flex items-center justify-center`}
              >
                {event.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{event.title}</p>
                <p className="text-gray-500 text-xs">{event.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center mb-3">
          <svg className="w-6 h-6 text-cyan-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-lg font-bold text-cyan-800">Upcoming Deadlines 🎓</h2>
        </div>

        <div className="space-y-3">
          {[
            {
              month: "Oct",
              day: "15",
              title: "Last Day to Drop a Class",
              detail: "Submit forms by 5 PM",
              color: "red",
            },
            {
              month: "Oct",
              day: "22",
              title: "Spring '26 Registration Opens",
              detail: "Opens at 8 AM for Seniors",
              color: "cyan",
            },
          ].map((d, i) => (
            <div key={i} className="flex items-center">
              <div className="text-center w-14 flex-shrink-0 mr-3">
                <p className={`text-xs text-${d.color}-500 uppercase font-bold`}>{d.month}</p>
                <p className="text-xl font-bold text-gray-700">{d.day}</p>
              </div>
              <div className={`border-l-2 border-${d.color}-400 pl-3`}>
                <p className="font-semibold text-gray-800 text-sm">{d.title}</p>
                <p className="text-xs text-gray-500">{d.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
