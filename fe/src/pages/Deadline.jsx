import React, { useState, useEffect } from 'react';
import { graphqlRequest } from '../api/graphql';

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
  if (modalData.type !== 'delete') return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={closeModal}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center p-5 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Xác nhận xóa</h3>
          <button onClick={closeModal} className="ml-auto text-gray-400 hover:text-gray-600">
            <CloseIcon />
          </button>
        </div>
        <p className="p-6">Bạn có chắc muốn xóa deadline "{modalData.deadline.title}"?</p>
        <div className="flex justify-end gap-4 p-6 pt-0">
          <button onClick={closeModal} className="px-4 py-2 bg-gray-300 rounded">Hủy</button>
          <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded">Xóa</button>
        </div>
      </div>
    </div>
  );
};

// --- Deadline Modal ---
const DeadlineModal = ({ modalData, closeModal, handleSave }) => {
  const [formData, setFormData] = useState({ title: '', deadline_date: '', details: '' });
  const [errors, setErrors] = useState({});

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
  }, [modalData]);

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Tiêu đề deadline không được để trống.";
    if (!formData.deadline_date) newErrors.deadline_date = "Ngày giờ kết thúc không được để trống.";
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(formData.deadline_date)) {
      newErrors.deadline_date = "Ngày giờ kết thúc không hợp lệ. Định dạng hợp lệ: YYYY-MM-DD HH:MM.";
    }
    if (formData.details.length > 255) newErrors.details = "Ghi chú không được vượt quá 255 ký tự.";
    if (!/^[a-zA-Z0-9\sÀ-ỹ.,-]*$/.test(formData.title)) newErrors.title = "Tiêu đề chứa ký tự không hợp lệ.";
    if (formData.details && !/^[a-zA-Z0-9\sÀ-ỹ.,-]*$/.test(formData.details)) newErrors.details = "Ghi chú chứa ký tự không hợp lệ.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const formattedDeadlineDate = formData.deadline_date.replace('T', ' ') + ':00';
      handleSave({ ...formData, deadline_date: formattedDeadlineDate });
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
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-32">
              <span className="text-red-500">*</span> Tên deadline
            </label>
            <div className="flex-1">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`bg-gray-50 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full p-2.5`}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
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
                onChange={(e) => setFormData({ ...formData, deadline_date: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                rows={3}
                maxLength={255}
                className={`bg-gray-50 border ${errors.details ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full p-2.5`}
              />
              {errors.details && <p className="text-red-500 text-xs mt-1">{errors.details}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-300 rounded">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Lưu</button>
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

  const handleSaveDeadline = async (formData) => {
    try {
      let res;
      if (modalData.type === 'add') {
        res = await graphqlRequest(CREATE_DEADLINE, { input: formData });
        if (res.data.createDeadline) {
          setDeadlines([...deadlines, res.data.createDeadline]);
          showToast('Thêm deadline thành công');
        }
      } else if (modalData.type === 'edit') {
        res = await graphqlRequest(UPDATE_DEADLINE, { id: modalData.deadline.id, input: formData });
        if (res.data.updateDeadline) {
          setDeadlines(deadlines.map((d) => (d.id === modalData.deadline.id ? res.data.updateDeadline : d)));
          showToast('Cập nhật deadline thành công');
        }
      }
      closeModal();
    } catch (error) {
      let errorMessage = 'Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.';
      try {
        const parsed = JSON.parse(error.message);
        errorMessage = Object.values(parsed)[0][0];
      } catch {}
      if (error.message.includes('Xung đột với deadline')) {
        errorMessage = 'Xung đột với deadline khác. Vui lòng chọn giờ hoặc tiêu đề khác.';
      } else if (error.message.includes('Không tìm thấy deadline')) {
        errorMessage = 'Không tìm thấy deadline. Vui lòng làm mới danh sách.';
      } else if (error.message.includes('Bạn không có quyền')) {
        errorMessage = error.message;
      } else if (error.message.includes('Phiên đăng nhập')) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        setTimeout(() => (window.location.href = '/login'), 5000);
      }
      showToast(errorMessage, 'error');
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
      let errorMessage = 'Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.';
      if (error.message.includes('Không tìm thấy deadline')) {
        errorMessage = 'Không tìm thấy deadline. Vui lòng làm mới danh sách.';
      } else if (error.message.includes('Bạn không có quyền')) {
        errorMessage = error.message;
      } else if (error.message.includes('Phiên đăng nhập')) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        setTimeout(() => (window.location.href = '/login'), 5000);
      }
      showToast(errorMessage, 'error');
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
      let errorMessage = 'Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.';
      if (error.message.includes('Kiểm tra dữ liệu hoặc xung đột')) {
        errorMessage = 'Không thể khôi phục deadline. Kiểm tra dữ liệu hoặc xung đột với deadline khác.';
      } else if (error.message.includes('Không tìm thấy deadline')) {
        errorMessage = 'Không tìm thấy deadline. Vui lòng làm mới danh sách.';
      } else if (error.message.includes('Bạn không có quyền')) {
        errorMessage = error.message;
      } else if (error.message.includes('Phiên đăng nhập')) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        setTimeout(() => (window.location.href = '/login'), 5000);
      }
      showToast(errorMessage, 'error');
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
      <div className="min-h-screen bg-gray-100 text-gray-800">
        <Toast {...toast} />
        <DeadlineModal modalData={modalData} closeModal={closeModal} handleSave={handleSaveDeadline} />
        <DeleteModal modalData={modalData} closeModal={closeModal} confirmDelete={handleDeleteDeadline} />

        <div className="p-4 max-w-7xl mx-auto">
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm deadline..."
                  className="pl-10 pr-4 py-2 border rounded-lg w-64"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2"><SearchIcon /></div>
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
                      <td className="px-6 py-3">{d.created_by}</td>
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
      </div>
    </>
  );
}