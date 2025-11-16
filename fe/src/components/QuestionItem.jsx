import React, { useState, useRef } from "react";
import EditableField from "./EditableField";
import { PlusIcon, DuplicateIcon, TrashIcon, CalendarIcon } from "../icons";
import FivePointScale from "./FivePointScale";

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
  onOptionImageChange,
}) {
  // Kiểm tra image từ question object
  const imageValue = question?.image;
  const options = question?.options || [];

  // Width của phần đáp án: 260px khi có ảnh, 300px khi không có ảnh
  const answerWidth = imageValue ? "260px" : "300px";

  // State cho drag and drop
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // State cho date input
  const [dateInputValue, setDateInputValue] = useState("");
  
  // Ref cho date picker input (ẩn)
  const datePickerRef = useRef(null);

  // Chuyển đổi từ YYYY-MM-DD sang MM/DD/YYYY
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Chuyển đổi từ MM/DD/YYYY sang YYYY-MM-DD
  const formatDateForStorage = (dateString) => {
    if (!dateString || dateString.length !== 10) return "";
    const parts = dateString.split("/");
    if (parts.length !== 3) return "";
    const month = parts[0];
    const day = parts[1];
    const year = parts[2];

    // Validate
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);
    const yearNum = parseInt(year, 10);

    if (monthNum < 1 || monthNum > 12) return "";
    if (dayNum < 1 || dayNum > 31) return "";
    if (yearNum < 1900 || yearNum > 2100) return "";

    // Check valid date
    const date = new Date(yearNum, monthNum - 1, dayNum);
    if (
      date.getFullYear() !== yearNum ||
      date.getMonth() !== monthNum - 1 ||
      date.getDate() !== dayNum
    ) {
      return "";
    }

    return `${year}-${month}-${day}`;
  };

  // Xử lý input với mask MM/DD/YYYY - tự động thêm dấu /
  const handleDateInputChange = (e) => {
    const inputValue = e.target.value;
    
    // Lấy chỉ số từ input (loại bỏ tất cả ký tự không phải số)
    let value = inputValue.replace(/[^0-9]/g, ""); // Chỉ lấy số
    
    // Giới hạn tối đa 8 số (MMDDYYYY)
    if (value.length > 8) {
      value = value.substring(0, 8);
    }
    
    // Format: tự động thêm dấu / sau 2 số và sau 4 số
    let formatted = value;
    if (value.length > 2) {
      formatted = value.substring(0, 2) + "/" + value.substring(2);
    }
    if (value.length > 4) {
      formatted = value.substring(0, 2) + "/" + value.substring(2, 4) + "/" + value.substring(4);
    }

    setDateInputValue(formatted);

    // Nếu đủ 8 số (MMDDYYYY), chuyển đổi và lưu
    if (value.length === 8) {
      const dateString = value.substring(0, 2) + "/" + value.substring(2, 4) + "/" + value.substring(4, 8);
      const dateForStorage = formatDateForStorage(dateString);
      if (dateForStorage) {
        onAnswerSelect?.(question.id, dateForStorage, question.type);
        // Cập nhật date picker input
        if (datePickerRef.current) {
          datePickerRef.current.value = dateForStorage;
        }
      }
    } else {
      // Nếu chưa đủ, xóa giá trị đã chọn
      onAnswerSelect?.(question.id, "", question.type);
      if (datePickerRef.current) {
        datePickerRef.current.value = "";
      }
    }
  };

  // Mở date picker khi click vào icon calendar
  const openDatePicker = (e) => {
    e.stopPropagation();
    if (datePickerRef.current) {
      if (typeof datePickerRef.current.showPicker === "function") {
        datePickerRef.current.showPicker();
      } else {
        datePickerRef.current.focus();
        datePickerRef.current.click();
      }
    }
  };

  // Xử lý khi chọn ngày từ date picker
  const handleDatePickerChange = (e) => {
    const selectedDate = e.target.value; // Format: YYYY-MM-DD
    if (selectedDate) {
      // Chuyển đổi từ YYYY-MM-DD sang MM/DD/YYYY để hiển thị
      const formatted = formatDateForDisplay(selectedDate);
      setDateInputValue(formatted);
      // Lưu giá trị YYYY-MM-DD
      onAnswerSelect?.(question.id, selectedDate, question.type);
    } else {
      setDateInputValue("");
      onAnswerSelect?.(question.id, "", question.type);
    }
  };

  // Sync dateInputValue với selectedAnswer khi selectedAnswer thay đổi
  React.useEffect(() => {
    if (question.type === "Ngày giờ") {
      const formatted = formatDateForDisplay(selectedAnswer);
      setDateInputValue(formatted || "");
      // Sync date picker input
      if (datePickerRef.current && selectedAnswer) {
        datePickerRef.current.value = selectedAnswer;
      } else if (datePickerRef.current && !selectedAnswer) {
        datePickerRef.current.value = "";
      }
    }
  }, [selectedAnswer, question.type]);

  // ✅ Helper: kiểm tra xem option có đang được chọn không
  const isOptionChecked = (selectedAnswer, optionId) => {
    if (Array.isArray(selectedAnswer)) {
      return selectedAnswer.map(String).includes(String(optionId));
    }
    return String(selectedAnswer) === String(optionId);
  };

  // ✅ Helper: kiểm tra xem có phải loại radio button không
  const isRadioType = () => {
    return (
      question.type === "Danh sách (nút chọn)" ||
      question.type === "Danh sách có nhận xét (Radio)" ||
      question.type === "Chọn hình ảnh từ danh sách (Radio)"
    );
  };

  // ✅ Helper: kiểm tra xem có phải loại image option không
  const isImageOptionType = () => {
    return (
      question.type === "Chọn hình ảnh từ danh sách (Radio)" ||
      question.type === "Chọn nhiều hình ảnh"
    );
  };

  // ✅ Helper: kiểm tra xem có phải loại 5 điểm không
  const isFivePointScale = () => {
    return question.type === "Lựa chọn 5 điểm";
  };

  // ✅ Helper: kiểm tra xem có phải loại Giới tính không
  const isGenderType = () => {
    return question.type === "Giới tính";
  };

  // ✅ Helper: kiểm tra xem có phải loại Có/Không không
  const isYesNoType = () => {
    return question.type === "Có/Không";
  };

  // ✅ Helper: kiểm tra xem có phải loại Ngày giờ không
  const isDateTimeType = () => {
    return question.type === "Ngày giờ";
  };

  // ✅ Handler: Upload ảnh cho option
  const handleOptionImageUpload = (optionId) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          onOptionImageChange?.(question.id, optionId, event.target.result);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div
      className="relative"
      style={{
        overflow: "visible",
        position: "relative",
        width: "100%",
        marginRight: "45px", // Tạo không gian cho nút di chuyển
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
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
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
              className="flex-1"
              style={{
                position: "relative",
              }}
            >
              <img
                key={imageValue}
                src={imageValue}
                alt="Question"
                style={{
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                  display: "block",
                }}
                onLoad={() => {
                  console.log(
                    "✅ Image loaded successfully for question:",
                    question.id
                  );
                }}
                onError={(e) => {
                  console.error(
                    "❌ Image error for question:",
                    question.id,
                    "Image URL:",
                    imageValue?.substring(0, 100)
                  );
                  e.target.style.display = "none";
                }}
              />
            </div>

            {/* Cột phải - Nội dung câu hỏi (50%) */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-baseline">
                <span className="text-violet-600 font-medium mr-2 whitespace-nowrap">
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
                    inputClassName="text-sm text-gray-800 mt-1 mb-4 italic font-medium"
                  />
                </div>
              </div>

              {/* Render 5 điểm nếu là loại Lựa chọn 5 điểm */}
              {isFivePointScale() ? (
                <FivePointScale
                  questionId={question.id}
                  selectedAnswer={selectedAnswer}
                  onAnswerSelect={onAnswerSelect}
                  isActive={isActive}
                  hasImage={true}
                />
              ) : isGenderType() ? (
                /* UI đặc biệt cho loại Giới tính */
                <div className="ml-[28px] flex gap-4 flex-wrap">
                  {options.map((option) => {
                    const isSelected = isOptionChecked(
                      selectedAnswer,
                      option.id
                    );
                    const isNoAnswer = option.text === "Không có câu trả lời";

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAnswerSelect?.(
                            question.id,
                            option.id,
                            question.type
                          );
                        }}
                        className="gender-button relative group"
                        style={{
                          width: isNoAnswer ? "173px" : "90px",
                          height: "75px",
                        }}
                      >
                        <div
                          className={`
                        absolute inset-0 flex flex-col items-center justify-center
                        border-[3px] rounded-md transition-all
                        ${
                          isSelected
                            ? "bg-[#10B981] border-[#10B981] text-white"
                            : isNoAnswer
                            ? "bg-white border-gray-600 group-hover:bg-[#10B981] group-hover:border-[#10B981]"
                            : "bg-white border-gray-600 group-hover:bg-[#10B981] group-hover:border-[#10B981]"
                        }
                      `}
                        >
                          {option.text === "Nữ" && (
                            <svg
                              width="32"
                              height="32"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M11 15.934A7.501 7.501 0 0 1 12 1a7.5 7.5 0 0 1 1 14.934V18h5v2h-5v4h-2v-4H6v-2h5v-2.066zM12 14a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z"></path>
                            </svg>
                          )}
                          {option.text === "Nam" && (
                            <svg
                              width="32"
                              height="32"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M15.05 8.537L18.585 5H14V3h8v8h-2V6.414l-3.537 3.537a7.5 7.5 0 1 1-1.414-1.414zM10.5 20a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z"></path>
                            </svg>
                          )}
                          {isNoAnswer && (
                            <svg
                              role="img"
                              xmlns="http://www.w3.org/2000/svg"
                              width="32px"
                              height="32px"
                              viewBox="0 0 24 24"
                              aria-labelledby="circleIconTitle"
                              stroke={isSelected ? "#ffffff" : "#4b5563"}
                              strokeWidth="1.5"
                              strokeLinecap="square"
                              strokeLinejoin="miter"
                              fill="none"
                              color={isSelected ? "#ffffff" : "#4b5563"}
                              className="mb-1 transition-colors"
                            >
                              <title id="circleIconTitle">Circle</title>
                              <circle cx="12" cy="12" r="8" />
                            </svg>
                          )}
                          <span
                            className="text-sm font-medium transition-colors"
                            style={{
                              color: isSelected ? "#ffffff" : "#4b5563",
                              width: isNoAnswer ? "145px" : "auto",
                              height: isNoAnswer ? "24px" : "auto",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              textAlign: "center",
                            }}
                          >
                            {option.text}
                          </span>
                        </div>
                        {/* Overlay khi hover để đổi màu icon và chữ */}
                        <div
                          className={`
                        absolute inset-0 flex flex-col items-center justify-center
                        border-[3px] rounded-md transition-opacity pointer-events-none
                        bg-[#10B981] border-[#10B981] text-white
                        ${
                          isSelected
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }
                      `}
                        >
                          {option.text === "Nữ" && (
                            <svg
                              width="32"
                              height="32"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M11 15.934A7.501 7.501 0 0 1 12 1a7.5 7.5 0 0 1 1 14.934V18h5v2h-5v4h-2v-4H6v-2h5v-2.066zM12 14a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z"></path>
                            </svg>
                          )}
                          {option.text === "Nam" && (
                            <svg
                              width="32"
                              height="32"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M15.05 8.537L18.585 5H14V3h8v8h-2V6.414l-3.537 3.537a7.5 7.5 0 1 1-1.414-1.414zM10.5 20a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z"></path>
                            </svg>
                          )}
                          {isNoAnswer && (
                            <svg
                              role="img"
                              xmlns="http://www.w3.org/2000/svg"
                              width="32px"
                              height="32px"
                              viewBox="0 0 24 24"
                              aria-labelledby="circleIconTitle"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              strokeLinecap="square"
                              strokeLinejoin="miter"
                              fill="none"
                              color="#ffffff"
                              className="mb-1"
                            >
                              <title id="circleIconTitle">Circle</title>
                              <circle cx="12" cy="12" r="8" />
                            </svg>
                          )}
                          <span
                            className="text-sm font-medium text-white"
                            style={{
                              width: isNoAnswer ? "145px" : "auto",
                              height: isNoAnswer ? "24px" : "auto",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              textAlign: "center",
                            }}
                          >
                            {option.text}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : isYesNoType() ? (
                /* UI đặc biệt cho loại Có/Không */
                <div className="ml-[28px] flex gap-4 flex-wrap">
                  {options.map((option) => {
                    const isSelected = isOptionChecked(
                      selectedAnswer,
                      option.id
                    );
                    const isNoAnswer = option.text === "Không có câu trả lời";

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAnswerSelect?.(
                            question.id,
                            option.id,
                            question.type
                          );
                        }}
                        className="gender-button relative group"
                        style={{
                          width: isNoAnswer ? "173px" : "90px",
                          height: "75px",
                        }}
                      >
                        <div
                          className={`
                        absolute inset-0 flex flex-col items-center justify-center
                        border-[3px] rounded-md transition-all
                        ${
                          isSelected
                            ? "bg-[#10B981] border-[#10B981] text-white"
                            : isNoAnswer
                            ? "bg-white border-gray-600 group-hover:bg-[#10B981] group-hover:border-[#10B981]"
                            : "bg-white border-gray-600 group-hover:bg-[#10B981] group-hover:border-[#10B981]"
                        }
                      `}
                        >
                          {option.text === "Có" && (
                            <svg
                              width="32"
                              height="32"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-.997-4L6.76 11.757l1.414-1.414 2.829 2.829 5.656-5.657 1.415 1.414L11.003 16z"></path>
                            </svg>
                          )}
                          {option.text === "Không" && (
                            <svg
                              width="32"
                              height="32"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0-9.414l2.828-2.829 1.415 1.415L13.414 12l2.829 2.828-1.415 1.415L12 13.414l-2.828 2.829-1.415-1.415L10.586 12 7.757 9.172l1.415-1.415L12 10.586z"></path>
                            </svg>
                          )}
                          {isNoAnswer && (
                            <svg
                              role="img"
                              xmlns="http://www.w3.org/2000/svg"
                              width="32px"
                              height="32px"
                              viewBox="0 0 24 24"
                              aria-labelledby="circleIconTitle"
                              stroke={isSelected ? "#ffffff" : "#4b5563"}
                              strokeWidth="1.5"
                              strokeLinecap="square"
                              strokeLinejoin="miter"
                              fill="none"
                              color={isSelected ? "#ffffff" : "#4b5563"}
                              className="mb-1 transition-colors"
                            >
                              <title id="circleIconTitle">Circle</title>
                              <circle cx="12" cy="12" r="8" />
                            </svg>
                          )}
                          <span
                            className="text-sm font-medium transition-colors"
                            style={{
                              color: isSelected ? "#ffffff" : "#4b5563",
                              width: isNoAnswer ? "145px" : "auto",
                              height: isNoAnswer ? "24px" : "auto",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              textAlign: "center",
                            }}
                          >
                            {option.text}
                          </span>
                        </div>
                        {/* Overlay khi hover để đổi màu icon và chữ */}
                        <div
                          className={`
                        absolute inset-0 flex flex-col items-center justify-center
                        border-[3px] rounded-md transition-opacity pointer-events-none
                        bg-[#10B981] border-[#10B981] text-white
                        ${
                          isSelected
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }
                      `}
                        >
                          {option.text === "Có" && (
                            <svg
                              width="32"
                              height="32"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-.997-4L6.76 11.757l1.414-1.414 2.829 2.829 5.656-5.657 1.415 1.414L11.003 16z"></path>
                            </svg>
                          )}
                          {option.text === "Không" && (
                            <svg
                              width="32"
                              height="32"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0-9.414l2.828-2.829 1.415 1.415L13.414 12l2.829 2.828-1.415 1.415L12 13.414l-2.828 2.829-1.415-1.415L10.586 12 7.757 9.172l1.415-1.415L12 10.586z"></path>
                            </svg>
                          )}
                          {isNoAnswer && (
                            <svg
                              role="img"
                              xmlns="http://www.w3.org/2000/svg"
                              width="32px"
                              height="32px"
                              viewBox="0 0 24 24"
                              aria-labelledby="circleIconTitle"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              strokeLinecap="square"
                              strokeLinejoin="miter"
                              fill="none"
                              color="#ffffff"
                              className="mb-1"
                            >
                              <title id="circleIconTitle">Circle</title>
                              <circle cx="12" cy="12" r="8" />
                            </svg>
                          )}
                          <span
                            className="text-sm font-medium text-white"
                            style={{
                              width: isNoAnswer ? "145px" : "auto",
                              height: isNoAnswer ? "24px" : "auto",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              textAlign: "center",
                            }}
                          >
                            {option.text}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : isDateTimeType() ? (
                /* UI đặc biệt cho loại Ngày giờ */
                <div className="ml-[28px]">
                  <div
                    className="relative"
                    style={{ width: "326px", height: "43px" }}
                  >
                    {/* Input ẩn cho date picker */}
                    <input
                      ref={datePickerRef}
                      type="date"
                      style={{
                        position: "absolute",
                        opacity: 0,
                        pointerEvents: "none",
                        width: 0,
                        height: 0,
                        overflow: "hidden",
                      }}
                      onChange={handleDatePickerChange}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <input
                      type="text"
                      className="border-[3px] border-gray-400 rounded-md px-3 py-2 font-semibold text-gray-800 focus:outline-none uppercase"
                      style={{
                        width: "326px",
                        height: "43px",
                        paddingRight: "40px",
                        fontSize: "14px",
                        letterSpacing: "0.5px",
                      }}
                      placeholder="MM/DD/YYYY"
                      value={dateInputValue}
                      onChange={handleDateInputChange}
                      onClick={(e) => e.stopPropagation()}
                      maxLength={10}
                    />
                    <button
                      type="button"
                      aria-label="Open date picker"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded hover:bg-gray-100 transition-colors pointer-events-auto"
                      onClick={openDatePicker}
                      style={{
                        width: "24px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        style={{ width: "24px", height: "24px" }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                /* Danh sách đáp án */
                options.length > 0 && (
                  <div className="ml-[28px] space-y-4">
                    {options.map((option, optionIndex) => {
                      const isDragging = draggedIndex === optionIndex;
                      const isDragOver = dragOverIndex === optionIndex;

                      const handleDragStart = (e) => {
                        setDraggedIndex(optionIndex);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData(
                          "text/plain",
                          optionIndex.toString()
                        );

                        // Tạo custom drag image từ cả dòng đáp án
                        const rowElement = e.currentTarget.closest(
                          ".flex.items-center.group"
                        );
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
                          dragImage.style.boxShadow =
                            "0 8px 24px rgba(124, 58, 237, 0.3), 0 4px 8px rgba(0,0,0,0.1)";
                          dragImage.style.transform = "scale(1.02)";
                          dragImage.style.fontWeight = "600";
                          document.body.appendChild(dragImage);
                          e.dataTransfer.setDragImage(dragImage, 30, 20);
                          setTimeout(
                            () => document.body.removeChild(dragImage),
                            0
                          );
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
                        if (
                          x < rect.left ||
                          x > rect.right ||
                          y < rect.top ||
                          y > rect.bottom
                        ) {
                          setDragOverIndex(null);
                        }
                      };

                      const handleDrop = (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (
                          draggedIndex !== null &&
                          draggedIndex !== optionIndex &&
                          onMoveOption
                        ) {
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
                          className={
                            isImageOptionType()
                              ? "flex items-start group"
                              : "inline-flex items-center group"
                          }
                          style={{
                            gap: "8px",
                            minHeight: "40px",
                            opacity: isDragging ? 1 : 1,
                            transition: "all 0.2s",
                            backgroundColor: isDragging
                              ? "#ffffff"
                              : isDragOver
                              ? "#f3f4f6"
                              : "transparent",
                            border: isDragging
                              ? "2px solid #7c3aed"
                              : "2px solid transparent",
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
                              checked={isOptionChecked(
                                selectedAnswer,
                                option.id
                              )}
                              onChange={() =>
                                onAnswerSelect?.(
                                  question.id,
                                  option.id,
                                  question.type
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="text-violet-600 focus:ring-violet-500 cursor-pointer flex-shrink-0 opacity-90"
                              style={{
                                accentColor: "#7c3aed",
                                width: "28px",
                                height: "28px",
                                borderRadius: isRadioType() ? "50%" : "4px",
                              }}
                            />
                          )}
                          <div
                            className="flex items-start space-x-2 ml-2"
                            style={{
                              width: isImageOptionType() ? "auto" : answerWidth,
                              flexShrink: 0,
                            }}
                          >
                            {isImageOptionType() ? (
                              /* Hiển thị ảnh cho loại "Chọn hình ảnh từ danh sách (Radio)" */
                              isActive ? (
                                /* Khi active: Hiển thị ảnh nếu có, hoặc ô upload */
                                option.image ? (
                                  <div className="relative inline-block">
                                    <img
                                      src={option.image}
                                      alt="Option"
                                      className="peer border-2 border-gray-700 rounded-sm cursor-pointer"
                                      style={{
                                        height: "160px",
                                        width: "auto",
                                        objectFit: "contain",
                                        display: "block",
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOptionImageUpload(option.id);
                                      }}
                                    />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOptionImageChange?.(
                                          question.id,
                                          option.id,
                                          null
                                        );
                                      }}
                                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 rounded-full w-6 h-6 flex items-center justify-center transition-all opacity-0 peer-hover:opacity-100"
                                      title="Xóa ảnh"
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
                                  <div
                                    className="border-2 border-dashed border-gray-700 rounded-md flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                                    style={{
                                      width: "260px",
                                      height: "160px",
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOptionImageUpload(option.id);
                                    }}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="32"
                                      height="32"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      className="text-gray-400 mb-2"
                                    >
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                      <polyline points="17 8 12 3 7 8" />
                                      <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    <span className="text-sm text-gray-500 italic">
                                      Thả hình ảnh tại đây
                                    </span>
                                  </div>
                                )
                              ) : /* Khi không active: Hiển thị ảnh hoặc NO IMAGE */
                              option.image ? (
                                <img
                                  src={option.image}
                                  alt="Option"
                                  className="border-2 border-gray-700 rounded-sm"
                                  style={{
                                    height: "160px",
                                    width: "auto",
                                    objectFit: "contain",
                                    display: "block",
                                  }}
                                />
                              ) : (
                                <div
                                  className="border-2 border-gray-700 rounded-md flex flex-col items-center justify-center bg-gray-50"
                                  style={{
                                    width: "160px",
                                    height: "160px",
                                  }}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="48"
                                    height="48"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    className="text-gray-300 mb-2"
                                  >
                                    <rect
                                      x="3"
                                      y="3"
                                      width="18"
                                      height="18"
                                      rx="2"
                                      ry="2"
                                    />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                  </svg>
                                  <span className="text-gray-400 font-bold text-sm">
                                    NO IMAGE
                                  </span>
                                </div>
                              )
                            ) : /* Hiển thị text bình thường cho các loại khác */
                            isActive ? (
                              <div
                                style={{
                                  width: answerWidth,
                                  flexShrink: 0,
                                }}
                              >
                                <EditableField
                                  placeholder={
                                    isRadioType()
                                      ? "Answer option"
                                      : "Subquestion"
                                  }
                                  initialValue={option.text}
                                  inputClassName="text-sm text-gray-700 placeholder:italic placeholder:text-gray-400 font-medium"
                                  isTextarea={true}
                                  onChange={(value) =>
                                    onOptionChange?.(
                                      question.id,
                                      option.id,
                                      value
                                    )
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
                                  className={`text-sm text-gray-700 font-medium ${
                                    !option.text ? "italic text-gray-400" : ""
                                  } inline-block whitespace-normal break-words leading-relaxed opacity-70`}
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
                                  {option.text ||
                                    (isRadioType()
                                      ? "Answer option"
                                      : "Subquestion")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* Ô nhận xét cho loại "Danh sách có nhận xét (Radio)" - chỉ hiện khi không active */}
              {!isActive &&
                question.type === "Danh sách có nhận xét (Radio)" && (
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
                  {!isGenderType() && !isYesNoType() && !isDateTimeType() && (
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
                  )}

                  <div
                    className={`flex items-center space-x-1 ${
                      isGenderType() || isYesNoType() || isDateTimeType()
                        ? "ml-auto"
                        : "mt-[45px]"
                    }`}
                  >
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
                {index + 1} →
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

            {/* Render 5 điểm nếu là loại Lựa chọn 5 điểm */}
            {isFivePointScale() ? (
              <FivePointScale
                questionId={question.id}
                selectedAnswer={selectedAnswer}
                onAnswerSelect={onAnswerSelect}
                isActive={isActive}
                hasImage={false}
              />
            ) : isGenderType() ? (
              /* UI đặc biệt cho loại Giới tính */
              <div className="ml-[28px] flex gap-4 flex-wrap">
                {options.map((option) => {
                  const isSelected = isOptionChecked(selectedAnswer, option.id);
                  const isNoAnswer = option.text === "Không có câu trả lời";

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAnswerSelect?.(question.id, option.id, question.type);
                      }}
                      className="gender-button relative group"
                      style={{
                        width: isNoAnswer ? "173px" : "90px",
                        height: "75px",
                      }}
                    >
                      <div
                        className={`
                        absolute inset-0 flex flex-col items-center justify-center
                        border-[3px] rounded-md transition-all
                        ${
                          isSelected
                            ? "bg-[#10B981] border-[#10B981] text-white"
                            : isNoAnswer
                            ? "bg-white border-gray-600 group-hover:bg-[#10B981] group-hover:border-[#10B981]"
                            : "bg-white border-gray-600 group-hover:bg-[#10B981] group-hover:border-[#10B981]"
                        }
                      `}
                      >
                        {option.text === "Nữ" && (
                          <svg
                            width="32"
                            height="32"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M11 15.934A7.501 7.501 0 0 1 12 1a7.5 7.5 0 0 1 1 14.934V18h5v2h-5v4h-2v-4H6v-2h5v-2.066zM12 14a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z"></path>
                          </svg>
                        )}
                        {option.text === "Nam" && (
                          <svg
                            width="32"
                            height="32"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M15.05 8.537L18.585 5H14V3h8v8h-2V6.414l-3.537 3.537a7.5 7.5 0 1 1-1.414-1.414zM10.5 20a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z"></path>
                          </svg>
                        )}
                        {isNoAnswer && (
                          <svg
                            role="img"
                            xmlns="http://www.w3.org/2000/svg"
                            width="32px"
                            height="32px"
                            viewBox="0 0 24 24"
                            aria-labelledby="circleIconTitle"
                            stroke={isSelected ? "#ffffff" : "#000000"}
                            strokeWidth="1.5"
                            strokeLinecap="square"
                            strokeLinejoin="miter"
                            fill="none"
                            color={isSelected ? "#ffffff" : "#000000"}
                            className="mb-1 transition-colors"
                          >
                            <title id="circleIconTitle">Circle</title>
                            <circle cx="12" cy="12" r="8" />
                          </svg>
                        )}
                        <span
                          className="text-sm font-medium transition-colors"
                          style={{
                            color: isSelected ? "#ffffff" : "#4b5563",
                            width: isNoAnswer ? "145px" : "auto",
                            height: isNoAnswer ? "24px" : "auto",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                          }}
                        >
                          {option.text}
                        </span>
                      </div>
                      {/* Overlay khi hover để đổi màu icon và chữ */}
                      <div
                        className={`
                        absolute inset-0 flex flex-col items-center justify-center
                        border-[3px] rounded-md transition-opacity pointer-events-none
                        bg-[#10B981] border-[#10B981] text-white
                        ${
                          isSelected
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }
                      `}
                      >
                        {option.text === "Nữ" && (
                          <svg
                            width="32"
                            height="32"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M11 15.934A7.501 7.501 0 0 1 12 1a7.5 7.5 0 0 1 1 14.934V18h5v2h-5v4h-2v-4H6v-2h5v-2.066zM12 14a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z"></path>
                          </svg>
                        )}
                        {option.text === "Nam" && (
                          <svg
                            width="32"
                            height="32"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M15.05 8.537L18.585 5H14V3h8v8h-2V6.414l-3.537 3.537a7.5 7.5 0 1 1-1.414-1.414zM10.5 20a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z"></path>
                          </svg>
                        )}
                        {isNoAnswer && (
                          <div
                            className="mb-1 rounded-full flex items-center justify-center"
                            style={{
                              width: "32px",
                              height: "32px",
                              border: "2px solid #ffffff",
                            }}
                          >
                            <div
                              className="rounded-full"
                              style={{
                                width: "20px",
                                height: "20px",
                                border: "2px solid #ffffff",
                              }}
                            ></div>
                          </div>
                        )}
                        <span className="text-sm font-medium text-white">
                          {option.text}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : isYesNoType() ? (
              /* UI đặc biệt cho loại Có/Không */
              <div className="ml-[28px] flex gap-4 flex-wrap">
                {options.map((option) => {
                  const isSelected = isOptionChecked(selectedAnswer, option.id);
                  const isNoAnswer = option.text === "Không có câu trả lời";

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAnswerSelect?.(question.id, option.id, question.type);
                      }}
                      className="gender-button relative group"
                      style={{
                        width: isNoAnswer ? "173px" : "90px",
                        height: "75px",
                      }}
                    >
                      <div
                        className={`
                        absolute inset-0 flex flex-col items-center justify-center
                        border-[3px] rounded-md transition-all
                        ${
                          isSelected
                            ? "bg-[#10B981] border-[#10B981] text-white"
                            : isNoAnswer
                            ? "bg-white border-gray-600 group-hover:bg-[#10B981] group-hover:border-[#10B981]"
                            : "bg-white border-gray-600 group-hover:bg-[#10B981] group-hover:border-[#10B981]"
                        }
                      `}
                      >
                        {option.text === "Có" && (
                          <svg
                            width="32"
                            height="32"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-.997-4L6.76 11.757l1.414-1.414 2.829 2.829 5.656-5.657 1.415 1.414L11.003 16z"></path>
                          </svg>
                        )}
                        {option.text === "Không" && (
                          <svg
                            width="32"
                            height="32"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0-9.414l2.828-2.829 1.415 1.415L13.414 12l2.829 2.828-1.415 1.415L12 13.414l-2.828 2.829-1.415-1.415L10.586 12 7.757 9.172l1.415-1.415L12 10.586z"></path>
                          </svg>
                        )}
                        {isNoAnswer && (
                          <svg
                            role="img"
                            xmlns="http://www.w3.org/2000/svg"
                            width="32px"
                            height="32px"
                            viewBox="0 0 24 24"
                            aria-labelledby="circleIconTitle"
                            stroke={isSelected ? "#ffffff" : "#4b5563"}
                            strokeWidth="1.5"
                            strokeLinecap="square"
                            strokeLinejoin="miter"
                            fill="none"
                            color={isSelected ? "#ffffff" : "#4b5563"}
                            className="mb-1 transition-colors"
                          >
                            <title id="circleIconTitle">Circle</title>
                            <circle cx="12" cy="12" r="8" />
                          </svg>
                        )}
                        <span
                          className="text-sm font-medium transition-colors"
                          style={{
                            color: isSelected ? "#ffffff" : "#4b5563",
                            width: isNoAnswer ? "145px" : "auto",
                            height: isNoAnswer ? "24px" : "auto",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                          }}
                        >
                          {option.text}
                        </span>
                      </div>
                      {/* Overlay khi hover để đổi màu icon và chữ */}
                      <div
                        className={`
                        absolute inset-0 flex flex-col items-center justify-center
                        border-[3px] rounded-md transition-opacity pointer-events-none
                        bg-[#10B981] border-[#10B981] text-white
                        ${
                          isSelected
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }
                      `}
                      >
                        {option.text === "Có" && (
                          <svg
                            width="32"
                            height="32"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-.997-4L6.76 11.757l1.414-1.414 2.829 2.829 5.656-5.657 1.415 1.414L11.003 16z"></path>
                          </svg>
                        )}
                        {option.text === "Không" && (
                          <svg
                            width="32"
                            height="32"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0-9.414l2.828-2.829 1.415 1.415L13.414 12l2.829 2.828-1.415 1.415L12 13.414l-2.828 2.829-1.415-1.415L10.586 12 7.757 9.172l1.415-1.415L12 10.586z"></path>
                          </svg>
                        )}
                        {isNoAnswer && (
                          <svg
                            role="img"
                            xmlns="http://www.w3.org/2000/svg"
                            width="32px"
                            height="32px"
                            viewBox="0 0 24 24"
                            aria-labelledby="circleIconTitle"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            strokeLinecap="square"
                            strokeLinejoin="miter"
                            fill="none"
                            color="#ffffff"
                            className="mb-1"
                          >
                            <title id="circleIconTitle">Circle</title>
                            <circle cx="12" cy="12" r="8" />
                          </svg>
                        )}
                        <span className="text-sm font-medium text-white">
                          {option.text}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : isDateTimeType() ? (
              /* UI đặc biệt cho loại Ngày giờ */
              <div className="ml-[28px]">
                <div
                  className="relative"
                  style={{ width: "326px", height: "43px" }}
                >
                  {/* Input ẩn cho date picker */}
                  <input
                    ref={datePickerRef}
                    type="date"
                    style={{
                      position: "absolute",
                      opacity: 0,
                      pointerEvents: "none",
                      width: 0,
                      height: 0,
                      overflow: "hidden",
                    }}
                    onChange={handleDatePickerChange}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <input
                    type="text"
                    className="border-[3px] border-gray-400 rounded-md px-3 py-2 font-semibold text-gray-800 focus:outline-none uppercase"
                    style={{
                      width: "326px",
                      height: "43px",
                      paddingRight: "40px",
                      fontSize: "14px",
                      letterSpacing: "0.5px",
                    }}
                    placeholder="MM/DD/YYYY"
                    value={dateInputValue}
                    onChange={handleDateInputChange}
                    onClick={(e) => e.stopPropagation()}
                    maxLength={10}
                  />
                  <button
                    type="button"
                    aria-label="Open date picker"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded hover:bg-gray-100 transition-colors pointer-events-auto"
                    onClick={openDatePicker}
                    style={{
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      style={{ width: "24px", height: "24px" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              /* Danh sách đáp án */
              options.length > 0 && (
                <div className="ml-[28px] space-y-4">
                  {options.map((option, optionIndex) => {
                    const isDragging = draggedIndex === optionIndex;
                    const isDragOver = dragOverIndex === optionIndex;

                    const handleDragStart = (e) => {
                      setDraggedIndex(optionIndex);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData(
                        "text/plain",
                        optionIndex.toString()
                      );

                      // Tạo custom drag image từ cả dòng đáp án
                      const rowElement = e.currentTarget.closest(
                        ".flex.items-center.group"
                      );
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
                        dragImage.style.boxShadow =
                          "0 8px 24px rgba(124, 58, 237, 0.3), 0 4px 8px rgba(0,0,0,0.1)";
                        dragImage.style.transform = "scale(1.02)";
                        dragImage.style.fontWeight = "600";
                        document.body.appendChild(dragImage);
                        e.dataTransfer.setDragImage(dragImage, 30, 20);
                        setTimeout(
                          () => document.body.removeChild(dragImage),
                          0
                        );
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
                      if (
                        x < rect.left ||
                        x > rect.right ||
                        y < rect.top ||
                        y > rect.bottom
                      ) {
                        setDragOverIndex(null);
                      }
                    };

                    const handleDrop = (e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      if (
                        draggedIndex !== null &&
                        draggedIndex !== optionIndex &&
                        onMoveOption
                      ) {
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
                        className={
                          isImageOptionType()
                            ? "flex items-start group"
                            : "inline-flex items-center group"
                        }
                        style={{
                          gap: "8px",
                          minHeight: "40px",
                          opacity: isDragging ? 1 : 1,
                          transition: "all 0.2s",
                          backgroundColor: isDragging
                            ? "#ffffff"
                            : isDragOver
                            ? "#f3f4f6"
                            : "transparent",
                          border: isDragging
                            ? "2px solid #7c3aed"
                            : "2px solid transparent",
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
                              onAnswerSelect?.(
                                question.id,
                                option.id,
                                question.type
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="text-violet-600 focus:ring-violet-500 cursor-pointer flex-shrink-0 opacity-90"
                            style={{
                              accentColor: "#7c3aed",
                              width: "28px",
                              height: "28px",
                              borderRadius: isRadioType() ? "50%" : "4px",
                            }}
                          />
                        )}
                        <div
                          className="flex items-start space-x-2 ml-4"
                          style={{
                            width: isImageOptionType() ? "auto" : "300px",
                            flexShrink: 0,
                          }}
                        >
                          {isImageOptionType() ? (
                            /* Hiển thị ảnh cho loại "Chọn hình ảnh từ danh sách (Radio)" */
                            isActive ? (
                              /* Khi active: Hiển thị ảnh nếu có, hoặc ô upload */
                              option.image ? (
                                <div className="relative inline-block">
                                  <img
                                    src={option.image}
                                    alt="Option"
                                    className="peer border-1 border-gray-900 rounded-sm cursor-pointer"
                                    style={{
                                      height: "160px",
                                      width: "auto",
                                      objectFit: "contain",
                                      display: "block",
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOptionImageUpload(option.id);
                                    }}
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOptionImageChange?.(
                                        question.id,
                                        option.id,
                                        null
                                      );
                                    }}
                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 rounded-full w-6 h-6 flex items-center justify-center transition-all opacity-0 peer-hover:opacity-100"
                                    title="Xóa ảnh"
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
                                <div
                                  className="border-2 border-dashed border-gray-700 rounded-md flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                                  style={{
                                    width: "260px",
                                    height: "160px",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOptionImageUpload(option.id);
                                  }}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-gray-400 mb-2"
                                  >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                  </svg>
                                  <span className="text-sm text-gray-500 italic">
                                    Thả hình ảnh tại đây
                                  </span>
                                </div>
                              )
                            ) : /* Khi không active: Hiển thị ảnh hoặc NO IMAGE */
                            option.image ? (
                              <img
                                src={option.image}
                                alt="Option"
                                className="border-2 border-gray-700 rounded-sm"
                                style={{
                                  height: "160px",
                                  width: "auto",
                                  objectFit: "contain",
                                  display: "block",
                                }}
                              />
                            ) : (
                              <div
                                className="border-2 border-gray-700 rounded-md flex flex-col items-center justify-center bg-gray-50"
                                style={{
                                  width: "160px",
                                  height: "160px",
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="48"
                                  height="48"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  className="text-gray-300 mb-2"
                                >
                                  <rect
                                    x="3"
                                    y="3"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    ry="2"
                                  />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                  <polyline points="21 15 16 10 5 21" />
                                </svg>
                                <span className="text-gray-400 font-bold text-sm">
                                  NO IMAGE
                                </span>
                              </div>
                            )
                          ) : /* Hiển thị text bình thường cho các loại khác */
                          isActive ? (
                            <div
                              style={{
                                width: "300px",
                                flexShrink: 0,
                              }}
                            >
                              <EditableField
                                placeholder={
                                  isRadioType()
                                    ? "Answer option"
                                    : "Subquestion"
                                }
                                initialValue={option.text}
                                inputClassName="text-sm text-gray-700 placeholder:italic placeholder:text-gray-400 font-medium"
                                isTextarea={true}
                                onChange={(value) =>
                                  onOptionChange?.(
                                    question.id,
                                    option.id,
                                    value
                                  )
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
                                className={`text-sm text-gray-700 font-medium ${
                                  !option.text ? "italic text-gray-400" : ""
                                } inline-block whitespace-normal break-words leading-relaxed opacity-70`}
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
                                {option.text ||
                                  (isRadioType()
                                    ? "Answer option"
                                    : "Subquestion")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
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
                {!isGenderType() && !isYesNoType() && !isDateTimeType() && (
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
                )}

                <div
                  className={`flex items-center space-x-1 ${
                    isGenderType() || isYesNoType() || isDateTimeType()
                      ? "ml-auto"
                      : "mt-[70px]"
                  }`}
                >
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
