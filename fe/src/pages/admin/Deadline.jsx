import React, { useState, useEffect } from "react";
import { graphqlRequest } from "../../api/graphqls";
import AdminSidebar from "../../components/AdminSidebar";

// --- SVG Icons ---
const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
      clipRule="evenodd"
    />
  </svg>
);
const SearchIcon = () => (
  <svg
    className="h-5 w-5 text-gray-400"
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);
const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);
const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);
const RestoreIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 4v5h5M20 20v-5h-5M4 4l16 16"
    />
  </svg>
);
const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

// --- GraphQL Queries ---
const GET_PAGINATED_DEADLINES = `
  query GetPaginatedDeadlines($perPage: Int, $page: Int, $includeDeleted: Boolean) {
    getPaginatedDeadlines(perPage: $perPage, page: $page, includeDeleted: $includeDeleted) {
      data {
        id
        title
        deadline_date
        details
        created_by
        created_at
        updated_at
        deleted_at
      }
      current_page
      last_page
      total
    }
  }
`;

const SEARCH_DEADLINES = `
  query SearchDeadlines($filter: DeadlineFilterInput, $perPage: Int, $page: Int) {
    searchDeadlines(filter: $filter, perPage: $perPage, page: $page) {
      data {
        id
        title
        deadline_date
        details
        created_by
        created_at
        updated_at
        deleted_at
      }
      current_page
      last_page
      total
    }
  }
`;

const CREATE_DEADLINE = `
  mutation CreateDeadline($input: DeadlineInput!) {
    createDeadline(input: $input) {
      id
      title
      deadline_date
      details
      created_by
      created_at
      updated_at
      deleted_at
    }
  }
`;

const UPDATE_DEADLINE = `
  mutation UpdateDeadline($id: ID!, $input: DeadlineInput!) {
    updateDeadline(id: $id, input: $input) {
      id
      title
      deadline_date
      details
      created_by
      created_at
      updated_at
      deleted_at
    }
  }
`;

const DELETE_DEADLINE = `
  mutation DeleteDeadline($id: ID!) {
    deleteDeadline(id: $id)
  }
`;

const RESTORE_DEADLINE = `
  mutation RestoreDeadline($id: ID!) {
    restoreDeadline(id: $id)
  }
`;

// --- Utility ---
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date)) return "N/A";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// --- Toast Component ---
const Toast = ({ message, type, visible }) => {
  if (!visible) return null;
  return (
    <div className={`fixed top-6 right-6 z-[100] rounded-xl px-6 py-4 shadow-2xl max-w-md border-2 backdrop-blur-sm transform transition-all duration-300 ${
      type === "success" 
        ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 text-green-900 shadow-green-200/50" 
        : "bg-gradient-to-r from-red-50 to-rose-50 border-red-400 text-red-900 shadow-red-200/50"
    }`}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 mt-0.5 ${
          type === "success" ? "text-green-600" : "text-red-600"
        }`}>
          {type === "success" ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div className="flex-1 text-base font-medium whitespace-pre-line leading-relaxed">{message}</div>
      </div>
    </div>
  );
};

// --- Deadline Modal ---
const DeadlineModal = ({ modalData, closeModal, handleSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    deadline_date: "",
    details: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (modalData.type === "edit" && modalData.deadline) {
      // Convert deadline_date to datetime-local format (YYYY-MM-DDTHH:mm)
      const deadlineDate = modalData.deadline.deadline_date
        ? new Date(modalData.deadline.deadline_date).toISOString().slice(0, 16)
        : "";
      setFormData({
        title: modalData.deadline.title,
        deadline_date: deadlineDate,
        details: modalData.deadline.details || "",
      });
    } else {
      setFormData({ title: "", deadline_date: "", details: "" });
    }
    setErrors({});
    setGeneralError('');
    setIsSubmitting(false); // Reset submitting state when modal opens/closes
  }, [modalData]);

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = "Tiêu đề deadline không được để trống.";
    } else if (formData.title.length > 255) {
      newErrors.title = "Tiêu đề deadline không được vượt quá 255 ký tự.";
    } else if (!/^[a-zA-Z0-9\sÀ-ỹ.,-]*$/.test(formData.title)) {
      newErrors.title = "Tiêu đề chứa ký tự không hợp lệ.";
    }
    if (!formData.deadline_date)
      newErrors.deadline_date = "Ngày giờ hết hạn không được để trống.";
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(formData.deadline_date)) {
      newErrors.deadline_date =
        "Ngày giờ hết hạn không hợp lệ. Định dạng hợp lệ: DD/MM/YYYY HH:mm.";
    } else {
      // Kiểm tra deadline_date phải lớn hơn thời điểm hiện tại
      const deadlineDate = new Date(formData.deadline_date);
      const now = new Date();
      if (deadlineDate <= now) {
        newErrors.deadline_date = "Ngày giờ hết hạn phải lớn hơn thời điểm hiện tại.";
      }
    }
    if (!formData.details.trim()) {
      newErrors.details = "Chi tiết không được để trống.";
    } else if (formData.details.length > 1000) {
      newErrors.details = "Chi tiết không được vượt quá 1000 ký tự.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent spam submit
    if (isSubmitting) {
      return;
    }
    
    // Clear errors before submit
    setErrors({});
    setGeneralError('');
    
    if (validate()) {
      setIsSubmitting(true);
      try {
        // Convert deadline_date to backend-compatible format (e.g., YYYY-MM-DD HH:mm:ss)
        const formattedDeadlineDate = new Date(formData.deadline_date)
          .toISOString()
          .replace("T", " ")
          .slice(0, 19);
        await handleSave({ ...formData, deadline_date: formattedDeadlineDate }, setErrors, setGeneralError);
      } catch (error) {
        // Error is handled in handleSave
        // Ensure generalError is set if not already set by handleSave
        console.log("Error caught in handleSubmit, generalError state:", generalError);
        // Error is handled in handleSave
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (modalData.type !== "add" && modalData.type !== "edit") return null;
  const isEditing = modalData.type === "edit";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity"
      onClick={closeModal}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border-b-2 border-orange-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              {isEditing ? "Chỉnh sửa deadline" : "Thêm deadline mới"}
            </h3>
          </div>
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-900 hover:bg-white rounded-full p-2 transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md"
          >
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {generalError && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-xl shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">{generalError}</span>
              </div>
            </div>
          )}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Tiêu đề deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              maxLength={255}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, title: value });
                // Real-time validation for length
                if (value.length > 255) {
                  setErrors({ ...errors, title: "Tiêu đề deadline không được vượt quá 255 ký tự." });
                } else if (errors.title && errors.title.includes("255")) {
                  // Clear length error if within limit
                  const newErrors = { ...errors };
                  delete newErrors.title;
                  setErrors(newErrors);
                } else if (errors.title) {
                  setErrors({ ...errors, title: "" });
                }
              }}
              className={`border-2 ${
                errors.title ? "border-red-500 bg-red-50" : "border-gray-300 bg-white hover:border-gray-400"
              } rounded-xl w-full p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md`}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.title && (
                <p className="text-red-500 text-xs">{errors.title}</p>
              )}
              <p className={`text-xs ml-auto ${formData.title.length > 255 ? 'text-red-500' : 'text-gray-400'}`}>
                {formData.title.length}/255
              </p>
            </div>
          </div>
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Ngày giờ hết hạn <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.deadline_date}
              onChange={(e) => {
                setFormData({ ...formData, deadline_date: e.target.value });
                // Clear error when user changes the date
                if (errors.deadline_date) {
                  setErrors({ ...errors, deadline_date: "" });
                }
              }}
              min={new Date().toISOString().slice(0, 16)}
              className={`border-2 ${
                errors.deadline_date ? "border-red-500 bg-red-50" : "border-gray-300 bg-white hover:border-gray-400"
              } rounded-xl w-full p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md`}
            />
            {errors.deadline_date && (
              <p className="text-red-500 text-xs mt-1">{errors.deadline_date}</p>
            )}
          </div>
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Chi tiết
            </label>
            <textarea
              value={formData.details}
              maxLength={1000}
              rows={4}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, details: value });
                // Real-time validation
                if (value.length > 1000) {
                  setErrors({ ...errors, details: "Chi tiết không được vượt quá 1000 ký tự." });
                } else if (errors.details && (errors.details.includes("1000") || errors.details.includes("trống"))) {
                  // Clear length or required error if within limit and not empty
                  const newErrors = { ...errors };
                  delete newErrors.details;
                  setErrors(newErrors);
                } else if (errors.details) {
                  setErrors({ ...errors, details: "" });
                }
              }}
              className={`border-2 ${
                errors.details ? "border-red-500 bg-red-50" : "border-gray-300 bg-white hover:border-gray-400"
              } rounded-xl w-full p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md resize-none`}
              placeholder="Nhập chi tiết về deadline..."
            />
            <div className="flex justify-between items-center mt-1">
              {errors.details && (
                <p className="text-red-500 text-xs">{errors.details}</p>
              )}
              <p className={`text-xs ml-auto ${formData.details.length > 1000 ? 'text-red-500' : 'text-gray-400'}`}>
                {formData.details.length}/1000
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t-2 border-gray-200 pt-6 bg-gray-50 -mx-8 -mb-8 px-8 pb-6">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="px-6 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-semibold text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:from-orange-700 hover:to-amber-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
            >
              {isSubmitting && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting ? "Đang xử lý..." : (isEditing ? "Cập nhật" : "Tạo deadline")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Delete Modal ---
const DeleteModal = ({ modalData, closeModal, confirmDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (modalData.type !== "delete") return null;
  
  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await confirmDelete();
    } catch (error) {
      // Error is handled in confirmDelete
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-red-100 to-rose-100 mb-4 shadow-lg ring-4 ring-red-50">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Bạn có chắc chắn muốn xóa?
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Hành động này sẽ ẩn deadline khỏi danh sách, nhưng bạn có thể khôi phục lại sau.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={closeModal}
              disabled={isDeleting}
              className="px-5 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-semibold text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              Hủy
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
            >
              {isDeleting && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isDeleting ? "Đang xóa..." : "Vâng, xóa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Restore Modal ---
const RestoreModal = ({ modalData, closeModal, confirmRestore }) => {
  const [isRestoring, setIsRestoring] = useState(false);
  
  if (modalData.type !== "restore") return null;
  
  const handleRestore = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      await confirmRestore();
    } catch (error) {
      // Error is handled in confirmRestore
    } finally {
      setIsRestoring(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mb-4 shadow-lg ring-4 ring-green-50">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l16 16" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Bạn có chắc chắn muốn khôi phục?
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Deadline này sẽ được khôi phục và hiển thị lại trong danh sách.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={closeModal}
              disabled={isRestoring}
              className="px-5 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-semibold text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              Hủy
            </button>
            <button
              onClick={handleRestore}
              disabled={isRestoring}
              className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
            >
              {isRestoring && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isRestoring ? "Đang khôi phục..." : "Vâng, khôi phục"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
export default function DeadlineManager() {
  const [deadlines, setDeadlines] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalData, setModalData] = useState({ type: null, deadline: null });
  const [toast, setToast] = useState({
    message: "",
    type: "success",
    visible: false,
  });
  const ITEMS_PER_PAGE = 10;

  const showToast = (msg, type = "success") =>
    setToast({ message: msg, type, visible: true });

  const handleShowDeletedChange = (e) => {
    setShowDeleted(e.target.checked);
    setCurrentPage(1);
  };

  // Fetch deadlines
  useEffect(() => {
    const fetchDeadlines = async () => {
      try {
        const response = await graphqlRequest(
          searchQuery ? SEARCH_DEADLINES : GET_PAGINATED_DEADLINES,
          searchQuery
            ? {
                filter: {
                  title: searchQuery,
                  details: searchQuery,
                  include_deleted: showDeleted,
                },
                perPage: ITEMS_PER_PAGE,
                page: currentPage,
              }
            : {
                perPage: ITEMS_PER_PAGE,
                page: currentPage,
                includeDeleted: showDeleted,
              }
        );
        const paginated =
          response.data.getPaginatedDeadlines || response.data.searchDeadlines;
        if (!paginated || !Array.isArray(paginated.data)) {
          showToast("Dữ liệu phản hồi không hợp lệ.", "error");
          return;
        }
        setDeadlines(paginated.data);
        setCurrentPage(paginated.current_page);
        setTotalPages(paginated.last_page);
      } catch (error) {
        if (error.message.includes("Failed to fetch")) {
          showToast(
            "Kết nối máy chủ bị gián đoạn. Vui lòng kiểm tra đường truyền.",
            "error"
          );
        } else if (error.message.includes("Không tìm thấy deadline")) {
          showToast(
            "Không tìm thấy deadline. Vui lòng làm mới danh sách.",
            "error"
          );
        } else {
          showToast(
            "Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.",
            "error"
          );
        }
      }
    };
    fetchDeadlines();
  }, [searchQuery, showDeleted, currentPage]);

  useEffect(() => {
    if (toast.visible)
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }, [toast]);

  const handleSaveDeadline = async (formData, setFieldErrors, setGeneralError) => {
    try {
      if (modalData.type === "edit") {
        // Gửi updated_at từ deadline hiện tại để optimistic locking
        const inputData = {
          ...formData,
          updated_at: modalData.deadline.updated_at || modalData.deadline.created_at
        };
        
        const res = await graphqlRequest(UPDATE_DEADLINE, {
          id: modalData.deadline.id,
          input: inputData,
        });
        if (res.data.updateDeadline) {
          setDeadlines(
            deadlines.map((d) =>
              d.id === modalData.deadline.id ? res.data.updateDeadline : d
            )
          );
          showToast("Cập nhật thông tin deadline thành công");
          closeModal();
        } else {
          throw new Error(
            "Cập nhật thất bại: Không nhận được dữ liệu từ server"
          );
        }
      } else {
        const res = await graphqlRequest(CREATE_DEADLINE, { input: formData });
        if (res.data.createDeadline) {
          setDeadlines([res.data.createDeadline, ...deadlines]);
          showToast("Tạo deadline thành công");
          closeModal();
        } else {
          throw new Error("Tạo thất bại: Không nhận được dữ liệu từ server");
        }
      }
    } catch (error) {
      console.error("Save event error:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        extensions: error.response?.data?.errors?.[0]?.extensions,
        stack: error.stack
      });
      
      // Handle validation errors - parse từ GraphQL validation extensions
      if (error.response?.data?.errors?.[0]?.extensions?.validation) {
        const validationErrors = error.response.data.errors[0].extensions.validation;
        const fieldErrors = {};
        
        // Map validation errors to form fields
        if (validationErrors.title) {
          fieldErrors.title = Array.isArray(validationErrors.title) 
            ? validationErrors.title[0] 
            : validationErrors.title;
        }
        if (validationErrors.event_date) {
          fieldErrors.event_date = Array.isArray(validationErrors.event_date) 
            ? validationErrors.event_date[0] 
            : validationErrors.event_date;
        }
        if (validationErrors.location) {
          fieldErrors.location = Array.isArray(validationErrors.location) 
            ? validationErrors.location[0] 
            : validationErrors.location;
        }
        
        if (Object.keys(fieldErrors).length > 0 && setFieldErrors) {
          setFieldErrors(fieldErrors);
          if (setGeneralError) setGeneralError('');
          return; // Don't show toast, errors are shown in form fields
        }
      }
      
      // Extract error message từ nhiều nguồn - giống như phần delete
      let errorMessage = error.message || "Không thể lưu dữ liệu. Vui lòng thử lại sau.";
      
      // Check GraphQL error extensions trực tiếp (nếu graphql.js chưa extract)
      // Priority 0: error.message (GraphQL Error class thường đưa message vào đây)
      if (error.response?.data?.errors?.[0]?.message && 
          error.response.data.errors[0].message !== 'Internal server error' && 
          error.response.data.errors[0].message !== 'Có lỗi xảy ra') {
        errorMessage = error.response.data.errors[0].message;
      }
      // Priority 1: Check exception message from Laravel (most specific)
      else if (error.response?.data?.errors?.[0]?.extensions?.exception?.message) {
        errorMessage = error.response.data.errors[0].extensions.exception.message;
      }
      // Priority 2: Check validation errors
      else if (error.response?.data?.errors?.[0]?.extensions?.validation) {
        const validationErrors = error.response.data.errors[0].extensions.validation;
        const firstError = Object.values(validationErrors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      }
      // Priority 3: Check other extensions message
      else if (error.response?.data?.errors?.[0]?.extensions?.message) {
        errorMessage = error.response.data.errors[0].extensions.message;
      }
      // Priority 4: Check debugMessage (Lighthouse debug mode)
      else if (error.response?.data?.errors?.[0]?.extensions?.debugMessage) {
        errorMessage = error.response.data.errors[0].extensions.debugMessage;
      }
      
      // Xử lý các loại lỗi cụ thể
      if (errorMessage.includes("Bạn chưa đăng nhập") || errorMessage.includes("Unauthenticated") || errorMessage.includes("auth")) {
        errorMessage = "Bạn chưa đăng nhập. Vui lòng đăng nhập lại.";
        setTimeout(() => (window.location.href = "/login"), 2000);
      } else if (errorMessage.includes("Bạn không có quyền") || errorMessage.includes("permission") || errorMessage.includes("Chỉ admin")) {
        errorMessage = errorMessage || "Bạn không có quyền thực hiện thao tác này.";
      } else if (errorMessage.includes("Đang xử lý yêu cầu")) {
        errorMessage = "Đang xử lý yêu cầu. Vui lòng đợi và thử lại sau vài giây.";
      } else if (errorMessage.includes("Dữ liệu đã được cập nhật")) {
        errorMessage = "Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang trước khi cập nhật.";
        console.log("Setting general error for optimistic locking:", errorMessage);
        console.log("setGeneralError function:", setGeneralError);
        if (setGeneralError) {
          setGeneralError(errorMessage);
          console.log("setGeneralError called");
        } else {
          console.error("setGeneralError is not available!");
        }
        showToast(errorMessage, "error");
        // Don't return early - let the error continue to be processed
        // The generalError state will be set and displayed in the modal
      } else if (errorMessage.includes("Ngày giờ hết hạn phải lớn hơn") || errorMessage.includes("after:now")) {
        errorMessage = "Ngày giờ hết hạn phải lớn hơn thời điểm hiện tại.";
        if (setFieldErrors) setFieldErrors(prev => ({ ...prev, deadline_date: errorMessage }));
        if (setGeneralError) setGeneralError('');
        return;
      } else if (errorMessage.includes("Xung đột với deadline") || errorMessage.includes("Đã tồn tại deadline")) {
        errorMessage = "Xung đột với deadline khác. Vui lòng chọn giờ hoặc tiêu đề khác.";
        if (setGeneralError) setGeneralError(errorMessage);
        showToast(errorMessage, "error");
        return; // Return early để không xử lý tiếp
      } else if (errorMessage.includes("Không tìm thấy deadline")) {
        errorMessage = "Không tìm thấy deadline. Vui lòng làm mới danh sách.";
      } else if (errorMessage.includes("Phiên đăng nhập") || errorMessage.includes("session")) {
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        setTimeout(() => (window.location.href = "/login"), 5000);
      } else if (errorMessage.includes("Không thể kết nối đến cơ sở dữ liệu") || errorMessage.includes("SQLSTATE")) {
        errorMessage = "Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.";
      } else if (errorMessage.includes("Lỗi cấu trúc dữ liệu") || errorMessage.includes("Unknown column")) {
        errorMessage = "Lỗi cấu trúc dữ liệu. Vui lòng liên hệ quản trị viên.";
      } else if (errorMessage.includes("Deadline này đã tồn tại") || errorMessage.includes("Duplicate entry")) {
        errorMessage = "Deadline này đã tồn tại. Vui lòng kiểm tra lại tiêu đề hoặc ngày giờ.";
        if (setGeneralError) setGeneralError(errorMessage);
        showToast(errorMessage, "error");
        return; // Return early để không xử lý tiếp
      } else if (errorMessage.includes("Định dạng ngày tháng không hợp lệ") || errorMessage.includes("date_format")) {
        errorMessage = "Định dạng ngày tháng không hợp lệ. Vui lòng kiểm tra lại.";
        if (setFieldErrors) setFieldErrors(prev => ({ ...prev, deadline_date: errorMessage }));
        if (setGeneralError) setGeneralError('');
        return;
      } else if (errorMessage.includes("Tên deadline không được để trống") || errorMessage.includes("title.required")) {
        if (setFieldErrors) setFieldErrors(prev => ({ ...prev, title: "Tiêu đề deadline không được để trống." }));
        if (setGeneralError) setGeneralError('');
        return;
      } else if (errorMessage.includes("Ngày giờ hết hạn không được để trống") || errorMessage.includes("deadline_date.required")) {
        if (setFieldErrors) setFieldErrors(prev => ({ ...prev, deadline_date: "Ngày giờ hết hạn không được để trống." }));
        if (setGeneralError) setGeneralError('');
        return;
      } else if (errorMessage === "Internal server error" || errorMessage === "Có lỗi xảy ra") {
        errorMessage = "Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.";
      }
      // Nếu không match với bất kỳ pattern nào, sử dụng message từ backend
      
      // Log final message để debug
      console.log("Final error message to display (save):", errorMessage);
      
      // Hiển thị lỗi chung nếu không phải lỗi field cụ thể
      // Nếu đã set generalError ở trên (như "Dữ liệu đã được cập nhật"), không set lại
      if (!errorMessage.includes("Ngày giờ hết hạn") && !errorMessage.includes("Tên deadline")) {
        // Only set if not already set for specific errors like "Dữ liệu đã được cập nhật"
        if (!errorMessage.includes("Dữ liệu đã được cập nhật") && !errorMessage.includes("Xung đột với deadline") && !errorMessage.includes("Deadline này đã tồn tại")) {
          if (setGeneralError) setGeneralError(errorMessage);
        }
        showToast(errorMessage, "error");
      } else {
        if (setGeneralError) setGeneralError('');
      }
      
      throw error; // Re-throw để component có thể xử lý
    }
  };

  const handleDeleteDeadline = async () => {
    try {
      const res = await graphqlRequest(DELETE_DEADLINE, {
        id: modalData.deadline.id,
      });
      if (res.data.deleteDeadline) {
        setDeadlines(
          deadlines.map((d) =>
            d.id === modalData.deadline.id
              ? { ...d, deleted_at: new Date().toISOString() }
              : d
          )
        );
        showToast("Xóa deadline thành công");
        closeModal();
      } else {
        throw new Error("Xóa thất bại: Không nhận được dữ liệu từ server");
      }
    } catch (error) {
      console.error("Delete deadline error:", error);
      let errorMessage = error.message || "Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.";
      
      if (error.message.includes("Đang xử lý yêu cầu xóa")) {
        errorMessage = "Đang xử lý yêu cầu xóa. Vui lòng đợi và thử lại sau vài giây.";
      } else if (error.message.includes("Deadline đã bị xóa trước đó")) {
        errorMessage = "Deadline đã bị xóa trước đó. Không thể xóa lại.";
      } else if (error.message.includes("Không tìm thấy deadline. Deadline không tồn tại")) {
        errorMessage = "Không tìm thấy deadline. Deadline không tồn tại.";
      } else if (error.message.includes("Không tìm thấy deadline")) {
        errorMessage = "Không tìm thấy deadline. Vui lòng làm mới danh sách.";
      } else if (error.message.includes("Bạn chưa đăng nhập") || error.message.includes("auth")) {
        errorMessage = "Bạn chưa đăng nhập. Vui lòng đăng nhập lại.";
        setTimeout(() => (window.location.href = "/login"), 2000);
      } else if (error.message.includes("Bạn không có quyền") || error.message.includes("permission")) {
        errorMessage = error.message || "Bạn không có quyền xóa deadline.";
      } else if (error.message.includes("Phiên đăng nhập")) {
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        setTimeout(() => (window.location.href = "/login"), 5000);
      } else if (error.message.includes("Không thể kết nối đến cơ sở dữ liệu")) {
        errorMessage = "Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.";
      } else if (error.message.includes("đang được sử dụng")) {
        errorMessage = "Không thể xóa deadline vì đang được sử dụng ở nơi khác.";
      } else if (error.message && error.message !== "Internal server error" && error.message !== "Có lỗi xảy ra") {
        // Sử dụng message từ backend nếu có
        errorMessage = error.message;
      }
      showToast(errorMessage, "error");
      throw error; // Re-throw để component có thể xử lý
    }
  };

  const handleRestoreDeadline = async () => {
    try {
      const id = modalData.deadline.id;
      const res = await graphqlRequest(RESTORE_DEADLINE, { id });
      if (res.data.restoreDeadline) {
        setDeadlines(deadlines.filter((d) => d.id !== id));
        showToast("Khôi phục deadline thành công");
        closeModal();
      } else {
        throw new Error(
          "Khôi phục thất bại: Không nhận được dữ liệu từ server"
        );
      }
    } catch (error) {
      let errorMessage = error.message || "Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.";
      if (error.message.includes("Đang xử lý yêu cầu")) {
        errorMessage = "Đang xử lý yêu cầu. Vui lòng đợi và thử lại sau vài giây.";
      } else if (error.message.includes("Kiểm tra dữ liệu hoặc xung đột")) {
        errorMessage =
          "Không thể khôi phục deadline. Kiểm tra dữ liệu hoặc xung đột với deadline khác.";
      } else if (error.message.includes("Không tìm thấy deadline")) {
        errorMessage = "Không tìm thấy deadline. Vui lòng làm mới danh sách.";
      } else if (error.message.includes("Bạn không có quyền")) {
        errorMessage = error.message;
      } else if (error.message.includes("Phiên đăng nhập")) {
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        setTimeout(() => (window.location.href = "/login"), 5000);
      } else if (error.message.includes("Không thể kết nối đến cơ sở dữ liệu")) {
        errorMessage = "Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.";
      } else if (error.message && error.message !== "Internal server error" && error.message !== "Có lỗi xảy ra") {
        // Sử dụng message từ backend nếu có
        errorMessage = error.message;
      }
      showToast(errorMessage, "error");
      throw error; // Re-throw để component có thể xử lý
    }
  };

  const closeModal = () => setModalData({ type: null, deadline: null });

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex">
      <AdminSidebar /> {/* Sidebar bên trái */}
      <div className="flex-1 p-4 max-w-7xl mx-auto">
        <Toast {...toast} />
        <DeadlineModal
          modalData={modalData}
          closeModal={closeModal}
          handleSave={handleSaveDeadline}
        />
        <DeleteModal
          modalData={modalData}
          closeModal={closeModal}
          confirmDelete={handleDeleteDeadline}
        />
        <RestoreModal
          modalData={modalData}
          closeModal={closeModal}
          confirmRestore={handleRestoreDeadline}
        />

        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600 shadow-lg">
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">Quản lý Deadline</h1>
          </div>
          <p className="text-gray-600 mt-2 text-lg">
            Thêm, sửa, xóa và tìm kiếm deadline dễ dàng
          </p>
        </header>

        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-xl border-2 border-gray-100 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            onClick={() => setModalData({ type: "add", deadline: null })}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:from-orange-700 hover:to-amber-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <PlusIcon /> Thêm mới
          </button>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                maxLength={255}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                  // Clear error when user types
                  if (searchError) {
                    setSearchError("");
                  }
                }}
                placeholder="Tìm kiếm deadline..."
                className={`pl-10 pr-16 py-2.5 border-2 rounded-xl w-64 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md ${searchError ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <SearchIcon />
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <span className={`text-xs font-medium ${searchQuery.length >= 250 ? 'text-orange-500' : searchQuery.length >= 255 ? 'text-red-500' : 'text-gray-400'}`}>
                  {searchQuery.length}/255
                </span>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer hover:text-orange-600 transition-colors">
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={handleShowDeletedChange}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
              />
              Hiển thị deadline đã xóa
            </label>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gradient-to-r from-gray-50 via-orange-50 to-amber-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Tiêu đề</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Ngày giờ hết hạn</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Chi tiết</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {deadlines.length > 0 ? (
                deadlines.map((d) => (
                  <tr
                    key={d.id}
                    className={`hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 transition-all duration-200 group ${
                      d.deleted_at ? "bg-gray-100 opacity-75" : ""
                    }`}
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">{d.title}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(d.deadline_date)}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{d.details || "N/A"}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(d.created_at)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {d.deleted_at ? (
                          <button
                            onClick={() => setModalData({ type: "restore", deadline: d })}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                            title="Khôi phục"
                          >
                            <RestoreIcon />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                setModalData({ type: "edit", deadline: d })
                              }
                              className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                              title="Chỉnh sửa"
                            >
                              <EditIcon />
                            </button>
                            <button
                              onClick={() =>
                                setModalData({ type: "delete", deadline: d })
                              }
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                              title="Xóa"
                            >
                              <DeleteIcon />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-lg">
                      <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-lg font-bold text-gray-800 mb-2">
                      {showDeleted
                        ? "Không có deadline đã xóa"
                        : "Không có deadline nào"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {showDeleted
                        ? "Tất cả deadline đang hoạt động"
                        : "Hãy thêm deadline mới để bắt đầu"}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-8 bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4">
            <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Trang <span className="text-orange-600 font-bold">{currentPage}</span> / <span className="text-orange-600 font-bold">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border-2 border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-400 transition-all duration-200 font-semibold text-gray-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Trước
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border-2 border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-400 transition-all duration-200 font-semibold text-gray-700 flex items-center gap-2"
              >
                Sau
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}