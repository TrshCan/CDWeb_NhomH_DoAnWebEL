import React, { useState } from "react";

export default function StructurePanel({
  questionItems = [],
  activeSection,
  onSelect,
  groupTitle = "Nhóm câu hỏi đầu tiên...",
}) {
  const [collapsed, setCollapsed] = useState(false);

  const Row = ({ title, active, level = 1, onClick, icon }) => {
    // Nếu là cấp 2 (câu hỏi con)
    const isQuestion = level === 2;

    return (
      <button
        type="button"
        onClick={onClick}
        className={[
          "w-full text-left rounded-md px-3 py-2 mb-1 transition-colors select-none flex items-center gap-2 text-sm",
          isQuestion ? "pl-6" : "pl-3",
          isQuestion
            ? active
              ? "bg-violet-600 text-white"
              : "text-gray-800 hover:bg-gray-100"
            : "text-gray-800 hover:bg-gray-100", // phần khác chỉ hover xám
        ].join(" ")}
      >
        {icon}
        <span className="truncate">{title}</span>
      </button>
    );
  };

  return (
    // Panel phẳng, hòa nền: KHÔNG border/bo góc, chỉ là danh sách
    <div className="w-full text-sm">
      {/* Hàng: Chào mừng */}
      <Row
        title="Chào mừng"
        active={activeSection === "welcome"}
        onClick={() => onSelect("welcome")}
        icon={
          // icon ghim tròn
          <span className="inline-block w-4 h-4 rounded-full border border-gray-400" />
        }
      />

      {/* Nhóm câu hỏi */}
      <div className="px-1 py-2">
        <div className="flex items-center gap-2 text-gray-700 px-2 mb-1">
          {/* caret thu gọn/mở rộng */}
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Thu gọn/Mở rộng"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={
                "w-4 h-4 transition-transform " +
                (collapsed ? "-rotate-90" : "rotate-0")
              }
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 9l6 6 6-6"
              />
            </svg>
          </button>

          {/* icon clipboard */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-gray-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 16h8M8 12h8M8 8h8M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
            />
          </svg>

          <div className="font-medium truncate">{groupTitle}</div>
        </div>

        {!collapsed && (
          <div className="mt-1 text-sm">
            {questionItems.map((q, idx) => {
              const qid = q?.id ?? idx + 1;
              const key = "question-" + qid;

              return (
                <Row
                  key={key}
                  title={q?.title || q?.text || "Câu hỏi của bạn là gì?"}
                  level={2}
                  active={activeSection === key}
                  onClick={() => onSelect(key)}
                  icon={
                    // icon list 3 dòng
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 6h16M4 12h10M4 18h16"
                      />
                    </svg>
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Hàng: Kết thúc */}
      <Row
        title="Kết thúc"
        active={activeSection === "end"}
        onClick={() => onSelect("end")}
        icon={
          <span className="inline-block w-4 h-4 rounded-full border border-gray-400" />
        }
      />
    </div>
  );
}
