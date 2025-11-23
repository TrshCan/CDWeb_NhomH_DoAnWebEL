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
  const [originalUpdatedAt, setOriginalUpdatedAt] = useState(null);

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
        // Store the original updated_at for conflict detection
        setOriginalUpdatedAt(survey.updated_at || null);
      } catch (error) {
        console.error("Error fetching survey details:", error);
        
        // Extract error message
        let errorMessage = "Không thể tải thông tin khảo sát";
        if (error.graphQLErrors && error.graphQLErrors.length > 0) {
          errorMessage = error.graphQLErrors[0].message || errorMessage;
        } else if (error.message && error.message !== "GraphQL error") {
          errorMessage = error.message;
        }
        
        toast.error(errorMessage);
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
      // Check for conflicts: fetch current survey data and compare updated_at
      if (originalUpdatedAt) {
        const currentSurvey = await getSurveyDetails(surveyId);
        const currentUpdatedAt = currentSurvey.updated_at;
        
        if (currentUpdatedAt && currentUpdatedAt !== originalUpdatedAt) {
          toast.error("Khảo sát đã được cập nhật bởi người khác. Vui lòng tải lại trang và thử lại.");
          setIsSubmitting(false);
          // Reload the survey data to show the latest version (reuse the already fetched data)
          const formatDateTimeLocal = (dateStr) => {
            if (!dateStr) return "";
            return dateStr.substring(0, 16).replace(' ', 'T');
          };
          setFormData({
            title: currentSurvey.title || "",
            description: currentSurvey.description || "",
            categories_id: currentSurvey.categories_id || "",
            start_at: formatDateTimeLocal(currentSurvey.start_at),
            end_at: formatDateTimeLocal(currentSurvey.end_at),
            object: currentSurvey.object || "",
            status: currentSurvey.status || "draft",
          });
          setOriginalUpdatedAt(currentSurvey.updated_at || null);
          return;
        }
      }
      // Prepare data for backend
      const dataToSave = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        categories_id: formData.categories_id ? parseInt(formData.categories_id, 10) : null,
        object: formData.object || null,
        status: formData.status,
      };

      // Include updated_at for optimistic locking
      if (originalUpdatedAt) {
        dataToSave.updated_at = originalUpdatedAt;
      }

      // Convert datetime-local format to backend format (Y-m-d H:i:s)
      if (formData.start_at) {
        dataToSave.start_at = formData.start_at.replace('T', ' ') + ':00';
      }
      if (formData.end_at) {
        dataToSave.end_at = formData.end_at.replace('T', ' ') + ':00';
      }

      // Remove null/empty values to avoid validation errors (but preserve updated_at for optimistic locking)
      Object.keys(dataToSave).forEach(key => {
        if (key !== 'updated_at' && (dataToSave[key] === null || dataToSave[key] === '')) {
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
      
      // Extract and display error message
      let errorMessage = "Không thể cập nhật khảo sát";
      
      // Check for GraphQL errors with validation details
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        const graphQLError = error.graphQLErrors[0];
        
        // Check for validation errors
        if (graphQLError.extensions?.validation) {
          const validationFields = Object.keys(graphQLError.extensions.validation);
          if (validationFields.length > 0) {
            const firstField = validationFields[0];
            const fieldErrors = graphQLError.extensions.validation[firstField];
            if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
              errorMessage = fieldErrors[0];
            }
          }
        } 
        // Check for category error in extensions
        else if (graphQLError.extensions?.category) {
          errorMessage = graphQLError.message || errorMessage;
        }
        // Use the GraphQL error message
        else if (graphQLError.message) {
          errorMessage = graphQLError.message;
        }
      } 
      // Fallback to error.message
      else if (error.message && error.message !== "GraphQL error") {
        errorMessage = error.message;
      }
      
      // Display the error toast
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
        if (e.target === e.currentTarget && !isSubmitting && !isLoading) {
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Chỉnh sửa Khảo sát</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200"
            disabled={isSubmitting || isLoading}
            title="Đóng"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center bg-gray-50">
            <div className="relative">
              <svg
                className="animate-spin h-16 w-16 text-indigo-600"
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
            </div>
            <p className="text-gray-700 font-medium mt-6 text-lg">Đang tải thông tin khảo sát...</p>
            <p className="text-gray-500 text-sm mt-2">Vui lòng đợi trong giây lát</p>
          </div>
        ) : (
          /* Form */
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
              disabled={isSubmitting}
            />
          </div>

          {/* Category and Object */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="categories_id" className="block text-sm font-semibold text-gray-800 mb-2">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                  </svg>
                  Danh mục
                </span>
              </label>
              <select
                id="categories_id"
                name="categories_id"
                value={formData.categories_id}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none bg-white"
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
                <option value="">Chọn đối tượng</option>
                <option value="public">🌐 Công chúng</option>
                <option value="students">🎓 Sinh viên</option>
                <option value="lecturers">👨‍🏫 Giảng viên</option>
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

          {/* Status */}
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
                  Đang lưu...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                  </svg>
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
