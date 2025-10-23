import React, { useState } from "react";


function Register() {
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setForm({ ...form, [id]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const res = await authApi.register(form.name, form.email, form.password);
            console.log("Kết quả từ BE:", res);
            setMessage("Đăng ký thành công! Hãy đăng nhập.");
            setTimeout(() => (window.location.href = "/login"), 1500);
        } catch (err) {
            console.error(err);
            setMessage("Đăng ký thất bại. Vui lòng thử lại!");
        }

        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded-lg shadow-md w-80"
            >
                <h2 className="text-2xl font-bold mb-4 text-center text-indigo-600">
                    Đăng ký
                </h2>

                {message && (
                    <div
                        className={`p-2 mb-3 rounded ${message.includes("thành công")
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                    >
                        {message}
                    </div>
                )}

                <input
                    id="name"
                    placeholder="Họ tên"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full mb-3 p-2 border rounded"
                    required
                />
                <input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full mb-3 p-2 border rounded"
                    required
                />
                <input
                    id="password"
                    type="password"
                    placeholder="Mật khẩu"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full mb-4 p-2 border rounded"
                    required
                />

                <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
                    disabled={loading}
                >
                    {loading ? "Đang đăng ký..." : "Đăng ký"}
                </button>

                <p className="mt-3 text-sm text-center">
                    Đã có tài khoản?{" "}
                    <a href="/login" className="text-indigo-600 hover:underline">
                        Đăng nhập
                    </a>
                </p>
            </form>
        </div>
    );
}

export default Register;
