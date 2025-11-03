import React, { useState } from "react";

export default function EndSection({ isActive, onClick }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mt-8 group">
      {/* Header */}
      <div
        className="flex items-center text-gray-600 mb-4 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div
          className={`transition-transform duration-300 ${
            collapsed ? "-rotate-90" : "rotate-0"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 15l7-7 7 7"
            />
          </svg>
        </div>
        <h2 className="text-md font-semibold ml-2 mr-3">Màn hình kết thúc</h2>
      </div>

      {/* Nội dung */}
      <div className="relative">
        {/* LAYER BÓNG */}
        <div className="absolute inset-0 rounded-lg shadow-[0_2px_10px_-2px_rgba(0,0,0,0.25)] pointer-events-none"></div>

        <div
          className={`transition-all duration-500 ease-in-out ${
            collapsed
              ? "max-h-0 overflow-hidden"
              : "max-h-[1000px] overflow-hidden"
          }`}
        >
          <div
            className={`bg-sky-100 rounded-lg p-8 transition-all duration-300 border-2 ${
              isActive
                ? "border-violet-600"
                : "border-transparent group-hover:border-violet-600"
            }`}
            onClick={onClick}
          >
            <textarea
              placeholder="Enter your end message here."
              className="w-full bg-transparent focus:outline-none rounded-md p-2 -ml-2 focus:bg-black/5 transition-colors duration-200 resize-none text-lg text-gray-500 mb-6"
              rows="1"
            ></textarea>

            <button className="bg-emerald-500 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-600 transition-colors">
              Hoàn thành
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
