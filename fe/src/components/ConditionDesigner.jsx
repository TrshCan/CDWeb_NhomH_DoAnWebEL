import React, { useState, useEffect, useRef } from "react";
import { PlusIcon, TrashIcon } from "../icons";

// Custom Dropdown Component
function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value)
  );
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-white border-2 border-black rounded-sm focus:outline-none appearance-none text-left flex items-center justify-between"
      >
        <span className={value ? "text-black" : "text-gray-500"}>
          {displayText}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
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
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border-1 border-gray-200 rounded-sm max-h-60 overflow-auto">
          <ul className="py-1">
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className="px-3 py-2 cursor-pointer hover:bg-green-50 transition-colors text-black"
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ConditionDesigner({
  value = {},
  onChange,
  onClose,
  isEmbedded = false,
  questionItems = [],
  currentQuestionId = null,
}) {
  const [conditions, setConditions] = useState(value.conditions || []);
  const [defaultScenario, setDefaultScenario] = useState(
    value.defaultScenario || 1
  );
  const [currentConditionType, setCurrentConditionType] = useState("question"); // For new condition

  // Lấy danh sách câu hỏi trước câu hỏi hiện tại
  const getPreviousQuestions = () => {
    if (!currentQuestionId) return [];
    const currentIndex = questionItems.findIndex(
      (q) => String(q.id) === String(currentQuestionId)
    );
    if (currentIndex <= 0) return [];
    return questionItems.slice(0, currentIndex);
  };

  // Lấy index của câu hỏi trong danh sách
  const getQuestionIndex = (questionId) => {
    return questionItems.findIndex((q) => String(q.id) === String(questionId));
  };

  // Lấy options của câu hỏi (tạm thời giả sử mỗi câu hỏi có options)
  // Trong tương lai, options sẽ được lưu trong question object
  const getQuestionOptions = (questionId) => {
    // Tạm thời trả về options mẫu
    // Trong thực tế, cần lấy từ question.options hoặc question.choices
    const question = questionItems.find(
      (q) => String(q.id) === String(questionId)
    );
    if (!question) return [];

    // Nếu question có options thì trả về, nếu không thì trả về options mẫu
    if (
      question.options &&
      Array.isArray(question.options) &&
      question.options.length > 0
    ) {
      return question.options;
    }

    // Options mẫu (sẽ được thay thế khi có dữ liệu thực)
    return [
      { id: 1, text: "Lựa chọn 1" },
      { id: 2, text: "Lựa chọn 2" },
      { id: 3, text: "Lựa chọn 3" },
    ];
  };

  // Lấy tên câu hỏi
  const getQuestionText = (questionId) => {
    const question = questionItems.find(
      (q) => String(q.id) === String(questionId)
    );
    return question?.text || `Câu hỏi ${questionId}`;
  };

  // Lấy tên option
  const getOptionText = (questionId, optionId) => {
    const options = getQuestionOptions(questionId);
    const option = options.find((opt) => String(opt.id) === String(optionId));
    return option?.text || `Lựa chọn ${optionId}`;
  };

  // Tạo preview message
  const getPreviewMessage = (condition) => {
    if (condition.type === "question" && condition.field && condition.value) {
      const questionId = condition.field;
      const questionText = getQuestionText(questionId);
      const optionText = getOptionText(questionId, condition.value);
      const currentQuestionNum =
        questionItems.findIndex(
          (q) => String(q.id) === String(currentQuestionId)
        ) + 1;
      return (
        <>
          <strong>Câu {currentQuestionNum} sẽ hiển thị </strong> khi người dùng
          chọn <strong>{questionText}</strong>: <strong>{optionText}</strong>
        </>
      );
    }
    if (condition.type === "participant" && condition.field && condition.value && condition.targetQuestionId) {
      const questionId = condition.field;
      const optionText = getOptionText(questionId, condition.value);
      const targetQuestionNum = getQuestionIndex(condition.targetQuestionId) + 1;
      const sourceQuestionNum = getQuestionIndex(questionId) + 1;
      return (
        <>
          <strong>Câu {targetQuestionNum} sẽ hiển thị</strong> khi chọn câu {sourceQuestionNum}: <strong>{optionText}</strong>
        </>
      );
    }
    return null;
  };

  const handleAddCondition = () => {
    const newCondition = {
      id: Date.now(),
      type: currentConditionType,
      field: "",
      operator: "equals",
      value: "",
      targetQuestionId: "",
    };
    const updated = [...conditions, newCondition];
    setConditions(updated);
    if (isEmbedded) {
      onChange?.({
        defaultScenario,
        conditions: updated,
      });
    }
  };

  const handleDeleteCondition = (id) => {
    const updated = conditions.filter((c) => c.id !== id);
    setConditions(updated);
    if (isEmbedded) {
      onChange?.({
        defaultScenario,
        conditions: updated,
      });
    }
  };

  const handleUpdateConditionType = (id, newType) => {
    const updated = conditions.map((c) =>
      c.id === id ? { ...c, type: newType, field: "", value: "", targetQuestionId: "" } : c
    );
    setConditions(updated);
    if (isEmbedded) {
      onChange?.({
        defaultScenario,
        conditions: updated,
      });
    }
  };

  const handleUpdateConditionField = (id, field) => {
    const updated = conditions.map((c) =>
      c.id === id ? { ...c, field, value: "", targetQuestionId: "" } : c
    );
    setConditions(updated);
    if (isEmbedded) {
      onChange?.({
        defaultScenario,
        conditions: updated,
      });
    }
  };

  const handleUpdateConditionValue = (id, value) => {
    const updated = conditions.map((c) => (c.id === id ? { ...c, value } : c));
    setConditions(updated);
    if (isEmbedded) {
      onChange?.({
        defaultScenario,
        conditions: updated,
      });
    }
  };

  const handleUpdateConditionTargetQuestion = (id, targetQuestionId) => {
    const updated = conditions.map((c) => (c.id === id ? { ...c, targetQuestionId } : c));
    setConditions(updated);
    if (isEmbedded) {
      onChange?.({
        defaultScenario,
        conditions: updated,
      });
    }
  };

  const handleAccept = () => {
    onChange?.({
      defaultScenario,
      conditions,
    });
    onClose?.();
  };

  // Cập nhật conditions khi value thay đổi từ bên ngoài
  useEffect(() => {
    if (value.conditions) {
      setConditions(value.conditions);
    }
    if (value.defaultScenario !== undefined) {
      setDefaultScenario(value.defaultScenario);
    }
  }, [value.conditions, value.defaultScenario]);

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
            {/* Description */}
            <div className="bg-blue-50 border border-blue-200 rounded-sm p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">Điều kiện hiển thị</p>
              <p>
                Điều kiện hiển thị cho phép bạn ẩn hoặc hiện các câu hỏi dựa
                trên lựa chọn ở câu trước.
              </p>
            </div>

            {/* Default Scenario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kịch bản mặc định
              </label>
              <input
                type="number"
                value={defaultScenario}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) || 1;
                  setDefaultScenario(newValue);
                  if (isEmbedded) {
                    onChange?.({
                      defaultScenario: newValue,
                      conditions,
                    });
                  }
                }}
                className="w-full px-3 py-2 bg-white border-2 border-black rounded-sm focus:outline-none"
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
                    onClick={() =>
                      handleUpdateConditionType(condition.id, "question")
                    }
                    className={`flex-1 text-sm font-semibold transition-colors ${
                      condition.type === "question"
                        ? "bg-gray-600 text-white"
                        : "bg-gray-200 text-gray-700 opacity-50"
                    }`}
                  >
                    Câu hỏi
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateConditionType(condition.id, "participant")
                    }
                    className={`flex-1 text-sm font-semibold transition-colors ${
                      condition.type === "participant"
                        ? "bg-gray-600 text-white"
                        : "bg-gray-200 text-gray-700 opacity-50"
                    }`}
                  >
                    Điều hướng câu hỏi
                  </button>
                </div>

                {/* Dropdown chọn câu hỏi (khi type === "question") */}
                {condition.type === "question" && (
                  <div className="mb-3">
                    <CustomDropdown
                      value={condition.field || ""}
                      onChange={(value) =>
                        handleUpdateConditionField(condition.id, value)
                      }
                      options={getPreviousQuestions().map((q) => {
                        const questionIndex = getQuestionIndex(q.id);
                        return {
                          value: String(q.id),
                          label: `${questionIndex + 1}. ${
                            q.text || `Câu hỏi ${q.id}`
                          }`,
                        };
                      })}
                      placeholder="Câu hỏi trước"
                    />
                  </div>
                )}

                {/* Dropdown chọn option (khi đã chọn câu hỏi) */}
                {condition.type === "question" && condition.field && (
                  <div className="mb-3">
                    <CustomDropdown
                      value={condition.value || ""}
                      onChange={(value) =>
                        handleUpdateConditionValue(condition.id, value)
                      }
                      options={getQuestionOptions(condition.field).map(
                        (opt) => ({
                          value: String(opt.id),
                          label: opt.text,
                        })
                      )}
                      placeholder="Chọn đáp án"
                    />
                  </div>
                )}

                {/* Dropdown cho participant data - Chọn đáp án */}
                {condition.type === "participant" && (
                  <div className="mb-3">
                    <CustomDropdown
                      value={condition.field || ""}
                      onChange={(value) =>
                        handleUpdateConditionField(condition.id, value)
                      }
                      options={getPreviousQuestions().map((q) => {
                        const questionIndex = getQuestionIndex(q.id);
                        return {
                          value: String(q.id),
                          label: `${questionIndex + 1}. ${
                            q.text || `Câu hỏi ${q.id}`
                          }`,
                        };
                      })}
                      placeholder="Chọn đáp án"
                    />
                  </div>
                )}

                {/* Dropdown chọn đáp án (khi đã chọn câu hỏi trong participant) */}
                {condition.type === "participant" && condition.field && (
                  <div className="mb-3">
                    <CustomDropdown
                      value={condition.value || ""}
                      onChange={(value) =>
                        handleUpdateConditionValue(condition.id, value)
                      }
                      options={getQuestionOptions(condition.field).map(
                        (opt) => ({
                          value: String(opt.id),
                          label: opt.text,
                        })
                      )}
                      placeholder="Chọn đáp án"
                    />
                  </div>
                )}

                {/* Dropdown chọn câu hỏi hiển thị (khi đã chọn đáp án trong participant) */}
                {condition.type === "participant" && condition.field && condition.value && (
                  <div className="mb-3">
                    <CustomDropdown
                      value={condition.targetQuestionId || ""}
                      onChange={(value) =>
                        handleUpdateConditionTargetQuestion(condition.id, value)
                      }
                      options={questionItems
                        .filter((q) => {
                          // Chỉ hiển thị các câu hỏi sau câu hỏi hiện tại
                          if (!currentQuestionId) return true;
                          const currentIndex = questionItems.findIndex(
                            (q) => String(q.id) === String(currentQuestionId)
                          );
                          const qIndex = questionItems.findIndex(
                            (item) => String(item.id) === String(q.id)
                          );
                          return qIndex > currentIndex;
                        })
                        .map((q) => {
                          const questionIndex = getQuestionIndex(q.id);
                          return {
                            value: String(q.id),
                            label: `${questionIndex + 1}. ${
                              q.text || `Câu hỏi ${q.id}`
                            }`,
                          };
                        })}
                      placeholder="Chọn câu hỏi hiển thị"
                    />
                  </div>
                )}

                {/* Preview message */}
                {getPreviewMessage(condition) && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-sm text-sm text-blue-800">
                    {getPreviewMessage(condition)}
                  </div>
                )}

                {/* Add Condition Button - only show on last condition */}
                {index === conditions.length - 1 && (
                  <button
                    onClick={handleAddCondition}
                    className="flex items-center text-violet-600 text-sm hover:text-violet-800 transition-colors font-normal mt-3"
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
                        : "bg-gray-200 text-gray-700 opacity-50"
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
                        : "bg-gray-200 text-gray-700 opacity-50"
                    }`}
                  >
                    Điều hướng câu hỏi
                  </button>
                </div>

                {/* Dropdown chọn câu hỏi (khi type === "question") */}
                {currentConditionType === "question" && (
                  <div className="mb-3">
                    <CustomDropdown
                      value=""
                      onChange={(value) => {
                        if (value) {
                          // Khi chọn câu hỏi, tự động thêm condition
                          const newCondition = {
                            id: Date.now(),
                            type: "question",
                            field: value,
                            operator: "equals",
                            value: "",
                          };
                          const updated = [...conditions, newCondition];
                          setConditions(updated);
                          if (isEmbedded) {
                            onChange?.({
                              defaultScenario,
                              conditions: updated,
                            });
                          }
                        }
                      }}
                      options={getPreviousQuestions().map((q) => {
                        const questionIndex = getQuestionIndex(q.id);
                        return {
                          value: String(q.id),
                          label: `${questionIndex + 1}. ${
                            q.text || `Câu hỏi ${q.id}`
                          }`,
                        };
                      })}
                      placeholder="Câu hỏi trước"
                    />
                  </div>
                )}

                {/* Dropdown cho participant data - Chọn đáp án */}
                {currentConditionType === "participant" && (
                  <div className="mb-3">
                    <CustomDropdown
                      value=""
                      onChange={(value) => {
                        if (value) {
                          // Khi chọn câu hỏi, tự động thêm condition
                          const newCondition = {
                            id: Date.now(),
                            type: "participant",
                            field: value,
                            operator: "equals",
                            value: "",
                            targetQuestionId: "",
                          };
                          const updated = [...conditions, newCondition];
                          setConditions(updated);
                          if (isEmbedded) {
                            onChange?.({
                              defaultScenario,
                              conditions: updated,
                            });
                          }
                        }
                      }}
                      options={getPreviousQuestions().map((q) => {
                        const questionIndex = getQuestionIndex(q.id);
                        return {
                          value: String(q.id),
                          label: `${questionIndex + 1}. ${
                            q.text || `Câu hỏi ${q.id}`
                          }`,
                        };
                      })}
                      placeholder="Chọn đáp án"
                    />
                  </div>
                )}

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
