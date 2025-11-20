import React from "react";

export default function HeaderBar({
  title = "",
  savedAt = null,
  isSaving = false,
  onActivate,
  onMore,
  onAddQuestion,
  logoSrc = "/fe/img/logo.jpg",
}) {
  const fmt = (d) => {
    if (!d) return "--:--";
    const pad = (n) => String(n).padStart(2, "0");
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${hh}:${mm}`;
  };

  return (
    <header className="fixed top-0 inset-x-0 h-[60px] bg-white border-b border-gray-200 z-50">
      <div className="h-full w-full flex items-center justify-between px-4">
        {/* Left: LOGO + Dấu + */}
        <div className="flex items-center min-w-0">
          {/* Nếu chưa có logo thật, tạm dùng placeholder box */}
          {logoSrc ? (
            <img src="img/logo.jpg" alt="Logo" className="h-13 w-auto" />
          ) : (
            <div className="h-8 w-24 bg-gray-200 rounded-sm" />
          )}
          
          {/* Dấu + cách logo 100px */}
          <div className="ml-[100px]">
            <button
              type="button"
              onClick={onAddQuestion}
              className="w-9 h-9 flex items-center justify-center rounded bg-violet-600 hover:bg-violet-700 active:bg-violet-800 transition-colors"
              aria-label="Thêm câu hỏi"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 1V11M1 6H11"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Center: TÊN KHẢO SÁT */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-2">
          <h1
            className="text-base md:text-lg font-semibold text-gray-900 truncate"
            title={title || "Chưa đặt tên"}
          >
            {title?.trim() ? title : "Chưa đặt tên"}
          </h1>
        </div>

        {/* Right: Log saved + Kích hoạt + ... */}
        <div className="flex items-center gap-2">
          {/* 115 x 29 */}
          <div className="w-[115px] h-[29px] inline-flex items-center justify-center rounded border border-gray-300 text-xs text-gray-700">
            {isSaving ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang lưu...
              </span>
            ) : (
              `Đã lưu ${fmt(savedAt)}`
            )}
          </div>

          {/* 113 x 36 */}
          <button
            type="button"
            className="w-[113px] h-9 inline-flex items-center justify-center rounded-md bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 active:bg-violet-800 transition"
            onClick={onActivate}
          >
            Kích hoạt
          </button>

          {/* 40 x 36 */}
          <button
            type="button"
            aria-label="More"
            className="w-10 h-9 inline-flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
            onClick={onMore}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-gray-800"
            >
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
