import React, { useState, useRef, useEffect } from "react";

export default function HeaderMenu({ onShare }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Đóng menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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

  return (
    <div className="relative" ref={menuRef}>
      {/* Button ... */}
      <button
        type="button"
        aria-label="More options"
        className="w-10 h-9 inline-flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="3" r="1.5" fill="currentColor" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          <circle cx="8" cy="13" r="1.5" fill="currentColor" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border-2 border-gray-300 py-3 z-50">
          {/* Header */}
          <div className="px-4 pb-3 mb-2 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 tracking-wider uppercase">
              NAVIGATE
            </h3>
          </div>
          
          {/* Menu Item */}
          <button
            type="button"
            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition"
            onClick={() => {
              onShare?.();
              setIsOpen(false);
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <path
                d="M12 5.5C13.1046 5.5 14 4.60457 14 3.5C14 2.39543 13.1046 1.5 12 1.5C10.8954 1.5 10 2.39543 10 3.5C10 4.60457 10.8954 5.5 12 5.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M4 10C5.10457 10 6 9.10457 6 8C6 6.89543 5.10457 6 4 6C2.89543 6 2 6.89543 2 8C2 9.10457 2.89543 10 4 10Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M12 14.5C13.1046 14.5 14 13.6046 14 12.5C14 11.3954 13.1046 10.5 12 10.5C10.8954 10.5 10 11.3954 10 12.5C10 13.6046 10.8954 14.5 12 14.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M5.8 9L10.2 11.5M10.2 4.5L5.8 7"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <span className="font-medium">Chia sẻ</span>
          </button>
        </div>
      )}
    </div>
  );
}
