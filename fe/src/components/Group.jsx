import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css/group-component.css";
import {
  sendJoinRequest,
  getPendingJoinRequests,
} from "../api/graphql/joinRequest";
import { getGroupsByUser, createGroup } from "../api/graphql/group";
import "../assets/css/group-component.css";

export default function Groups() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [pendingGroups, setPendingGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [userGroupsLoading, setUserGroupsLoading] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupCode, setGroupCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
  const [joinError, setJoinError] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [createError, setCreateError] = useState("");

  // Check if user is logged in
  const getUserFromStorage = () => {
    try {
      const userData = localStorage.getItem("user");

      if (!userData) {
        console.log("No user found in localStorage (key: 'user')");
        return null;
      }

      // Parse the JSON string into an object
      const user = JSON.parse(userData);

      // Log the full user object for debugging
      //console.log("Retrieved user from localStorage:", user);

      return user;
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      console.error("Raw stored value:", localStorage.getItem("user"));
      return null;
    }
  };

  const user = getUserFromStorage();
  const isLoggedIn = !!user;
  const userRole = user?.role || "student"; // Adjust based on your user object structure

  useEffect(() => {
    const fetchPendingRequests = async () => {
      if (!isLoggedIn || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const requests = await getPendingJoinRequests(user.id);
        console.log("Fetched pending requests:", requests);

        // Map to match UI structure
        const formatted = requests.map((req) => ({
          id: req.id,
          title: req.group.name,
          members: 0, // You can add member count later
          code: req.group.code,
          status: req.status,
        }));

        setPendingGroups(formatted);
      } catch (error) {
        console.error("Failed to load pending requests:", error);
        setJoinError("Failed to load pending requests");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingRequests();
  }, [isLoggedIn, user?.id]);

  useEffect(() => {
    const fetchUserGroups = async () => {
      if (!isLoggedIn || !user?.id) {
        setUserGroupsLoading(false);
        return;
      }

      // Only fetch when "Your Groups" tab is active
      if (activeTab !== "yourGroups") {
        return;
      }

      try {
        setUserGroupsLoading(true);
        const groups = await getGroupsByUser(user.id);
        console.log("Fetched user groups:", groups);

        // Map to match UI structure
        const formatted = groups.map((group) => ({
          id: group.id,
          title: group.name,
          description: group.description,
          members: group.members?.length || 0,
          code: group.code,
          creator: group.creator?.name || "Unknown",
          created_at: group.created_at,
          created_by: group.created_by,
        }));

        setUserGroups(formatted);
      } catch (error) {
        console.error("Failed to load user groups:", error);
      } finally {
        setUserGroupsLoading(false);
      }
    };

    fetchUserGroups();
  }, [isLoggedIn, user?.id, activeTab]);

  const handleJoinSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      setJoinError("Please log in to join a group");
      return;
    }

    if (!groupCode.trim()) {
      setJoinError("Please enter a group code");
      return;
    }

    setJoinLoading(true);
    setJoinError("");
    setJoinMessage("");

    try {
      // Get token from localStorage
      const token = localStorage.getItem("token");

      const result = await sendJoinRequest(
        {
          code: groupCode.trim(),
          userId: user.id, // Adjust based on your user object structure
        },
        token
      );

      if (result.success) {
        setJoinMessage(result.message || "Join request sent successfully!");
        setShowJoinModal(false);
        setGroupCode("");
        // Optionally refresh pending groups list
        // fetchPendingGroups();
      } else {
        setJoinError(result.message || "Failed to send join request");
      }
    } catch (error) {
      console.error("Join request error:", error);
      setJoinError(
        error.message || "An error occurred while sending join request"
      );
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      setCreateError("Please log in to create a group");
      return;
    }

    if (!groupName.trim()) {
      setCreateError("Please enter a group name");
      return;
    }

    if (!(userRole === "lecturer" || userRole === "admin")) {
      setCreateError("Only lecturers and admins can create groups");
      return;
    }

    setCreateLoading(true);
    setCreateError("");
    setCreateMessage("");

    try {
      const result = await createGroup(
        groupName.trim(),
        groupDescription.trim() || null,
        user.id
      );

      setCreateMessage("Group created successfully!");
      setShowCreateModal(false);
      setGroupName("");
      setGroupDescription("");

      // Refresh user groups list if we're on that tab
      if (activeTab === "yourGroups") {
        const groups = await getGroupsByUser(user.id);
        const formatted = groups.map((group) => ({
          id: group.id,
          title: group.name,
          description: group.description,
          members: group.members?.length || 0,
          code: group.code,
          creator: group.creator?.name || "Unknown",
          created_at: group.created_at,
          created_by: group.created_by,
        }));
        setUserGroups(formatted);
      }
    } catch (error) {
      console.error("Create group error:", error);
      setCreateError(
        error.message || "An error occurred while creating the group"
      );
    } finally {
      setCreateLoading(false);
    }
  };

  // Disable join button if not logged in
  const renderJoinButton = () => {
    if (!isLoggedIn) {
      return (
        <button
          disabled
          className="bg-gray-400 text-white px-4 py-2 rounded-full cursor-not-allowed"
          title="Please log in to join groups"
        >
          Join Group (Login Required)
        </button>
      );
    }

    return (
      <button
        className="bg-cyan-600 text-white px-4 py-2 rounded-full hover:bg-cyan-700 transition"
        onClick={() => setShowJoinModal(true)}
      >
        Join Group
      </button>
    );
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
            Pending
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
            {renderJoinButton()}

            {(userRole === "lecturer" || userRole === "admin") && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-cyan-600 text-white px-4 py-2 rounded-full hover:bg-cyan-700 transition"
              >
                Create Group
              </button>
            )}
          </div>

          <h2 className="text-lg font-bold text-cyan-200">Pending Requests</h2>

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
              Haven't sent any requests 😴
            </div>
          ) : (
            // ←←← REPLACE FROM HERE ↓↓↓
            pendingGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-lg shadow p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 bg-cyan-100 text-cyan-700 rounded-full h-10 w-10 flex items-center justify-center">
                    [Chat Icon]
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{group.title}</p>
                    <p className="text-sm text-gray-500">
                      Code:{" "}
                      <code className="bg-gray-100 px-1 rounded">
                        {group.code}
                      </code>
                    </p>
                  </div>
                  <button className="bg-gray-600 text-white px-4 py-2 rounded-full cursor-default text-sm">
                    {group.status === "pending"
                      ? "Awaiting Approval"
                      : group.status}
                  </button>
                </div>
              </div>
            ))
            // ←←← TO HERE ↑↑↑
          )}
        </section>
      )}

      {/* Your Groups */}
      {activeTab === "yourGroups" && (
        <section id="yourGroups" className="space-y-4 tab-slide">
          <h2 className="text-lg font-bold text-cyan-800">Your Groups</h2>

          {/* Loading Skeletons */}
          {userGroupsLoading ? (
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
          ) : userGroups.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              No groups joined yet 😔
            </div>
          ) : (
            userGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-lg shadow p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 bg-cyan-100 text-cyan-700 rounded-full h-10 w-10 flex items-center justify-center">
                    [Chat Icon]
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{group.title}</p>
                      {group.created_by && String(group.created_by) === String(user?.id) && (
                        <span className="bg-cyan-100 text-cyan-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          Created by you
                        </span>
                      )}
                    </div>
                    {group.description && (
                      <p className="text-sm text-gray-500 mb-1">
                        {group.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      Code:{" "}
                      <code className="bg-gray-100 px-1 rounded">
                        {group.code}
                      </code>
                      {" • "}
                      {group.members} member{group.members !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/group/${group.id}`)}
                    className="bg-cyan-600 text-white px-4 py-2 rounded-full hover:bg-cyan-700 transition text-sm"
                  >
                    View Group
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h2 className="text-lg font-semibold text-cyan-700 mb-4 text-center">
              Enter Group Code
            </h2>
            <form
              onSubmit={handleJoinSubmit}
              className="flex flex-col space-y-4"
            >
              <input
                type="text"
                placeholder="Group Code"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
                disabled={joinLoading}
              />

              {joinError && (
                <div className="text-red-600 text-sm text-center">
                  {joinError}
                </div>
              )}
              {joinMessage && (
                <div className="text-green-600 text-sm text-center">
                  {joinMessage}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinError("");
                    setJoinMessage("");
                    setGroupCode("");
                  }}
                  className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
                  disabled={joinLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joinLoading || !isLoggedIn}
                  className={`px-4 py-2 rounded-md text-white ${
                    joinLoading || !isLoggedIn
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-cyan-600 hover:bg-cyan-700"
                  }`}
                >
                  {joinLoading ? "Joining..." : "Join"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-[90vw]">
            <h2 className="text-lg font-semibold text-cyan-700 mb-4 text-center">
              Create New Group
            </h2>
            <form
              onSubmit={handleCreateSubmit}
              className="flex flex-col space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                  disabled={createLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Enter group description"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  disabled={createLoading}
                />
              </div>

              {createError && (
                <div className="text-red-600 text-sm text-center">
                  {createError}
                </div>
              )}
              {createMessage && (
                <div className="text-green-600 text-sm text-center">
                  {createMessage}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError("");
                    setCreateMessage("");
                    setGroupName("");
                    setGroupDescription("");
                  }}
                  className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !isLoggedIn || !(userRole === "lecturer" || userRole === "admin")}
                  className={`px-4 py-2 rounded-md text-white ${
                    createLoading || !isLoggedIn || !(userRole === "lecturer" || userRole === "admin")
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-cyan-600 hover:bg-cyan-700"
                  }`}
                >
                  {createLoading ? "Creating..." : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
