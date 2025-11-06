import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { updateProfile, getUserProfile } from "../api/graphql/user";

// ================== INPUT COMPONENT (Đã Tách và Tối Ưu) ==================
// Tách InputField ra ngoài để nó không bị định nghĩa lại trong mỗi lần render của UserManagement.
// Sử dụng React.memo để ngăn nó render lại nếu props không thay đổi.
const InputField = React.memo(({ id, label, type = "text", value, onChange, placeholder, error }) => {
    return (
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
                className={`w-full p-3 rounded-lg bg-gray-700 text-white border ${error ? "border-red-500" : "border-gray-600"
                    } focus:ring-blue-500 focus:border-blue-500 transition duration-150`}
            />
            {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
        </div>
    );
});

// ================== MAIN COMPONENT ==================
function UserManagement({ onCancel, onUpdateSuccess }) {
    const twitterBlue = "#1DA1F2";
    const { state } = useLocation();
    const user = state?.user;

    const [formData, setFormData] = useState(() => {
        // Xử lý avatarUrl: nếu là path từ server, chuyển thành URL đầy đủ
        let avatarUrl = user?.avatarUrl || user?.avatarInitial || "";
        if (avatarUrl && !avatarUrl.startsWith("http") && !avatarUrl.startsWith("data:")) {
            if (avatarUrl.startsWith("avatars/")) {
                avatarUrl = `http://localhost:8000/storage/${avatarUrl}`;
            } else if (avatarUrl && avatarUrl !== "default.png") {
                avatarUrl = `http://localhost:8000/storage/${avatarUrl}`;
            }
        }
        
        return {
            displayName: user?.displayName || "",
            email: user?.email || "",
            address: user?.bio || user?.address || "",
            newPassword: "",
            confirmPassword: "",
            avatarUrl: avatarUrl,
        };
    });

    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(null);
    const [isPasswordChange, setIsPasswordChange] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const avatarFileRef = useRef(null); // Lưu file object để gửi lên server

    // Fetch email nếu không có trong user object (fallback)
    useEffect(() => {
        const fetchUserEmail = async () => {
            // Nếu user object đã có email, không cần fetch
            if (user?.email || !user?.id) return;

            try {
                const userId = user.id || localStorage.getItem("userId");
                if (!userId) return;

                const profileData = await getUserProfile(parseInt(userId));
                if (profileData?.email) {
                    setFormData((prev) => ({ ...prev, email: profileData.email }));
                }
            } catch (error) {
                console.error("Failed to fetch user email:", error);
            }
        };

        fetchUserEmail();
    }, [user?.id, user?.email]); // Chỉ chạy khi user.id hoặc user.email thay đổi

    // --- Handlers ---
    const handleChange = useCallback((e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
        // Clear error ngay khi user bắt đầu gõ
        setErrors((prev) => (prev[id] ? { ...prev, [id]: undefined } : prev));
    }, []);

    const handleAvatarUpload = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: "error", text: "Kích thước ảnh không được vượt quá 2MB." });
            e.target.value = null;
            avatarFileRef.current = null;
            return;
        }
        if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
            setMessage({ type: "error", text: "Định dạng ảnh không hợp lệ (JPG, PNG, GIF)." });
            e.target.value = null;
            avatarFileRef.current = null;
            return;
        }

        // Lưu file object để gửi lên server
        avatarFileRef.current = file;

        // Hiển thị preview
        const reader = new FileReader();
        reader.onload = () => {
            setFormData((prev) => ({ ...prev, avatarUrl: reader.result }));
            setMessage({ type: "success", text: "Đã chọn ảnh đại diện mới. Nhấn 'Cập nhật' để lưu." });
        };
        reader.readAsDataURL(file);
    }, []); // Không cần dependencies

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);
        setErrors({});

        // Validation
        const newErrors = {};
        
        if (!formData.displayName || formData.displayName.trim() === "") {
            newErrors.displayName = "Họ và tên không được để trống";
        } else if (formData.displayName.trim().length < 10) {
            newErrors.displayName = "Họ và tên phải từ 10 ký tự trở lên";
        } else if (formData.displayName.trim().length > 50) {
            newErrors.displayName = "Họ và tên không được quá 50 ký tự";
        }

        if (!formData.email || formData.email.trim() === "") {
            newErrors.email = "Email không được để trống";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email không hợp lệ";
        }

        if (isPasswordChange) {
            if (!formData.newPassword || formData.newPassword.length < 8) {
                newErrors.newPassword = "Mật khẩu phải có ít nhất 8 ký tự";
            } else {
                // Kiểm tra độ phức tạp của mật khẩu
                const hasUpperCase = /[A-Z]/.test(formData.newPassword);
                const hasLowerCase = /[a-z]/.test(formData.newPassword);
                const hasNumbers = /[0-9]/.test(formData.newPassword);
                const hasSpecialChar = /[^A-Za-z0-9]/.test(formData.newPassword);
                
                if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
                    newErrors.newPassword = "Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt";
                }
            }
            if (formData.newPassword !== formData.confirmPassword) {
                newErrors.confirmPassword = "Mật khẩu xác nhận không trùng khớp";
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setMessage({ type: "error", text: "Vui lòng kiểm tra lại thông tin." });
            setIsLoading(false);
            return;
        }

        // Gọi API thật
        try {
            const password = isPasswordChange ? formData.newPassword : null;
            const password_confirmation = isPasswordChange ? formData.confirmPassword : null;
            const avatarFile = avatarFileRef.current;

            const updatedUser = await updateProfile(
                formData.displayName.trim(),
                formData.email.trim(),
                formData.address?.trim() || null,
                password,
                password_confirmation,
                avatarFile
            );

            // Cập nhật thành công
            setMessage({ type: "success", text: "Cập nhật hồ sơ thành công!" });
            
            // Reset avatar file ref sau khi upload thành công
            avatarFileRef.current = null;
            
            // Cập nhật avatarUrl nếu có avatar mới từ server
            if (updatedUser.avatar) {
                // Chuyển path thành URL đầy đủ
                let avatarUrl = updatedUser.avatar;
                if (!avatarUrl.startsWith("http") && !avatarUrl.startsWith("data:")) {
                    // Nếu là path tương đối, chuyển thành URL đầy đủ
                    if (avatarUrl.startsWith("avatars/")) {
                        avatarUrl = `http://localhost:8000/storage/${avatarUrl}`;
                    } else {
                        avatarUrl = `http://localhost:8000/storage/${avatarUrl}`;
                    }
                }
                setFormData((prev) => ({ ...prev, avatarUrl }));
            }

            // Gọi callback để cập nhật thông tin user ở component cha
            let finalAvatarUrl = formData.avatarUrl;
            if (updatedUser.avatar) {
                // Chuyển path thành URL đầy đủ nếu cần
                finalAvatarUrl = updatedUser.avatar;
                if (!finalAvatarUrl.startsWith("http") && !finalAvatarUrl.startsWith("data:")) {
                    finalAvatarUrl = `http://localhost:8000/storage/${finalAvatarUrl}`;
                }
            }
            
            onUpdateSuccess?.({
                ...formData,
                displayName: updatedUser.name,
                email: updatedUser.email,
                address: updatedUser.address || formData.address,
                avatarUrl: finalAvatarUrl,
            });

            // Reset password fields nếu đã đổi mật khẩu
            if (isPasswordChange) {
                setFormData((prev) => ({ ...prev, newPassword: "", confirmPassword: "" }));
                setIsPasswordChange(false);
            }
        } catch (error) {
            console.error("Update profile error:", error);
            
            // Xử lý lỗi từ server
            const errorMessage = error.message || "Cập nhật thất bại. Vui lòng thử lại.";
            const newErrors = {};
            
            // Phân tích lỗi validation từ server
            if (errorMessage.includes("name") || errorMessage.includes("họ tên") || errorMessage.includes("Họ tên")) {
                if (errorMessage.includes("10")) {
                    newErrors.displayName = "Họ và tên phải từ 10 ký tự trở lên";
                } else if (errorMessage.includes("50")) {
                    newErrors.displayName = "Họ và tên không được quá 50 ký tự";
                } else if (errorMessage.includes("ký tự đặc biệt")) {
                    newErrors.displayName = "Vui lòng không dùng các ký tự đặc biệt";
                } else {
                    newErrors.displayName = errorMessage;
                }
            } else if (errorMessage.includes("email") || errorMessage.includes("Email")) {
                if (errorMessage.includes("đã được đăng ký") || errorMessage.includes("unique")) {
                    newErrors.email = "Email đã được đăng ký";
                } else if (errorMessage.includes("không hợp lệ")) {
                    newErrors.email = "Email không hợp lệ";
                } else {
                    newErrors.email = errorMessage;
                }
            } else if (errorMessage.includes("password") || errorMessage.includes("mật khẩu") || errorMessage.includes("Mật khẩu")) {
                if (errorMessage.includes("8")) {
                    newErrors.newPassword = "Mật khẩu phải có ít nhất 8 ký tự";
                } else if (errorMessage.includes("chữ hoa") || errorMessage.includes("chữ thường") || errorMessage.includes("ký tự đặc biệt")) {
                    newErrors.newPassword = "Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt";
                } else if (errorMessage.includes("không trùng khớp") || errorMessage.includes("same")) {
                    newErrors.confirmPassword = "Mật khẩu xác nhận không trùng khớp";
                } else {
                    newErrors.newPassword = errorMessage;
                }
            } else if (errorMessage.includes("avatar") || errorMessage.includes("Ảnh")) {
                setMessage({ type: "error", text: errorMessage });
            } else {
                // Nếu có lỗi validation, hiển thị trong form
                if (Object.keys(newErrors).length > 0) {
                    setErrors(newErrors);
                } else {
                    setMessage({ type: "error", text: errorMessage });
                }
            }
            
            // Nếu có lỗi validation, hiển thị chúng
            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                setMessage({ type: "error", text: "Vui lòng kiểm tra lại thông tin." });
            }
        } finally {
            setIsLoading(false);
        }
    }, [formData, isPasswordChange, onUpdateSuccess]); // Dependencies

    // Xử lý logic hiển thị Avatar
    const avatarDisplay = useMemo(() => {
        // Kiểm tra nếu có avatar URL (data URL, http URL, hoặc path từ server)
        const hasAvatar = formData.avatarUrl && (
            formData.avatarUrl.startsWith("data:") || 
            formData.avatarUrl.includes("http") ||
            formData.avatarUrl.startsWith("avatars/")
        );
        
        // Nếu là path từ server, chuyển thành URL đầy đủ
        let avatarUrl = formData.avatarUrl;
        if (avatarUrl && avatarUrl.startsWith("avatars/") && !avatarUrl.includes("http")) {
            avatarUrl = `http://localhost:8000/storage/${avatarUrl}`;
        }
        
        const isImageUrl = hasAvatar && avatarUrl;
        const initial = formData.displayName?.[0]?.toUpperCase() || "U";
        return { isImageUrl, initial, avatarUrl: avatarUrl || formData.avatarUrl };
    }, [formData.avatarUrl, formData.displayName]);


    return (
        <div className="w-full h-full p-0">
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
                                backgroundColor: avatarDisplay.isImageUrl ? "transparent" : twitterBlue,
                            }}
                            onClick={() => document.getElementById("avatar-upload").click()}
                        >
                            {avatarDisplay.isImageUrl ? (
                                <img src={avatarDisplay.avatarUrl || formData.avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                            ) : (
                                avatarDisplay.initial
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

                    <InputField
                        id="address"
                        label="Địa chỉ"
                        type="text"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="123 Đường ABC, Quận XYZ, TP. HCM"
                        error={errors.address}
                    />

                    {/* Password Section */}
                    <div className="mb-6 border-t border-gray-700 pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-xl font-bold text-white">Thay đổi Mật khẩu</label>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsPasswordChange(prev => !prev);
                                    if (isPasswordChange) { // Kiểm tra trạng thái cũ (trước khi toggle)
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

export default React.memo(UserManagement);