import React, { useState } from "react";
import SectionHeader from "./SectionHeader";
import EditableField from "./EditableField";
import { GlobeIcon, ChevronDownIcon, ReturnIcon } from "../icons";

export default function WelcomeSection({ isActive, onClick }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <div className="mb-8 group">
      <SectionHeader
        title="Màn hình chào mừng"
        isCollapsed={isCollapsed}
        onClick={() => setIsCollapsed(!isCollapsed)}
      />
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isCollapsed ? "max-h-0" : "max-h-[1000px]"
        }`}
        onClick={onClick}
      >
        <div
          className={`bg-violet-50 border-2 rounded-lg p-8 transition-colors duration-300 shadow-lg ${
            isActive
              ? "border-violet-600"
              : "border-transparent group-hover:border-violet-600"
          }`}
        >
          <div className="mb-8 text-left">
            <a
              href="#"
              className="text-sm text-violet-600 font-semibold hover:underline"
            >
              <GlobeIcon />
              Thay đổi ngôn ngữ Tiếng Việt - Tiếng Việt
              <ChevronDownIcon />
            </a>
          </div>
          <EditableField
            placeholder="Welcome title"
            inputClassName="text-4xl font-bold text-gray-800 mb-4"
          />
          <EditableField
            placeholder="Welcome description"
            inputClassName="text-lg text-gray-600 mb-4"
            isTextarea
          />
          <p className="text-gray-500 mb-6 text-left">
            Có 1 câu hỏi trong cuộc khảo sát này.
          </p>
          <div className="flex items-center">
            <button className="bg-emerald-500 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-600 transition-colors">
              Bắt đầu khảo sát
            </button>
            <span className="ml-4 text-gray-600">
              hoặc nhấn
              <ReturnIcon />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
