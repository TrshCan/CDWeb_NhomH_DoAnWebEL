import React from "react";
import EditableField from "./EditableField";
import { PlusIcon, DuplicateIcon, TrashIcon } from "../icons";

export default function QuestionItem({
  isActive,
  onClick,
  question,
  index,
  totalQuestions,
  moveQuestionItem,
  onDuplicate,
  onDelete,
}) {
  return (
    // Cho phép icon tràn ra ngoài card
    <div className="relative overflow-visible">
      <div
        onClick={onClick}
        className={[
          "group p-6 pb-12 cursor-pointer rounded-sm",
          "transition-shadow duration-150",
          "hover:ring-2 hover:ring-inset hover:ring-violet-600",
          "focus-within:ring-2 focus-within:ring-inset focus-within:ring-violet-600",
          isActive
            ? "ring-2 ring-inset ring-violet-600 z-10 bg-gray-50"
            : "z-0 bg-white",
        ].join(" ")}
      >
        <div className="flex items-baseline">
          <span className="text-violet-600 font-semibold mr-2 whitespace-nowrap">
            {question.id} →
          </span>
          <div className="w-full">
            <EditableField
              placeholder="Nhập câu hỏi của bạn ở đây"
              initialValue={question.text}
              inputClassName="text-lg text-gray-800 font-thin text-[25px]"
            />
            <EditableField
              placeholder="Mô tả trợ giúp tuỳ chọn"
              initialValue={question.helpText}
              inputClassName="text-sm text-gray-700 mt-1 "
            />
          </div>
        </div>

        {isActive && (
          <>
            <div className="mt-10 ml-6">
              <button className="flex items-center text-violet-600 text-sm hover:text-violet-800 transition-colors font-normal">
                <PlusIcon className="h-5 w-5 mr-1" />
                Thêm câu hỏi phụ
              </button>
            </div>
            <div className="absolute bottom-4 right-4 flex items-center space-x-2">
              <button
                className="p-1 rounded-md hover:bg-gray-100"
                title="Duplicate"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate?.(index);
                }}
              >
                <DuplicateIcon />
              </button>
              <button
                className="p-1 rounded-md hover:bg-gray-100"
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(index); // confirm ở App
                }}
              >
                <TrashIcon />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Nút move lên/xuống: giữ nguyên như trước, không thêm icon cạnh dấu ... */}
      <div
        className={[
          "absolute z-50 top-1/2 -right-10 -translate-y-1/2",
          "flex flex-col items-center space-y-1",
          isActive ? "" : "opacity-0 pointer-events-none",
          "group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity",
        ].join(" ")}
      >
        {/* Up */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            moveQuestionItem(index, "up");
          }}
          disabled={index === 0}
          className={`rounded-0.5 p-1 transition-colors duration-150 shadow ${
            index === 0
              ? "bg-gray-400 opacity-50 cursor-not-allowed"
              : "bg-gray-500 hover:bg-gray-600"
          }`}
          aria-label="Move up"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
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
          className={`rounded-0.5 p-1 transition-colors duration-150 shadow ${
            index === totalQuestions - 1
              ? "bg-gray-400 opacity-50 cursor-not-allowed"
              : "bg-gray-500 hover:bg-gray-600"
          }`}
          aria-label="Move down"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
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
    </div>
  );
}
