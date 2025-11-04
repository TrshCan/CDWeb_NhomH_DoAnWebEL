import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import PostCard from "./PostCard";
import { getPostsByGroup, createPost } from "../api/graphql/post";
import { getGroupsByUser, isUserMemberOfGroup, isUserGroupAdminOrModerator, updateGroup } from "../api/graphql/group";
import { getPendingJoinRequestsByGroup } from "../api/graphql/joinRequest";

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
  const [pendingRequests, setPendingRequests] = useState([]);

  // Get user info
  const getUserFromStorage = () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) return null;
      return JSON.parse(userData);
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  };

  const user = getUserFromStorage();

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
        if (!user?.id) {
          toast.error("Please log in to view this group");
          setAccessDenied(true);
          setLoading(false);
          setTimeout(() => navigate("/group"), 2000);
          return;
        }

        // Check if user is a member of this group
        const isMember = await isUserMemberOfGroup(user.id, groupId);
        
        if (!isMember) {
          toast.error("You don't have access to this group");
          setAccessDenied(true);
          setLoading(false);
          setTimeout(() => navigate("/group"), 2000);
          return;
        }

        setIsAuthorized(true);
        
        // Fetch group info from user's groups
        const userGroups = await getGroupsByUser(user.id);
        const group = userGroups.find((g) => String(g.id) === String(groupId));
        
        if (group) {
          setGroupInfo({
            id: group.id,
            name: group.name,
            description: group.description,
            code: group.code,
            created_by: group.created_by,
          });
        } else {
          // Fallback: group exists and user is member but not in their groups list
          setGroupInfo({
            id: groupId,
            name: "Group",
            description: "",
            code: "",
            created_by: undefined,
          });
        }

        // Determine management permission (admin/moderator or creator)
        const canManageRes = await isUserGroupAdminOrModerator(user.id, groupId);
        const isCreator = group?.created_by && String(group.created_by) === String(user.id);
        setCanManage(canManageRes || isCreator);

        // Fetch posts for this group
        const groupPosts = await getPostsByGroup(groupId);
        setPosts(
          groupPosts.map((p) => ({
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
          }))
        );
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
  }, [groupId, user?.id, navigate]);

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

    if (!user?.id) {
      toast.error("Please log in to create a post");
      return;
    }

    try {
      const input = {
        user_id: user.id,
        type: "normal_post",
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
      toast.error("Failed to create post.");
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
              setSettingsName(groupInfo?.name || "");
              setSettingsDesc(groupInfo?.description || "");
              try {
                const reqs = await getPendingJoinRequestsByGroup(groupId);
                setPendingRequests(reqs);
              } catch {}
              setShowSettings(true);
            }}
            className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 p-2 rounded-full transition"
            title="Group settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567l-.174 1.01a8.26 8.26 0 0 0-1.285.744l-.93-.54a1.875 1.875 0 0 0-2.55.682l-.75 1.299a1.875 1.875 0 0 0 .435 2.385l.83.679a8.266 8.266 0 0 0 0 1.49l-.83.679a1.875 1.875 0 0 0-.435 2.385l.75 1.299a1.875 1.875 0 0 0 2.55.682l.93-.54c.4.3.83.555 1.285.744l.174 1.01c.151.904.933 1.567 1.85 1.567h1.5c.917 0 1.699-.663 1.85-1.567l.174-1.01c.455-.189.885-.444 1.285-.744l.93.54a1.875 1.875 0 0 0 2.55-.682l.75-1.299a1.875 1.875 0 0 0-.435-2.385l-.83-.679c.04-.492.04-.998 0-1.49l.83-.679a1.875 1.875 0 0 0 .435-2.385l-.75-1.299a1.875 1.875 0 0 0-2.55-.682l-.93.54a8.26 8.26 0 0 0-1.285-.744l-.174-1.01A1.875 1.875 0 0 0 12.578 2.25h-1.5Zm.75 8.25a2.25 2.25 0 1 0-4.5 0 2.25 2.25 0 0 0 4.5 0Z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Post Upload Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-10 h-10 bg-cyan-600 rounded-full"></div>
          <p className="font-semibold text-cyan-600">
            {user?.name || "Anonymous"}
          </p>
        </div>

        <textarea
          id="groupPostInput"
          className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 resize-none"
          rows="4"
          placeholder="What's happening in this group?"
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
                id="groupMediaInput"
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
                  const mediaInput = document.getElementById("groupMediaInput");
                  if (mediaInput) mediaInput.value = "";
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
                    {pendingRequests.map((r) => (
                      <div key={r.id} className="flex items-center justify-between border rounded-md p-2">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">{r.user?.name || `User ${r.user?.id}`}</span>
                          <span className="text-gray-500"> wants to join</span>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const mutation = `mutation($id: ID!){ approveJoinRequest(id:$id){ id status user{ id name } group{ id } } }`;
                              await fetch("http://localhost:8000/graphql", {
                                method: "POST",
                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
                                body: JSON.stringify({ query: mutation, variables: { id: r.id.toString() } })
                              });
                              setPendingRequests((prev) => prev.filter((x) => x.id !== r.id));
                              toast.success("Request approved");
                            } catch (e) {
                              toast.error("Failed to approve request");
                            }
                          }}
                          className="bg-cyan-600 text-white px-3 py-1 rounded hover:bg-cyan-700 text-sm"
                        >
                          Approve
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300">Close</button>
              <button
                disabled={settingsSaving}
                onClick={async () => {
                  try {
                    setSettingsSaving(true);
                    const updated = await updateGroup(groupId, settingsName.trim() || null, settingsDesc.trim() || null);
                    setGroupInfo((g) => ({ ...g, name: updated.name, description: updated.description }));
                    toast.success("Group updated");
                    setShowSettings(false);
                  } catch (e) {
                    toast.error(e.message || "Failed to update group");
                  } finally {
                    setSettingsSaving(false);
                  }
                }}
                className={`px-4 py-2 rounded-md text-white ${settingsSaving ? "bg-gray-400" : "bg-cyan-600 hover:bg-cyan-700"}`}
              >
                {settingsSaving ? "Saving..." : "Save"}
              </button>
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
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </main>
  );
}

