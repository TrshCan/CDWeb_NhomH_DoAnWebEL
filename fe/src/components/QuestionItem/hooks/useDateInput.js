import { useState, useRef, useEffect } from "react";
import { formatDateForDisplay, formatDateForStorage } from "../helpers/dateFormatters";

export const useDateInput = (question, selectedAnswer, onAnswerSelect) => {
  const [dateInputValue, setDateInputValue] = useState("");
  const datePickerRef = useRef(null);

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
  useEffect(() => {
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

  return {
    dateInputValue,
    datePickerRef,
    handleDateInputChange,
    openDatePicker,
    handleDatePickerChange,
  };
};
