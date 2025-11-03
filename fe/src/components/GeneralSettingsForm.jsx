import React, { useEffect, useState } from "react";

export default function GeneralSettingsForm({ value, onChange }) {
  const [form, setForm] = useState({
    title: "",
    type: "survey",
    object: "public",
    base_language: "vi",
    owner: "",
  });

  useEffect(() => {
    if (value) setForm((f) => ({ ...f, ...value }));
  }, [value]);

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const blurPush = (key) => onChange?.({ ...form, [key]: form[key] });

  const baseFieldCls =
    "w-full border border-gray-300 rounded-md px-4 py-2 text-gray-800 " +
    "focus:ring-2 focus:ring-violet-600 focus:border-violet-600 " +
    "focus:text-violet-700 hover:bg-violet-50 hover:border-violet-500 transition-colors";

  return (
    <div className="bg-white rounded-md shadow border border-gray-200 p-10 max-w-3xl mx-auto mt-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-8">Tổng quát</h2>

      {/* Tên khảo sát */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên khảo sát
        </label>
        <input
          type="text"
          className={baseFieldCls}
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          onBlur={() => blurPush("title")}
          placeholder="Nhập tên khảo sát..."
        />
      </div>

      {/* Loại khảo sát */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Loại khảo sát
        </label>
        <select
          className={baseFieldCls}
          value={form.type}
          onChange={(e) => update("type", e.target.value)}
          onBlur={() => blurPush("type")}
        >
          <option value="survey">Survey</option>
          <option value="quiz">Quiz</option>
        </select>
      </div>

      {/* Đối tượng khảo sát */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Đối tượng khảo sát
        </label>
        <select
          className={baseFieldCls}
          value={form.object}
          onChange={(e) => update("object", e.target.value)}
          onBlur={() => blurPush("object")}
        >
          <option value="public">Công khai</option>
          <option value="students">Học viên</option>
          <option value="lecturers">Giảng viên</option>
          <option value="internal">Nội bộ</option>
        </select>
      </div>

      {/* Ngôn ngữ cơ sở */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ngôn ngữ cơ sở
        </label>
        <select
          className={baseFieldCls}
          value={form.base_language}
          onChange={(e) => update("base_language", e.target.value)}
          onBlur={() => blurPush("base_language")}
        >
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* Người tạo khảo sát */}
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Người tạo khảo sát
        </label>
        <input
          type="text"
          className={baseFieldCls}
          value={form.owner}
          onChange={(e) => update("owner", e.target.value)}
          onBlur={() => blurPush("owner")}
          placeholder="Nhập tên người tạo..."
        />
      </div>
    </div>
  );
}
