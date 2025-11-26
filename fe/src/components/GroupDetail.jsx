import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import PostCard from "./PostCard";
import { getPostsByGroup, createPost } from "../api/graphql/post";
import { getGroupsByUser, isUserMemberOfGroup, isUserGroupAdminOrModerator, updateGroup, deleteGroup } from "../api/graphql/group";
import { getPendingJoinRequestsByGroup, approveJoinRequest } from "../api/graphql/joinRequest";

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

export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState(null);
  const [files, setFiles] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsDesc, setSettingsDesc] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvingRequestIds, setApprovingRequestIds] = useState(new Set());
  const [latestPostTime, setLatestPostTime] = useState(null);
  const [announcement, setAnnouncement] = useState(null); // { text, count, firstName }
  const [bannerVisible, setBannerVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const announcementTimerRef = React.useRef(null);
  const postsTopRef = React.useRef(null);

  // Get user info from localStorage
  const getUserIdFromStorage = () => {
    try {
      const userId = localStorage.getItem("userId");
      return userId ? parseInt(userId) : null;
    } catch (error) {
      console.error("Error getting userId from localStorage:", error);
      return null;
    }
  };

  const getUserNameFromStorage = () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) return "Anonymous";
      const user = JSON.parse(userData);
      return user?.name || "Anonymous";
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return "Anonymous";
    }
  };

  const userId = getUserIdFromStorage();
  const userName = getUserNameFromStorage();

  // Helper function to check if group is soft-deleted
  const isGroupDeleted = () => {
    if (!groupInfo) return false;
    // Check if deleted_at exists and is not null/undefined/empty string
    const deletedAt = groupInfo.deleted_at;
    return deletedAt !== null && deletedAt !== undefined && deletedAt !== '';
  };

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!groupId) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // Validate groupId is numeric
      if (isNaN(parseInt(groupId))) {
        toast.error("Invalid group ID");
        setAccessDenied(true);
        setLoading(false);
        navigate("/group");
        return;
      }

      try {
        setLoading(true);
        
        // Check if user is logged in
        if (!userId) {
          toast.error("Please log in to view this group");
          setAccessDenied(true);
          setLoading(false);
          setTimeout(() => navigate("/group"), 2000);
          return;
        }

        // Check if user is a member of this group
        const isMember = await isUserMemberOfGroup(userId, groupId);
        
        if (!isMember) {
          toast.error("You don't have access to this group");
          setAccessDenied(true);
          setLoading(false);
          setTimeout(() => navigate("/group"), 2000);
          return;
        }

        setIsAuthorized(true);
        
        // Fetch group info from user's groups
        const userGroups = await getGroupsByUser(userId);
        const group = userGroups.find((g) => String(g.id) === String(groupId));
        
        if (group) {
          setGroupInfo({
            id: group.id,
            name: group.name,
            description: group.description,
            code: group.code,
            created_by: group.created_by,
            deleted_at: group.deleted_at || null,
          });
        } else {
          // Fallback: group exists and user is member but not in their groups list
          setGroupInfo({
            id: groupId,
            name: "Group",
            description: "",
            code: "",
            created_by: undefined,
            deleted_at: null,
          });
        }

        // Determine management permission (admin/moderator or creator)
        const canManageRes = await isUserGroupAdminOrModerator(userId, groupId);
        const isCreator = group?.created_by && String(group.created_by) === String(userId);
        setCanManage(canManageRes || isCreator);

        // Fetch posts for this group
        const groupPosts = await getPostsByGroup(groupId);
        // Filter to only show group_post type
        const filteredPosts = groupPosts.filter((p) => p.type === "group_post");
        const mapped = filteredPosts.map((p) => ({
            id: p.id,
            type: p.type,
            user: p.user?.name || "Anonymous",
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
            created_at: p.created_at,
            user_id: p.user?.id,
          }));
        setPosts(mapped);
        // Track latest post timestamp for polling
        const newest = mapped[0]?.created_at ? new Date(mapped[0].created_at).getTime() : null;
        setLatestPostTime(newest);
      } catch (err) {
        console.error("Failed to fetch group data:", err);
        toast.error("Failed to load group data.");
        setAccessDenied(true);
        setTimeout(() => navigate("/group"), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId, userId, navigate]);

  // Poll for new posts to show announcement
  useEffect(() => {
    if (!isAuthorized || !groupId) return;

    const interval = setInterval(async () => {
      try {
        const groupPosts = await getPostsByGroup(groupId);
        if (!groupPosts || groupPosts.length === 0) return;
        // Filter to only check group_post type
        const filteredPosts = groupPosts.filter((p) => p.type === "group_post");
        if (filteredPosts.length === 0) return;
        const newestServerTime = filteredPosts[0]?.created_at ? new Date(filteredPosts[0].created_at).getTime() : null;
        if (latestPostTime && newestServerTime && newestServerTime > latestPostTime) {
          // Count how many new posts newer than latestPostTime and not by current user
          const newOnes = filteredPosts.filter((p) => new Date(p.created_at).getTime() > latestPostTime && String(p.user?.id) !== String(userId));
          if (newOnes.length > 0) {
            const firstName = newOnes[0]?.user?.name || "Someone";
            const more = newOnes.length - 1;
            const text = more <= 0 ? `${firstName} just posted` : `${firstName} and ${more} more just posted`;
            setAnnouncement({ text, count: newOnes.length, firstName });
            setBannerVisible(true);
            // Auto-dismiss after 8s
            if (announcementTimerRef.current) clearTimeout(announcementTimerRef.current);
            announcementTimerRef.current = setTimeout(() => {
              setBannerVisible(false);
            }, 8000);
          }
        }
      } catch (e) {
        // fail silently
      }
    }, 10000); // poll every 10s

    return () => clearInterval(interval);
  }, [isAuthorized, groupId, latestPostTime, userId]);

  const handleReloadForAnnouncement = async () => {
    try {
      const groupPosts = await getPostsByGroup(groupId);
      // Filter to only show group_post type
      const filteredPosts = groupPosts.filter((p) => p.type === "group_post");
      const mapped = filteredPosts.map((p) => ({
        id: p.id,
        type: p.type,
        user: p.user?.name || "Anonymous",
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
        created_at: p.created_at,
        user_id: p.user?.id,
      }));
      setPosts(mapped);
      const newest = mapped[0]?.created_at ? new Date(mapped[0].created_at).getTime() : null;
      setLatestPostTime(newest);
      setAnnouncement(null);
      setBannerVisible(false);
      // Smooth scroll to top of posts
      setTimeout(() => {
        const topEl = postsTopRef.current;
        if (topEl) {
          topEl.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 0);
    } catch (e) {
      // ignore
    }
  };

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

  const addPost = async () => {
    const text = document.getElementById("groupPostInput")?.value.trim();
    if (!text && files.length === 0) return;

    if (!userId) {
      toast.error("Please log in to create a post");
      return;
    }

    // Check if group is soft-deleted
    if (isGroupDeleted()) {
      toast.error("Cannot create post: This group has been deleted");
      return;
    }

    try {
      const input = {
        user_id: userId,
        type: "group_post",
        content: text,
        group_id: parseInt(groupId),
      };

      const newPost = await createPost(input, files);
      toast.success("Post created!");

      setPosts((prev) => [
        {
          id: newPost.id,
          type: newPost.type,
          user: newPost.user?.name || "You",
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
        },
        ...prev,
      ]);

      const postInput = document.getElementById("groupPostInput");
      if (postInput) postInput.value = "";
      const mediaInput = document.getElementById("groupMediaInput");
      if (mediaInput) mediaInput.value = "";
      setFiles([]);
    } catch (err) {
      console.error("Failed to create post:", err);
      
      // Extract error message from various error formats
      let errorMessage = "Failed to create post.";
      
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.response?.data?.errors?.[0]?.message) {
        errorMessage = err.response.data.errors[0].message;
      } else if (err?.response?.data?.errors?.[0]?.extensions?.validation) {
        // Handle Laravel validation errors
        const validationErrors = err.response.data.errors[0].extensions.validation;
        const firstError = Object.values(validationErrors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      } else if (err?.response?.data?.errors?.[0]) {
        errorMessage = err.response.data.errors[0].message || errorMessage;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleBack = () => {
    navigate("/group");
  };

  // Show access denied message
  if (accessDenied) {
    return (
      <main className="w-full lg:w-2/3">
        <Toaster position="top-right" />
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to view this group.
          </p>
          <button
            onClick={handleBack}
            className="bg-cyan-600 text-white px-6 py-2 rounded-full hover:bg-cyan-700 transition"
          >
            Back to Groups
          </button>
        </div>
      </main>
    );
  }

  // Show loading state
  if (loading || !isAuthorized) {
    return (
      <main className="w-full lg:w-2/3">
        <Toaster position="top-right" />
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Loading group...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full lg:w-2/3">
      <Toaster position="top-right" />

      {/* Sticky sliding announcement banner */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className={`sticky top-2 z-40 transition-transform duration-300 ${bannerVisible ? "translate-y-0" : "-translate-y-24"}`}
      >
        {announcement && (
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3 bg-white/95 backdrop-blur border border-cyan-200 rounded-full shadow px-3 py-2">
              {/* Avatar (first poster initial) */}
              <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center text-sm font-semibold">
                {(announcement.firstName || "?").charAt(0).toUpperCase()}
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate" title={announcement.text}>
                  {announcement.text}
                </p>
              </div>
              {/* Badge count */}
              <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full text-xs font-bold bg-cyan-100 text-cyan-700">
                {announcement.count}
              </span>
              {/* Action button */}
              <button
                onClick={handleReloadForAnnouncement}
                className="ml-2 text-sm font-medium bg-cyan-600 text-white px-3 py-1 rounded-full hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                New posts
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Header with group name, back arrow and settings */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex items-center space-x-4">
        <button
          onClick={handleBack}
          className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 p-2 rounded-full transition"
          title="Back to Groups"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">
            {groupInfo?.name || "Group"}
          </h1>
          {groupInfo?.description && (
            <p className="text-sm text-gray-500 mt-1">{groupInfo.description}</p>
          )}
        </div>
        {canManage && (
          <button
            onClick={async () => {
              if (settingsLoading) return;
              setSettingsLoading(true);
              setSettingsName(groupInfo?.name || "");
              setSettingsDesc(groupInfo?.description || "");
              try {
                const reqs = await getPendingJoinRequestsByGroup(groupId);
                setPendingRequests(reqs);
              } catch {}
              setShowSettings(true);
              setSettingsLoading(false);
            }}
            disabled={settingsLoading}
            className={`text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 p-2 rounded-full transition ${settingsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Group settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567l-.174 1.01a8.26 8.26 0 0 0-1.285.744l-.93-.54a1.875 1.875 0 0 0-2.55.682l-.75 1.299a1.875 1.875 0 0 0 .435 2.385l.83.679a8.266 8.266 0 0 0 0 1.49l-.83.679a1.875 1.875 0 0 0-.435 2.385l.75 1.299a1.875 1.875 0 0 0 2.55.682l.93-.54c.4.3.83.555 1.285.744l.174 1.01c.151.904.933 1.567 1.85 1.567h1.5c.917 0 1.699-.663 1.85-1.567l.174-1.01c.455-.189.885-.444 1.285-.744l.93.54a1.875 1.875 0 0 0 2.55-.682l.75-1.299a1.875 1.875 0 0 0-.435-2.385l-.83-.679c.04-.492.04-.998 0-1.49l.83-.679a1.875 1.875 0 0 0 .435-2.385l-.75-1.299a1.875 1.875 0 0 0-2.55-.682l-.93.54a8.26 8.26 0 0 0-1.285-.744l-.174-1.01A1.875 1.875 0 0 0 12.578 2.25h-1.5Zm.75 8.25a2.25 2.25 0 1 0-4.5 0 2.25 2.25 0 0 0 4.5 0Z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Invisible anchor for scrolling to top of posts */}
      <div ref={postsTopRef} />

      {/* Post Upload Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-10 h-10 bg-cyan-600 rounded-full"></div>
          <p className="font-semibold text-cyan-600">
            {userName}
          </p>
        </div>

        {isGroupDeleted() && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              This group has been deleted. You cannot create new posts.
            </p>
          </div>
        )}

        <textarea
          id="groupPostInput"
          disabled={isGroupDeleted()}
          className={`w-full bg-gray-100 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 resize-none ${
            isGroupDeleted() ? 'opacity-50 cursor-not-allowed bg-gray-200' : ''
          }`}
          rows="4"
          placeholder={isGroupDeleted() ? "This group has been deleted. Posting is disabled." : "What's happening in this group?"}
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
            <label className={`${isGroupDeleted() ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1`}>
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
                id="groupMediaInput"
                type="file"
                accept="image/jpeg,image/png,video/mp4"
                multiple
                disabled={isGroupDeleted()}
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {files.length > 0 && (
              <button
                onClick={() => {
                  setFiles([]);
                  const mediaInput = document.getElementById("groupMediaInput");
                  if (mediaInput) mediaInput.value = "";
                }}
                disabled={isGroupDeleted()}
                className={`text-sm text-red-500 ${isGroupDeleted() ? 'opacity-50 cursor-not-allowed' : 'hover:underline'}`}
              >
                Clear Media
              </button>
            )}
          </div>

          <button
            onClick={addPost}
            disabled={isGroupDeleted()}
            className={`px-5 py-2 rounded-full transition-all ${
              isGroupDeleted()
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-cyan-600 text-white hover:bg-cyan-700 active:scale-95'
            }`}
          >
            Post
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[560px] max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Group Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                <input
                  type="text"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={settingsDesc}
                  onChange={(e) => setSettingsDesc(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="pt-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">Pending Join Requests</p>
                {pendingRequests.length === 0 ? (
                  <p className="text-sm text-gray-500">No pending requests.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-auto pr-1">
                    {pendingRequests.map((r) => {
                      const isApproving = approvingRequestIds.has(r.id);
                      return (
                        <div key={r.id} className="flex items-center justify-between border rounded-md p-2">
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">{r.user?.name || `User ${r.user?.id}`}</span>
                            <span className="text-gray-500"> wants to join</span>
                          </div>
                          <button
                            onClick={async () => {
                              // Check authentication
                              if (!userId) {
                                toast.error("Please log in to approve join requests");
                                return;
                              }

                              try {
                                setApprovingRequestIds((prev) => new Set(prev).add(r.id));
                                
                                // Check if group is soft-deleted by fetching fresh data
                                const userGroups = await getGroupsByUser(userId);
                                const freshGroup = userGroups.find((g) => String(g.id) === String(groupId));
                                
                                if (!freshGroup || freshGroup.deleted_at) {
                                  toast.error("The group is deleted");
                                  // Update local state
                                  setGroupInfo((prev) => ({
                                    ...prev,
                                    deleted_at: freshGroup?.deleted_at || new Date().toISOString()
                                  }));
                                  return;
                                }

                                // Check authorization
                                const hasPermission = await isUserGroupAdminOrModerator(userId, groupId);
                                if (!hasPermission) {
                                  toast.error("Only group admins and moderators can approve join requests");
                                  return;
                                }

                                // Approve the request
                                await approveJoinRequest(r.id);
                                setPendingRequests((prev) => prev.filter((x) => x.id !== r.id));
                                toast.success("Request approved");
                              } catch (e) {
                                // Extract error message
                                let errorMessage = "Failed to approve request";
                                
                                if (e?.message) {
                                  errorMessage = e.message;
                                } else if (e?.response?.data?.errors?.[0]?.message) {
                                  errorMessage = e.response.data.errors[0].message;
                                } else if (e?.response?.data?.errors?.[0]?.extensions?.validation) {
                                  const validationErrors = e.response.data.errors[0].extensions.validation;
                                  const firstError = Object.values(validationErrors)[0];
                                  errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
                                }
                                
                                // Check if error indicates deleted group
                                if (errorMessage.toLowerCase().includes('deleted') || 
                                    errorMessage.toLowerCase().includes('not found')) {
                                  toast.error("The group is deleted");
                                } else {
                                  toast.error(errorMessage);
                                }
                              } finally {
                                setApprovingRequestIds((prev) => {
                                  const newSet = new Set(prev);
                                  newSet.delete(r.id);
                                  return newSet;
                                });
                              }
                            }}
                            disabled={isApproving}
                            className={`px-3 py-1 rounded text-sm text-white ${
                              isApproving
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-cyan-600 hover:bg-cyan-700"
                            }`}
                          >
                            {isApproving ? "Approving..." : "Approve"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-between items-center">
              <button
                onClick={() => {
                  // Check if group is already soft-deleted
                  if (isGroupDeleted()) {
                    toast.error("This group has already been deleted");
                    return;
                  }
                  setShowDeleteConfirm(true);
                }}
                disabled={settingsSaving}
                className={`px-4 py-2 rounded-md text-white transition ${
                  settingsSaving
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Delete Group
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSettings(false)}
                  disabled={settingsSaving}
                  className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Close
                </button>
                <button
                  disabled={settingsSaving}
                  onClick={async () => {
                    // Check authentication
                    if (!userId) {
                      toast.error("Please log in to update the group");
                      return;
                    }

                    // Validate input
                    if (!settingsName.trim()) {
                      toast.error("Group name is required");
                      return;
                    }

                    try {
                      setSettingsSaving(true);
                      
                      // Check if group is soft-deleted by trying to fetch fresh data
                      const userGroups = await getGroupsByUser(userId);
                      const freshGroup = userGroups.find((g) => String(g.id) === String(groupId));
                      
                      if (!freshGroup || freshGroup.deleted_at) {
                        toast.error("The group is deleted");
                        // Update local state
                        setGroupInfo((prev) => ({
                          ...prev,
                          deleted_at: freshGroup?.deleted_at || new Date().toISOString()
                        }));
                        return;
                      }

                      // Check authorization
                      const hasPermission = await isUserGroupAdminOrModerator(userId, groupId);
                      if (!hasPermission) {
                        toast.error("Only group admins and moderators can update the group");
                        return;
                      }

                      // Perform update
                      const updated = await updateGroup(groupId, settingsName.trim() || null, settingsDesc.trim() || null);
                      
                      setGroupInfo((g) => ({ 
                        ...g, 
                        name: updated.name, 
                        description: updated.description,
                        deleted_at: updated.deleted_at || null
                      }));
                      toast.success("Group updated");
                      setShowSettings(false);
                    } catch (e) {
                      // Extract and display error message
                      let errorMessage = "Failed to update group";
                      
                      if (e?.message) {
                        errorMessage = e.message;
                      } else if (e?.response?.data?.errors?.[0]?.message) {
                        errorMessage = e.response.data.errors[0].message;
                      }
                      
                      // Check if error indicates deleted group
                      if (errorMessage.toLowerCase().includes('deleted') || 
                          errorMessage.toLowerCase().includes('not found')) {
                        toast.error("The group is deleted");
                      } else {
                        toast.error(errorMessage);
                      }
                    } finally {
                      setSettingsSaving(false);
                    }
                  }}
                  className={`px-4 py-2 rounded-md text-white ${
                    settingsSaving
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-cyan-600 hover:bg-cyan-700"
                  }`}
                >
                  {settingsSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-500 text-center">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="text-gray-500 text-center">No posts yet. Be the first to post!</p>
        ) : (
          posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              isGroupDeleted={isGroupDeleted()}
            />
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">Delete Group</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={deleteLoading}
              >
                ×
              </button>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <span className="font-semibold">{groupInfo?.name}</span>? 
              This action cannot be undone. All posts and members will be removed from this group.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Check authentication
                  if (!userId) {
                    toast.error("Please log in to delete the group");
                    setShowDeleteConfirm(false);
                    return;
                  }

                  try {
                    setDeleteLoading(true);
                    
                    // Check if group is already soft-deleted by fetching fresh data
                    const userGroups = await getGroupsByUser(userId);
                    const freshGroup = userGroups.find((g) => String(g.id) === String(groupId));
                    
                    if (!freshGroup || freshGroup.deleted_at) {
                      toast.error("The group is deleted");
                      // Update local state
                      setGroupInfo((prev) => ({
                        ...prev,
                        deleted_at: freshGroup?.deleted_at || new Date().toISOString()
                      }));
                      setShowDeleteConfirm(false);
                      return;
                    }

                    // Check authorization
                    const hasPermission = await isUserGroupAdminOrModerator(userId, groupId);
                    if (!hasPermission) {
                      toast.error("Only group admins and moderators can delete the group");
                      setShowDeleteConfirm(false);
                      return;
                    }

                    // Perform deletion
                    await deleteGroup(groupId);
                    toast.success("Group deleted successfully");
                    setShowDeleteConfirm(false);
                    setShowSettings(false);
                    // Redirect to groups page after a short delay
                    setTimeout(() => {
                      navigate("/group");
                    }, 1000);
                  } catch (e) {
                    // Extract error message
                    let errorMessage = "Failed to delete group";
                    
                    if (e?.message) {
                      errorMessage = e.message;
                    } else if (e?.response?.data?.errors?.[0]?.message) {
                      errorMessage = e.response.data.errors[0].message;
                    } else if (e?.response?.data?.errors?.[0]?.extensions?.validation) {
                      const validationErrors = e.response.data.errors[0].extensions.validation;
                      const firstError = Object.values(validationErrors)[0];
                      errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
                    }
                    
                    // Check if error indicates deleted group
                    if (errorMessage.toLowerCase().includes('deleted') || 
                        errorMessage.toLowerCase().includes('not found')) {
                      toast.error("The group is deleted");
                    } else {
                      toast.error(errorMessage);
                    }
                    
                    setShowDeleteConfirm(false);
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
                disabled={deleteLoading}
                className={`px-4 py-2 rounded-md text-white ${
                  deleteLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {deleteLoading ? "Deleting..." : "Delete Group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

