import React, { useState } from "react";
import { graphqlRequest } from "../api/graphql";
import { useNavigate } from "react-router-dom";

function SocialSphereHeader() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-l-xl">
      <svg
        className="w-24 h-24 mb-6 text-indigo-600 animate-pulse"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        ></path>
      </svg>
      <h1
        className="
          text-5xl
          md:text-7xl
          font-extrabold
          tracking-tighter
          mb-3

          /* Tạo Gradient Text */
          bg-clip-text
          text-transparent
          bg-gradient-to-r
          from-indigo-600
          via-pink-500
          to-purple-700

          transition
          duration-500
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

function ForgotPasswordForm() {
  const navigate = useNavigate();
  const FORGOT_PASSWORD = `
    mutation ForgotPassword($email: String!) {
      forgotPassword(email: $email)
    }
  `;

  const [formData, setFormData] = useState({
    email: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
    // Clear errors when user types
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      // Validation
      if (!formData.email.trim()) {
        setError("Vui lòng nhập email");
        setIsLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Email không hợp lệ");
        setIsLoading(false);
        return;
      }

      const variables = {
        email: formData.email.trim(),
      };

      const response = await graphqlRequest(FORGOT_PASSWORD, variables);

      if (response.data && response.data.forgotPassword) {
        setMessage(response.data.forgotPassword);
        setFormData({ email: "" });
      } else if (response.errors) {
        // Handle Laravel validation errors
        const firstError = response.errors[0];
        if (firstError.extensions && firstError.extensions.validation) {
          const validationErrors = firstError.extensions.validation;
          const firstField = Object.keys(validationErrors)[0];
          const firstFieldError = validationErrors[firstField][0];
          setError(firstFieldError);
        } else {
          // Handle general errors
          const errorMessage = firstError.message;
          if (errorMessage.includes("chưa được đăng ký")) {
            setError("Email chưa được đăng ký trong hệ thống");
          } else if (errorMessage.includes("không hợp lệ")) {
            setError("Email không hợp lệ");
          } else {
            setError(errorMessage);
          }
        }
      } else {
        setError("Có lỗi xảy ra, vui lòng thử lại");
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi kết nối mạng hoặc máy chủ");
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  return (
    <form className="w-full max-w-sm mx-auto p-8" onSubmit={handleSubmit}>
      <h2 className="text-3xl font-bold mb-8 text-center text-white">
        Quên Mật Khẩu
      </h2>

      <p className="text-sm text-gray-300 mb-6 text-center">
        Nhập email đăng ký của bạn để nhận link đặt lại mật khẩu
      </p>

      {/* Thông báo thành công */}
      {message && (
        <div
          className="p-3 mb-4 text-sm font-medium text-green-800 bg-green-100 rounded-lg"
          role="alert"
        >
          {message}
        </div>
      )}

      {/* Thông báo lỗi */}
      {error && (
        <div
          className="p-3 mb-4 text-sm font-medium text-red-800 bg-red-100 rounded-lg"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Trường Email */}
      <div className="mb-6">
        <label
          htmlFor="email"
          className="block mb-2 text-sm font-medium text-white text-left"
        >
          Nhập Email:
        </label>
        <input
          type="email"
          id="email"
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-3 shadow-sm"
          placeholder="nguyenvana@gmail.com"
          required
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      {/* Nút Gửi yêu cầu */}
      <button
        type="submit"
        className="
          text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300
          font-bold rounded-lg text-md w-full px-5 py-3.5 text-center shadow-lg transition duration-200
          flex items-center justify-center
        "
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Đang xử lý...
          </>
        ) : (
          "Gửi yêu cầu"
        )}
      </button>

      <p className="mt-4 text-center text-sm text-gray-500">
        <button
          onClick={() => navigate("/login")}
          className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
        >
          ← Quay lại đăng nhập
        </button>
      </p>
    </form>
  );
}

function App() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* 1. Phần SocialSphere Header (Trái, Ẩn trên Mobile) */}
        <div className="hidden md:block md:w-1/2 bg-indigo-50">
          <SocialSphereHeader />
        </div>

        {/* 2. Phần Form (Phải, Chiếm 1/2 trên Desktop, Full trên Mobile) */}
        <div className="w-full md:w-1/2 flex items-center bg-gray-900 justify-center">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}

export default App;
