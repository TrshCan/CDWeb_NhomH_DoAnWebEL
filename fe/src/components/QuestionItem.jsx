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
  onAnswerSelect,
  selectedAnswer,
  conditionInfo,
}) {
  const hasImage = !!question?.image;
  const options = question?.options || [];

  return (
    <div
      className="relative"
      style={{ overflow: "visible", position: "relative", width: "100%" }}
    >
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
            top: "50%",
            right: "-37px", // 22px icon + 15px khoảng cách
            transform: "translateY(-50%)",
            zIndex: 1000,
            pointerEvents: "auto",
            position: "absolute",
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
            style={{
              width: "22px",
              height: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
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
            style={{
              width: "22px",
              height: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
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
        {/* Badge điều kiện hiển thị */}
        {conditionInfo && conditionInfo.length > 0 && (
          <div className="absolute top-3 right-3 z-20">
            <div className="bg-blue-100 border border-blue-300 rounded-md px-3 py-1.5 shadow-sm">
              <div className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-xs text-blue-800">
                  {conditionInfo.map((msg, idx) => (
                    <div key={idx} className="leading-tight">
                      {msg}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
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
                  {question.id} →
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
                    inputClassName="text-sm text-gray-700 mt-1 mb-4"
                  />
                </div>
              </div>

              {/* Danh sách đáp án */}
              {options.length > 0 && (
                <div className="mt-4 ml-[28px] space-y-2">
                  {options.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center space-x-3 cursor-pointer group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option.id}
                        checked={String(selectedAnswer) === String(option.id)}
                        onChange={() => onAnswerSelect?.(question.id, option.id)}
                        className="w-4 h-4 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">
                        {option.text}
                      </span>
                    </label>
                  ))}
                </div>
              )}

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
          <div className="p-6 pb-5">
            <div className="flex items-baseline">
              <span className="text-violet-600 font-semibold mr-2 whitespace-nowrap">
                {question.id} →
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
                  inputClassName="text-sm text-gray-700 mt-1 mb-4"
                />
              </div>
            </div>

            {/* Danh sách đáp án */}
            {options.length > 0 && (
              <div className="mt-4 ml-[28px] space-y-2">
                {options.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center space-x-3 cursor-pointer group"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option.id}
                      checked={String(selectedAnswer) === String(option.id)}
                      onChange={() => onAnswerSelect?.(question.id, option.id)}
                      className="w-4 h-4 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      {option.text}
                    </span>
                  </label>
                ))}
              </div>
            )}

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
