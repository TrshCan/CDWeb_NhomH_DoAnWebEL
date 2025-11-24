import { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import { isLongTextType } from "../helpers/questionTypeHelpers";

export const useTextInput = (question, selectedAnswer, onAnswerSelect) => {
  const [textInputValue, setTextInputValue] = useState("");
  const [textInputError, setTextInputError] = useState("");
  const [multipleTextInputs, setMultipleTextInputs] = useState({});
  
  const toastTimeoutRef = useRef(null);
  const lastToastIdRef = useRef(null);

  // Helper function để hiển thị toast với debounce
  const showToastError = (errorMsg, toastId = "text-error") => {
    // Clear timeout cũ nếu có
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    // Dismiss toast cũ cùng loại nếu có
    if (lastToastIdRef.current) {
      toast.dismiss(lastToastIdRef.current);
    }

    // Hiển thị toast mới sau 300ms debounce
    toastTimeoutRef.current = setTimeout(() => {
      const id = toast.error(errorMsg, {
        style: { background: "#dc2626", color: "#fff" },
        id: toastId, // Sử dụng cùng ID để replace toast cũ
      });
      lastToastIdRef.current = id;
    }, 300);
  };

  // Xử lý khi nhập text cho nhiều văn bản ngắn
  const handleMultipleTextInputChange = (optionId, value) => {
    const maxLength = 256;
    
    // Kiểm tra độ dài
    if (value.length > maxLength) {
      return; // Không cho phép nhập quá 256 ký tự
    }

    // Cập nhật state
    const newInputs = { ...multipleTextInputs, [optionId]: value };
    setMultipleTextInputs(newInputs);
    
    // Lưu vào selectedAnswer dưới dạng JSON
    onAnswerSelect?.(question.id, JSON.stringify(newInputs), question.type);
  };

  // Xử lý khi nhập text
  const handleTextInputChange = (e) => {
    const value = e.target.value;
    const isNumericOnly = question?.numericOnly === true;
    const maxLength = question?.maxLength || (isLongTextType(question.type) ? 2500 : 256);

    // Kiểm tra độ dài trước - không cho phép nhập quá maxLength
    if (value.length > maxLength) {
      // Không cho phép nhập quá 256 ký tự
      const errorMsg = `Vượt quá số ký tự cho phép (${maxLength} ký tự)`;
      setTextInputError(errorMsg);
      showToastError(errorMsg, "max-length-error");
      // Giữ nguyên giá trị cũ (không cập nhật)
      return;
    }

    // Kiểm tra nếu chỉ cho phép số
    if (isNumericOnly) {
      // Chỉ cho phép số - chỉ lấy các ký tự số
      const numericValue = value.replace(/[^0-9]/g, "");
      if (value !== numericValue) {
        // Nếu có ký tự không phải số, hiển thị lỗi nhưng vẫn cập nhật với giá trị đã lọc
        const errorMsg = "Chỉ được phép nhập số";
        setTextInputError(errorMsg);
        showToastError(errorMsg, "numeric-only-error");
        setTextInputValue(numericValue);
        onAnswerSelect?.(question.id, numericValue, question.type);
        return;
      }
    }

    // Clear error nếu hợp lệ
    setTextInputError("");
    setTextInputValue(value);
    onAnswerSelect?.(question.id, value, question.type);
  };

  // Sync textInputValue với selectedAnswer
  useEffect(() => {
    if (question.type === "Văn bản ngắn") {
      setTextInputValue(selectedAnswer || "");
      setTextInputError("");
    } else if (question.type === "Văn bản dài") {
      setTextInputValue(selectedAnswer || "");
      setTextInputError("");
    } else if (question.type === "Nhiều văn bản ngắn") {
      if (selectedAnswer) {
        try {
          const parsed = JSON.parse(selectedAnswer);
          if (typeof parsed === "object" && parsed !== null) {
            setMultipleTextInputs(parsed);
          } else {
            setMultipleTextInputs({});
          }
        } catch {
          setMultipleTextInputs({});
        }
      } else {
        setMultipleTextInputs({});
      }
    }
  }, [selectedAnswer, question.type]);

  // Clear error khi numericOnly hoặc maxLength thay đổi
  useEffect(() => {
    if (question.type === "Văn bản ngắn" || question.type === "Văn bản dài") {
      setTextInputError("");
    }
  }, [question?.numericOnly, question?.maxLength, question.type]);

  // Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  return {
    textInputValue,
    textInputError,
    multipleTextInputs,
    handleTextInputChange,
    handleMultipleTextInputChange,
  };
};
