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
  onTextChange,
}) {
  const hasImage = !!question?.image;

  return (
    <div className="relative" style={{ overflow: 'visible', position: 'relative', width: '100%' }}>
      {/* Dấu * cho câu hỏi bắt buộc (chỉ hiện khi Bật/true) */}
      {question?.required === true && (
        <span className="absolute top-2 right-4 z-50 text-red-500 text-[25px] font-bold select-none pointer-events-none">
          *
        </span>
      )}

      {/* ======================= NÚT MOVE LÊN/XUỐNG - ĐẶT BÊN NGOÀI ======================= */}
      {isActive && (
        <div
          className="absolute flex flex-col items-center space-y-1"
          style={{ 
            top: '50%', 
            right: '-37px', // 22px icon + 15px khoảng cách
            transform: 'translateY(-50%)',
            zIndex: 1000,
            pointerEvents: 'auto',
            position: 'absolute'
          }}
        >
          {/* Up */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              moveQuestionItem(index, "up");
            }}
            disabled={index === 0}
            className={`rounded p-0.5 transition-colors duration-150 shadow ${
              index === 0
                ? "bg-gray-400 opacity-50 cursor-not-allowed"
                : "bg-gray-500 hover:bg-gray-600 active:bg-gray-700"
            }`}
            aria-label="Move up"
            style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
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
            className={`rounded p-0.5 transition-colors duration-150 shadow ${
              index === totalQuestions - 1
                ? "bg-gray-400 opacity-50 cursor-not-allowed"
                : "bg-gray-500 hover:bg-gray-600 active:bg-gray-700"
            }`}
            aria-label="Move down"
            style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
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
      )}

      <div
        onClick={onClick}
        className={[
          "peer cursor-pointer rounded-sm transition-shadow duration-150 relative",
          "hover:ring-2 hover:ring-inset hover:ring-violet-600",
          "focus-within:ring-2 focus-within:ring-inset focus-within:ring-violet-600",
          isActive
            ? "ring-2 ring-inset ring-violet-600 z-10 bg-white"
            : "z-0 bg-white",
        ].join(" ")}
      >
        {hasImage ? (
          /* ======================= BỐ CỤC 2 CỘT (CÓ ẢNH) ======================= */
          <div
            className="flex justify-between gap-[16px] px-[28px] py-[38px] pb-[38px]"
            style={{ alignItems: "stretch" }}
          >
            {/* Cột trái - Ảnh (50%) */}
            <div className="flex-1 flex items-center justify-center">
              <img
                src={question.image}
                alt="Question"
                className="w-full h-auto object-contain"
                style={{ maxWidth: "100%", maxHeight: "100%" }}
              />
            </div>

            {/* Cột phải - Nội dung câu hỏi (50%) */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-baseline">
                <span className="text-violet-600 font-semibold mr-2 whitespace-nowrap">
                  {index + 1} →
                </span>
                <div className="w-full">
                  <EditableField
                    placeholder="Câu hỏi của bạn ở đây"
                    initialValue={question.text}
                    inputClassName="text-gray-800 font-thin text-[25px]"
                    onChange={(value) => onTextChange?.(question.id, value)}
                  />
                  <EditableField
                    placeholder="Mô tả trợ giúp tuỳ chọn"
                    initialValue={question.helpText}
                    inputClassName="text-sm text-gray-700 mt-1"
                  />
                </div>
              </div>

              {/* Actions: thu theo nội dung (không absolute) */}
              {isActive && (
                <div className="mt-6 flex items-start justify-between">
                  <button className="flex items-center text-violet-600 text-sm hover:text-violet-800 transition-colors font-normal ml-[28px]">
                    <PlusIcon className="h-5 w-5 mr-1" />
                    Thêm câu hỏi phụ
                  </button>

                  <div className="flex items-center space-x-1 mt-[45px]">
                    <button
                      className="p-1"
                      title="Duplicate"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate?.(index);
                      }}
                    >
                      <DuplicateIcon />
                    </button>
                    <button
                      className="p-1"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(index);
                      }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ======================= BỐ CỤC MẶC ĐỊNH (KHÔNG ẢNH) ======================= */
          <div className="p-6 pb-12">
            <div className="flex items-baseline">
              <span className="text-violet-600 font-semibold mr-2 whitespace-nowrap">
                {index + 1} →
              </span>
              <div className="w-full">
                <EditableField
                  placeholder="Nhập câu hỏi của bạn ở đây"
                  initialValue={question.text}
                  inputClassName="text-gray-800 font-thin text-[25px]"
                  onChange={(value) => onTextChange?.(question.id, value)}
                />
                <EditableField
                  placeholder="Mô tả trợ giúp tuỳ chọn"
                  initialValue={question.helpText}
                  inputClassName="text-sm text-gray-700 mt-1"
                />
              </div>
            </div>

            {/* Actions: đặt inline bên dưới nội dung */}
            {isActive && (
              <div className="mt-6 flex items-start justify-between">
                <button className="flex items-center text-violet-600 text-sm hover:text-violet-800 transition-colors font-normal ml-[28px]">
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Thêm câu hỏi phụ
                </button>

                <div className="flex items-center space-x-1 mt-[45px]">
                  <button
                    className="p-1"
                    title="Duplicate"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate?.(index);
                    }}
                  >
                    <DuplicateIcon />
                  </button>
                  <button
                    className="p-1"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(index);
                    }}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
