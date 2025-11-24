import React from "react";

export default function SettingsPanel({ tab = "publish", onSelect }) {
  const Item = ({ value, title }) => {
    const active = tab === value;
    return (
      <button
        type="button"
        onClick={() => onSelect(value)}
        className={[
          "w-full text-left rounded-md px-3 py-2 mb-1 transition-colors",
          active
            ? "bg-violet-600 text-white hover:bg-violet-700"
            : "hover:bg-gray-100 text-gray-800",
        ].join(" ")}
      >
        {title}
      </button>
    );
  };

  return (
    // phẳng: không border/bo góc; hòa nền panel cha
    <div className="w-full">
      <div className="p-2">
        <Item value="general" title="Tổng quát" />
        <Item value="publish" title="Xuất bản và truy cập" />
      </div>
    </div>
  );
}
