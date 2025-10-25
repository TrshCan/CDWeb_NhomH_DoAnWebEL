import React, { useState } from "react";

export default function EditableField({
  placeholder,
  initialValue = "",
  inputClassName = "",
  isTextarea = false,
}) {
  const [value, setValue] = useState(initialValue);
  const commonClasses =
    "w-full bg-transparent focus:outline-none rounded-md p-2 -ml-2 focus:bg-black/5 transition-colors duration-200 resize-none";
  const InputComponent = isTextarea ? "textarea" : "input";

  return (
    <InputComponent
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className={`${commonClasses} ${inputClassName}`}
      rows={isTextarea ? 1 : undefined}
    />
  );
}
