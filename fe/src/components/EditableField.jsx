import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

export default function EditableField({
  placeholder,
  initialValue = "",
  inputClassName = "",
  isTextarea = false,
  maxLength = 256, // ✅ Giới hạn mặc định 256 ký tự cho tên, mô tả, đáp án
  onChange, // ✅ callback ra ngoài khi onChange
  onBlur, // ✅ callback ra ngoài khi onBlur (để lưu vào CSDL)
}) {
  const [value, setValue] = useState(initialValue);
  const [showError, setShowError] = useState(false);
  const textareaRef = useRef(null);
  const warningShownRef = useRef(false);
  const errorTimeoutRef = useRef(null);
  const InputComponent = isTextarea ? "textarea" : "input";

  const commonClasses =
    "focus:outline-none rounded-md p-2 -ml-2 transition-colors duration-200 resize-none bg-transparent focus:bg-black/5";

  // 🔄 Đồng bộ lại khi initialValue thay đổi (từ App)
  useEffect(() => {
    setValue(initialValue || "");
    warningShownRef.current = false;
  }, [initialValue, maxLength]);

  // Cleanup timeout khi unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  // Auto-grow textarea height - đảm bảo height tối thiểu là 24px
  useEffect(() => {
    if (isTextarea && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(scrollHeight, 24)}px`;
    }
  }, [value, isTextarea]);

  const handleChange = (e) => {
    let newVal = e.target.value;
    
    // ✅ Giới hạn số ký tự - không cho nhập quá maxLength
    if (newVal.length >= maxLength) {
      newVal = newVal.slice(0, maxLength);
      
      // Hiển thị lỗi trong 3 giây
      setShowError(true);
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        setShowError(false);
      }, 3000);
      
      // Hiển thị toast cảnh báo (chỉ 1 lần trong 3 giây)
      if (!warningShownRef.current) {
        toast.error(`Chỉ cho phép nhập tối đa ${maxLength} ký tự`, {
          duration: 3000,
          id: 'max-length-warning',
        });
        warningShownRef.current = true;
        
        setTimeout(() => {
          warningShownRef.current = false;
        }, 3000);
      }
    }
    
    setValue(newVal);
    onChange?.(newVal);
    
    // Auto-grow textarea
    if (isTextarea && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(scrollHeight, 24)}px`;
    }
  };

  // ✅ Ngăn event propagation để không mất active
  const handleClick = (e) => {
    e.stopPropagation();
  };

  const handleMouseDown = (e) => {
    e.stopPropagation();
  };

  // ✅ Style cho trạng thái lỗi - chỉ đổi màu nền và chữ, không có viền
  const baseStyle = isTextarea ? {
    width: "100%",
    maxWidth: "100%",
    minHeight: "24px",
    wordWrap: "break-word",
    overflowWrap: "break-word",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
    boxSizing: "border-box",
    lineHeight: "1.625",
    marginTop: "0",
    marginBottom: "0",
    verticalAlign: "top",
    backgroundColor: showError ? "#fef2f2" : undefined,
    color: showError ? "#dc2626" : undefined,
  } : {
    backgroundColor: showError ? "#fef2f2" : undefined,
    color: showError ? "#dc2626" : undefined,
  };

  return (
    <div className="relative w-full" onClick={handleClick} onMouseDown={handleMouseDown}>
      <InputComponent
        ref={isTextarea ? textareaRef : null}
        type={isTextarea ? undefined : "text"}
        value={value}
        onChange={handleChange}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onBlur={(e) => {
          onChange?.(e.target.value);
          onBlur?.(e.target.value);
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`${commonClasses} ${inputClassName} ${isTextarea ? "w-full" : "w-full"}`}
        rows={isTextarea ? 1 : undefined}
        style={baseStyle}
      />
      {/* Hiển thị số ký tự và cảnh báo khi đạt giới hạn */}
      {showError && (
        <div 
          className="text-xs font-semibold mt-1"
          style={{ color: "#dc2626" }}
        >
          ⚠️ {value.length}/{maxLength} ký tự (đã đạt giới hạn)
        </div>
      )}
    </div>
  );
}
