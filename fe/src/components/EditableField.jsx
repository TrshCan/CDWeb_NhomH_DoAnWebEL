import React, { useState, useEffect, useRef } from "react";

export default function EditableField({
  placeholder,
  initialValue = "",
  inputClassName = "",
  isTextarea = false,
  onChange, // ✅ callback ra ngoài khi onChange
  onBlur, // ✅ callback ra ngoài khi onBlur (để lưu vào CSDL)
}) {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef(null);
  const InputComponent = isTextarea ? "textarea" : "input";

  const commonClasses =
    "bg-transparent focus:outline-none rounded-md p-2 -ml-2 focus:bg-black/5 transition-colors duration-200 resize-none";

  // 🔄 Đồng bộ lại khi initialValue thay đổi (từ App)
  useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);

  // Auto-grow textarea height - đảm bảo height tối thiểu là 24px
  useEffect(() => {
    if (isTextarea && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      // Đảm bảo height tối thiểu là 24px (minHeight)
      textareaRef.current.style.height = `${Math.max(scrollHeight, 24)}px`;
    }
  }, [value, isTextarea]);

  const handleChange = (e) => {
    const newVal = e.target.value;
    setValue(newVal); // cập nhật local
    onChange?.(newVal); // 🔔 báo App biết để cập nhật panel trái
    
    // Auto-grow textarea - đảm bảo height tối thiểu là 24px
    if (isTextarea && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      // Đảm bảo height tối thiểu là 24px (minHeight)
      textareaRef.current.style.height = `${Math.max(scrollHeight, 24)}px`;
    }
  };

  return (
    <InputComponent
      ref={isTextarea ? textareaRef : null}
      type={isTextarea ? undefined : "text"}
      value={value}
      onChange={handleChange}
      onBlur={(e) => {
        // Gọi onChange để cập nhật UI (nếu có)
        onChange?.(e.target.value);
        // Gọi onBlur để lưu vào CSDL (nếu có)
        onBlur?.(e.target.value);
      }}
      placeholder={placeholder}
      className={`${commonClasses} ${inputClassName} ${isTextarea ? "w-full" : "w-full"}`}
      rows={isTextarea ? 1 : undefined}
      style={isTextarea ? {
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
      } : {}}
    />
  );
}
