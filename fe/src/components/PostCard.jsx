import React, { useState } from "react";

export default function PostCard({ post }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const maxVisible = 4;
  const hasExtra = post.media?.length > maxVisible;
  const visibleMedia = hasExtra
    ? post.media.slice(0, maxVisible)
    : post.media || [];

  const handleOpen = (index) => setSelectedIndex(index);
  const handleClose = () => setSelectedIndex(null);
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

  return (
    <div className="post bg-white rounded-lg shadow p-4 relative">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <div className="w-10 h-10 bg-cyan-600 rounded-full"></div>
        <div>
          <p className="font-semibold text-cyan-600">{post.user}</p>
          <p className="text-gray-500 text-sm">{post.time}</p>
        </div>
      </div>

      {/* Content */}
      <p className="mt-2 text-gray-800 whitespace-pre-wrap">{post.content}</p>

      {/* Media grid */}
      {visibleMedia.length > 0 && (
        <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
          {visibleMedia.length === 1 && (
            <img
              src={visibleMedia[0].url}
              alt=""
              onClick={() => handleOpen(0)}
              className="w-full h-auto max-h-[600px] object-cover cursor-pointer"
            />
          )}

          {visibleMedia.length === 2 && (
            <div className="grid grid-cols-2 gap-px bg-gray-200">
              {visibleMedia.map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  alt=""
                  onClick={() => handleOpen(i)}
                  className="w-full h-80 object-cover cursor-pointer"
                />
              ))}
            </div>
          )}

          {visibleMedia.length === 3 && (
            <div className="grid grid-cols-2 gap-px bg-gray-200">
              <img
                src={visibleMedia[0].url}
                alt=""
                onClick={() => handleOpen(0)}
                className="col-span-2 w-full h-72 object-cover cursor-pointer"
              />
              {visibleMedia.slice(1).map((img, i) => (
                <img
                  key={i + 1}
                  src={img.url}
                  alt=""
                  onClick={() => handleOpen(i + 1)}
                  className="w-full h-64 object-cover cursor-pointer"
                />
              ))}
            </div>
          )}

          {visibleMedia.length === 4 && (
            <div className="grid grid-cols-2 gap-px bg-gray-200 relative">
              {visibleMedia.map((img, i) => {
                const isLast = i === 3 && hasExtra;
                return (
                  <div key={i} className="relative">
                    <img
                      src={img.url}
                      alt=""
                      onClick={() => handleOpen(i)}
                      className="w-full h-64 object-cover cursor-pointer"
                    />
                    {isLast && (
                      <div
                        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xl font-semibold cursor-pointer"
                        onClick={() => handleOpen(i)}
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
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={handleClose}
        >
          {/* Left button */}
          {post.media.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-6 text-white text-4xl font-bold px-3 py-1 bg-black bg-opacity-30 rounded-full hover:bg-opacity-60"
            >
              ‹
            </button>
          )}

          {/* Image */}
          <img
            src={post.media[selectedIndex].url}
            alt="Full view"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Right button */}
          {post.media.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-6 text-white text-4xl font-bold px-3 py-1 bg-black bg-opacity-30 rounded-full hover:bg-opacity-60"
            >
              ›
            </button>
          )}

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-8 text-white text-3xl font-bold hover:text-gray-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-4 mt-3 text-gray-500">
        <button title="Like" className="hover:text-cyan-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        <button title="Comment" className="hover:text-cyan-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>

        <button title="Share" className="hover:text-cyan-600">
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
