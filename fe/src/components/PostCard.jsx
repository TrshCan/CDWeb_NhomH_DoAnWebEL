import React from "react";
export default function PostCard({ post }) {
  return (
    <div className="post bg-white rounded-lg shadow p-4">
      {/* Header (avatar + user info) */}
      <div className="flex items-center space-x-2">
        <div className="w-10 h-10 bg-cyan-600 rounded-full"></div>
        <div>
          <p className="font-semibold text-cyan-600">{post.user}</p>
          <p className="text-gray-500 text-sm">{post.time}</p>
        </div>
      </div>

      {/* Content */}
      <p className="mt-2">{post.content}</p>

      {/* Optional Media */}
      {post.media && (
        <div
          className="mt-2"
          dangerouslySetInnerHTML={{ __html: post.media }}
        />
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4 mt-2 text-gray-500">
        <button title="Like" className="hover:text-cyan-600">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            ></path>
          </svg>
        </button>

        <button title="Comment" className="hover:text-cyan-600">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            ></path>
          </svg>
        </button>

        <button title="Share" className="hover:text-cyan-600">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
