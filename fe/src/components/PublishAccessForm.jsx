// components/PublishAccessForm.jsx
import React, { useEffect, useMemo, useState } from "react";

// helper: chuẩn hóa về 'yyyy-MM-ddTHH:mm' cho <input type="datetime-local">
function toLocalInputValue(v) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function PublishAccessForm({ value, onChange }) {
  const [form, setForm] = useState({
    start_at: "", // ISO string hoặc empty
    end_at: "",
  });

  useEffect(() => {
    if (value) setForm((f) => ({ ...f, ...value }));
  }, [value]);

  const handleChange = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleBlur = (key) => {
    onChange?.({ ...form, [key]: form[key] });
  };

  const startInput = useMemo(
    () => toLocalInputValue(form.start_at),
    [form.start_at]
  );
  const endInput = useMemo(() => toLocalInputValue(form.end_at), [form.end_at]);

  const [error, setError] = useState("");
  const validate = (start, end) => {
    if (start && end && new Date(end) < new Date(start)) {
      setError("⚠️ Ngày/giờ kết thúc phải sau ngày/giờ bắt đầu.");
    } else {
      setError("");
    }
  };

  useEffect(() => {
    validate(form.start_at, form.end_at);
  }, [form.start_at, form.end_at]);

  return (
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
        <div className="relative">
          <input
            type="datetime-local"
            className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-800
                       focus:ring-2 focus:ring-violet-600 focus:border-violet-600
                       hover:bg-violet-50 transition-colors"
            value={startInput}
            onChange={(e) => {
              // e.target.value là 'yyyy-MM-ddTHH:mm' -> lưu ISO
              const iso = e.target.value
                ? new Date(e.target.value).toISOString()
                : "";
              handleChange("start_at", iso);
            }}
            onBlur={() => handleBlur("start_at")}
            placeholder="MM/DD/YYYY hh:mm"
          />
          {/* icon lịch đơn giản (tuỳ chọn) */}
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            🗓️
          </span>
        </div>
      </div>

      {/* Ngày/giờ kết thúc */}
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ngày/giờ kết thúc
        </label>
        <div className="relative">
          <input
            type="datetime-local"
            className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-800
                       focus:ring-2 focus:ring-violet-600 focus:border-violet-600
                       hover:bg-violet-50 transition-colors"
            value={endInput}
            onChange={(e) => {
              const iso = e.target.value
                ? new Date(e.target.value).toISOString()
                : "";
              handleChange("end_at", iso);
            }}
            onBlur={() => handleBlur("end_at")}
            placeholder="MM/DD/YYYY hh:mm"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            🗓️
          </span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
