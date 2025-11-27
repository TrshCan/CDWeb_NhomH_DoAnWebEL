import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

function toLocalInputValue(v) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  // Đảm bảo năm có 4 chữ số
  if (year < 1000 || year > 9999) return "";
  return `${year}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function PublishAccessForm({ value, onChange }) {
  const [form, setForm] = useState({ start_at: "", end_at: "" });
  const [error, setError] = useState("");
  const [localInputs, setLocalInputs] = useState({ start_at: "", end_at: "" });

  const startRef = useRef(null);
  const endRef = useRef(null);
  const committedRef = useRef({ start_at: "", end_at: "" });
  const lastErrorRef = useRef("");

  useEffect(() => {
    if (value) {
      setForm((f) => ({ ...f, ...value }));
      committedRef.current = { ...value };
      // Cập nhật local inputs khi có giá trị mới từ props
      setLocalInputs({
        start_at: toLocalInputValue(value.start_at),
        end_at: toLocalInputValue(value.end_at),
      });
    }
  }, [value]);

  const baseFieldCls =
    "w-full border border-gray-300 rounded-sm px-4 py-2 pr-12 text-gray-800 " +
    "focus:border-violet-600 focus:shadow-md " +
    "hover:bg-violet-50 hover:border-violet-500 transition-colors input-no-indicator";

  const validate = (startISO, endISO) => {
    if (!startISO && !endISO) return "";
    if (!startISO) return "Vui lòng chọn ngày/giờ bắt đầu.";
    if (!endISO) return "Vui lòng chọn ngày/giờ kết thúc.";
    const start = new Date(startISO);
    const end = new Date(endISO);
    if (isNaN(start.getTime()) || isNaN(end.getTime()))
      return "Thời gian không hợp lệ.";
    if (end < start) return "Ngày/giờ kết thúc phải sau ngày/giờ bắt đầu.";
    return "";
  };

  const commitIfValidAndChanged = (key, nextISO) => {
    const prevISO = committedRef.current[key];
    if (nextISO === prevISO) return;

    const nextForm = { ...form, [key]: nextISO };
    const msg = validate(nextForm.start_at, nextForm.end_at);
    if (msg) {
      setError(msg);
      if (msg !== lastErrorRef.current) {
        lastErrorRef.current = msg;
        toast.error(msg, {
          id: "pubdate-error",
          style: { background: "#dc2626", color: "#fff" },
        });
      }
      return;
    }

    lastErrorRef.current = "";
    toast.dismiss("pubdate-error");

    setForm(nextForm);
    committedRef.current = { ...nextForm };
    onChange?.(nextForm);
    setError("");

    toast.success("Đã lưu thay đổi ✅", {
      id: `pubdate-ok-${key}`,
      style: { background: "#16a34a", color: "#fff" },
    });
  };

  const handleDateChange = (key, rawValue) => {
    // Cập nhật local input state ngay lập tức
    setLocalInputs((prev) => ({ ...prev, [key]: rawValue }));

    // Xóa error khi đang nhập
    setError("");
    toast.dismiss("pubdate-error");

    // Kiểm tra format datetime-local hợp lệ (yyyy-MM-ddThh:mm)
    if (!rawValue) {
      const iso = "";
      const nextForm = { ...form, [key]: iso };
      setForm(nextForm);
      commitIfValidAndChanged(key, iso);
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(rawValue)) {
      // Format chưa đúng, chỉ cập nhật local input, không xử lý tiếp
      return;
    }

    const iso = new Date(rawValue).toISOString();
    const nextForm = { ...form, [key]: iso };
    setForm(nextForm);

    const msg = validate(nextForm.start_at, nextForm.end_at);
    setError(msg);

    if (!msg) commitIfValidAndChanged(key, iso);
    else if (msg !== lastErrorRef.current) {
      lastErrorRef.current = msg;
      toast.error(msg, {
        id: "pubdate-error",
        style: { background: "#dc2626", color: "#fff" },
      });
    }
  };

  const CalendarIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      stroke="#000"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      fill="none"
      className="transition-transform duration-200 group-hover:scale-110"
    >
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
      <style>{`
        .input-no-indicator::-webkit-calendar-picker-indicator { opacity: 0; display: none; }
        .input-no-indicator::-webkit-clear-button { display: none; }
        .input-no-indicator::-webkit-inner-spin-button { display: none; }
      `}</style>

      <div className="w-full max-w-none mr-auto ml-8 bg-white p-8 mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">
          Publication date
        </h2>
        <hr className="border-gray-200 mb-6" />

        <div className="space-y-6">
          {/* Ngày/giờ bắt đầu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày/giờ bắt đầu
            </label>
            <div className="relative group">
              <input
                ref={startRef}
                type="datetime-local"
                className={baseFieldCls}
                value={localInputs.start_at}
                onChange={(e) => handleDateChange("start_at", e.target.value)}
              />
              <button
                type="button"
                aria-label="Open date picker"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 top-[-20px] left-200"
                onClick={() => openPicker(startRef)}
              >
                <CalendarIcon />
              </button>
            </div>
          </div>

          {/* Ngày/giờ kết thúc */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày/giờ kết thúc
            </label>
            <div className="relative group">
              <input
                ref={endRef}
                type="datetime-local"
                className={baseFieldCls}
                value={localInputs.end_at}
                onChange={(e) => handleDateChange("end_at", e.target.value)}
              />
              <button
                type="button"
                aria-label="Open date picker"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 top-[-20px] left-200"
                onClick={() => openPicker(endRef)}
              >
                <CalendarIcon />
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </>
  );
}
