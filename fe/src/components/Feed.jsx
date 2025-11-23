import React, { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import PostCard from "../components/PostCard";
import {
  getPostsByType,
  getPostsOfFollowing,
  createPost,
} from "../api/graphql/post";
import { getUserProfile, getUserFollowingIds } from "../api/graphql/user";

import "../assets/css/feed.css"; // 👈 import the shimmer + fade css
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
  const [activeTab, setActiveTab] = useState("announcement");
  const [allPosts, setAllPosts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [files, setFiles] = useState([]);
  const [user, setUser] = useState(null);
  const loadMoreRef = useRef(null);

  // TODO: Replace with actual logged-in user's following list from your auth/user context
  const [followingUserIds, setFollowingUserIds] = useState([]); // Array of user IDs that the logged-in user follows

  // ✅ Load current user from localStorage + GraphQL
  // Check login status based on token (same pattern as Sidebar)
  const checkLoginStatus = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      setUser(null);
      return;
    }

    try {
      const data = await getUserProfile(parseInt(userId));
      setUser(data);
    } catch (err) {
      console.error("Failed to load user:", err);
      toast.error("Failed to load user info");
      setUser(null);
      // Clean up invalid token/userId
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
    }
  };

  useEffect(() => {
    // Initial check
    checkLoginStatus();

    // Listen for changes in localStorage (cross-tab sync)
    const handleStorageChange = (e) => {
      if (e.key === "token" || e.key === "userId") {
        checkLoginStatus();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Listen for same-tab login/logout via custom event (same as Sidebar)
    const handleTokenChange = () => checkLoginStatus();
    window.addEventListener("tokenChanged", handleTokenChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("tokenChanged", handleTokenChange);
    };
  }, []); // Run once on mount

  // Keep Following tab hidden when logged out
  useEffect(() => {
    if (!user && activeTab === "following") {
      setActiveTab("announcement");
    }
  }, [user, activeTab]);

  // Load following IDs when user logs in
  useEffect(() => {
    const loadFollowing = async () => {
      if (!user) {
        setFollowingUserIds([]);
        return;
      }
      try {
        const ids = await getUserFollowingIds(parseInt(user.id));
        setFollowingUserIds(ids);
      } catch (err) {
        console.error("Failed to load following ids:", err);
        setFollowingUserIds([]);
      }
    };
    loadFollowing();
  }, [user]);

  // ✅ Fetch posts
  // ✅ Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        let data = [];

        if (activeTab === "announcement") {
          data = await getPostsByType("announcement");
        } else if (activeTab === "campus") {
          data = await getPostsByType("normal_post");
        } else if (activeTab === "following" && user) {
          // ←←←  USE FOLLOWING IDs instead of user.id
          data = await getPostsOfFollowing(followingUserIds);
        }

        const mapped = data.map((p) => ({
          id: p.id,
          type: p.type,
          user: p.user?.name || "Anonymous",
          userId: p.user?.id,
          time: timeAgo(p.created_at),
          content: p.content,
          media: p.media
            ? p.media.map((m) =>
                typeof m === "string"
                  ? { filename: m }
                  : m.url
                  ? { url: m.url }
                  : { filename: m.filename }
              )
            : [],
        }));

        setAllPosts(mapped);
        setVisibleCount(10);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
        toast.error("Failed to load posts.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [activeTab, user, followingUserIds]); // ← add followingUserIds to deps

  // Setup intersection observer for infinite loading
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loading && !loadingMore) {
          if (visibleCount < allPosts.length) {
            setLoadingMore(true);
            // Small delay to show animation
            setTimeout(() => {
              setVisibleCount((c) => Math.min(c + 10, allPosts.length));
              setLoadingMore(false);
            }, 600);
          }
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [allPosts.length, loading, loadingMore, visibleCount]);

  // File validation
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const MAX_FILES = 4;
    const MAX_SIZE_MB = 4;

    if (selected.length + files.length > MAX_FILES) {
      toast.error(`You can only upload up to ${MAX_FILES} files.`);
      e.target.value = "";
      return;
    }

    const invalidFiles = selected.filter(
      (f) => f.size > MAX_SIZE_MB * 1024 * 1024
    );

    if (invalidFiles.length > 0) {
      toast.error(`Each file must be smaller than ${MAX_SIZE_MB}MB.`);
      e.target.value = "";
      return;
    }

    setFiles((prev) => [...prev, ...selected]);
  };

  // ✅ Create new post using logged-in user info
  const addPost = async () => {
    const token = localStorage.getItem("token");
    if (!token || !user) {
      toast.error("You must be logged in to post.");
      return;
    }

    const text = document.getElementById("postInput").value.trim();
    if (!text && files.length === 0) return;

    try {
      const input = {
        user_id: user.id.toString(),
        type: "normal_post",
        content: text,
      };

      const newPost = await createPost(input, files);
      toast.success("Post created!");

      setAllPosts((prev) => [
        {
          id: newPost.id,
          type: newPost.type,
          user: newPost.user?.name || "You",
          userId: newPost.user?.id,
          time: timeAgo(newPost.created_at),
          content: newPost.content,
          media: newPost.media
            ? newPost.media.map((m) =>
                typeof m === "string"
                  ? { filename: m }
                  : m.url
                  ? { url: m.url }
                  : { filename: m.filename }
              )
            : [],
          likes: [],
          children: [],
        },
        ...prev,
      ]);

      document.getElementById("postInput").value = "";
      document.getElementById("mediaInput").value = "";
      setFiles([]);
    } catch (err) {
      console.error("Failed to create post:", err);
      const errorMessage = err?.response?.data?.errors?.[0]?.message || err?.message || "Failed to create post.";
      
      // Kiểm tra nếu là lỗi permission
      if (errorMessage.includes('không có quyền') || errorMessage.includes('permission') || errorMessage.includes('quyền')) {
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage || "Không thể tạo bài viết. Vui lòng thử lại.");
      }
    }
  };

  return (
    <main className="w-full lg:w-2/3">
      <Toaster position="top-right" />

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow p-2 mb-4 flex space-x-2">
        {(user
          ? ["announcement", "campus", "following"]
          : ["announcement", "campus"]
        ).map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-2 rounded-lg ${
              activeTab === tab
                ? "bg-cyan-100 text-cyan-700 font-semibold"
                : "text-cyan-600"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "announcement"
              ? "Announcement"
              : tab === "campus"
              ? "Campus"
              : "Following"}
          </button>
        ))}
      </div>

      {activeTab === "campus" && user && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-10 h-10 bg-cyan-600 rounded-full"></div>
            <p className="font-semibold text-cyan-600">{user.name}</p>
          </div>

          <textarea
            id="postInput"
            className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 resize-none"
            rows="4"
            placeholder="What's on your mind?"
          ></textarea>

          {/* Media Preview */}
          {files.length > 0 && (
            <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
              {files.length === 1 && (
                <img
                  src={URL.createObjectURL(files[0])}
                  alt="preview"
                  className="w-full max-h-[600px] object-cover"
                />
              )}

              {files.length === 2 && (
                <div className="grid grid-cols-2 gap-px bg-gray-200">
                  {files.map((f, i) => (
                    <img
                      key={i}
                      src={URL.createObjectURL(f)}
                      alt="preview"
                      className="w-full h-80 object-cover"
                    />
                  ))}
                </div>
              )}

              {files.length === 3 && (
                <div className="grid grid-cols-2 gap-px bg-gray-200">
                  <img
                    src={URL.createObjectURL(files[0])}
                    alt="preview"
                    className="col-span-2 w-full h-72 object-cover"
                  />
                  {files.slice(1).map((f, i) => (
                    <img
                      key={i + 1}
                      src={URL.createObjectURL(f)}
                      alt="preview"
                      className="w-full h-64 object-cover"
                    />
                  ))}
                </div>
              )}

              {files.length >= 4 && (
                <div className="grid grid-cols-2 gap-px bg-gray-200 relative">
                  {files.slice(0, 4).map((f, i) => (
                    <div key={i} className="relative">
                      <img
                        src={URL.createObjectURL(f)}
                        alt="preview"
                        className="w-full h-64 object-cover"
                      />
                      {i === 3 && files.length > 4 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xl font-semibold">
                          +{files.length - 4} more
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="cursor-pointer text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Media
                <input
                  id="mediaInput"
                  type="file"
                  accept="image/jpeg,image/png,video/mp4"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {files.length > 0 && (
                <button
                  onClick={() => {
                    setFiles([]);
                    document.getElementById("mediaInput").value = "";
                  }}
                  className="text-sm text-red-500 hover:underline"
                >
                  Clear Media
                </button>
              )}
            </div>

            <button
              onClick={addPost}
              className="bg-cyan-600 text-white px-5 py-2 rounded-full hover:bg-cyan-700 active:scale-95 transition-all"
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