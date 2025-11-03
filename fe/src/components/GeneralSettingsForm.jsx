import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

export default function GeneralSettingsForm({ value, onChange }) {
  const [form, setForm] = useState({
    title: "",
    type: "survey",
    object: "public",
    base_language: "vi",
    owner: "",
  });
  const [errors, setErrors] = useState({});
  const committedRef = useRef({});

  useEffect(() => {
    if (value) {
      setForm((f) => ({ ...f, ...value }));
      committedRef.current = { ...value };
    }
  }, [value]);

  const baseFieldCls =
    "w-full border border-gray-300 rounded-md px-4 py-2 text-gray-800 " +
    "focus:border-violet-600 focus:shadow-md " +
    "hover:bg-violet-50 hover:border-violet-500 transition-colors";

  // Chuẩn hóa text: loại khoảng trắng thừa, giới hạn 256 ký tự
  const normalizeText = (input) => {
    if (!input) return "";
    let cleaned = input.replace(/\s{2,}/g, " ").trim();
    if (cleaned.length > 256) cleaned = cleaned.slice(0, 256);
    return cleaned;
  };

  // Viết hoa chữ cái đầu tiên của chuỗi
  const capitalizeFirstLetter = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  // Viết hoa chữ cái đầu tiên của mỗi từ
  const capitalizeWords = (str) => str.replace(/\b\w/g, (c) => c.toUpperCase());

  const VALID_TYPES = ["survey", "quiz"];
  const VALID_OBJECTS = ["public", "students", "lecturers", "internal"];
  const VALID_LANGS = ["vi", "en"];

  // ✅ Validate đúng loại dữ liệu
  const validateField = (key, raw) => {
    // các field text: title, owner
    if (key === "title" || key === "owner") {
      const val = normalizeText(raw);
      if (!val) return "Trường này không được để trống.";
      if (val.length < 3) return "Phải có ít nhất 3 ký tự.";
      if (val.length > 256) return "Không được vượt quá 256 ký tự.";
      if (/\s{2,}/.test(raw)) return "Không được có 2 khoảng trắng liên tiếp.";
      return "";
    }

    // select fields — không normalize
    if (key === "type") {
      if (!VALID_TYPES.includes(raw)) return "Loại khảo sát không hợp lệ.";
      return "";
    }
    if (key === "object") {
      if (!VALID_OBJECTS.includes(raw))
        return "Đối tượng khảo sát không hợp lệ.";
      return "";
    }
    if (key === "base_language") {
      if (!VALID_LANGS.includes(raw)) return "Ngôn ngữ cơ sở không hợp lệ.";
      return "";
    }
    return "";
  };

  // update text/select
  const update = (key, val) => {
    if (key === "title" || key === "owner") {
      if (val.length > 256) {
        toast.error("Không được nhập quá 256 ký tự.", {
          style: { background: "#dc2626", color: "#fff" },
        });
        return;
      }
    }
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  // xử lý khi blur (chỉ với thay đổi thật sự)
  const blurPush = (key) => {
    const rawVal = form[key] ?? "";
    const newVal =
      key === "title" || key === "owner" ? normalizeText(rawVal) : rawVal; // tránh normalize select
    const oldVal = committedRef.current[key] ?? "";

    if (newVal === oldVal) return;

    // auto viết hoa
    let finalVal = newVal;
    if (key === "owner") finalVal = capitalizeWords(newVal);
    else if (key === "title") finalVal = capitalizeFirstLetter(newVal);

    // kiểm tra lỗi
    const errorMsg = validateField(key, finalVal);
    if (errorMsg) {
      setErrors((prev) => ({ ...prev, [key]: errorMsg }));
      toast.error(errorMsg, {
        style: { background: "#dc2626", color: "#fff" },
      });
      return;
    } else {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }

    // cập nhật và lưu
    const updated = { ...form, [key]: finalVal };
    setForm(updated);
    committedRef.current[key] = finalVal;
    onChange?.(updated);

    toast.success("Đã lưu thay đổi ✅", {
      style: { background: "#16a34a", color: "#fff" },
    });
  };

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
        {errors.title && (
          <p className="text-sm text-red-600 mt-2">{errors.title}</p>
        )}
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
          <option value="">-- Chọn loại khảo sát --</option>
          <option value="survey">Survey</option>
          <option value="quiz">Quiz</option>
        </select>
        {errors.type && (
          <p className="text-sm text-red-600 mt-2">{errors.type}</p>
        )}
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
          <option value="">-- Chọn đối tượng --</option>
          <option value="public">Công khai</option>
          <option value="students">Học viên</option>
          <option value="lecturers">Giảng viên</option>
          <option value="internal">Nội bộ</option>
        </select>
        {errors.object && (
          <p className="text-sm text-red-600 mt-2">{errors.object}</p>
        )}
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
          <option value="">-- Chọn ngôn ngữ --</option>
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
        {errors.base_language && (
          <p className="text-sm text-red-600 mt-2">{errors.base_language}</p>
        )}
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
        {errors.owner && (
          <p className="text-sm text-red-600 mt-2">{errors.owner}</p>
        )}
      </div>
    </div>
  );
}
