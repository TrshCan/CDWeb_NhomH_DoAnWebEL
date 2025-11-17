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
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
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
      name: '',
      email: '',
      phone:'',
      address:'',
      password: '',
      remember: true,
  });
  const [message, setMessage] = useState('');

  // Xử lý thay đổi Input
  const handleChange = (e) => {
      const { id, value, type, checked } = e.target;
      setFormData(prevData => ({
          ...prevData,
          [id]: type === 'checkbox' ? checked : value
      }));
  };

  // Xử lý Submit

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          const variables = {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              address: formData.address,
              password: formData.password
          };
  
          const response = await graphqlRequest(REGISTER_USER, variables);
          console.log("Full response:", response); // log để debug

          if (response.data && response.data.registerUser) {
              // Mutation thành công
              let second = 3;
              setCountdown(second);
              setMessage(`Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản. Bạn sẽ được chuyển sang trang đăng nhập trong vòng ${second} giây...`);

              const interval = setInterval(() => {
                  second -= 1;
                  setCountdown(second);
                  setMessage(`Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản. Bạn sẽ được chuyển sang trang đăng nhập trong vòng ${second} giây...`);

                  if (second === 0) {
                      clearInterval(interval);
                      navigate('/login');
                  }
              }, 1000);

              // Reset form
              setFormData({ name: '', email: '', phone: '', address: '', password: '', remember: false });
          } else if (response.errors) {
              console.error("GraphQL errors:", response.errors);
              setMessage(response.errors[0].message);
          } else {
              setMessage("Có lỗi xảy ra, vui lòng thử lại");
          }


      } catch (err) {
          console.error(err);
          setMessage("Network hoặc server error");
      }
  };
  

  return (
    <form className="w-full max-w-md mx-auto p-6" onSubmit={handleSubmit}>
    <h2 className="text-2xl font-bold mb-6 text-center text-white">
      Đăng ký tài khoản
    </h2>
  
    {message && (
      <div className="p-3 mb-4 text-sm font-medium text-green-800 bg-green-100 rounded-lg">
        {message}
      </div>
    )}
  
    {/* GRID 2 CỘT */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
  
      {/* Họ tên */}
      <div>
        <label className="block mb-2 text-sm font-medium text-white">Họ Tên</label>
        <input
          id="name"
          type="text"
          placeholder="Nguyen Van A"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-3 rounded-lg border bg-white text-gray-900"
        />
      </div>
  
      {/* Email */}
      <div>
        <label className="block mb-2 text-sm font-medium text-white">Email</label>
        <input
          id="email"
          type="email"
          placeholder="WQOZV@example.com"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-3 rounded-lg border bg-white text-gray-900"
        />
      </div>
  
      {/* SĐT */}
      <div>
        <label className="block mb-2 text-sm font-medium text-white">Số điện thoại</label>
        <input
          id="phone"
          type="text"
          placeholder="0123456789"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-3 rounded-lg border bg-white text-gray-900"
        />
      </div>
  
      {/* Địa chỉ */}
      <div>
        <label className="block mb-2 text-sm font-medium text-white">Địa chỉ</label>
        <input
          id="address"
          type="text"
          placeholder="Thanh Xuan, Ha Noi"
          value={formData.address}
          onChange={handleChange}
          className="w-full p-3 rounded-lg border bg-white text-gray-900"
        />
      </div>
  
    </div>
  
    {/* Mật khẩu full width */}
    <div className="mt-5 relative">
      <label className="block mb-2 text-sm font-medium text-white">Mật khẩu</label>
      <input
        id="password"
        type={showPassword ? "text" : "password"}
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
        className="w-full p-3 pr-10 rounded-lg border bg-white text-gray-900"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-10 text-gray-500"
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  
    {/* Checkbox */}
    <div className="flex items-center my-4">
      <input id="remember" type="checkbox" checked={formData.remember} 
        onChange={handleChange} className="w-4 h-4" />
      <label htmlFor="remember" className="ml-2 text-sm text-white">
        Tôi đồng ý với điều khoản sử dụng
      </label>
    </div>
  
    {/* Nút đăng ký */}
    <button className="mt-2 w-full p-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">
      Đăng ký
    </button>
  
    <p className="mt-3 text-center text-sm text-gray-400">
      Đã có tài khoản?  
      <a href="/login" className="ml-1 text-indigo-400 hover:underline">
        Đăng nhập
      </a>
    </p>
  </form>  
  );
}
function App() {
    return (
        <div className="h-screen flex items-center justify-center">
            <div className="flex w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden">

                {/* Left */}
                <div className="hidden md:block md:w-1/2 bg-indigo-50">
                    <SocialSphereHeader />
                </div>

                {/* Right */}
                <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-900">
                    <RegisterForm />
                </div>
            </div>
        </div>
    );
}


export default App;