import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const statusMessages = {
  success: {
    title: "Xác thực thành công!",
    description: "Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập để bắt đầu trải nghiệm.",
    tone: "bg-green-100 text-green-800 border-green-300",
  },
  already_verified: {
    title: "Email đã được xác thực",
    description: "Email này đã được xác thực trước đó. Bạn có thể đăng nhập bất cứ lúc nào.",
    tone: "bg-blue-100 text-blue-800 border-blue-300",
  },
  default: {
    title: "Liên kết không hợp lệ",
    description: "Có vẻ như liên kết xác thực đã hết hạn hoặc không chính xác. Bạn có thể yêu cầu gửi lại email xác thực.",
    tone: "bg-red-100 text-red-800 border-red-300",
  },
};

export default function EmailVerificationResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const status = params.get("status") || "default";
  const { title, description, tone } = statusMessages[status] ?? statusMessages.default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-xl p-8 space-y-6 text-center">
        <div className={`border rounded-lg p-4 ${tone}`}>
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-sm">{description}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/login")}
            className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
          >
            Đến trang đăng nhập
          </button>
          <button
            onClick={() => navigate("/register")}
            className="w-full px-4 py-3 border border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition"
          >
            Tạo tài khoản mới
          </button>
        </div>
      </div>
    </div>
  );
}

