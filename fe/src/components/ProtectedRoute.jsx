import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      toast.error("Vui lòng đăng nhập để truy cập trang này");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Check if user is authenticated
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  if (!token || !userId) {
    return null; // Don't render anything while redirecting
  }

  return children;
}
