import React, { useState, useEffect } from "react";

export default function EditableField({
  placeholder,
  initialValue = "",
  inputClassName = "",
  isTextarea = false,
  onChange, // ✅ callback ra ngoài
}) {
  const [value, setValue] = useState(initialValue);
  const InputComponent = isTextarea ? "textarea" : "input";

  const commonClasses =
    "w-full bg-transparent focus:outline-none rounded-md p-2 -ml-2 focus:bg-black/5 transition-colors duration-200 resize-none";

  // 🔄 Đồng bộ lại khi initialValue thay đổi (từ App)
  useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);

  const handleChange = (e) => {
    const newVal = e.target.value;
    setValue(newVal); // cập nhật local
    onChange?.(newVal); // 🔔 báo App biết để cập nhật panel trái
  };

  return (
    <InputComponent
      type={isTextarea ? undefined : "text"}
      value={value}
      onChange={handleChange}
      onBlur={(e) => onChange?.(e.target.value)} // ✅ backup khi mất focus
      placeholder={placeholder}
      className={`${commonClasses} ${inputClassName}`}
      rows={isTextarea ? 1 : undefined}
    />
  );
}
