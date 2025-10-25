import React, { useState } from "react";
import SectionHeader from "./SectionHeader";
import EditableField from "./EditableField";

export default function EndSection({ isActive, onClick }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <div className="mt-8 group">
      <SectionHeader
        title="Màn hình kết thúc"
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
          className={`bg-sky-50 border-2 rounded-lg p-8 transition-colors duration-300 shadow-lg ${
            isActive
              ? "border-violet-600"
              : "border-transparent group-hover:border-violet-600"
          }`}
        >
          <EditableField
            placeholder="Enter your end message here."
            inputClassName="text-lg text-gray-500 mb-6"
            isTextarea
          />
          <button className="bg-emerald-500 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-600 transition-colors">
            Hoàn thành
          </button>
        </div>
      </div>
    </div>
  );
}
