import React, { useState, useRef } from "react";
import { ChevronDownIcon, PlusIcon } from "../icons";
import QuestionTypeSelectModal from "./QuestionTypeSelectModal";
import ConditionDesigner from "./ConditionDesigner";

// Component cho segmented control 3 nút (Bật, Soft, Tắt)
function SegmentedControl({ value, onChange, options = ["Bật", "Soft", "Tắt"] }) {
  const getActiveIndex = () => {
    if (value === true || value === "Bật") return 0;
    if (value === "soft" || value === "Soft") return 1;
    if (value === false || value === "Tắt") return 2;
    return 1; // mặc định là Soft
  };

  const activeIndex = getActiveIndex();

  return (
    <div className="flex w-full h-10 rounded-sm overflow-hidden bg-gray-500 p-1">
      {options.map((option, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={option}
            type="button"
            className={`flex-1 text-sm font-semibold ${
              isActive
                ? "bg-white text-gray-900"
                : "bg-gray-500 text-white hover:bg-gray-600"
            }`}
            onClick={() => {
              if (index === 0) onChange(true);
              else if (index === 1) onChange("soft");
              else onChange(false);
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function QuestionSettingsPanel({
  value = {},
  onChange,
  onClose,
  questionItems = [],
  currentQuestionId = null,
}) {
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [showConditionDesigner, setShowConditionDesigner] = useState(false);
  const typeButtonRef = useRef(null);

  const {
    questionCode = "Q001",
    type = "Danh sách (nút chọn)",
    required = "soft",
    image = null,
    conditions = [],
    defaultScenario = 1,
  } = value;


  const handleImageDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0] || e.target?.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange?.({ ...value, image: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = handleImageDrop;
    input.click();
  };

  // Nếu đang hiển thị Condition Designer, render nó thay vì settings
  if (showConditionDesigner) {
    return (
      <ConditionDesigner
        value={{
          conditions,
          defaultScenario,
        }}
        onChange={(conditionData) => {
          onChange?.({
            ...value,
            conditions: conditionData.conditions,
            defaultScenario: conditionData.defaultScenario,
          });
        }}
        onClose={() => setShowConditionDesigner(false)}
        isEmbedded={true}
        questionItems={questionItems}
        currentQuestionId={currentQuestionId}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="h-12 bg-gray-200 flex items-center justify-between px-4">
          <span className="font-semibold text-gray-800">Cài đặt câu hỏi</span>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            onClick={onClose}
            aria-label="Đóng"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 mt-4">
        <div className="space-y-6">
          {/* Question Code */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">
              Question code
            </label>
            <input
              type="text"
              value={questionCode}
              onChange={(e) =>
                onChange?.({ ...value, questionCode: e.target.value })
              }
              className="w-full px-3 py-2 border-[2px] border-gray-600 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Type (Loại) */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">
              Loại
            </label>
            <button
              ref={typeButtonRef}
              type="button"
              onClick={() => setIsTypeModalOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 border-[2px] border-gray-600 rounded-sm bg-white text-sm hover:bg-gray-50 text-left"
            >
              <span className={type ? "text-gray-800" : "text-gray-400"}>
                {type || "Chọn loại câu hỏi"}
              </span>
              <ChevronDownIcon />
            </button>
          </div>

          {/* Required Status (Tính bắt buộc) */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">
              Tính bắt buộc
            </label>
            <SegmentedControl
              value={required}
              onChange={(newRequired) =>
                onChange?.({ ...value, required: newRequired })
              }
            />
          </div>

          {/* Add Image */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">
              Add image
            </label>
            <div
              onClick={handleImageClick}
              onDrop={handleImageDrop}
              onDragOver={(e) => e.preventDefault()}
              className="w-full border-2 border-dashed border-gray-300 rounded-sm p-8 text-center cursor-pointer hover:border-violet-500 transition-colors"
            >
              {image ? (
                <div className="relative w-full">
                  <img
                    src={image}
                    alt="Question"
                    className="w-full h-auto"
                    style={{
                      display: "block",
                      objectFit: "contain",
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange?.({ ...value, image: null });
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                    >
                      <path d="M15.5355339 15.5355339L8.46446609 8.46446609M15.5355339 8.46446609L8.46446609 15.5355339" />
                      <path d="M4.92893219,19.0710678 C1.02368927,15.1658249 1.02368927,8.83417511 4.92893219,4.92893219 C8.83417511,1.02368927 15.1658249,1.02368927 19.0710678,4.92893219 C22.9763107,8.83417511 22.9763107,15.1658249 19.0710678,19.0710678 C15.1658249,22.9763107 8.83417511,22.9763107 4.92893219,19.0710678 Z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto text-gray-400 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-sm text-gray-600">Thả hình ảnh tại đây</p>
                </>
              )}
            </div>
          </div>

          {/* Conditional Designer */}
          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-medium mb-3 text-gray-700">
              Trình thiết kế điều kiện
            </label>
            <button
              type="button"
              onClick={() => setShowConditionDesigner(true)}
              className="flex items-center text-gray-800 font-semibold hover:text-gray-900 transition-colors"
            >
              <div className="w-8 h-8 bg-gray-600 rounded-sm flex items-center justify-center mr-2">
                <PlusIcon className="h-5 w-5 text-white" />
              </div>
              <span>Logic mới</span>
            </button>
            {conditions && conditions.length > 0 && (
              <div className="mt-3 text-sm text-gray-600">
                Đã có {conditions.length} điều kiện
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Question Type Select Modal - chỉ để thay đổi loại câu hỏi */}
      <QuestionTypeSelectModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onSelectQuestionType={(selectedType) => {
          onChange?.({ ...value, type: selectedType });
          setIsTypeModalOpen(false);
        }}
        triggerElement={typeButtonRef.current}
      />
    </div>
  );
}

