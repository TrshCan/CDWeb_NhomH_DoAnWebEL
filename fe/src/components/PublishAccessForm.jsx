import React, { useEffect, useMemo, useState } from "react";

// chuyển ISO/string -> value cho input datetime-local: "yyyy-MM-ddTHH:mm"
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

  useEffect(() => {
    if (value) setForm((f) => ({ ...f, ...value }));
  }, [value]);

  const baseFieldCls =
    "w-full border border-gray-300 rounded-md px-4 py-2 text-gray-800 " +
    "focus:ring-2 focus:ring-violet-600 focus:border-violet-600 " +
    "hover:bg-violet-50 hover:border-violet-500 transition-colors";

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

  return (
    <div className="bg-white rounded-md shadow border border-gray-200 p-10 max-w-3xl mx-auto mt-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">
        Publication date
      </h2>
      <hr className="border-gray-200 mb-6" />

      {/* Start */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ngày/giờ bắt đầu
        </label>
        <div className="relative">
          <input
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
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            🗓️
          </span>
        </div>
      </div>

      {/* End */}
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ngày/giờ kết thúc
        </label>
        <div className="relative">
          <input
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
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            🗓️
          </span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
