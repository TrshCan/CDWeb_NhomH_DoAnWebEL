import React, { useState, useEffect } from "react";
import "../assets/css/group-component.css";

export default function Groups() {
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [pendingGroups, setPendingGroups] = useState([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupCode, setGroupCode] = useState("");

  // 👇 simulate getting user role (replace with actual user data later)
  const userRole = "student"; // "lecturer" | "admin" | "student"

  useEffect(() => {
    setTimeout(() => setLoading(false), 1500);
  }, []);

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    console.log("Joining group with code:", groupCode);
    setShowJoinModal(false);
    setGroupCode("");
  };

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col space-y-4">
      {/* Search + Tabs */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <input
          type="text"
          placeholder="Search for groups..."
          className="w-full bg-gray-100 border border-gray-300 rounded-full px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
        />

        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 text-center py-2 font-semibold rounded-md tab-btn ${
              activeTab === "pending"
                ? "bg-cyan-100 text-cyan-600"
                : "text-cyan-600 hover:bg-cyan-50"
            }`}
          >
            Pending / Waiting
          </button>
          <button
            onClick={() => setActiveTab("yourGroups")}
            className={`flex-1 text-center py-2 font-semibold rounded-md tab-btn ${
              activeTab === "yourGroups"
                ? "bg-cyan-100 text-cyan-600"
                : "text-cyan-600 hover:bg-cyan-50"
            }`}
          >
            Your Groups
          </button>
        </div>
      </div>

      {/* Pending Groups */}
      {activeTab === "pending" && (
        <section id="pending" className="space-y-4 tab-slide">
          <div className="flex space-x-2 mb-4">
            {/* 🔥 Conditional button rendering */}
            <button
              className="bg-cyan-600 text-white px-4 py-2 rounded-full hover:bg-cyan-700 transition"
              onClick={() => setShowJoinModal(true)}
            >
              Join Group
            </button>

            {(userRole === "lecturer" || userRole === "admin") && (
              <button className="bg-cyan-600 text-white px-4 py-2 rounded-full hover:bg-cyan-700 transition">
                Create Group
              </button>
            )}
          </div>

          <h2 className="text-lg font-bold text-cyan-800">
            Pending / Waiting Groups
          </h2>

          {/* Loading Skeletons */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((s) => (
                <div key={s} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center space-x-3">
                    <div className="skeleton rounded-full h-10 w-10"></div>
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 rounded w-1/3"></div>
                      <div className="skeleton h-3 rounded w-1/2"></div>
                    </div>
                    <div className="skeleton h-8 rounded-full w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : pendingGroups.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Haven’t sent any requests 😴
            </div>
          ) : (
            pendingGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-lg shadow p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 bg-cyan-100 text-cyan-700 rounded-full h-10 w-10 flex items-center justify-center">
                    💬
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{group.title}</p>
                    <p className="text-sm text-gray-500">
                      {group.members} members
                    </p>
                  </div>
                  <button className="bg-gray-600 text-white px-4 py-2 rounded-full cursor-default">
                    Awaiting Approval
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* Your Groups */}
      {activeTab === "yourGroups" && (
        <section id="yourGroups" className="space-y-4 tab-slide">
          <h2 className="text-lg font-bold text-cyan-800">Your Groups</h2>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-center">No groups joined yet 😔</p>
          </div>
        </section>
      )}

      {/* 🔥 Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h2 className="text-lg font-semibold text-cyan-700 mb-4 text-center">
              Enter Group Code
            </h2>
            <form onSubmit={handleJoinSubmit} className="flex flex-col space-y-4">
              <input
                type="text"
                placeholder="Group Code"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-cyan-600 text-white hover:bg-cyan-700"
                >
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
