import React from "react";

export default function MoveButtons({ index, totalQuestions, moveQuestionItem, isActive }) {
  if (!isActive) return null;

  return (
    <div
      className="absolute flex flex-col items-center space-y-1"
      style={{
        top: "50%",
        right: "-37px", // 22px icon + 15px khoảng cách
        transform: "translateY(-50%)",
        zIndex: 1000,
        pointerEvents: "auto",
        position: "absolute",
        willChange: "transform", // Tối ưu rendering
      }}
    >
      {/* Up */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          moveQuestionItem(index, "up");
        }}
        disabled={index === 0}
        className={`rounded p-0.5 transition-colors duration-150 shadow ${
          index === 0
            ? "bg-gray-400 opacity-50 cursor-not-allowed"
            : "bg-gray-500 hover:bg-gray-600 active:bg-gray-700"
        }`}
        aria-label="Move up"
        style={{
          width: "22px",
          height: "22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          stroke="white"
          strokeWidth="4.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
          fill="none"
        >
          <polyline points="6 14 12 8 18 14" />
        </svg>
      </button>

      {/* Down */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          moveQuestionItem(index, "down");
        }}
        disabled={index === totalQuestions - 1}
        className={`rounded p-0.5 transition-colors duration-150 shadow ${
          index === totalQuestions - 1
            ? "bg-gray-400 opacity-50 cursor-not-allowed"
            : "bg-gray-500 hover:bg-gray-600 active:bg-gray-700"
        }`}
        aria-label="Move down"
        style={{
          width: "22px",
          height: "22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          stroke="white"
          strokeWidth="4.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
          fill="none"
        >
          <polyline points="6 10 12 16 18 10" />
        </svg>
      </button>
    </div>
  );
}
