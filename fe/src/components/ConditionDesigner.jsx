import React, { useState, useEffect } from "react";
import { PlusIcon, TrashIcon } from "../icons";

export default function ConditionDesigner({ value = {}, onChange, onClose, isEmbedded = false }) {
  const [conditions, setConditions] = useState(value.conditions || []);
  const [defaultScenario, setDefaultScenario] = useState(value.defaultScenario || 1);
  const [currentConditionType, setCurrentConditionType] = useState("question"); // For new condition

  const handleAddCondition = () => {
    const newCondition = {
      id: Date.now(),
      type: currentConditionType,
      field: "",
      operator: "",
      value: "",
    };
    setConditions([...conditions, newCondition]);
  };

  const handleDeleteCondition = (id) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const handleUpdateConditionType = (id, newType) => {
    setConditions(
      conditions.map((c) => (c.id === id ? { ...c, type: newType } : c))
    );
  };

  const handleAccept = () => {
    onChange?.({
      defaultScenario,
      conditions,
    });
    onClose?.();
  };

  // Auto-save khi có thay đổi (nếu embedded)
  useEffect(() => {
    if (isEmbedded) {
      onChange?.({
        defaultScenario,
        conditions,
      });
    }
  }, [defaultScenario, conditions, isEmbedded, onChange]);

  const containerClass = isEmbedded 
    ? "h-full flex flex-col bg-white"
    : "fixed inset-0 bg-white z-50 flex flex-col";

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="px-4 pt-4 flex-shrink-0">
        <div className="h-12 bg-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center">
            {isEmbedded && (
              <button
                onClick={onClose}
                className="mr-3 p-1 hover:bg-gray-300 rounded"
                aria-label="Quay lại"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            <span className="font-semibold text-gray-800">
              Trình thiết kế điều kiện
            </span>
          </div>
          {!isEmbedded && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-200"
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
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="border-2 border-purple-200 rounded-lg p-4 space-y-6">
            {/* Default Scenario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kịch bản mặc định
              </label>
              <input
                type="number"
                value={defaultScenario}
                onChange={(e) => setDefaultScenario(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                min="1"
              />
            </div>

            {/* Conditions */}
            {conditions.map((condition, index) => (
              <div key={condition.id} className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Chỉ hiển thị nếu
                  </label>
                  <button
                    onClick={() => handleDeleteCondition(condition.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                    aria-label="Xóa điều kiện"
                  >
                    <TrashIcon />
                  </button>
                </div>

                {/* Segmented Control */}
                <div className="flex w-full h-10 rounded-sm overflow-hidden bg-gray-200 mb-3">
                  <button
                    type="button"
                    onClick={() => handleUpdateConditionType(condition.id, "question")}
                    className={`flex-1 text-sm font-semibold transition-colors ${
                      condition.type === "question"
                        ? "bg-gray-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Câu hỏi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateConditionType(condition.id, "participant")}
                    className={`flex-1 text-sm font-semibold transition-colors ${
                      condition.type === "participant"
                        ? "bg-gray-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Dữ liệu người tham gia
                  </button>
                </div>

                {/* Dropdown */}
                <div className="relative mb-3">
                  <select
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none"
                    value={condition.field || ""}
                    onChange={(e) => {
                      const updated = conditions.map((c) =>
                        c.id === condition.id ? { ...c, field: e.target.value } : c
                      );
                      setConditions(updated);
                    }}
                  >
                    <option value="">
                      {condition.type === "question"
                        ? "Chọn câu hỏi"
                        : "Dữ liệu người tham gia"}
                    </option>
                    {condition.type === "participant" && (
                      <>
                        <option value="participant-name">Tên người tham gia</option>
                        <option value="participant-email">Email</option>
                      </>
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Add Condition Button - only show on last condition */}
                {index === conditions.length - 1 && (
                  <button
                    onClick={handleAddCondition}
                    className="flex items-center text-violet-600 text-sm hover:text-violet-800 transition-colors font-normal"
                  >
                    <PlusIcon className="h-5 w-5 mr-1 text-violet-600" />
                    Thêm điều kiện
                  </button>
                )}
              </div>
            ))}

            {/* Add First Condition */}
            {conditions.length === 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Chỉ hiển thị nếu
                  </label>
                </div>

                {/* Segmented Control */}
                <div className="flex w-full h-10 rounded-sm overflow-hidden bg-gray-200 mb-3">
                  <button
                    type="button"
                    onClick={() => setCurrentConditionType("question")}
                    className={`flex-1 text-sm font-semibold transition-colors ${
                      currentConditionType === "question"
                        ? "bg-gray-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Câu hỏi
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentConditionType("participant")}
                    className={`flex-1 text-sm font-semibold transition-colors ${
                      currentConditionType === "participant"
                        ? "bg-gray-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Dữ liệu người tham gia
                  </button>
                </div>

                {/* Dropdown */}
                <div className="relative mb-3">
                  <select
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none"
                    defaultValue=""
                  >
                    <option value="">
                      {currentConditionType === "question"
                        ? "Chọn câu hỏi"
                        : "Dữ liệu người tham gia"}
                    </option>
                    {currentConditionType === "participant" && (
                      <>
                        <option value="participant-name">Tên người tham gia</option>
                        <option value="participant-email">Email</option>
                      </>
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Add Condition Button */}
                <button
                  onClick={handleAddCondition}
                  className="flex items-center text-violet-600 text-sm hover:text-violet-800 transition-colors font-normal"
                >
                  <PlusIcon className="h-5 w-5 mr-1 text-violet-600" />
                  Thêm điều kiện
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accept Button - chỉ hiện khi không embedded */}
      {!isEmbedded && (
        <div className="bg-white border-t border-gray-200 px-4 py-4 flex justify-center flex-shrink-0">
          <button
            onClick={handleAccept}
            className="px-6 py-2 bg-gray-500 text-white rounded-sm hover:bg-gray-600 transition-colors font-medium"
          >
            Chấp nhận
          </button>
        </div>
      )}
    </div>
  );
}

