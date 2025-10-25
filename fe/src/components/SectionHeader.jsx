import React from "react";
import { ChevronUpIcon } from "../icons";

export default function SectionHeader({
  title,
  badge,
  children,
  onClick,
  isCollapsed,
}) {
  return (
    <div
      className="flex items-center text-gray-600 mb-4 cursor-pointer"
      onClick={onClick}
    >
      <div
        className={`transition-transform duration-300 ${
          !isCollapsed ? "rotate-0" : "-rotate-90"
        }`}
      >
        <ChevronUpIcon />
      </div>
      <h2 className="text-md font-semibold ml-2 mr-3">{title}</h2>
      {badge && (
        <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-md">
          {badge}
        </span>
      )}
      <div className="ml-auto">{children}</div>
    </div>
  );
}
