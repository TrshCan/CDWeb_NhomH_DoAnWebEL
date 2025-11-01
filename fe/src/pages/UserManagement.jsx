import React, { useState } from "react";
// import { graphqlRequest } from "../api/graphql.js"; // Giữ lại nếu cần cho API thật

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

    const [errors, setErrors] = useState({}); // Vẫn giữ errors state để xử lý UI cho InputField
    const [message, setMessage] = useState(null);
    const [isPasswordChange, setIsPasswordChange] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // ================== INPUT COMPONENT (đã di chuyển vào đây cho gọn) ==================
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
                // Giữ lại logic CSS dựa trên `error` prop
                className={`w-full p-3 rounded-lg bg-gray-700 text-white border ${error ? "border-red-500" : "border-gray-600"
                } focus:ring-blue-500 focus:border-blue-500 transition duration-150`}
            />
            {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
        </div>
    );
    // ==================================================================================

    // --- Handlers ---
    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
        // Không xóa lỗi khi thay đổi input vì không còn logic validation.
        // Trong trường hợp này, `errors` sẽ chỉ được set sau khi submit (nếu có logic API validation).
        // Tạm thời set về undefined để code không bị crash.
        setErrors((prev) => ({ ...prev, [id]: undefined }));
        setMessage(null);
    };

    const handleAvatarUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Giữ lại các kiểm tra cơ bản về kích thước và định dạng file
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
        setErrors({}); // Đảm bảo clear errors

        // KHÔNG CÒN VALIDATION LOGIC NỘI BỘ NÀO

        // Giả lập API call thành công sau 1.5s
        setTimeout(() => {
            // Giả lập lỗi từ server nếu email là mock.exist@example.com (giữ lại 1 mock duy nhất)
            if (formData.email === "mock.exist@example.com") {
                setErrors({ email: "Email đã được đăng ký (Mock Server Error)" });
                setMessage({ type: "error", text: "Cập nhật thất bại. Vui lòng kiểm tra lại." });
                setIsLoading(false);
                return;
            }

            onUpdateSuccess?.(formData);
            setMessage({ type: "success", text: "Cập nhật hồ sơ thành công!" });
            setIsLoading(false);

            if (isPasswordChange) {
                setFormData((prev) => ({ ...prev, newPassword: "", confirmPassword: "" }));
                setIsPasswordChange(false);
            }
        }, 1500);
    };


    return (
        // Div ngoài cùng: Đảm bảo component chiếm hết không gian được cấp
        <div className="w-full h-full p-0">

            {/* Chỉ giữ lại phần Form */}
            <div className="flex-1 p-8 w-full bg-gray-800 rounded-xl">
                <h2 className="text-3xl font-extrabold text-white mb-6 border-b border-gray-700 pb-3">
                    Quản lý Hồ Sơ Cá Nhân
                </h2>

                {/* Thông báo */}
                {message && (
                    <div
                        className={`p-3 mb-4 rounded-lg font-medium ${message.type === "success" ? "bg-green-600" : "bg-red-600"
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
                                    formData.avatarUrl && !formData.avatarUrl.startsWith("data:")
                                        ? "transparent"
                                        : twitterBlue,
                            }}
                            onClick={() => document.getElementById("avatar-upload").click()}
                        >
                            {formData.avatarUrl && (formData.avatarUrl.startsWith("data:") || !formData.avatarUrl.includes(' ')) ? (
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
                                className={`px-3 py-1 text-sm font-bold rounded-full transition duration-200 ${isPasswordChange
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
                                {/* Xóa hướng dẫn về yêu cầu mật khẩu vì không còn validation */}
                                <p className="text-sm text-gray-400 mt-2">
                                    Vui lòng nhập mật khẩu mới để thay đổi.
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
                            className={`px-6 py-2 font-bold rounded-lg text-white transition duration-200 ${isLoading
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
    );
}

export default UserManagement;