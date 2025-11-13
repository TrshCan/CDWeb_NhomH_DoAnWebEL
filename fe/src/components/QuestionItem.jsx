import React, { useState } from "react";
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
  onOptionChange,
  onRemoveOption,
  onMoveOption,
  onAddOption,
}) {
  // Kiểm tra image từ question object
  const imageValue = question?.image;
  const options = question?.options || [];

  // Width của phần đáp án: 260px khi có ảnh, 300px khi không có ảnh
  const answerWidth = imageValue ? "260px" : "300px";

  // State cho drag and drop
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Debug: log image value để kiểm tra
  if (imageValue) {
    console.log(`Question ${question.id} has image:`, imageValue.substring(0, 50));
  }

  // ✅ Helper: kiểm tra xem option có đang được chọn không
  const isOptionChecked = (selectedAnswer, optionId) => {
    if (Array.isArray(selectedAnswer)) {
      return selectedAnswer
        .map(String)
        .includes(String(optionId));
    }
    return String(selectedAnswer) === String(optionId);
  };

  // ✅ Helper: kiểm tra xem có phải loại radio button không
  const isRadioType = () => {
    return question.type === "Danh sách (nút chọn)" || question.type === "Danh sách có nhận xét (Radio)";
  };

  return (
    <div
      className="relative"
      style={{
        overflow: "visible",
        position: "relative",
        width: "100%",
        isolation: "isolate", // Tạo stacking context mới để tránh ảnh hưởng layout
      }}
    >
      {/* Dấu * cho câu hỏi bắt buộc (chỉ hiện khi Bật/true) */}
      {question?.required === true && (
        <span className="absolute top-2 right-4 z-50 text-red-500 text-[30px] font-bold select-none pointer-events-none">
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
            willChange: "transform", // Tối ưu rendering
          }}
        >
          {/* Up */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              moveQuestionItem(index, "up");
            }}
            disabled={index === 0}
            className={`rounded p-0.5 transition-colors duration-150 shadow ${index === 0
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
            className={`rounded p-0.5 transition-colors duration-150 shadow ${index === totalQuestions - 1
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
        style={{ minHeight: imageValue ? "350px" : "250px" }}
      >
        {/* Thông báo điều kiện hiển thị */}
        {conditionInfo && conditionInfo.length > 0 && (
          <div className="absolute top-1 right-[50px] z-20">
            <div className="text-xs text-red-500 italic">
              {conditionInfo.map((msg, idx) => (
                <div key={idx} className="leading-tight">
                  {msg}
                </div>
              ))}
            </div>
          </div>
        )}
        {imageValue ? (
          /* ======================= BỐ CỤC 2 CỘT (CÓ ẢNH) ======================= */
          <div
            className="flex justify-between gap-[16px] px-[28px] py-[38px] pb-[38px]"
            style={{ alignItems: "flex-start" }}
          >
            {/* Cột trái - Ảnh (50%) */}
            <div
              className="flex-1 flex items-center justify-center bg-gray-50"
              style={{
                height: "350px",
                minHeight: "350px",
                maxHeight: "350px",
                overflow: "hidden",
                position: "relative"
              }}
            >
              <img
                key={imageValue}
                src={imageValue}
                alt="Question"
                style={{
                  maxWidth: "100%",
                  maxHeight: "350px",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  display: "block"
                }}
                onLoad={() => {
                  console.log("✅ Image loaded successfully for question:", question.id);
                }}
                onError={(e) => {
                  console.error("❌ Image error for question:", question.id, "Image URL:", imageValue?.substring(0, 100));
                  e.target.style.display = "none";
                }}
              />
            </div>

            {/* Cột phải - Nội dung câu hỏi (50%) */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-baseline">
                <span className="text-violet-600 font-medium mr-2 whitespace-nowrap">
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
                    inputClassName="text-sm text-gray-800 mt-1 mb-4 italic font-medium"
                  />
                </div>
              </div>

              {/* Danh sách đáp án */}
              {options.length > 0 && (
                <div className="ml-[28px] space-y-1">
                  {options.map((option, optionIndex) => {
                    const isDragging = draggedIndex === optionIndex;
                    const isDragOver = dragOverIndex === optionIndex;

                    const handleDragStart = (e) => {
                      setDraggedIndex(optionIndex);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", optionIndex.toString());
                      
                      // Tạo custom drag image từ cả dòng đáp án
                      const rowElement = e.currentTarget.closest('.flex.items-center.group');
                      if (rowElement) {
                        const dragImage = rowElement.cloneNode(true);
                        dragImage.style.position = "absolute";
                        dragImage.style.top = "-9999px";
                        dragImage.style.left = "-9999px";
                        dragImage.style.width = rowElement.offsetWidth + "px";
                        dragImage.style.backgroundColor = "#ffffff";
                        dragImage.style.border = "3px solid #7c3aed";
                        dragImage.style.borderRadius = "8px";
                        dragImage.style.padding = "10px";
                        dragImage.style.boxShadow = "0 8px 24px rgba(124, 58, 237, 0.3), 0 4px 8px rgba(0,0,0,0.1)";
                        dragImage.style.transform = "scale(1.02)";
                        dragImage.style.fontWeight = "600";
                        document.body.appendChild(dragImage);
                        e.dataTransfer.setDragImage(dragImage, 30, 20);
                        setTimeout(() => document.body.removeChild(dragImage), 0);
                      }
                    };

                    const handleDragOver = (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.dataTransfer.dropEffect = "move";
                      if (dragOverIndex !== optionIndex) {
                        setDragOverIndex(optionIndex);
                      }
                    };

                    const handleDragLeave = (e) => {
                      e.preventDefault();
                      // Chỉ xóa dragOverIndex nếu không còn ở trong container
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX;
                      const y = e.clientY;
                      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                        setDragOverIndex(null);
                      }
                    };

                    const handleDrop = (e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      if (draggedIndex !== null && draggedIndex !== optionIndex && onMoveOption) {
                        onMoveOption(question.id, draggedIndex, optionIndex);
                      }

                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    };

                    const handleDragEnd = () => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    };

                    return (
                      <div
                        key={option.id}
                        className="inline-flex items-center group"
                        style={{
                          gap: "8px",
                          minHeight: "40px",
                          opacity: isDragging ? 1 : 1,
                          transition: "all 0.2s",
                          backgroundColor: isDragging ? "#ffffff" : (isDragOver ? "#f3f4f6" : "transparent"),
                          border: isDragging ? "2px solid #7c3aed" : "2px solid transparent",
                          borderRadius: isDragging ? "6px" : "0px",
                          padding: isDragging ? "4px" : "0px",
                        }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        {/* Khi active: hiển thị icon X (hình tròn 13x13) và icon grid (14x14) */}
                        {isActive ? (
                          <>
                            {/* Icon X để xóa - hình tròn 13x13 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveOption?.(question.id, option.id);
                              }}
                              className="flex-shrink-0 hover:bg-red-100 rounded-full transition-colors"
                              title="Xóa đáp án"
                              style={{
                                width: "13px",
                                height: "13px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#ef4444",
                                border: "none",
                                padding: "0",
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="8"
                                height="8"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                            {/* Icon 6 chấm nằm ngang để di chuyển */}
                            <div
                              draggable={isActive}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                              className="cursor-move flex-shrink-0 hover:bg-gray-200 rounded transition-colors"
                              title="Nhấn giữ và kéo để di chuyển đáp án"
                              style={{
                                width: "18px",
                                height: "14px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "2px",
                                userSelect: "none",
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="10"
                                viewBox="0 0 18 10"
                                fill="currentColor"
                                className="text-gray-600"
                              >
                                <circle cx="2" cy="2" r="1.5" />
                                <circle cx="9" cy="2" r="1.5" />
                                <circle cx="16" cy="2" r="1.5" />
                                <circle cx="2" cy="8" r="1.5" />
                                <circle cx="9" cy="8" r="1.5" />
                                <circle cx="16" cy="8" r="1.5" />
                              </svg>
                            </div>
                          </>
                        ) : (
                          /* Khi không active: hiển thị checkbox hoặc radio tùy loại */
                          <input
                            type={isRadioType() ? "radio" : "checkbox"}
                            name={`question-${question.id}`}
                            value={option.id}
                            checked={isOptionChecked(selectedAnswer, option.id)}
                            onChange={() =>
                              onAnswerSelect?.(question.id, option.id, question.type)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="text-violet-600 focus:ring-violet-500 border-2 border-gray-400 cursor-pointer flex-shrink-0"
                            style={{
                              accentColor: "#7c3aed",
                              width: "24px",
                              height: "24px",
                              borderRadius: isRadioType() ? "50%" : "4px",
                            }}
                          />
                        )}
                        <div
                          className="flex items-start space-x-2 ml-2"
                          style={{ width: answerWidth, flexShrink: 0 }}
                        >
                          {isActive ? (
                            <div
                              style={{
                                width: answerWidth,
                                flexShrink: 0,
                              }}
                            >
                              <EditableField
                                placeholder={isRadioType() ? "Answer option" : "Subquestion"}
                                initialValue={option.text}
                                inputClassName="text-sm text-gray-700 placeholder:italic placeholder:text-gray-400 font-medium"
                                isTextarea={true}
                                onChange={(value) =>
                                  onOptionChange?.(question.id, option.id, value)
                                }
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                width: answerWidth,
                                flexShrink: 0,
                              }}
                            >
                              <span
                                className={`text-sm text-gray-700 font-medium ${!option.text ? "italic text-gray-400" : ""} inline-block whitespace-normal break-words leading-relaxed`}
                                style={{
                                  width: answerWidth,
                                  padding: "8px",
                                  marginLeft: "-8px",
                                  marginTop: "0",
                                  marginBottom: "0",
                                  boxSizing: "border-box",
                                  minHeight: "24px",
                                  lineHeight: "1.625",
                                  display: "inline-block",
                                  verticalAlign: "top",
                                }}
                              >
                                {option.text || (isRadioType() ? "Answer option" : "Subquestion")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Ô nhận xét cho loại "Danh sách có nhận xét (Radio)" - chỉ hiện khi không active */}
              {!isActive && question.type === "Danh sách có nhận xét (Radio)" && (
                <div className="ml-[28px] mt-4">
                  <textarea
                    placeholder="Nhập nhận xét của bạn tại đây."
                    className="w-full border-2 border-gray-700 rounded-md p-3 text-sm text-gray-700 placeholder:italic placeholder:text-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
                    rows="3"
                    style={{ width: answerWidth }}
                  />
                </div>
              )}

              {/* Actions: thu theo nội dung (không absolute) */}
              {isActive && (
                <div className="mt-6 flex items-start justify-between">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddOption?.(question.id);
                    }}
                    className="flex items-center text-violet-600 text-sm hover:text-violet-800 transition-colors font-normal ml-[28px]"
                  >
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
          <div className="p-6 pb-[35px]">
            <div className="flex items-baseline">
              <span className="text-violet-600 font-medium mr-2 whitespace-nowrap">
                {question.id} →
              </span>
              <div className="w-full">
                <EditableField
                  placeholder="Nhập câu hỏi của bạn ở đây"
                  initialValue={question.text}
                  inputClassName="text-gray-900 font-thin text-[25px]"
                  onChange={(value) => onTextChange?.(question.id, value)}
                />
                <EditableField
                  placeholder="Mô tả trợ giúp tuỳ chọn"
                  initialValue={question.helpText}
                  inputClassName="text-sm text-gray-800 mt-1 mb-4 italic font-medium"
                />
              </div>
            </div>

            {/* Danh sách đáp án */}
            {options.length > 0 && (
              <div className="ml-[28px] space-y-1">
                {options.map((option, optionIndex) => {
                  const isDragging = draggedIndex === optionIndex;
                  const isDragOver = dragOverIndex === optionIndex;

                  const handleDragStart = (e) => {
                    setDraggedIndex(optionIndex);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", optionIndex.toString());
                    
                    // Tạo custom drag image từ cả dòng đáp án
                    const rowElement = e.currentTarget.closest('.flex.items-center.group');
                    if (rowElement) {
                      const dragImage = rowElement.cloneNode(true);
                      dragImage.style.position = "absolute";
                      dragImage.style.top = "-9999px";
                      dragImage.style.left = "-9999px";
                      dragImage.style.width = rowElement.offsetWidth + "px";
                      dragImage.style.backgroundColor = "#ffffff";
                      dragImage.style.border = "3px solid #7c3aed";
                      dragImage.style.borderRadius = "8px";
                      dragImage.style.padding = "10px";
                      dragImage.style.boxShadow = "0 8px 24px rgba(124, 58, 237, 0.3), 0 4px 8px rgba(0,0,0,0.1)";
                      dragImage.style.transform = "scale(1.02)";
                      dragImage.style.fontWeight = "600";
                      document.body.appendChild(dragImage);
                      e.dataTransfer.setDragImage(dragImage, 30, 20);
                      setTimeout(() => document.body.removeChild(dragImage), 0);
                    }
                  };

                  const handleDragOver = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOverIndex !== optionIndex) {
                      setDragOverIndex(optionIndex);
                    }
                  };

                  const handleDragLeave = (e) => {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX;
                    const y = e.clientY;
                    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                      setDragOverIndex(null);
                    }
                  };

                  const handleDrop = (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (draggedIndex !== null && draggedIndex !== optionIndex && onMoveOption) {
                      onMoveOption(question.id, draggedIndex, optionIndex);
                    }

                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  };

                  const handleDragEnd = () => {
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  };

                  return (
                    <div
                      key={option.id}
                      className="inline-flex items-center group"
                      style={{
                        gap: "8px",
                        minHeight: "40px",
                        opacity: isDragging ? 1 : 1,
                        transition: "all 0.2s",
                        backgroundColor: isDragging ? "#ffffff" : (isDragOver ? "#f3f4f6" : "transparent"),
                        border: isDragging ? "2px solid #7c3aed" : "2px solid transparent",
                        borderRadius: isDragging ? "6px" : "0px",
                        padding: isDragging ? "4px" : "0px",
                      }}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {/* Khi active: hiển thị icon X (hình tròn 13x13) và icon grid (14x14) */}
                      {isActive ? (
                        <>
                          {/* Icon X để xóa - hình tròn 13x13 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveOption?.(question.id, option.id);
                            }}
                            className="flex-shrink-0 hover:bg-red-100 rounded-full transition-colors"
                            title="Xóa đáp án"
                            style={{
                              width: "13px",
                              height: "13px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "#ef4444",
                              border: "none",
                              padding: "0",
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="8"
                              height="8"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                          {/* Icon 6 chấm nằm ngang để di chuyển */}
                          <div
                            draggable={isActive}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            className="cursor-move flex-shrink-0 hover:bg-gray-200 rounded transition-colors"
                            title="Nhấn giữ và kéo để di chuyển đáp án"
                            style={{
                              width: "18px",
                              height: "14px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "2px",
                              userSelect: "none",
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="10"
                              viewBox="0 0 18 10"
                              fill="currentColor"
                              className="text-gray-600"
                            >
                              <circle cx="2" cy="2" r="1.5" />
                              <circle cx="9" cy="2" r="1.5" />
                              <circle cx="16" cy="2" r="1.5" />
                              <circle cx="2" cy="8" r="1.5" />
                              <circle cx="9" cy="8" r="1.5" />
                              <circle cx="16" cy="8" r="1.5" />
                            </svg>
                          </div>
                        </>
                      ) : (
                        /* Khi không active: hiển thị checkbox hoặc radio tùy loại */
                        <input
                          type={isRadioType() ? "radio" : "checkbox"}
                          name={`question-${question.id}`}
                          value={option.id}
                          checked={isOptionChecked(selectedAnswer, option.id)}
                          onChange={() =>
                            onAnswerSelect?.(question.id, option.id, question.type)
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="text-violet-600 focus:ring-violet-500 border-2 border-gray-400 cursor-pointer flex-shrink-0"
                          style={{
                            accentColor: "#7c3aed",
                            width: "24px",
                            height: "24px",
                            borderRadius: isRadioType() ? "50%" : "4px",
                          }}
                        />

                      )}
                      <div
                        className="flex items-start space-x-2 ml-4"
                        style={{ width: "300px", flexShrink: 0 }}
                      >
                        {isActive ? (
                          <div
                            style={{
                              width: "300px",
                              flexShrink: 0,
                            }}
                          >
                            <EditableField
                              placeholder={isRadioType() ? "Answer option" : "Subquestion"}
                              initialValue={option.text}
                              inputClassName="text-sm text-gray-700 placeholder:italic placeholder:text-gray-400 font-medium"
                              isTextarea={true}
                              onChange={(value) =>
                                onOptionChange?.(question.id, option.id, value)
                              }
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              width: "300px",
                              flexShrink: 0,
                            }}
                          >
                            <span
                              className={`text-sm text-gray-700 font-medium ${!option.text ? "italic text-gray-400" : ""
                                } inline-block whitespace-normal break-words leading-relaxed`}
                              style={{
                                width: "300px",
                                padding: "8px",
                                marginLeft: "-8px",
                                marginTop: "0",
                                marginBottom: "0",
                                boxSizing: "border-box",
                                minHeight: "24px",
                                lineHeight: "1.625",
                                display: "inline-block",
                                verticalAlign: "top",
                              }}
                            >
                              {option.text || (isRadioType() ? "Answer option" : "Subquestion")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ô nhận xét cho loại "Danh sách có nhận xét (Radio)" - chỉ hiện khi không active */}
            {!isActive && question.type === "Danh sách có nhận xét (Radio)" && (
              <div className="ml-[28px] mt-4">
                <textarea
                  placeholder="Nhập nhận xét của bạn tại đây."
                  className="w-full border-2 border-gray-700 rounded-md p-3 text-sm text-gray-700 placeholder:italic placeholder:text-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
                  rows="3"
                  style={{ width: "300px" }}
                />
              </div>
            )}

            {/* Actions: đặt inline bên dưới nội dung */}
            {isActive && (
              <div className="mt-6 flex items-start justify-between">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddOption?.(question.id);
                  }}
                  className="flex items-center text-violet-600 text-sm hover:text-violet-800 transition-colors font-normal ml-[28px]"
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Thêm câu hỏi phụ
                </button>

                <div className="flex items-center space-x-1 mt-[70px]">
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
