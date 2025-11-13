import React, { useState } from "react";

export default function EndSection({ isActive, onClick }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mt-8 group">
      {/* Header */}
      <div
        className="flex items-center text-gray-600 mb-4 cursor-pointer"
        onClick={onClick} // không toggle
      >
        <button
          type="button"
          className="p-1 -ml-1"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed((v) => !v);
          }}
          aria-label={collapsed ? "Mở rộng" : "Thu gọn"}
        >
          <div
            className={`transition-transform duration-500 ease-in-out ${
              collapsed ? "rotate-180" : "rotate-0"
            }`}
          >
            {/* Chevron Up */}
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
        </button>

        <h2 className="text-md font-semibold ml-2 mr-3">Màn hình kết thúc</h2>
      </div>

      {/* Nội dung */}
      <div className="relative">
        <div className="absolute inset-0 rounded-sm shadow-[0_2px_10px_-2px_rgba(0,0,0,0.25)] pointer-events-none"></div>

        <div
          className={`transition-all duration-500 ease-in-out ${
            collapsed
              ? "max-h-0 overflow-hidden opacity-0"
              : "max-h-[1000px] overflow-hidden opacity-100"
          }`}
        >
          <div
            className={`bg-sky-100 rounded-lg transition-all duration-500 ease-in-out border-2 ${
              collapsed ? "p-0" : "p-8"
            } ${
              isActive
                ? "border-violet-600"
                : "border-transparent group-hover:border-violet-600"
            }`}
            onClick={onClick}
          >
            <textarea
              placeholder="Nhập thông báo kết thúc của bạn tại đây."
              className="w-full bg-transparent focus:outline-none rounded-sm p-2 -ml-2 focus:bg-black/5 transition-colors duration-200 resize-none text-lg text-gray-900 mb-6 italic"
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
