import React, { useState, useEffect } from "react";
import { graphqlRequest } from "../api/graphql";
import { useNavigate, useSearchParams } from "react-router-dom";
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

function ResetPasswordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const RESET_PASSWORD = `
    mutation ResetPassword($token: String!, $email: String!, $password: String!, $passwordConfirmation: String!) {
      resetPassword(token: $token, email: $email, password: $password, passwordConfirmation: $passwordConfirmation)
    }
  `;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const emailParam = searchParams.get("email");

    if (!tokenParam || !emailParam) {
      setErrors({ token: "Link không hợp lệ" });
    } else {
      setToken(tokenParam);
      setFormData((prev) => ({ ...prev, email: emailParam }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
    // Clear errors when user types
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const validatePassword = (password) => {
    const newErrors = {};

    if (!password) {
      newErrors.password = "Vui lòng nhập mật khẩu mới";
      return newErrors;
    }

    if (password.length < 8) {
      newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự";
      return newErrors;
    }

    if (!/[A-Z]/.test(password)) {
      newErrors.password = "Mật khẩu phải có ít nhất 1 chữ hoa";
      return newErrors;
    }

    if (!/[a-z]/.test(password)) {
      newErrors.password = "Mật khẩu phải có ít nhất 1 chữ thường";
      return newErrors;
    }

    if (!/[0-9]/.test(password)) {
      newErrors.password = "Mật khẩu phải có ít nhất 1 số";
      return newErrors;
    }

    if (!/[\W_]/.test(password)) {
      newErrors.password = "Mật khẩu phải có ít nhất 1 ký tự đặc biệt";
      return newErrors;
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setErrors({});

    try {
      // Validate password
      const passwordErrors = validatePassword(formData.password);
      if (Object.keys(passwordErrors).length > 0) {
        setErrors(passwordErrors);
        setIsLoading(false);
        return;
      }

      // Validate password confirmation
      if (formData.password !== formData.passwordConfirmation) {
        setErrors({
          passwordConfirmation: "Xác nhận mật khẩu không trùng khớp",
        });
        setIsLoading(false);
        return;
      }

      if (!token) {
        setErrors({ token: "Link không hợp lệ" });
        setIsLoading(false);
        return;
      }

      const variables = {
        token: token,
        email: formData.email.trim(),
        password: formData.password,
        passwordConfirmation: formData.passwordConfirmation,
      };

      const response = await graphqlRequest(RESET_PASSWORD, variables);

      if (response.data && response.data.resetPassword) {
        setMessage("Đặt lại mật khẩu thành công");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else if (response.errors) {
        const errorMessage = response.errors[0].message;

        if (errorMessage.includes("hết hạn")) {
          setErrors({ token: "Link đặt lại mật khẩu đã hết hạn" });
        } else if (errorMessage.includes("không hợp lệ")) {
          setErrors({ token: "Link không hợp lệ" });
        } else if (errorMessage.includes("mật khẩu")) {
          if (errorMessage.includes("8 ký tự")) {
            setErrors({ password: "Mật khẩu phải có ít nhất 8 ký tự" });
          } else if (errorMessage.includes("chữ hoa")) {
            setErrors({ password: "Mật khẩu phải có ít nhất 1 chữ hoa" });
          } else if (errorMessage.includes("chữ thường")) {
            setErrors({ password: "Mật khẩu phải có ít nhất 1 chữ thường" });
          } else if (errorMessage.includes("số")) {
            setErrors({ password: "Mật khẩu phải có ít nhất 1 số" });
          } else if (errorMessage.includes("ký tự đặc biệt")) {
            setErrors({
              password: "Mật khẩu phải có ít nhất 1 ký tự đặc biệt",
            });
          } else if (errorMessage.includes("trùng khớp")) {
            setErrors({
              passwordConfirmation: "Xác nhận mật khẩu không trùng khớp",
            });
          } else {
            setErrors({ password: errorMessage });
          }
        } else {
          setErrors({ general: errorMessage });
        }
      } else {
        setErrors({ general: "Có lỗi xảy ra, vui lòng thử lại" });
      }
    } catch (err) {
      console.error(err);
      setErrors({ general: "Network hoặc server error" });
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  return (
    <form className="w-full max-w-sm mx-auto p-8" onSubmit={handleSubmit}>
      <h2 className="text-3xl font-bold mb-8 text-center text-white">
        Đặt Lại Mật Khẩu
      </h2>

      {/* Thông báo thành công */}
      {message && (
        <div
          className="p-3 mb-4 text-sm font-medium text-green-800 bg-green-100 rounded-lg"
          role="alert"
        >
          {message}
        </div>
      )}

      {/* Thông báo lỗi chung */}
      {errors.general && (
        <div
          className="p-3 mb-4 text-sm font-medium text-red-800 bg-red-100 rounded-lg"
          role="alert"
        >
          {errors.general}
        </div>
      )}

      {/* Lỗi token */}
      {errors.token && (
        <div
          className="p-3 mb-4 text-sm font-medium text-red-800 bg-red-100 rounded-lg"
          role="alert"
        >
          {errors.token}
        </div>
      )}

      {/* Trường Email (readonly) */}
      <div className="mb-5">
        <label
          htmlFor="email"
          className="block mb-2 text-sm font-medium text-white text-left"
        >
          Email:
        </label>
        <input
          type="email"
          id="email"
          className="bg-gray-100 border border-gray-300 text-gray-600 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-3 shadow-sm cursor-not-allowed"
          value={formData.email}
          readOnly
          disabled
        />
      </div>

      {/* Trường Mật khẩu mới */}
      <div className="mb-5">
        <label
          htmlFor="password"
          className="block mb-2 text-sm font-medium text-white text-left"
        >
          Mật khẩu mới:
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            className={`bg-white border ${
              errors.password ? "border-red-500" : "border-gray-300"
            } text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-3 pr-10 shadow-sm`}
            placeholder="•••••••••"
            required
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute  top-[-30px] left-70 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password}</p>
        )}
      </div>

      {/* Trường Xác nhận mật khẩu */}
      <div className="mb-6">
        <label
          htmlFor="passwordConfirmation"
          className="block mb-2 text-sm font-medium text-white text-left"
        >
          Xác nhận mật khẩu mới:
        </label>
        <div className="relative">
          <input
            type={showPasswordConfirmation ? "text" : "password"}
            id="passwordConfirmation"
            className={`bg-white border ${
              errors.passwordConfirmation ? "border-red-500" : "border-gray-300"
            } text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-3 pr-10 shadow-sm`}
            placeholder="•••••••••"
            required
            value={formData.passwordConfirmation}
            onChange={handleChange}
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute top-[-30px] left-70 right-0 pr-3 flex items-center"
            onClick={() =>
              setShowPasswordConfirmation(!showPasswordConfirmation)
            }
          >
            {showPasswordConfirmation ? (
              <EyeOff className="h-5 w-5 text-gray-400" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        {errors.passwordConfirmation && (
          <p className="mt-1 text-sm text-red-500">
            {errors.passwordConfirmation}
          </p>
        )}
      </div>

      {/* Nút Đặt lại mật khẩu */}
      <button
        type="submit"
        className="
          text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300
          font-bold rounded-lg text-md w-full px-5 py-3.5 text-center shadow-lg transition duration-200
          flex items-center justify-center
        "
        disabled={isLoading || !token}
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
          "Đặt lại mật khẩu"
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
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}

export default App;
