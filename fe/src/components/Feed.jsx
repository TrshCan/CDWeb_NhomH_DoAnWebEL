import React, { useState, useEffect } from "react";
import PostCard from "../components/PostCard";
import { getAllPosts } from "../api/graphql/post";

export default function Feed() {
  const [activeTab, setActiveTab] = useState("forYou");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getAllPosts();
        const formatted = data.map((p) => ({
          user: p.user?.name || "Anonymous",
          time: new Date(p.created_at).toLocaleString(),
          content: p.content,
          media: "",
        }));
        setPosts(formatted);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const addPost = () => {
    const text = document.getElementById("postInput").value;
    if (!text.trim()) return;
    setPosts([
      {
        user: "You",
        time: new Date().toLocaleString(),
        content: text,
        media: "",
      },
      ...posts,
    ]);
    document.getElementById("postInput").value = "";
  };

  return (
    <main className="w-full lg:w-2/3">
      {/* Sticky Navigation */}
      <div className="bg-white rounded-lg shadow p-2 mb-4">
        <div className="flex space-x-4">
          <button
            className={`flex-1 text-center py-2 rounded-lg ${
              activeTab === "forYou"
                ? "bg-cyan-100 text-cyan-700 font-semibold"
                : "text-cyan-600"
            }`}
            onClick={() => setActiveTab("forYou")}
          >
            For You
          </button>
          <button
            className={`flex-1 text-center py-2 rounded-lg ${
              activeTab === "following"
                ? "bg-cyan-100 text-cyan-700 font-semibold"
                : "text-cyan-600"
            }`}
            onClick={() => setActiveTab("following")}
          >
            Following
          </button>
        </div>
      </div>

      {/* Post Form (only for Following tab) */}
      {activeTab === "following" && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <textarea
            id="postInput"
            className="w-full bg-gray-100 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900"
            rows="4"
            placeholder="What's on your mind?"
          ></textarea>
          <div className="flex justify-end mt-2">
            <button
              onClick={addPost}
              className="bg-cyan-600 text-white px-4 py-2 rounded-full hover:bg-cyan-700"
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* Post Feed */}
      <div className="space-y-4" id="postFeed">
        {loading ? (
          <p className="text-gray-500 text-center">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="text-gray-500 text-center">No posts yet.</p>
        ) : (
          posts.map((post, i) => <PostCard key={i} post={post} />)
        )}
      </div>
    </main>
  );
}
