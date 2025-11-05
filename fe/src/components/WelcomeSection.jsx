import React, { useState } from "react";

export default function WelcomeSection({ isActive, onClick }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mb-8 group">
      {/* Header */}
      <div
        className="flex items-center text-gray-600 mb-4 cursor-pointer"
        onClick={onClick} // chỉ chọn section, không toggle
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
            className={`transition-transform duration-300 ${
              collapsed ? "rotate-180" : "rotate-0"
            }`}
          >
            {/* Chevron Up: lên = mở. Xoay 180 khi thu = xuống */}
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

        <h2 className="text-md font-semibold ml-2 mr-3">Màn hình chào mừng</h2>
      </div>

      {/* Nội dung */}
      <div className="relative">
        <div className="absolute inset-0 rounded-sm shadow-[0_2px_10px_-2px_rgba(0,0,0,0.25)] pointer-events-none"></div>

        <div
          className={`transition-all duration-500 ease-in-out ${
            collapsed
              ? "max-h-0 overflow-hidden"
              : "max-h-[1000px] overflow-hidden"
          }`}
        >
          <div
            className={`bg-violet-100 rounded-sm p-8 transition-all duration-300 border-2 ${
              isActive
                ? "border-violet-600"
                : "border-transparent group-hover:border-violet-600"
            }`}
            onClick={onClick}
          >
            <div className="mb-8 text-left">
              <a
                href="#"
                className="text-sm text-violet-600 font-semibold hover:underline"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 inline-block text-violet-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9m-9 9a9 9 0 00-9-9"
                  />
                </svg>
                Thay đổi ngôn ngữ Tiếng Việt - Tiếng Việt
              </a>
            </div>

            <input
              placeholder="Tiêu đề chào mừng"
              className="w-full bg-transparent focus:outline-none rounded-md p-2 -ml-2 focus:bg-black/5 transition-colors duration-200 text-4xl font-bold font-['Playfair_Display'] mb-4"
              type="text"
            />

            <textarea
              placeholder="Mô tả chào mừng"
              className="w-full bg-transparent focus:outline-none rounded-md p-2 -ml-2 focus:bg-black/5 transition-colors duration-200 text-lg mb-4 resize-none"
              rows="1"
            ></textarea>

            <p className="text-gray-500 mb-6 text-left">
              Có 1 câu hỏi trong cuộc khảo sát này.
            </p>

            <div className="flex items-center">
              <button className="bg-emerald-500 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-600 transition-colors">
                Bắt đầu khảo sát
              </button>
              <span className="ml-4 text-gray-600">
                hoặc nhấn
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 inline-block ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 15l-3-3m0 0l3-3m-3 3h12a6 6 0 000-12h-3"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
