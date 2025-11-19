import React, { useState, useEffect } from 'react';
import { graphqlRequest } from '../../api/graphql';
import AdminSidebar from "../../components/AdminSidebar";


// --- SVG Icons ---
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);
const SearchIcon = () => (
  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const RestoreIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l16 16" />
  </svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
        user {
          id
          name
          email
        }
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
        user {
          id
          name
          email
        }
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
      user {
        id
        name
        email
      }
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
      user {
        id
        name
        email
      }
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
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date)) return 'N/A';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

// --- Toast Component ---
const Toast = ({ message, type, visible }) => {
  if (!visible) return null;
  const baseClasses = 'toast fixed top-5 right-5 z-[100] rounded-lg p-4 text-white shadow-lg transition-transform transform';
  const typeClasses = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
};

// --- Delete Modal ---
const DeleteModal = ({ modalData, closeModal, confirmDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (modalData.type !== 'delete') return null;
  
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={closeModal}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center p-5 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Xác nhận xóa</h3>
          <button 
            onClick={closeModal} 
            disabled={isDeleting}
            className="ml-auto text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CloseIcon />
          </button>
        </div>
        <p className="p-6">Bạn có chắc muốn xóa deadline "{modalData.deadline.title}"?</p>
        <div className="flex justify-end gap-4 p-6 pt-0">
          <button 
            onClick={closeModal} 
            disabled={isDeleting}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isDeleting ? "Đang xóa..." : "Xóa"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Deadline Modal ---
const DeadlineModal = ({ modalData, closeModal, handleSave }) => {
  const [formData, setFormData] = useState({ title: '', deadline_date: '', details: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (modalData.type === 'edit' && modalData.deadline) {
      const deadlineDate = modalData.deadline.deadline_date
        ? new Date(modalData.deadline.deadline_date).toISOString().slice(0, 16)
        : '';
      setFormData({
        title: modalData.deadline.title || '',
        deadline_date: deadlineDate,
        details: modalData.deadline.details || '',
      });
    } else {
      setFormData({ title: '', deadline_date: '', details: '' });
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
    if (!formData.deadline_date) newErrors.deadline_date = "Ngày giờ kết thúc không được để trống.";
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(formData.deadline_date)) {
      newErrors.deadline_date = "Ngày giờ kết thúc không hợp lệ. Định dạng hợp lệ: YYYY-MM-DD HH:MM.";
    } else {
      // Kiểm tra deadline_date phải lớn hơn thời điểm hiện tại
      const deadlineDate = new Date(formData.deadline_date);
      const now = new Date();
      if (deadlineDate <= now) {
        newErrors.deadline_date = "Ngày giờ kết thúc phải sau thời điểm hiện tại.";
      }
    }
    if (formData.details && formData.details.length > 255) {
      newErrors.details = "Ghi chú không được vượt quá 255 ký tự.";
    } else if (formData.details && !/^[a-zA-Z0-9\sÀ-ỹ.,-]*$/.test(formData.details)) {
      newErrors.details = "Ghi chú chứa ký tự không hợp lệ.";
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
        const formattedDeadlineDate = formData.deadline_date.replace('T', ' ') + ':00';
        await handleSave({ ...formData, deadline_date: formattedDeadlineDate }, setErrors, setGeneralError);
      } catch (error) {
        // Error is handled in handleSave
        // Ensure generalError is set if not already set by handleSave
        console.log("Error caught in handleSubmit, generalError state:", generalError);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (modalData.type !== 'add' && modalData.type !== 'edit') return null;
  const isEditing = modalData.type === 'edit';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={closeModal}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center p-5 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            {isEditing ? 'Chỉnh sửa deadline' : 'Thêm deadline mới'}
          </h3>
          <button onClick={closeModal} className="ml-auto text-gray-400 hover:text-gray-600">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {generalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {generalError}
            </div>
          )}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-32">
              <span className="text-red-500">*</span> Tên deadline
            </label>
            <div className="flex-1">
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
                className={`bg-gray-50 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full p-2.5`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.title && <p className="text-red-500 text-xs">{errors.title}</p>}
                <p className={`text-xs ml-auto ${formData.title.length > 255 ? 'text-red-500' : 'text-gray-400'}`}>
                  {formData.title.length}/255
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-32">
              <span className="text-red-500">*</span> Ngày giờ kết thúc
            </label>
            <div className="flex-1">
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
                className={`bg-gray-50 border ${errors.deadline_date ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full p-2.5`}
              />
              {errors.deadline_date && <p className="text-red-500 text-xs mt-1">{errors.deadline_date}</p>}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <label className="text-sm font-medium text-gray-700 w-32">Ghi chú / Mô tả</label>
            <div className="flex-1">
              <textarea
                value={formData.details}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, details: value });
                  // Real-time validation for length
                  if (value.length > 255) {
                    setErrors({ ...errors, details: "Ghi chú không được vượt quá 255 ký tự." });
                  } else if (errors.details && errors.details.includes("255")) {
                    // Clear length error if within limit
                    const newErrors = { ...errors };
                    delete newErrors.details;
                    setErrors(newErrors);
                  } else if (errors.details) {
                    setErrors({ ...errors, details: "" });
                  }
                }}
                rows={3}
                maxLength={255}
                className={`bg-gray-50 border ${errors.details ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full p-2.5`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.details && <p className="text-red-500 text-xs">{errors.details}</p>}
                <p className="text-gray-400 text-xs ml-auto">{formData.details.length}/255</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button 
              type="button" 
              onClick={closeModal} 
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting ? "Đang xử lý..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Component ---
export default function Deadline() {
  const [deadlines, setDeadlines] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [modalData, setModalData] = useState({ type: null, deadline: null });
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast({ ...toast, visible: false }), 3000);
  };

  const fetchDeadlines = async () => {
    try {
      const variables = { perPage: 5, page: currentPage, includeDeleted: showDeleted };
      let res;
      if (searchQuery) {
        variables.filter = { title: searchQuery };
        res = await graphqlRequest(SEARCH_DEADLINES, variables);
        console.log('Search response:', res);
        setDeadlines(res.data.searchDeadlines.data);
        setTotalPages(res.data.searchDeadlines.last_page);
      } else {
        res = await graphqlRequest(GET_PAGINATED_DEADLINES, variables);
        console.log('Paginated response:', res);
        setDeadlines(res.data.getPaginatedDeadlines.data);
        setTotalPages(res.data.getPaginatedDeadlines.last_page);
      }
    } catch (error) {
      console.error('Fetch deadlines error:', error);
      showToast('Lỗi khi tải danh sách deadline', 'error');
    }
  };

  useEffect(() => {
    fetchDeadlines();
  }, [currentPage, searchQuery, showDeleted]);

  const handleShowDeletedChange = (e) => {
    setShowDeleted(e.target.checked);
    setCurrentPage(1);
  };

  const handleSaveDeadline = async (formData, setFieldErrors, setGeneralError) => {
    try {
      let res;
      if (modalData.type === 'add') {
        res = await graphqlRequest(CREATE_DEADLINE, { input: formData });
        if (res.data.createDeadline) {
          setDeadlines([...deadlines, res.data.createDeadline]);
          showToast('Thêm deadline thành công');
          closeModal();
        }
      } else if (modalData.type === 'edit') {
        // Gửi updated_at từ deadline hiện tại để optimistic locking
        const inputData = {
          ...formData,
          updated_at: modalData.deadline.updated_at || modalData.deadline.created_at
        };
        
        res = await graphqlRequest(UPDATE_DEADLINE, { id: modalData.deadline.id, input: inputData });
        if (res.data.updateDeadline) {
          setDeadlines(deadlines.map((d) => (d.id === modalData.deadline.id ? res.data.updateDeadline : d)));
          showToast('Cập nhật deadline thành công');
          closeModal();
        }
      }
    } catch (error) {
      console.error("Save deadline error:", error);
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
        if (validationErrors.deadline_date) {
          fieldErrors.deadline_date = Array.isArray(validationErrors.deadline_date) 
            ? validationErrors.deadline_date[0] 
            : validationErrors.deadline_date;
        }
        if (validationErrors.details) {
          fieldErrors.details = Array.isArray(validationErrors.details) 
            ? validationErrors.details[0] 
            : validationErrors.details;
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
      } else if (errorMessage.includes("Ngày giờ kết thúc phải sau thời điểm hiện tại") || errorMessage.includes("after:now")) {
        errorMessage = "Ngày giờ kết thúc phải sau thời điểm hiện tại.";
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
      } else if (errorMessage.includes("Ngày giờ kết thúc không được để trống") || errorMessage.includes("deadline_date.required")) {
        if (setFieldErrors) setFieldErrors(prev => ({ ...prev, deadline_date: "Ngày giờ kết thúc không được để trống." }));
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
      if (!errorMessage.includes("Ngày giờ kết thúc") && !errorMessage.includes("Tên deadline")) {
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
      const res = await graphqlRequest(DELETE_DEADLINE, { id: modalData.deadline.id });
      if (res.data.deleteDeadline) {
        setDeadlines(deadlines.map((d) => (d.id === modalData.deadline.id ? { ...d, deleted_at: new Date().toISOString() } : d)));
        showToast('Xóa deadline thành công');
      } else {
        throw new Error('Xóa thất bại: Không nhận được dữ liệu từ server');
      }
      closeModal();
    } catch (error) {
      console.error("Delete deadline error:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        extensions: error.response?.data?.errors?.[0]?.extensions,
        stack: error.stack
      });
      
      // Extract error message từ nhiều nguồn
      let errorMessage = error.message || "Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.";
      
      // Check GraphQL error extensions trực tiếp (nếu graphql.js chưa extract)
      if (error.response?.data?.errors?.[0]?.extensions?.exception?.message) {
        errorMessage = error.response.data.errors[0].extensions.exception.message;
      } else if (error.response?.data?.errors?.[0]?.extensions?.validation) {
        const validationErrors = error.response.data.errors[0].extensions.validation;
        const firstError = Object.values(validationErrors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      } else if (error.response?.data?.errors?.[0]?.extensions?.message) {
        errorMessage = error.response.data.errors[0].extensions.message;
      } else if (error.response?.data?.errors?.[0]?.message) {
        errorMessage = error.response.data.errors[0].message;
      }
      
      // Xử lý các loại lỗi cụ thể - ưu tiên các message cụ thể trước
      if (!errorMessage || errorMessage === "Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.") {
        // Chỉ set default nếu thực sự không có message
        if (!errorMessage) {
          errorMessage = "Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.";
        }
      } else if (errorMessage.includes("Deadline đã bị xóa trước đó") || errorMessage.includes("đã bị xóa trước đó")) {
        errorMessage = "Deadline đã bị xóa trước đó. Không thể xóa lại.";
      } else if (errorMessage.includes("Đang xử lý yêu cầu xóa")) {
        errorMessage = "Đang xử lý yêu cầu xóa. Vui lòng đợi và thử lại sau vài giây.";
      } else if (errorMessage.includes("Không tìm thấy deadline. Deadline không tồn tại")) {
        errorMessage = "Không tìm thấy deadline. Deadline không tồn tại.";
      } else if (errorMessage.includes("Không tìm thấy deadline")) {
        errorMessage = "Không tìm thấy deadline. Vui lòng làm mới danh sách.";
      } else if (errorMessage.includes("Bạn chưa đăng nhập") || errorMessage.includes("Unauthenticated") || errorMessage.includes("auth")) {
        errorMessage = "Bạn chưa đăng nhập. Vui lòng đăng nhập lại.";
        setTimeout(() => (window.location.href = "/login"), 2000);
      } else if (errorMessage.includes("Bạn không có quyền") || errorMessage.includes("permission") || errorMessage.includes("Chỉ admin")) {
        errorMessage = errorMessage || "Bạn không có quyền xóa deadline.";
      } else if (errorMessage.includes("Phiên đăng nhập") || errorMessage.includes("session")) {
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        setTimeout(() => (window.location.href = "/login"), 5000);
      } else if (errorMessage.includes("Không thể kết nối đến cơ sở dữ liệu") || errorMessage.includes("SQLSTATE")) {
        errorMessage = "Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.";
      } else if (errorMessage.includes("đang được sử dụng") || errorMessage.includes("Foreign key constraint")) {
        errorMessage = "Không thể xóa deadline vì đang được sử dụng ở nơi khác.";
      } else if (errorMessage === "Internal server error" || errorMessage === "Có lỗi xảy ra") {
        errorMessage = "Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.";
      }
      // Nếu không match với bất kỳ pattern nào, sử dụng message từ backend
      
      console.log("Final error message to display:", errorMessage);
      showToast(errorMessage, "error");
      throw error; // Re-throw để component có thể xử lý
    }
  };

  const handleRestoreDeadline = async (id) => {
    try {
      const res = await graphqlRequest(RESTORE_DEADLINE, { id });
      if (res.data.restoreDeadline) {
        setDeadlines(deadlines.map((d) => (d.id === id ? { ...d, deleted_at: null } : d)));
        showToast('Khôi phục deadline thành công');
      } else {
        throw new Error('Khôi phục thất bại: Không nhận được dữ liệu từ server');
      }
    } catch (error) {
      console.error("Restore deadline error:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        extensions: error.response?.data?.errors?.[0]?.extensions,
      });
      
      // Extract error message từ nhiều nguồn
      let errorMessage = error.message || "Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.";
      
      // Check GraphQL error extensions trực tiếp
      if (error.response?.data?.errors?.[0]?.extensions?.exception?.message) {
        errorMessage = error.response.data.errors[0].extensions.exception.message;
      } else if (error.response?.data?.errors?.[0]?.extensions?.validation) {
        const validationErrors = error.response.data.errors[0].extensions.validation;
        const firstError = Object.values(validationErrors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      } else if (error.response?.data?.errors?.[0]?.extensions?.message) {
        errorMessage = error.response.data.errors[0].extensions.message;
      } else if (error.response?.data?.errors?.[0]?.message) {
        errorMessage = error.response.data.errors[0].message;
      }
      
      // Xử lý các loại lỗi cụ thể
      if (errorMessage.includes("Đang xử lý yêu cầu")) {
        errorMessage = "Đang xử lý yêu cầu. Vui lòng đợi và thử lại sau vài giây.";
      } else if (errorMessage.includes("Kiểm tra dữ liệu hoặc xung đột") || errorMessage.includes("xung đột")) {
        errorMessage = "Không thể khôi phục deadline. Kiểm tra dữ liệu hoặc xung đột với deadline khác.";
      } else if (errorMessage.includes("Không tìm thấy deadline")) {
        errorMessage = "Không tìm thấy deadline. Vui lòng làm mới danh sách.";
      } else if (errorMessage.includes("Bạn không có quyền") || errorMessage.includes("permission") || errorMessage.includes("Chỉ admin")) {
        errorMessage = errorMessage || "Bạn không có quyền khôi phục deadline.";
      } else if (errorMessage.includes("Phiên đăng nhập") || errorMessage.includes("session")) {
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        setTimeout(() => (window.location.href = "/login"), 5000);
      } else if (errorMessage.includes("Không thể kết nối đến cơ sở dữ liệu") || errorMessage.includes("SQLSTATE")) {
        errorMessage = "Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.";
      } else if (errorMessage === "Internal server error" || errorMessage === "Có lỗi xảy ra") {
        errorMessage = "Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.";
      }
      // Nếu không match, sử dụng message từ backend
      
      showToast(errorMessage, "error");
    }
  };

  const closeModal = () => setModalData({ type: null, deadline: null });

  return (
    <>
      <style>{`
        @keyframes slide-in {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        .toast {
          animation: slide-in 0.5s forwards, fade-out 0.5s 2.5s forwards;
        }
        th {
          text-align: left !important;
        }
      `}</style>
      <div className="flex min-h-screen bg-gray-100">
        <AdminSidebar />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <Toast {...toast} />
          <DeadlineModal modalData={modalData} closeModal={closeModal} handleSave={handleSaveDeadline} />
          <DeleteModal modalData={modalData} closeModal={closeModal} confirmDelete={handleDeleteDeadline} />

          <div className="max-w-7xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Quản lý Deadline</h1>
            <p className="text-gray-500 mt-2">Tạo, cập nhật và quản lý các deadline quan trọng.</p>
          </header>

          <div className="bg-white p-5 rounded-xl shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button onClick={() => setModalData({ type: 'add', deadline: null })} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
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
                  className={`pl-10 pr-16 py-2 border rounded-lg w-64 ${searchError ? 'border-red-500' : 'border-gray-300'}`}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2"><SearchIcon /></div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <span className={`text-xs ${searchQuery.length >= 250 ? 'text-orange-500' : searchQuery.length >= 255 ? 'text-red-500' : 'text-gray-400'}`}>
                    {searchQuery.length}/255
                  </span>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showDeleted} onChange={handleShowDeletedChange} /> Hiển thị deadline đã xóa
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Tên deadline</th>
                  <th className="px-6 py-3">Ngày giờ kết thúc</th>
                  <th className="px-6 py-3">Ghi chú</th>
                  <th className="px-6 py-3">Người tạo</th>
                  <th className="px-6 py-3">Ngày tạo</th>
                  <th className="px-6 py-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {deadlines.length > 0 ? (
                  deadlines.map((d) => (
                    <tr key={d.id} className={`hover:bg-gray-50 ${d.deleted_at ? 'bg-gray-100 opacity-75' : ''}`}>
                      <td className="px-6 py-3 font-medium">{d.title}</td>
                      <td className="px-6 py-3">{formatDate(d.deadline_date)}</td>
                      <td className="px-6 py-3">{d.details || 'N/A'}</td>
                      <td className="px-6 py-3">{d.user?.name || 'N/A'}</td>
                      <td className="px-6 py-3">{formatDate(d.created_at)}</td>
                      <td className="px-6 py-3 text-center">
                        {d.deleted_at ? (
                          <button onClick={() => handleRestoreDeadline(d.id)} className="text-green-500 hover:text-green-700"><RestoreIcon /></button>
                        ) : (
                          <>
                            <button onClick={() => setModalData({ type: 'edit', deadline: d })} className="text-indigo-500 hover:text-indigo-700"><EditIcon /></button>
                            <button onClick={() => setModalData({ type: 'delete', deadline: d })} className="text-red-500 hover:text-red-700 ml-2"><DeleteIcon /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      {showDeleted ? 'Không có deadline đã xóa' : 'Không có deadline nào'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <span>
                Trang <b>{currentPage}</b> / <b>{totalPages}</b>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>
    </>
  );
}