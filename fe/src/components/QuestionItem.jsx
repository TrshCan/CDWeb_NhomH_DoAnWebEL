import React from "react";
import EditableField from "./EditableField";
import {
  PlusIcon,
  DuplicateIcon,
  TrashIcon,
  ChevronUpSideIcon,
  ChevronDownSideIcon,
} from "../icons";

export default function QuestionItem({
  isActive,
  onClick,
  question,
  index,
  totalQuestions,
  moveQuestionItem,
}) {
  return (
    <div className="relative mb-1">
      <div
        onClick={onClick}
        className={`bg-white border-2 rounded-lg shadow-lg p-6 pb-12 transition-colors duration-300 cursor-pointer ${
          isActive ? "border-violet-600" : "border-transparent"
        } hover:border-violet-600`}
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
            <div className="mt-6">
              <button className="flex items-center text-violet-600 font-semibold text-sm hover:text-violet-800 transition-colors">
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
      {isActive && (
        <div className="absolute top-1/2 -right-12 -translate-y-1/2 flex flex-col items-center space-y-1 bg-white p-1 rounded-md shadow-lg border border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              moveQuestionItem(index, "up");
            }}
            disabled={index === 0}
            className={index === 0 ? "opacity-50 cursor-not-allowed" : ""}
          >
            <ChevronUpSideIcon />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              moveQuestionItem(index, "down");
            }}
            disabled={index === totalQuestions - 1}
            className={
              index === totalQuestions - 1
                ? "opacity-50 cursor-not-allowed"
                : ""
            }
          >
            <ChevronDownSideIcon />
          </button>
        </div>
      )}
    </div>
  );
}
