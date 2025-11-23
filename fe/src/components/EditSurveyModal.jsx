import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getSurveyDetails, getCategories, updateSurvey } from "../api/graphql/survey";
import "../assets/css/EditSurveyModal.css";

export default function EditSurveyModal({ isOpen, onClose, surveyId, onSave }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categories_id: "",
    start_at: "",
    end_at: "",
    object: "",
    status: "draft",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

    fetchCategories();
  }, []);

  // Fetch survey details when modal opens
  useEffect(() => {
    const fetchSurveyDetails = async () => {
      if (!isOpen || !surveyId) return;
      
      setIsLoading(true);
      try {
        const survey = await getSurveyDetails(surveyId);
        
        // Convert backend datetime format (Y-m-d H:i:s) to datetime-local format (Y-m-d\TH:i)
        const formatDateTimeLocal = (dateStr) => {
          if (!dateStr) return "";
          // Remove seconds and replace space with T
          return dateStr.substring(0, 16).replace(' ', 'T');
        };
        
        setFormData({
          title: survey.title || "",
          description: survey.description || "",
          categories_id: survey.categories_id || "",
          start_at: formatDateTimeLocal(survey.start_at),
          end_at: formatDateTimeLocal(survey.end_at),
          object: survey.object || "",
          status: survey.status || "draft",
        });
      } catch (error) {
        console.error("Error fetching survey details:", error);
        toast.error("Không thể tải thông tin khảo sát");
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurveyDetails();
  }, [isOpen, surveyId, onClose]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề khảo sát");
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
      // Prepare data for backend
      const dataToSave = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        categories_id: formData.categories_id ? parseInt(formData.categories_id, 10) : null,
        object: formData.object || null,
        status: formData.status,
      };

      // Convert datetime-local format to backend format (Y-m-d H:i:s)
      if (formData.start_at) {
        dataToSave.start_at = formData.start_at.replace('T', ' ') + ':00';
      }
      if (formData.end_at) {
        dataToSave.end_at = formData.end_at.replace('T', ' ') + ':00';
      }

      // Remove null/empty values to avoid validation errors
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === null || dataToSave[key] === '') {
          delete dataToSave[key];
        }
      });

      // Call the API directly to save to database
      const updatedSurvey = await updateSurvey(surveyId, dataToSave);
      
      // Call the parent callback to refresh the list
      if (onSave) {
        await onSave(surveyId, updatedSurvey);
      }
      
      toast.success("Cập nhật khảo sát thành công");
      onClose();
    } catch (error) {
      console.error("Error updating survey:", error);
      
      // Try to extract validation errors from GraphQL response
      let errorMessage = "Không thể cập nhật khảo sát";
      
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Chỉnh sửa Khảo sát</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting || isLoading}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <svg
              className="animate-spin h-12 w-12 text-indigo-600 mb-4"
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
            <p className="text-gray-600">Đang tải thông tin khảo sát...</p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Nhập tiêu đề khảo sát"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Nhập mô tả khảo sát"
              disabled={isSubmitting}
            />
          </div>

          {/* Category and Object */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="categories_id" className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục
              </label>
              <select
                id="categories_id"
                name="categories_id"
                value={formData.categories_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

            <div>
              <label htmlFor="object" className="block text-sm font-medium text-gray-700 mb-1">
                Đối tượng
              </label>
              <select
                id="object"
                name="object"
                value={formData.object}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isSubmitting}
              >
                <option value="">Chọn đối tượng</option>
                <option value="public">Công chúng</option>
                <option value="students">Sinh viên</option>
                <option value="lecturers">Giảng viên</option>
              </select>
            </div>
          </div>

          {/* Start and End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_at" className="block text-sm font-medium text-gray-700 mb-1">
                Ngày bắt đầu
              </label>
              <input
                type="datetime-local"
                id="start_at"
                name="start_at"
                value={formData.start_at}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="end_at" className="block text-sm font-medium text-gray-700 mb-1">
                Ngày kết thúc
              </label>
              <input
                type="datetime-local"
                id="end_at"
                name="end_at"
                value={formData.end_at}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isSubmitting}
            >
              <option value="pending">Chờ duyệt</option>
              <option value="active">Đang hoạt động</option>
              <option value="paused">Tạm dừng</option>
              <option value="closed">Đã đóng</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
