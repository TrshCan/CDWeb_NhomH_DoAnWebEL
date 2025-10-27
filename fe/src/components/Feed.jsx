import React, { useState, useEffect } from "react";
import PostCard from "../components/PostCard";
import { getAllPosts, getPostsByType, createPost } from "../api/graphql/post";

// Helper to format time difference
function timeAgo(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now - created;

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay >= 1) return `${diffDay} day(s) ago`;
  if (diffHr >= 1) return `${diffHr} hour(s) ago`;
  if (diffMin >= 1) return `${diffMin} minute(s) ago`;
  return "Just now";
}

export default function Feed() {
  const [activeTab, setActiveTab] = useState("forYou");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]); // State for selected files

  // Fetch posts when activeTab changes
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const data =
          activeTab === "forYou"
            ? await getPostsByType("announcement")
            : await getPostsByType("normal_post");
        const formatted = data.map((p) => ({
          id: p.id,
          type: p.type,
          user: p.user?.name || "Anonymous",
          time: timeAgo(p.created_at),
          content: p.content,
          media: p.media || [], // Include media
        }));
        setPosts(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [activeTab]);

  // Handle file selection
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files)); // Convert FileList to array
  };

  // Handler to add a new post with files
  const addPost = async () => {
    const text = document.getElementById("postInput").value.trim();
    if (!text && files.length === 0) return; // Require text or files

    try {
      const input = {
        user_id: "1", // Replace with authenticated user ID
        type: "normal_post",
        content: text,
      };

      const newPost = await createPost(input, files);

      setPosts((prev) => [
        {
          id: newPost.id,
          type: newPost.type,
          user: newPost.user?.name || "You",
          time: timeAgo(newPost.created_at),
          content: newPost.content,
          media: newPost.media || [], // Include media
        },
        ...prev,
      ]);

      // Reset form
      document.getElementById("postInput").value = "";
      setFiles([]);
      document.getElementById("mediaInput").value = "";
    } catch (err) {
      console.error("Failed to create post:", err);
    }
  };

  // Render
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
          <input
            id="mediaInput"
            type="file"
            accept="image/jpeg,image/png,video/mp4"
            multiple
            className="mt-2"
            onChange={handleFileChange}
          />
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