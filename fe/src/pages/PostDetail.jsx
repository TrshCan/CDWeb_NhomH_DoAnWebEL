import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PostCard from "../components/PostCard";
import { getPostById, createComment, toggleLike } from "../api/graphql/post";
import { getUserProfile } from "../api/graphql/user";

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

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null); // { id, user }

  useEffect(() => {
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
        setUser(null);
      }
    };

    checkLoginStatus();
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const data = await getPostById(id);
        
        // Map post data to match PostCard format
        const mappedPost = {
          id: data.id,
          type: data.type,
          user: data.user?.name || "Anonymous",
          userId: data.user?.id,
          time: timeAgo(data.created_at),
          content: data.content,
          media: data.media
            ? data.media.map((m) =>
                typeof m === "string"
                  ? { filename: m }
                  : m.url
                  ? { url: m.url }
                  : { filename: m.filename }
              )
            : [],
          likes: data.likes || [],
          children: data.children ? data.children.map((child) => ({
            ...child,
            children: child.children || [],
          })) : [],
        };
        
        setPost(mappedPost);
      } catch (err) {
        console.error("Failed to fetch post:", err);
        toast.error("Failed to load post.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id, navigate]);

  const handleComment = async (replyToId = null) => {
    if (!user) {
      toast.error("Please log in to comment");
      return;
    }

    const text = commentText.trim();
    if (!text && files.length === 0) {
      toast.error("Please enter a comment or add media");
      return;
    }

    try {
      const targetPostId = replyToId || post.id;
      console.log("Creating comment with:", { postId: targetPostId, userId: user.id, text, filesCount: files.length });
      const newComment = await createComment(targetPostId, user.id, text || "", files);
      console.log("Comment created:", newComment);
      toast.success(replyToId ? "Reply posted!" : "Comment posted!");

      // Refresh post data
      const data = await getPostById(id);
      const mappedPost = {
        id: data.id,
        type: data.type,
        user: data.user?.name || "Anonymous",
        userId: data.user?.id,
        time: timeAgo(data.created_at),
        content: data.content,
        media: data.media
          ? data.media.map((m) =>
              typeof m === "string"
                ? { filename: m }
                : m.url
                ? { url: m.url }
                : { filename: m.filename }
            )
          : [],
        likes: data.likes || [],
        children: data.children ? data.children.map((child) => ({
          ...child,
          children: child.children || [],
        })) : [],
      };
      setPost(mappedPost);

      setCommentText("");
      setFiles([]);
      setReplyingTo(null);
      const mediaInput = document.getElementById("commentMediaInput");
      if (mediaInput) mediaInput.value = "";
    } catch (err) {
      console.error("Failed to create comment:", err);
      const errorMessage = err?.response?.data?.errors?.[0]?.message || err?.message || "Failed to post comment.";
      toast.error(errorMessage);
    }
  };

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

  if (loading) {
    return (
      <div className="w-full lg:w-2/3 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading post...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full lg:w-2/3 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Post not found</div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-2/3 space-y-4">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 mb-4"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back
      </button>

      {/* Main Post */}
      <PostCard 
        post={post} 
        onLikeUpdate={async (postId, isLiked) => {
          // Refresh post data after like
          try {
            const data = await getPostById(id);
            const mappedPost = {
              id: data.id,
              type: data.type,
              user: data.user?.name || "Anonymous",
              userId: data.user?.id,
              time: timeAgo(data.created_at),
              content: data.content,
              media: data.media
                ? data.media.map((m) =>
                    typeof m === "string"
                      ? { filename: m }
                      : m.url
                      ? { url: m.url }
                      : { filename: m.filename }
                  )
                : [],
          likes: data.likes || [],
          children: data.children ? data.children.map((child) => ({
            ...child,
            children: child.children || [],
          })) : [],
        };
        setPost(mappedPost);
          } catch (err) {
            console.error("Failed to refresh post:", err);
          }
        }}
      />

      {/* Comment Form */}
      {user && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-cyan-600 rounded-full"></div>
            <p className="font-semibold text-cyan-600 text-sm">{user.name}</p>
            {replyingTo && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>·</span>
                <span>Replying to <span className="font-semibold text-cyan-600">@{replyingTo.user}</span></span>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 resize-none"
            rows="3"
            placeholder={replyingTo ? `Reply to @${replyingTo.user}...` : "Write a comment..."}
          ></textarea>

          {/* Media Preview */}
          {files.length > 0 && (
            <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
              {files.length === 1 && (
                <img
                  src={URL.createObjectURL(files[0])}
                  alt="preview"
                  className="w-full max-h-[400px] object-cover"
                />
              )}

              {files.length > 1 && (
                <div className="grid grid-cols-2 gap-px bg-gray-200">
                  {files.slice(0, 4).map((f, i) => (
                    <img
                      key={i}
                      src={URL.createObjectURL(f)}
                      alt="preview"
                      className="w-full h-48 object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="cursor-pointer text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1 text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Media
                <input
                  id="commentMediaInput"
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
                    document.getElementById("commentMediaInput").value = "";
                  }}
                  className="text-sm text-red-500 hover:underline"
                >
                  Clear Media
                </button>
              )}
            </div>

            <button
              onClick={() => handleComment(replyingTo?.id)}
              className="bg-cyan-600 text-white px-4 py-2 rounded-full hover:bg-cyan-700 active:scale-95 transition-all text-sm"
            >
              {replyingTo ? "Reply" : "Comment"}
            </button>
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Comments ({post.children?.length || 0})
        </h3>
        {post.children && post.children.length > 0 ? (
          post.children.map((comment) => {
            // Recursive function to render nested comments
            const renderComment = (commentData, depth = 0, parentComment = null) => {
              // Determine parent_user: 
              // - If comment has parent_id and it's not the main post, it's a reply to another comment
              // - Use parent comment's user if available, otherwise use parent from query, otherwise main post user
              const isReplyToComment = commentData.parent_id && String(commentData.parent_id) !== String(post.id);
              const parentUser = isReplyToComment
                ? (parentComment?.user || commentData.parent?.user?.name || post.user)
                : post.user;
              
              const mapped = {
                id: commentData.id,
                type: commentData.type,
                user: commentData.user?.name || "Anonymous",
                userId: commentData.user?.id,
                time: timeAgo(commentData.created_at),
                content: commentData.content,
                parent_id: commentData.parent_id || post.id,
                parent_user: parentUser,
                media: commentData.media
                  ? commentData.media.map((m) =>
                      typeof m === "string"
                        ? { filename: m }
                        : m.url
                        ? { url: m.url }
                        : { filename: m.filename }
                    )
                  : [],
                likes: commentData.likes || [],
                children: commentData.children || [],
              };
              
              return (
                <div key={commentData.id} className={depth > 0 ? "ml-8 mt-2" : "ml-4"}>
                  <PostCard 
                    post={mapped} 
                    onReply={(replyId, replyUser) => setReplyingTo({ id: replyId, user: replyUser })}
                  />
                  {mapped.children && mapped.children.length > 0 && (
                    <div className="mt-2">
                      {mapped.children.map((child) => renderComment(child, depth + 1, mapped))}
                    </div>
                  )}
                </div>
              );
            };
            
            return renderComment(comment);
          })
        ) : (
          <p className="text-gray-500 text-center py-8">No comments yet.</p>
        )}
      </div>
    </div>
  );
}

