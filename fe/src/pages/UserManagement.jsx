import React, { useState } from "react";

// ================== VALIDATION HELPERS ==================
const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
const uppercaseRegex = /[A-Z]/;
const lowercaseRegex = /[a-z]/;
const numberRegex = /[0-9]/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateProfile = (data, isPasswordChange) => {
  let errors = {};

  // 1️⃣ Họ tên
  if (!data.displayName.trim()) {
    errors.displayName = "Vui lòng không bỏ trống họ tên";
  } else if (data.displayName.length > 50) {
    errors.displayName = "Họ tên không được quá 50 ký tự";
  } else if (data.displayName.length < 10) {
    errors.displayName = "Họ tên phải từ 10 ký tự trở lên";
  } else {
    const allowedCharsRegex = /^[a-zA-Z0-9\s\u00C0-\u1EF9]*$/;
    if (!allowedCharsRegex.test(data.displayName)) {
      errors.displayName = "Vui lòng không dùng các ký tự đặc biệt!";
    }
  }

  // 2️⃣ Email
  if (!data.email.trim()) {
    errors.email = "Vui lòng nhập email";
  } else if (!emailRegex.test(data.email)) {
    errors.email = "Email không hợp lệ";
  } else if (data.email === "mock.exist@example.com") {
    errors.email = "Email đã được đăng ký (Mock Error)";
  }

  // 3️⃣ Mật khẩu
  if (isPasswordChange) {
    if (!data.newPassword) {
      errors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (data.newPassword.length < 8) {
      errors.newPassword = "Mật khẩu phải có ít nhất 8 ký tự";
    } else if (!uppercaseRegex.test(data.newPassword)) {
      errors.newPassword = "Mật khẩu phải có ít nhất 1 chữ hoa";
    } else if (!lowercaseRegex.test(data.newPassword)) {
      errors.newPassword = "Mật khẩu phải có ít nhất 1 chữ thường";
    } else if (!numberRegex.test(data.newPassword)) {
      errors.newPassword = "Mật khẩu phải có ít nhất 1 số";
    } else if (!specialCharRegex.test(data.newPassword)) {
      errors.newPassword = "Mật khẩu phải có ít nhất 1 ký tự đặc biệt";
    }

    if (data.newPassword !== data.confirmPassword) {
      errors.confirmPassword = "Xác nhận mật khẩu không trùng khớp";
    }
  }

  return errors;
};

// ================== INPUT COMPONENT ==================
const InputField = ({ id, label, type = "text", value, onChange, placeholder, error }) => (
  <div className="mb-6 text-left">
    <label htmlFor={id} className="block mb-2 text-sm font-medium text-white">
      {label}
    </label>
    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full p-3 rounded-lg bg-gray-700 text-white border ${
        error ? "border-red-500" : "border-gray-600"
      } focus:ring-blue-500 focus:border-blue-500 transition duration-150`}
    />
    {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
  </div>
);

// ================== LOGO COMPONENT ==================
function SocialSphereHeader() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-l-xl">
      <svg
        className="w-24 h-24 mb-6 text-indigo-600 animate-pulse"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <h1
        className="
          text-5xl md:text-6xl font-extrabold tracking-tighter mb-3
          bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-pink-500 to-purple-700
        "
      >
        TDC SocialSphere
      </h1>
      <p className="text-lg text-gray-600 font-medium max-w-sm">
        Nền tảng kết nối, sáng tạo và phát triển cộng đồng.
      </p>
    </div>
  );
}

// ================== MAIN COMPONENT ==================
function UserManagement({ user, onCancel, onUpdateSuccess }) {
  const twitterBlue = "#1DA1F2";

  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    email: user?.email || "",
    newPassword: "",
    confirmPassword: "",
    avatarUrl: user?.avatarUrl || user?.avatarInitial || "",
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [isPasswordChange, setIsPasswordChange] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- Handlers ---
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: undefined }));
    setMessage(null);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Kích thước ảnh không được vượt quá 2MB." });
      e.target.value = null;
      return;
    }
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      setMessage({ type: "error", text: "Định dạng ảnh không hợp lệ (JPG, PNG, GIF)." });
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, avatarUrl: reader.result }));
      setMessage({ type: "success", text: "Đã chọn ảnh đại diện mới. Nhấn 'Cập nhật' để lưu." });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const validationErrors = validateProfile(formData, isPasswordChange);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setMessage({ type: "error", text: "Vui lòng kiểm tra lại các trường bị lỗi." });
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      onUpdateSuccess?.(formData);
      setMessage({ type: "success", text: "Cập nhật hồ sơ thành công!" });
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex w-full max-w-5xl bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Left Side - Logo */}
        <div className="hidden md:block md:w-1/2">
          <SocialSphereHeader />
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 p-8">
          <h2 className="text-3xl font-extrabold text-white mb-6 border-b border-gray-700 pb-3">
            Quản lý Hồ Sơ Cá Nhân
          </h2>

          {/* Thông báo */}
          {message && (
            <div
              className={`p-3 mb-4 rounded-lg font-medium ${
                message.type === "success" ? "bg-green-600" : "bg-red-600"
              } text-white`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="text-left">
            {/* Avatar */}
            <div className="flex items-center space-x-6 mb-8">
              <div
                className="w-24 h-24 rounded-full border-4 border-gray-700 overflow-hidden flex items-center justify-center text-4xl font-bold text-white cursor-pointer hover:opacity-80 transition duration-150"
                style={{
                  backgroundColor:
                    formData.avatarUrl.startsWith("data:") || formData.avatarUrl
                      ? "transparent"
                      : twitterBlue,
                }}
                onClick={() => document.getElementById("avatar-upload").click()}
              >
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  formData.displayName?.[0]?.toUpperCase() || "U"
                )}
              </div>

              <input
                type="file"
                id="avatar-upload"
                accept=".jpg,.jpeg,.png,.gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => document.getElementById("avatar-upload").click()}
                className="px-4 py-2 text-sm font-bold text-white border border-gray-500 rounded-full hover:bg-gray-700 transition duration-200"
              >
                Thay đổi Avatar
              </button>
            </div>

            {/* Inputs */}
            <InputField
              id="displayName"
              label="Họ và tên"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              error={errors.displayName}
            />

            <InputField
              id="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="nguyenvana@gmail.com"
              error={errors.email}
            />

            {/* Password Section */}
            <div className="mb-6 border-t border-gray-700 pt-6">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xl font-bold text-white">Thay đổi Mật khẩu</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordChange(!isPasswordChange);
                    if (isPasswordChange) {
                      setFormData((prev) => ({ ...prev, newPassword: "", confirmPassword: "" }));
                      setErrors({});
                    }
                  }}
                  className={`px-3 py-1 text-sm font-bold rounded-full transition duration-200 ${
                    isPasswordChange
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-blue-600 hover:bg-blue-700"
                  } text-white`}
                >
                  {isPasswordChange ? "Hủy đổi mật khẩu" : "Đổi mật khẩu"}
                </button>
              </div>

              {isPasswordChange && (
                <>
                  <InputField
                    id="newPassword"
                    label="Mật khẩu mới"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    error={errors.newPassword}
                  />
                  <InputField
                    id="confirmPassword"
                    label="Xác nhận mật khẩu mới"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    error={errors.confirmPassword}
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                  </p>
                </>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-4 mt-8">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 font-bold rounded-lg text-white border border-gray-600 hover:bg-gray-700 transition duration-200"
                disabled={isLoading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className={`px-6 py-2 font-bold rounded-lg text-white transition duration-200 ${
                  isLoading
                    ? "bg-blue-800 opacity-70 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={isLoading}
              >
                {isLoading ? "Đang cập nhật..." : "Cập nhật"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
