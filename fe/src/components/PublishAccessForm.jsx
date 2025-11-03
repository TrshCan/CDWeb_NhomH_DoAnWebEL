import React, { useEffect, useMemo, useRef, useState } from "react";

// Chuẩn hoá giá trị datetime-local
function toLocalInputValue(v) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function PublishAccessForm({ value, onChange }) {
  const [form, setForm] = useState({ start_at: "", end_at: "" });
  const [error, setError] = useState("");

  const startRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    if (value) setForm((f) => ({ ...f, ...value }));
  }, [value]);

  const baseFieldCls =
    "w-full border border-gray-300 rounded-md px-4 py-2 pr-12 text-gray-800 " + // pr-12 để chừa chỗ cho icon
    "focus:ring-2 focus:ring-violet-600 focus:border-violet-600 " +
    "hover:bg-violet-50 hover:border-violet-500 transition-colors input-no-indicator";

  const startInput = useMemo(
    () => toLocalInputValue(form.start_at),
    [form.start_at]
  );
  const endInput = useMemo(() => toLocalInputValue(form.end_at), [form.end_at]);

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const blurPush = (key) => onChange?.({ ...form, [key]: form[key] });

  useEffect(() => {
    if (
      form.start_at &&
      form.end_at &&
      new Date(form.end_at) < new Date(form.start_at)
    ) {
      setError("⚠️ Ngày/giờ kết thúc phải sau ngày/giờ bắt đầu.");
    } else setError("");
  }, [form.start_at, form.end_at]);

  // Icon lịch (màu đen)
  const CalendarIcon = () => (
    <svg
      width="20px"
      height="20px"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-labelledby="calendarEventIconTitle"
      stroke="#000000"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      fill="none"
      color="#000000"
      className="transition-transform duration-200 group-hover:scale-110"
    >
      <title id="calendarEventIconTitle">Calendar event</title>
      <path d="M3 5H21V21H3V5Z" />
      <path d="M21 9H3" />
      <path d="M7 5V3" />
      <path d="M17 5V3" />
      <rect x="15" y="15" width="2" height="2" />
    </svg>
  );

  const openPicker = (ref) => {
    if (ref.current) {
      // Chromium hỗ trợ showPicker(); nếu không có, fallback focus
      if (typeof ref.current.showPicker === "function")
        ref.current.showPicker();
      else ref.current.focus();
    }
  };

  return (
    <>
      {/* CSS ẩn icon lịch mặc định của trình duyệt */}
      <style>{`
        /* Chrome, Edge, Safari (WebKit) */
        .input-no-indicator::-webkit-calendar-picker-indicator {
          opacity: 0;
          display: none;
        }
        .input-no-indicator::-webkit-clear-button { display: none; }
        .input-no-indicator::-webkit-inner-spin-button { display: none; }
        /* Firefox hầu như không hiện indicator nên không cần */
      `}</style>

      <div className="bg-white rounded-md shadow border border-gray-200 p-10 max-w-3xl mx-auto mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">
          Publication date
        </h2>
        <hr className="border-gray-200 mb-6" />

        {/* Ngày/giờ bắt đầu */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày/giờ bắt đầu
          </label>
          <div className="relative group">
            <input
              ref={startRef}
              type="datetime-local"
              className={baseFieldCls}
              value={startInput}
              onChange={(e) =>
                update(
                  "start_at",
                  e.target.value ? new Date(e.target.value).toISOString() : ""
                )
              }
              onBlur={() => blurPush("start_at")}
              placeholder="MM/DD/YYYY hh:mm"
            />
            {/* Icon tuỳ biến duy nhất */}
            <button
              type="button"
              aria-label="Open date picker"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
              onClick={() => openPicker(startRef)}
            >
              <CalendarIcon />
            </button>
          </div>
        </div>

        {/* Ngày/giờ kết thúc */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày/giờ kết thúc
          </label>
          <div className="relative group">
            <input
              ref={endRef}
              type="datetime-local"
              className={baseFieldCls}
              value={endInput}
              onChange={(e) =>
                update(
                  "end_at",
                  e.target.value ? new Date(e.target.value).toISOString() : ""
                )
              }
              onBlur={() => blurPush("end_at")}
              placeholder="MM/DD/YYYY hh:mm"
            />
            <button
              type="button"
              aria-label="Open date picker"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
              onClick={() => openPicker(endRef)}
            >
              <CalendarIcon />
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
    </>
  );
}
