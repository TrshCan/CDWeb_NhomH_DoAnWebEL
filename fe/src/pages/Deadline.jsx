import React, { useState, useEffect, useMemo, useCallback } from 'react';

const Deadline = () => {
  // Application State
  const [state, setState] = useState({
    deadlines: [],
    showDeleted: false,
    editingDeadlineId: null,
    deletingDeadlineId: null,
    searchQuery: '',
    currentPage: 1,
    itemsPerPage: 3,
    modalOpen: false,
    modalMode: 'add',
    deleteModalOpen: false,
    toast: { visible: false, message: '', isSuccess: true },
    formData: { name: '', end_datetime: '', notes: '' },
  });

  // Mock Administrator
  const currentUser = "Admin Demo";

  // Mock Data Generation
  useEffect(() => {
    const generateMockData = () => {
      const mockDeadlines = [
        { id: 1, name: "Nộp báo cáo tháng 10", end_datetime: "2025-10-31T17:00", notes: "Nộp cho phòng kế toán", created_by: "Admin A", created_at: "2025-10-01T10:00:00Z", deleted_at: null },
        { id: 2, name: "Đăng ký tiệc cuối năm", end_datetime: "2025-11-15T23:59", notes: "", created_by: "Admin B", created_at: "2025-10-05T11:30:00Z", deleted_at: null },
        { id: 3, name: "Hạn chót thanh toán nhà cung cấp", end_datetime: "2025-10-25T16:00", notes: "NCC Viettel", created_by: "Admin A", created_at: "2025-10-10T09:00:00Z", deleted_at: "2025-10-11T12:00:00Z" },
        { id: 4, name: "Gửi kế hoạch dự án Z", end_datetime: "2025-11-05T10:00", notes: "Gửi cho khách hàng ABC", created_by: "Admin C", created_at: "2025-10-11T14:00:00Z", deleted_at: null },
        { id: 5, name: "Review code sprint 21", end_datetime: "2025-10-20T15:00", notes: "Team dev thực hiện", created_by: "Admin B", created_at: "2025-10-15T16:00:00Z", deleted_at: null },
        { id: 6, name: "Deadline đã bị trùng", end_datetime: "2025-11-15T23:59", notes: "Dữ liệu test xung đột", created_by: "Admin Test", created_at: "2025-10-15T16:00:00Z", deleted_at: "2025-10-16T16:00:00Z" },
      ];
      setState(prev => ({ ...prev, deadlines: mockDeadlines }));
    };
    generateMockData();
  }, []);

  // Utility Functions
  const formatDateTime = useCallback((dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }, []);

  const showToast = useCallback((message, isSuccess = true) => {
    setState(prev => ({ ...prev, toast: { message, isSuccess, visible: true } }));
    setTimeout(() => setState(prev => ({ ...prev, toast: { ...prev.toast, visible: false } })), 3000);
  }, []);

  // Computed Values
  const filteredDeadlines = useMemo(() => {
    return state.deadlines.filter(d => {
      const isDeletedMatch = state.showDeleted ? d.deleted_at !== null : d.deleted_at === null;
      const searchLower = state.searchQuery.toLowerCase();
      const searchMatch = state.searchQuery === '' || 
                          d.name.toLowerCase().includes(searchLower) ||
                          formatDateTime(d.end_datetime).includes(state.searchQuery);
      return isDeletedMatch && searchMatch;
    });
  }, [state.deadlines, state.showDeleted, state.searchQuery, formatDateTime]);

  const totalPages = useMemo(() => Math.ceil(filteredDeadlines.length / state.itemsPerPage), [filteredDeadlines.length, state.itemsPerPage]);

  const paginatedDeadlines = useMemo(() => {
    const page = Math.min(state.currentPage, totalPages || 1);
    const startIndex = (page - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    return filteredDeadlines.slice(startIndex, endIndex);
  }, [filteredDeadlines, state.currentPage, state.itemsPerPage, totalPages]);

  // Icons
  const EditIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const DeleteIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );

  const RestoreIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );

  // Event Handlers
  const handlePageChange = useCallback((direction) => {
    setState(prev => {
      const newPage = Math.max(1, Math.min(totalPages, prev.currentPage + direction));
      return { ...prev, currentPage: newPage };
    });
  }, [totalPages]);

  const openDeadlineModal = useCallback((mode = 'add', deadlineId = null) => {
    const deadline = state.deadlines.find(d => d.id === deadlineId);
    setState(prev => ({
      ...prev,
      editingDeadlineId: deadlineId,
      modalMode: mode,
      modalOpen: true,
      formData: deadline ? { name: deadline.name, end_datetime: deadline.end_datetime, notes: deadline.notes || '' } : { name: '', end_datetime: '', notes: '' }
    }));
  }, [state.deadlines]);

  const closeDeadlineModal = useCallback(() => {
    setState(prev => ({ ...prev, editingDeadlineId: null, modalMode: 'add', modalOpen: false, formData: { name: '', end_datetime: '', notes: '' } }));
  }, []);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setState(prev => ({ ...prev, formData: { ...prev.formData, [name]: value } }));
  }, []);

  const handleSubmitDeadline = useCallback((e) => {
    e.preventDefault();
    const { editingDeadlineId } = state;
    setState(prev => {
      if (prev.editingDeadlineId) {
        const updatedDeadlines = prev.deadlines.map(d =>
          d.id === prev.editingDeadlineId ? { ...d, ...prev.formData } : d
        );
        showToast("Cập nhật thông tin deadline thành công.");
        return { ...prev, deadlines: updatedDeadlines, editingDeadlineId: null, modalMode: 'add', modalOpen: false, formData: { name: '', end_datetime: '', notes: '' } };
      } else {
        const newDeadline = {
          id: Date.now(),
          ...prev.formData,
          created_by: currentUser,
          created_at: new Date().toISOString(),
          deleted_at: null,
        };
        showToast("Tạo deadline thành công.");
        return { ...prev, deadlines: [newDeadline, ...prev.deadlines], modalMode: 'add', modalOpen: false, formData: { name: '', end_datetime: '', notes: '' } };
      }
    });
  }, [showToast, currentUser, state.editingDeadlineId, state.formData, state.deadlines]);

  const openDeleteModal = useCallback((deadlineId) => {
    setState(prev => ({ ...prev, deletingDeadlineId: deadlineId, deleteModalOpen: true }));
  }, []);

  const closeDeleteModal = useCallback(() => {
    setState(prev => ({ ...prev, deletingDeadlineId: null, deleteModalOpen: false }));
  }, []);

  const handleConfirmDelete = useCallback(() => {
    setState(prev => {
      if (prev.deletingDeadlineId) {
        const updatedDeadlines = prev.deadlines.map(d =>
          d.id === prev.deletingDeadlineId ? { ...d, deleted_at: new Date().toISOString() } : d
        );
        showToast("Xóa deadline thành công.");
        return { ...prev, deadlines: updatedDeadlines, deletingDeadlineId: null, deleteModalOpen: false };
      }
      return prev;
    });
  }, [showToast]);

  const handleRestoreDeadline = useCallback((id) => {
    setState(prev => ({
      ...prev,
      deadlines: prev.deadlines.map(d => d.id === id ? { ...d, deleted_at: null } : d)
    }));
    showToast("Khôi phục deadline thành công.");
  }, [showToast]);

  const handleToggleDeleted = useCallback((e) => {
    setState(prev => ({ ...prev, showDeleted: e.target.checked, currentPage: 1 }));
  }, []);

  const handleSearchChange = useCallback((e) => {
    setState(prev => ({ ...prev, searchQuery: e.target.value, currentPage: 1 }));
  }, []);

  // Components
  const Toast = () => {
    if (!state.toast.visible) return null;
    return (
      <div className={`fixed top-5 right-5 z-50 rounded-lg p-4 text-white animate-[slide-in_0.5s_forwards,fade-out_0.5s_2.5s_forwards] ${state.toast.isSuccess ? 'bg-green-500' : 'bg-red-500'}`}>
        {state.toast.message}
      </div>
    );
  };

  const DeadlineModal = () => {
    if (!state.modalOpen) return null;
    const { name, end_datetime, notes } = state.formData;

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50" onClick={closeDeadlineModal}>
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold text-slate-800">
              {state.modalMode === 'edit' ? 'Chỉnh sửa deadline' : 'Thêm deadline mới'}
            </h3>
          </div>
          <form className="p-6 space-y-4" onSubmit={handleSubmitDeadline}>
            <div>
              <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900">
                Tên deadline <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={handleFormChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                required
              />
            </div>
            <div>
              <label htmlFor="end_datetime" className="block mb-2 text-sm font-medium text-gray-900">
                Ngày giờ kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="end_datetime"
                name="end_datetime"
                value={end_datetime}
                onChange={handleFormChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                required
              />
            </div>
            <div>
              <label htmlFor="notes" className="block mb-2 text-sm font-medium text-gray-900">
                Ghi chú / Mô tả
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={notes}
                onChange={handleFormChange}
                maxLength={255}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              />
            </div>
            <div className="flex items-center justify-end pt-4 border-t gap-3">
              <button
                type="button"
                onClick={closeDeadlineModal}
                className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              >
                {state.modalMode === 'edit' ? 'Cập nhật' : 'Tạo deadline'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const DeleteModal = () => {
    if (!state.deleteModalOpen) return null;

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50" onClick={closeDeleteModal}>
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6 text-center" onClick={e => e.stopPropagation()}>
          <svg className="mx-auto mb-4 text-gray-400 w-12 h-12" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <h3 className="mb-5 text-lg font-normal text-gray-500">Bạn có chắc chắn muốn xóa deadline này?</h3>
          <p className="text-sm text-gray-500 mb-6">Hành động này sẽ ẩn deadline khỏi danh sách, nhưng bạn có thể khôi phục lại sau.</p>
          <button
            onClick={handleConfirmDelete}
            type="button"
            className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center mr-2"
          >
            Vâng, chắc chắn
          </button>
          <button
            onClick={closeDeleteModal}
            type="button"
            className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10"
          >
            Hủy bỏ
          </button>
        </div>
      </div>
    );
  };

  const Pagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
        <span className="text-sm text-gray-700">
          Trang <b>{state.currentPage}</b> trên <b>{totalPages}</b>
        </span>
        <div className="inline-flex rounded-md shadow-sm -space-x-px">
          <button 
            onClick={() => handlePageChange(-1)} 
            disabled={state.currentPage === 1} 
            className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trước
          </button>
          <button 
            onClick={() => handlePageChange(1)} 
            disabled={state.currentPage === totalPages} 
            className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sau
          </button>
        </div>
      </div>
    );
  };

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
        body {
          font-family: 'Inter', sans-serif;
          background-color: #f3f4f6;
        }
      `}</style>
      <div className="container mx-auto p-4 md:p-8 antialiased text-slate-700 bg-gray-100 min-h-screen">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Quản lý Deadline</h1>
          <p className="text-slate-500 mt-1">Tạo, cập nhật và quản lý các deadline quan trọng.</p>
        </header>

        {/* Toast Notification */}
        <Toast />

        {/* Controls: Add, Search, Toggle Deleted */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => openDeadlineModal('add')}
            className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Thêm mới
          </button>
          <div className="flex flex-grow md:flex-grow-0 items-center gap-4">
            <div className="relative w-full max-w-xs">
              <input
                type="text"
                value={state.searchQuery}
                onChange={handleSearchChange}
                placeholder="Tìm theo tên, ngày giờ..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={state.showDeleted}
                onChange={handleToggleDeleted}
                className="form-checkbox h-5 w-5 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Hiển thị đã xóa</span>
            </label>
          </div>
        </div>

        {/* Deadlines Table */}
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Tên deadline</th>
                <th scope="col" className="px-6 py-3">Ngày giờ kết thúc</th>
                <th scope="col" className="px-6 py-3">Ghi chú</th>
                <th scope="col" className="px-6 py-3">Người tạo</th>
                <th scope="col" className="px-6 py-3">Ngày tạo</th>
                <th scope="col" className="px-6 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDeadlines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-slate-500">
                    Không có deadline nào để hiển thị.
                  </td>
                </tr>
              ) : (
                paginatedDeadlines.map(deadline => (
                  <tr key={deadline.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{deadline.name}</td>
                    <td className="px-6 py-4">{formatDateTime(deadline.end_datetime)}</td>
                    <td className="px-6 py-4 truncate max-w-xs">{deadline.notes || 'N/A'}</td>
                    <td className="px-6 py-4">{deadline.created_by}</td>
                    <td className="px-6 py-4">{formatDateTime(deadline.created_at)}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      {deadline.deleted_at ? (
                        <button
                          onClick={() => handleRestoreDeadline(deadline.id)}
                          className="p-1 text-green-600 hover:text-green-800 rounded transition-colors"
                          title="Khôi phục"
                        >
                          <RestoreIcon />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => openDeadlineModal('edit', deadline.id)}
                            className="p-1 text-blue-600 hover:text-blue-800 rounded transition-colors"
                            title="Sửa"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => openDeleteModal(deadline.id)}
                            className="p-1 text-red-600 hover:text-red-800 rounded transition-colors"
                            title="Xóa"
                          >
                            <DeleteIcon />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination />

        {/* Modals */}
        <DeadlineModal />
        <DeleteModal />
      </div>
    </>
  );
};

export default Deadline;