import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { updatePost, deletePost, toggleLike } from "../api/graphql/post";

export default function PostCard({ post, onDeleted, onLikeUpdate, disableCommentNavigate = false, onReply = null }) {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [commentsCount, setCommentsCount] = useState(post.children?.length || 0);

  const currentUserId = (() => {
    try {
      const u = localStorage.getItem("user");
      const userId = localStorage.getItem("userId");
      return userId || (u ? JSON.parse(u)?.id : null);
    } catch { return null; }
  })();
  const ownerId = post.userId || post.user_id || null;
  const isOwner = ownerId && String(ownerId) === String(currentUserId);
  const handleCardClick = () => {
    if (!disableCommentNavigate) {
      navigate(`/post/${post.id}`);
    }
  };

  // Check if current user liked this post
  useEffect(() => {
    if (currentUserId && post.likes) {
      const liked = post.likes.some(like => 
        String(like.user_id || like.user?.id) === String(currentUserId)
      );
      setIsLiked(liked);
    }
  }, [currentUserId, post.likes]);

  useEffect(() => {
    setLikesCount(post.likes?.length || 0);
    setCommentsCount(post.children?.length || 0);
  }, [post.likes, post.children]);

  const maxVisible = 4;
  const hasExtra = post.media?.length > maxVisible;
  const visibleMedia = hasExtra
    ? post.media.slice(0, maxVisible)
    : post.media || [];

  // Log media data for debugging
  useEffect(() => {
    console.log("PostCard media:", post.media);
  }, [post.media]);

  // Helper function to get the correct media URL
  const getMediaUrl = (media) => {
    if (media.url) {
      return media.url;
    } else if (media.filename) {
      return `/storage/media/${media.filename}`;
    } else if (typeof media === "string") {
      return `/storage/media/${media}`;
    }
    console.warn("Invalid media format:", media);
    return "https://via.placeholder.com/150"; // Fallback placeholder
  };

  // Helper function to render media (image or video)
  const getMediaElement = (media, index, className, onClick) => {
    const url = getMediaUrl(media);
    const isVideo = url.endsWith(".mp4");

    if (isVideo) {
      return (
        <video
          key={index}
          src={url}
          controls
          className={className}
          onClick={onClick}
          onError={(e) => console.error("Failed to load video:", e.target.src)}
        />
      );
    }

    return (
      <img
        key={index}
        src={url}
        alt=""
        className={className}
        onClick={onClick}
        onError={(e) => console.error("Failed to load image:", e.target.src)}
      />
    );
  };

  const handleOpen = (index) => {
    setSelectedIndex(index);
    document.body.style.overflow = "hidden"; // prevent scroll
  };

  const handleClose = () => {
    setSelectedIndex(null);
    document.body.style.overflow = "auto"; // restore scroll
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setSelectedIndex(
      (prev) => (prev - 1 + post.media.length) % post.media.length
    );
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev + 1) % post.media.length);
  };

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") handlePrev(e);
      else if (e.key === "ArrowRight") handleNext(e);
      else if (e.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex]);

  if (hidden) return null;

  return (
    <div
      className="post bg-white rounded-lg shadow p-4 relative cursor-pointer hover:bg-gray-50 transition"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disableCommentNavigate) {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center space-x-2">
        <div className="w-10 h-10 bg-cyan-600 rounded-full"></div>
        <div>
          <p className="font-semibold text-cyan-600">{post.user}</p>
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <span>{post.time}</span>
            {post.parent_id && post.parent_user && (
              <>
                <span>·</span>
                <span className="text-cyan-600">
                  Replying to <span className="font-semibold">@{post.parent_user}</span>
                </span>
              </>
            )}
          </div>
        </div>
        </div>
        {/* 3-dots menu */}
        <div className="relative">
          <button
            aria-haspopup="true"
            aria-expanded={menuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="p-1 rounded hover:bg-gray-100"
            title="More options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1 text-sm">
                {isOwner ? (
                  <>
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                        setMenuOpen(false);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await deletePost(post.id);
                          toast.success("Đã xóa bài viết!");
                          if (onDeleted) onDeleted(post.id); else setHidden(true);
                        } catch (e) {
                          console.error(e);
                          const errorMessage = e?.response?.data?.errors?.[0]?.message || e?.message || "Không thể xóa bài viết.";
                          
                          // Kiểm tra nếu là lỗi permission
                          if (errorMessage.includes('không có quyền') || errorMessage.includes('permission') || errorMessage.includes('quyền')) {
                            toast.error(errorMessage);
                          } else {
                            toast.error(errorMessage || "Không thể xóa bài viết. Vui lòng thử lại.");
                          }
                        }
                      }}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      alert(`Following ${post.user} (mock)`);
                    }}
                  >
                    Follow {post.user}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content / Edit */}
      {isEditing ? (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <div className="mt-2 flex gap-2">
            <button
              disabled={saving}
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  setSaving(true);
                  const updated = await updatePost(post.id, editContent.trim());
                  post.content = updated.content;
                  setIsEditing(false);
                } catch (e) {
                  console.error(e);
                  const errorMessage = e?.response?.data?.errors?.[0]?.message || e?.message || "Không thể cập nhật bài viết.";
                  toast.error(errorMessage);
                } finally {
                  setSaving(false);
                }
              }}
              className={`px-3 py-1 rounded text-white ${saving ? "bg-gray-400" : "bg-cyan-600 hover:bg-cyan-700"}`}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(false);
                setEditContent(post.content);
              }}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-gray-800 whitespace-pre-wrap">{post.content}</p>
      )}

      {/* Media grid */}
      {visibleMedia.length > 0 && (
        <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
          {visibleMedia.length === 1 && getMediaElement(
            visibleMedia[0],
            0,
            "w-full h-auto max-h-[600px] object-cover cursor-pointer hover:opacity-90 transition",
            (e) => {
              e.stopPropagation();
              handleOpen(0);
            }
          )}

          {visibleMedia.length === 2 && (
            <div className="grid grid-cols-2 gap-px bg-gray-200">
              {visibleMedia.map((media, i) =>
                getMediaElement(media, i, "w-full h-80 object-cover cursor-pointer hover:opacity-90 transition", (e) => {
                  e.stopPropagation();
                  handleOpen(i);
                })
              )}
            </div>
          )}

          {visibleMedia.length === 3 && (
            <div className="grid grid-cols-2 gap-px bg-gray-200">
              {getMediaElement(visibleMedia[0], 0, "col-span-2 w-full h-72 object-cover cursor-pointer hover:opacity-90 transition", (e) => {
                e.stopPropagation();
                handleOpen(0);
              })}
              {visibleMedia.slice(1).map((media, i) =>
                getMediaElement(media, i + 1, "w-full h-64 object-cover cursor-pointer hover:opacity-90 transition", (e) => {
                  e.stopPropagation();
                  handleOpen(i + 1);
                })
              )}
            </div>
          )}

          {visibleMedia.length === 4 && (
            <div className="grid grid-cols-2 gap-px bg-gray-200 relative">
              {visibleMedia.map((media, i) => {
                const isLast = i === 3 && hasExtra;
                return (
                  <div key={i} className="relative">
                    {getMediaElement(media, i, "w-full h-64 object-cover cursor-pointer hover:opacity-90 transition", (e) => {
                      e.stopPropagation();
                      handleOpen(i);
                    })}
                    {isLast && (
                      <div
                        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center 
                                   text-white text-xl font-semibold cursor-pointer hover:bg-opacity-70"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpen(i);
                        }}
                      >
                        +{post.media.length - maxVisible} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal viewer */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-fadeIn"
          onClick={handleClose}
        >
          {/* Left button */}
          {post.media.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-6 text-cyan-400 text-5xl font-bold px-3 py-1 
                         bg-black/40 rounded-full hover:bg-black/70 hover:scale-110 
                         transition-transform duration-200"
            >
              ‹
            </button>
          )}

          {/* Media */}
          {getMediaElement(post.media[selectedIndex], selectedIndex, "max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-lg animate-zoomIn", (e) => e.stopPropagation())}

          {/* Right button */}
          {post.media.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-6 text-cyan-400 text-5xl font-bold px-3 py-1 
                         bg-black/40 rounded-full hover:bg-black/70 hover:scale-110 
                         transition-transform duration-200"
            >
              ›
            </button>
          )}

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-8 text-cyan-400 text-4xl font-bold 
                       hover:text-cyan-300 hover:scale-110 transition-transform duration-200"
          >
            ×
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-4 mt-3 text-gray-500">
        <button 
          title="Like" 
          onClick={async (e) => {
            e.stopPropagation();
            if (!currentUserId) {
              toast.error("Vui lòng đăng nhập để thích bài viết");
              return;
            }
            try {
              const newLikedState = await toggleLike(post.id, currentUserId);
              setIsLiked(newLikedState);
              setLikesCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));
              if (onLikeUpdate) onLikeUpdate(post.id, newLikedState);
            } catch (e) {
              console.error("Failed to toggle like:", e);
              const errorMessage = e?.response?.data?.errors?.[0]?.message || e?.message || "Không thể thích bài viết.";
              
              // Kiểm tra nếu là lỗi permission
              if (errorMessage.includes('không có quyền') || errorMessage.includes('permission') || errorMessage.includes('quyền')) {
                toast.error(errorMessage);
              } else {
                toast.error(errorMessage || "Không thể thích bài viết. Vui lòng thử lại.");
              }
            }
          }}
          className={`flex items-center gap-1 hover:text-cyan-600 transition-colors ${isLiked ? "text-cyan-600" : ""}`}
        >
          <svg 
            className={`w-5 h-5 ${isLiked ? "fill-current" : "fill-none"}`} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          {likesCount > 0 && <span className="text-sm">{likesCount}</span>}
        </button>

        {onReply ? (
          <button 
            title="Reply" 
            onClick={(e) => {
              e.stopPropagation();
              onReply(post.id, post.user);
            }}
            className="flex items-center gap-1 hover:text-cyan-600 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            <span className="text-sm">Reply</span>
          </button>
        ) : (
          <button 
            title="Comment" 
            onClick={(e) => {
              e.stopPropagation();
              if (!disableCommentNavigate) {
                navigate(`/post/${post.id}`);
              }
            }}
            className={`flex items-center gap-1 hover:text-cyan-600 ${disableCommentNavigate ? 'cursor-default opacity-50' : 'cursor-pointer'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {commentsCount > 0 && <span className="text-sm">{commentsCount}</span>}
          </button>
        )}

        <button
          title="Share"
          className="hover:text-cyan-600"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}