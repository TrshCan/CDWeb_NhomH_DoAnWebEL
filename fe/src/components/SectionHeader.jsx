// SectionHeader.jsx
import React from "react";
import { ChevronUpIcon } from "../icons";

export default function SectionHeader({
  renderTitle,
  title,
  badge,
  children,
  onToggle,      // chỉ icon gọi
  onClick,       // fallback (giữ tương thích)
  isCollapsed,   // nguồn sự thật để đồng bộ icon
}) {
  const handleToggle = onToggle ?? onClick;

  return (
    <div className="flex items-center text-gray-600 mb-4 select-none">
      <button
        type="button"
        aria-label={isCollapsed ? "Mở rộng" : "Thu gọn"}
        aria-expanded={!isCollapsed}
        onClick={(e) => { e.stopPropagation(); handleToggle?.(e); }}
        className="p-1 -ml-1 cursor-pointer"
      >
        <div
          // dùng cùng duration và easing với phần thân để “chạy cùng lúc”
          className={`transition-transform duration-500 ease-in-out ${
            isCollapsed ? "rotate-180" : "rotate-0"
          }`}
        >
          {/* ChevronUp mặc định hướng lên; khi thu (isCollapsed=true) xoay 180° => hướng xuống */}
          <ChevronUpIcon />
        </div>
      </button>

      <div className="ml-1 mr-3">
        {renderTitle ?? (
          <h2 className="text-md font-semibold px-2 py-1 rounded">{title}</h2>
        )}
      </div>

      {badge != null && (
        <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-md">
          {badge}
        </span>
      )}

      <div className="ml-auto">{children}</div>
    </div>
  );
}
