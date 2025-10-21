import React, { useState } from 'react';

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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
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
function ForgotPWDForm() {
    // Quản lý State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        remember: false,
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
    const handleSubmit = (e) => {
        e.preventDefault(); 
        console.log('Dữ liệu đăng ký:', formData);
        setMessage('Đăng ký thành công! Vui lòng kiểm tra email xác nhận.');
        
        // Reset form sau 3 giây
        setTimeout(() => {
            setFormData({ name: '', email: '', password: '', remember: false });
            setMessage('');
        }, 3000);
    };

    return (
        <form 
            className="w-full max-w-sm mx-auto p-8"
            onSubmit={handleSubmit}
        >
            <h2 className="text-3xl font-bold mb-8 text-center text-white">
                Quên mật khẩu
            </h2>

            {/* Thông báo */}
            {message && (
                <div className="p-3 mb-4 text-sm font-medium text-green-800 bg-green-100 rounded-lg" role="alert">
                    {message}
                </div>
            )}
            {/* Trường Email */}
            <div className="mb-5">
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-white text-left">Nhập Email:</label>
                <input 
                    type="email" 
                    id="email" 
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-3 shadow-sm" 
                    placeholder="nguyenvana@gmail.com" 
                    required 
                    value={formData.email}
                    onChange={handleChange}
                />
            </div>   
            {/* Nút Đăng ký */}
            <button 
                type="submit" 
                className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-bold rounded-lg text-md w-full px-5 py-3.5 text-center shadow-lg transition duration-200"
            >
                Gửi Email Reset Mật Khẩu
            </button>

            <p className="mt-4 text-center text-sm text-gray-500">
                Không đổi nữa? 
                <a href="/login" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500 ml-1">
                    Đăng nhập ngay
                </a>
            </p>
        </form>
    );
}

function App() {
    return (
        <div className="h-screen flex items-center justify-center">
            <div className="flex  w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden">
                
                {/* 1. Phần SocialSphere Header (Trái, Ẩn trên Mobile) */}
                <div className="hidden md:block md:w-1/2 bg-indigo-50">
                    <SocialSphereHeader />
                </div>
                
                {/* 2. Phần Form Đăng Ký (Phải, Chiếm 1/2 trên Desktop, Full trên Mobile) */}
                <div className="w-full md:w-1/2 flex items-center bg-gray-900 justify-center">
                    <ForgotPWDForm />
                </div>
                
            </div>
        </div>
    );
}

export default App;