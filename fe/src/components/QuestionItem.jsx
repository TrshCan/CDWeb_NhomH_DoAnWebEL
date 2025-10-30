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
}) {
  return (
    // Cho phép icon tràn ra ngoài card
    <div className="relative overflow-visible">
      <div
        onClick={onClick}
        // thêm 'group' để có thể hiện icon khi hover
        className={[
          "group p-6 pb-12 cursor-pointer bg-white rounded-sm",
          "transition-shadow duration-150",
          "hover:ring-2 hover:ring-inset hover:ring-violet-600",
          "focus-within:ring-2 focus-within:ring-inset focus-within:ring-violet-600",
          isActive ? "ring-2 ring-inset ring-violet-600 z-10" : "z-0",
        ].join(" ")}
      >
        <div className="flex items-baseline">
          <span className="text-violet-600 font-semibold mr-2 whitespace-nowrap">
            {question.id} →
          </span>
          <div className="w-full">
            <EditableField
              placeholder="Your question here"
              initialValue={question.text}
              inputClassName="text-lg text-gray-800"
            />
            <EditableField
              placeholder="Optional help description"
              initialValue={question.helpText}
              inputClassName="text-sm text-gray-500 mt-1"
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
              <button className="p-1 rounded-md hover:bg-gray-100">
                <DuplicateIcon />
              </button>
              <button className="p-1 rounded-md hover:bg-gray-100">
                <TrashIcon />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Icon vuông, nhỏ, NẰM HẲN BÊN NGOÀI; hiện khi active hoặc hover card */}
      <div
        className={[
          "absolute z-50 top-1/2 -right-10 -translate-y-1/2",
          "flex flex-col items-center space-y-1",
          // ẩn mặc định, hiện khi hover card
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
          className={`rounded-0.5 p-1 transition-colors duration-150 shadow
            ${
              index === 0
                ? "bg-gray-400 opacity-50 cursor-not-allowed"
                : "bg-gray-500 hover:bg-gray-600"
            }`}
          aria-label="Move up"
        >
          {/* icon trắng */}
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
          className={`rounded-0.5 p-1 transition-colors duration-150 shadow
            ${
              index === totalQuestions - 1
                ? "bg-gray-400 opacity-50 cursor-not-allowed"
                : "bg-gray-500 hover:bg-gray-600"
            }`}
          aria-label="Move down"
        >
          {/* icon trắng */}
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
