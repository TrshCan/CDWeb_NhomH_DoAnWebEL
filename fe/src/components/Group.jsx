import React, { useState } from "react";

export default function Groups() {
  const [activeTab, setActiveTab] = useState("pending");
  const [groupPosts, setGroupPosts] = useState([]);
  const [postText, setPostText] = useState("");

  const handlePost = () => {
    if (!postText.trim()) return;
    setGroupPosts([{ content: postText, id: Date.now() }, ...groupPosts]);
    setPostText("");
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
            className={`flex-1 text-center py-2 font-semibold rounded-md ${
              activeTab === "pending"
                ? "bg-cyan-100 text-cyan-600"
                : "text-cyan-600 hover:bg-cyan-50"
            }`}
          >
            Pending / Waiting
          </button>
          <button
            onClick={() => setActiveTab("yourGroups")}
            className={`flex-1 text-center py-2 font-semibold rounded-md ${
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
        <section id="pending" className="space-y-4">
          <div className="flex space-x-2 mb-4">
            <button className="bg-cyan-600 text-white px-4 py-2 rounded-full hover:bg-cyan-700">
              Join Group
            </button>
            <button className="bg-cyan-600 text-white px-4 py-2 rounded-full hover:bg-cyan-700">
              Create Group
            </button>
          </div>

          <h2 className="text-lg font-bold text-cyan-800">
            Pending / Waiting Groups
          </h2>

          {[
            {
              icon: "💻",
              title: "CS101 - Intro to Programming",
              members: 12,
              desc: "Learn the basics of programming with Python.",
            },
            {
              icon: "📊",
              title: "Data Structures",
              members: 80,
              desc: "Dive into algorithms and data structures.",
            },
            {
              icon: "🌐",
              title: "Web Development",
              members: 60,
              desc: "Build modern web applications with HTML, CSS, and JS.",
            },
          ].map((group, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 bg-cyan-100 text-cyan-700 rounded-full h-10 w-10 flex items-center justify-center">
                  {group.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{group.title}</p>
                  <p className="text-sm text-gray-500">{group.members} members</p>
                  <p className="text-sm text-gray-600 mt-1">{group.desc}</p>
                </div>
                <button className="bg-gray-600 text-white px-4 py-2 rounded-full cursor-default">
                  Awaiting Approval
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Your Groups */}
      {activeTab === "yourGroups" && (
        <section id="yourGroups" className="space-y-4">
          <h2 className="text-lg font-bold text-cyan-800">Your Groups</h2>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-center">No groups joined yet 😔</p>
          </div>
        </section>
      )}

      {/* Group Feed Example */}
      <section id="groupFeed" className="space-y-4">
        <h2 className="text-lg font-bold text-cyan-800">Group Posts</h2>
        <div className="bg-white rounded-lg shadow p-4">
          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            className="w-full bg-gray-100 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
            rows="4"
            placeholder="Share something with the group..."
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handlePost}
              className="bg-cyan-600 text-white px-4 py-2 rounded-full hover:bg-cyan-700"
            >
              Post
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {groupPosts.length === 0 ? (
            <p className="text-gray-500 text-center">No posts yet 💤</p>
          ) : (
            groupPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow p-4 hover:bg-gray-50 transition"
              >
                <p className="text-gray-800">{post.content}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
