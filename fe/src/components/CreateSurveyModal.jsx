import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { createSurvey, getCategories } from "../api/graphql/survey";
import "../assets/css/EditSurveyModal.css";

export default function CreateSurveyModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categories_id: "",
    type: "survey",
    start_at: "",
    end_at: "",
    object: "public",
    status: "pending",
    points: 0,
    time_limit: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Không thể tải danh mục");
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: "",
        description: "",
        categories_id: "",
        type: "survey",
        start_at: "",
        end_at: "",
        object: "public",
        status: "pending",
        points: 0,
        time_limit: "",
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : parseInt(value, 10)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề khảo sát");
      return;
    }

    if (!formData.categories_id) {
      toast.error("Vui lòng chọn danh mục");
      return;
    }

    if (formData.start_at && formData.end_at) {
      const startDate = new Date(formData.start_at);
      const endDate = new Date(formData.end_at);
      if (endDate < startDate) {
        toast.error("Ngày kết thúc phải sau ngày bắt đầu");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Get userId from localStorage
      const userIdStr = localStorage.getItem("userId");
      if (!userIdStr) {
        toast.error("Bạn chưa đăng nhập. Vui lòng đăng nhập để tạo khảo sát");
        return;
      }

      // Prepare data for backend
      const dataToSave = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        categories_id: parseInt(formData.categories_id, 10),
        type: formData.type || "survey",
        object: formData.object || "public",
        status: formData.status || "pending",
        points: formData.points || 0,
        created_by: parseInt(userIdStr, 10),
      };

      // Convert datetime-local format to backend format (Y-m-d H:i:s)
      if (formData.start_at) {
        dataToSave.start_at = formData.start_at.replace('T', ' ') + ':00';
      }
      if (formData.end_at) {
        dataToSave.end_at = formData.end_at.replace('T', ' ') + ':00';
      }

      // Add time_limit if provided
      if (formData.time_limit && formData.time_limit !== "") {
        dataToSave.time_limit = parseInt(formData.time_limit, 10);
      }

      // Call the API to create survey
      const newSurvey = await createSurvey(dataToSave);
      
      // Call the parent callback to refresh the list
      if (onSave) {
        await onSave(newSurvey);
      }
      
      toast.success("Tạo khảo sát thành công");
      onClose();
    } catch (error) {
      console.error("Error creating survey:", error);
      
      // Try to extract validation errors from GraphQL response
      let errorMessage = "Không thể tạo khảo sát";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      // Check for validation errors in the error object
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        const validationError = error.graphQLErrors[0];
        if (validationError.extensions?.validation) {
          // Show first validation error
          const validationFields = Object.keys(validationError.extensions.validation);
          if (validationFields.length > 0) {
            const firstField = validationFields[0];
            const fieldErrors = validationError.extensions.validation[firstField];
            if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
              errorMessage = fieldErrors[0];
            }
          }
        } else if (validationError.message) {
          errorMessage = validationError.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Tạo Khảo sát Mới</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200"
            disabled={isSubmitting}
            title="Đóng"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
        <div className="p-8 space-y-6">
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title" className="block text-sm font-semibold text-gray-800 mb-2">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" />
                </svg>
                Tiêu đề <span className="text-red-500 ml-1">*</span>
              </span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Nhập tiêu đề khảo sát của bạn..."
              required
              maxLength={255}
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-2">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
                </svg>
                Mô tả
              </span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
              placeholder="Mô tả chi tiết về khảo sát..."
              maxLength={255}
              disabled={isSubmitting}
            />
          </div>

          {/* Category and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="categories_id" className="block text-sm font-semibold text-gray-800 mb-2">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                  </svg>
                  Danh mục <span className="text-red-500 ml-1">*</span>
                </span>
              </label>
              <select
                id="categories_id"
                name="categories_id"
                value={formData.categories_id}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none bg-white"
                required
                disabled={isSubmitting}
              >
                <option value="">Chọn danh mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="type" className="block text-sm font-semibold text-gray-800 mb-2">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z" clipRule="evenodd" />
                  </svg>
                  Loại
                </span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none bg-white"
                disabled={isSubmitting}
              >
                <option value="survey">📋 Survey</option>
                <option value="quiz">🎯 Quiz</option>
              </select>
            </div>
          </div>

          {/* Start and End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="start_at" className="block text-sm font-semibold text-gray-800 mb-2">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Ngày bắt đầu
                </span>
              </label>
              <input
                type="datetime-local"
                id="start_at"
                name="start_at"
                value={formData.start_at}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_at" className="block text-sm font-semibold text-gray-800 mb-2">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Ngày kết thúc
                </span>
              </label>
              <input
                type="datetime-local"
                id="end_at"
                name="end_at"
                value={formData.end_at}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Points and Time Limit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="points" className="block text-sm font-semibold text-gray-800 mb-2">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Điểm thưởng
                </span>
              </label>
              <input
                type="number"
                id="points"
                name="points"
                value={formData.points}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="time_limit" className="block text-sm font-semibold text-gray-800 mb-2">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Giới hạn thời gian (phút)
                </span>
              </label>
              <input
                type="number"
                id="time_limit"
                name="time_limit"
                value={formData.time_limit}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Ví dụ: 30"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Object and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="object" className="block text-sm font-semibold text-gray-800 mb-2">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  Đối tượng
                </span>
              </label>
              <select
                id="object"
                name="object"
                value={formData.object}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none bg-white"
                disabled={isSubmitting}
              >
                <option value="public">🌐 Công chúng</option>
                <option value="students">🎓 Sinh viên</option>
                <option value="lecturers">👨‍🏫 Giảng viên</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status" className="block text-sm font-semibold text-gray-800 mb-2">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Trạng thái
                </span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none bg-white"
                disabled={isSubmitting}
              >
                <option value="pending">⏳ Chờ duyệt</option>
                <option value="active">✅ Đang hoạt động</option>
                <option value="paused">⏸️ Tạm dừng</option>
                <option value="closed">🔒 Đã đóng</option>
              </select>
            </div>
          </div>
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-5 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg hover:shadow-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Đang tạo...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Tạo khảo sát
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

