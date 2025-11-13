import React, { useState } from "react";
import { graphqlRequest } from "../api/graphql";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

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

function RegisterForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const REGISTER_USER = `
  mutation($name: String!, $email: String!, $password: String!,$phone: String,$address: String) {
    registerUser(name: $name, email: $email, password: $password,phone: $phone, address: $address) {
      id
      name
      email
      phone
      address
    }
  }
`;
  // Quản lý State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    remember: true,
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success"); // 'success' or 'error'

  // Xử lý thay đổi Input
  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: type === "checkbox" ? checked : value,
    }));

    // Clear message when user starts typing
    if (message) {
      setMessage("");
    }
  };

  // Xử lý Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const variables = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        password: formData.password,
      };

      console.log("Sending variables:", variables); // Debug log
      const response = await graphqlRequest(REGISTER_USER, variables);
      console.log("Full response:", response); // Debug log

      if (response.data && response.data.registerUser) {
        // Mutation thành công
        setMessageType("success");
        let second = 3;
        setMessage(
          `Đăng ký thành công! Bạn sẽ được chuyển trang trong vòng ${second} giây...`,
        );

        const interval = setInterval(() => {
          second -= 1;
          setMessage(
            `Đăng ký thành công! Bạn sẽ được chuyển trang trong vòng ${second} giây...`,
          );

          if (second === 0) {
            clearInterval(interval);
            navigate("/login");
          }
        }, 1000);

        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
          password: "",
          remember: false,
        });
      } else if (response.errors) {
        console.error("GraphQL errors:", response.errors);
        setMessageType("error");

        // Handle specific validation errors
        const firstError = response.errors[0];
        if (firstError.extensions && firstError.extensions.validation) {
          // Laravel validation errors
          const validationErrors = firstError.extensions.validation;
          const firstField = Object.keys(validationErrors)[0];
          const firstFieldError = validationErrors[firstField][0];
          setMessage(firstFieldError);
        } else {
          // General GraphQL errors
          setMessage(firstError.message);
        }
      } else {
        setMessageType("error");
        setMessage("Có lỗi xảy ra, vui lòng thử lại");
      }
    } catch (err) {
      console.error("Catch error:", err);
      setMessageType("error");

      // Handle network errors and other exceptions
      if (err.message) {
        setMessage(err.message);
      } else {
        setMessage("Kết nối mạng có vấn đề, vui lòng thử lại");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="w-full max-w-sm mx-auto p-8" onSubmit={handleSubmit}>
      <h2 className="text-3xl font-bold mb-8 text-center text-white">
        Đăng ký tài khoản
      </h2>

      {/* Thông báo */}
      {message && (
        <div
          className={`p-3 mb-4 text-sm font-medium rounded-lg ${
            messageType === "success"
              ? "text-green-800 bg-green-100"
              : "text-red-800 bg-red-100"
          }`}
          role="alert"
        >
          {message}
        </div>
      )}

      {/* Trường Họ Tên */}
      <div className="mb-5">
        <label
          htmlFor="name"
          className="block mb-2 text-sm font-medium text-white text-left"
        >
          Nhập Họ Tên:
        </label>
        <input
          type="text"
          id="name"
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-3 shadow-sm"
          placeholder="Nguyễn Văn A"
          required
          value={formData.name}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>

      {/* Trường Email */}
      <div className="mb-5">
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
          disabled={isSubmitting}
        />
      </div>

      <div className="mb-5">
        <label
          htmlFor="phone"
          className="block mb-2 text-sm font-medium text-white text-left"
        >
          Nhập SĐT:
        </label>
        <input
          type="text"
          id="phone"
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-3 shadow-sm"
          placeholder="0866666666"
          required
          value={formData.phone}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>

      <div className="mb-5">
        <label
          htmlFor="address"
          className="block mb-2 text-sm font-medium text-white text-left"
        >
          Nhập Địa chỉ:
        </label>
        <input
          type="text"
          id="address"
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-3 shadow-sm"
          placeholder="34 Vũ Tùng, TP Hồ Chí Minh"
          required
          value={formData.address}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>

      {/* Mật khẩu + icon 👁️ */}
      <div className="mb-6 relative">
        <label
          htmlFor="password"
          className="block mb-2 text-sm font-medium text-white text-left"
        >
          Nhập mật khẩu:
        </label>
        <input
          type={showPassword ? "text" : "password"}
          id="password"
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-3 pr-10 shadow-sm"
          placeholder="•••••••••"
          required
          value={formData.password}
          onChange={handleChange}
          disabled={isSubmitting}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
          disabled={isSubmitting}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {/* Checkbox */}
      <div className="flex items-start mb-6">
        <div className="flex items-center h-5">
          <input
            id="remember"
            type="checkbox"
            className="w-4 h-4 border border-gray-300 rounded accent-indigo-600 focus:ring-3 focus:ring-indigo-300"
            checked={formData.remember}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
        <label
          htmlFor="remember"
          className="ms-2 text-sm font-medium text-white"
        >
          Tôi đồng ý với điều khoản sử dụng
        </label>
      </div>

      {/* Nút Đăng ký */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`text-white font-bold rounded-lg text-md w-full px-5 py-3.5 text-center shadow-lg transition duration-200 ${
          isSubmitting
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300"
        }`}
      >
        {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
      </button>

      <p className="mt-4 text-center text-sm text-gray-500">
        Đã có tài khoản?
        <a
          href="/login"
          className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500 ml-1"
        >
          Đăng nhập ngay
        </a>
      </p>
    </form>
  );
}

function App() {
  return (
    <div className="h-50% flex items-center justify-center">
      <div className="flex  w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* 1. Phần SocialSphere Header (Trái, Ẩn trên Mobile) */}
        <div className="hidden md:block md:w-1/2 bg-indigo-50">
          <SocialSphereHeader />
        </div>

        {/* 2. Phần Form Đăng Ký (Phải, Chiếm 1/2 trên Desktop, Full trên Mobile) */}
        <div className="w-full md:w-1/2 flex items-center bg-gray-900 justify-center">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}

export default App;
