import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

// format value cho <input type="datetime-local">
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
  const committedRef = useRef({ start_at: "", end_at: "" });
  const lastErrorRef = useRef("");

  useEffect(() => {
    if (value) {
      setForm((f) => ({ ...f, ...value }));
      committedRef.current = { ...value };
    }
  }, [value]);

  const baseFieldCls =
    "w-full border border-gray-300 rounded-md px-4 py-2 pr-12 text-gray-800 " +
    "focus:border-violet-600 focus:shadow-md " + // 1 viền duy nhất khi focus
    "hover:bg-violet-50 hover:border-violet-500 transition-colors input-no-indicator";

  const startInput = useMemo(
    () => toLocalInputValue(form.start_at),
    [form.start_at]
  );
  const endInput = useMemo(() => toLocalInputValue(form.end_at), [form.end_at]);

  // Validate chi tiết
  const validate = (startISO, endISO) => {
    if (!startISO && !endISO) return ""; // chưa nhập gì
    if (!startISO) return "Vui lòng chọn ngày/giờ bắt đầu.";
    if (!endISO) return "Vui lòng chọn ngày/giờ kết thúc.";
    const start = new Date(startISO);
    const end = new Date(endISO);
    if (isNaN(start.getTime()) || isNaN(end.getTime()))
      return "Thời gian không hợp lệ.";
    if (end < start) return "Ngày/giờ kết thúc phải sau ngày/giờ bắt đầu.";
    return "";
  };

  useEffect(() => {
    setError(validate(form.start_at, form.end_at));
  }, [form.start_at, form.end_at]);

  // Commit lưu + toast xanh (chỉ khi giá trị thật sự đổi)
  const commitIfValidAndChanged = (key, nextISO) => {
    const prevISO = committedRef.current[key];
    if (nextISO === prevISO) return; // không đổi -> thôi

    const startISO = key === "start_at" ? nextISO : form.start_at;
    const endISO = key === "end_at" ? nextISO : form.end_at;

    const msg = validate(startISO, endISO);
    if (msg) {
      // lỗi -> toast đỏ ngay, không lưu
      setError(msg);
      if (msg !== lastErrorRef.current) {
        lastErrorRef.current = msg;
        toast.error(msg, {
          id: "pubdate-error",
          style: { background: "#dc2626", color: "#fff" },
        }); // đỏ
      }
      return;
    }

    // hợp lệ -> xoá lỗi, lưu + toast xanh
    lastErrorRef.current = "";
    toast.dismiss("pubdate-error");
    committedRef.current[key] = nextISO;
    onChange?.({ ...committedRef.current });
    setError("");
    toast.success("Đã lưu thay đổi ✅", {
      id: `pubdate-ok-${key}`,
      style: { background: "#16a34a", color: "#fff" },
    }); // xanh
  };

  // onChange cho datetime: cập nhật state, validate và AUTO-COMMIT (không cần blur)
  const handleDateChange = (key, rawValue) => {
    const iso = rawValue ? new Date(rawValue).toISOString() : "";
    const nextForm = { ...form, [key]: iso };
    setForm(nextForm);

    const msg = validate(nextForm.start_at, nextForm.end_at);
    setError(msg);

    // Tự lưu ngay khi hợp lệ
    if (!msg) {
      commitIfValidAndChanged(key, iso);
    } else {
      // Báo lỗi ngay
      if (msg !== lastErrorRef.current) {
        lastErrorRef.current = msg;
        toast.error(msg, {
          id: "pubdate-error",
          style: { background: "#dc2626", color: "#fff" },
        });
      }
    }
  };

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
      if (typeof ref.current.showPicker === "function")
        ref.current.showPicker();
      else ref.current.focus();
    }
  };

  return (
    <>
      {/* Ẩn icon lịch mặc định để không bị icon đôi */}
      <style>{`
        .input-no-indicator::-webkit-calendar-picker-indicator { opacity: 0; display: none; }
        .input-no-indicator::-webkit-clear-button { display: none; }
        .input-no-indicator::-webkit-inner-spin-button { display: none; }
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
              onChange={(e) => handleDateChange("start_at", e.target.value)}
              // vẫn để onBlur, nhưng commit đã xảy ra ngay onChange khi hợp lệ
              onBlur={() => {
                /* no-op */
              }}
            />
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
              onChange={(e) => handleDateChange("end_at", e.target.value)}
              onBlur={() => {
                /* no-op */
              }}
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

        {/* Lỗi hiển thị trực tiếp dưới form */}
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>
    </>
  );
}
