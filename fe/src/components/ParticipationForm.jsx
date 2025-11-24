import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function ParticipationForm({ value, onChange }) {
  const [form, setForm] = useState({
    object: "public",
    status: "pending",
  });

  useEffect(() => {
    if (value) {
      setForm((f) => ({ ...f, ...value }));
    }
  }, [value]);

  const handleChange = (key, val) => {
    const updated = { ...form, [key]: val };
    setForm(updated);
    onChange?.(updated);
    toast.success("Đã lưu thay đổi ✅", {
      style: { background: "#16a34a", color: "#fff" },
    });
  };

  return (
    <div className="w-full max-w-none mr-auto ml-8 bg-white p-8 mt-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">
        Hình thức tham gia
      </h2>

      <div className="space-y-6">
        {/* Đối tượng khảo sát */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Đối tượng khảo sát
          </label>
          <select
            className="w-full border border-gray-300 rounded-sm px-4 py-2 text-gray-800 focus:border-violet-600 focus:shadow-md hover:bg-violet-50 hover:border-violet-500 transition-colors"
            value={form.object}
            onChange={(e) => handleChange("object", e.target.value)}
          >
            <option value="public">Công khai</option>
            <option value="students">Học viên</option>
            <option value="lecturers">Giảng viên</option>
            <option value="internal">Nội bộ</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Chọn đối tượng có thể tham gia khảo sát
          </p>
        </div>

        {/* Trạng thái */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trạng thái
          </label>
          <select
            className="w-full border border-gray-300 rounded-sm px-4 py-2 text-gray-800 focus:border-violet-600 focus:shadow-md hover:bg-violet-50 hover:border-violet-500 transition-colors"
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            <option value="pending">Chờ kích hoạt</option>
            <option value="active">Đang hoạt động</option>
            <option value="paused">Tạm dừng</option>
            <option value="closed">Đã đóng</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Trạng thái hiện tại của khảo sát
          </p>
        </div>
      </div>
    </div>
  );
}
