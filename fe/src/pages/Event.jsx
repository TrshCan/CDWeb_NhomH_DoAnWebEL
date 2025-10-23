import React, { useState, useEffect } from 'react';
import { graphqlRequest } from '../api/graphql';

// --- SVG Icons ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const SearchIcon = () => <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 ７h16" /></svg>;
const RestoreIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l16 16" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

// --- GraphQL Queries ---
const GET_PAGINATED_EVENTS = `
  query GetPaginatedEvents($perPage: Int, $page: Int, $includeDeleted: Boolean) {
    getPaginatedEvents(perPage: $perPage, page: $page, includeDeleted: $includeDeleted) {
      data {
        id
        title
        event_date
        location
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

const SEARCH_EVENTS = `
  query SearchEvents($filter: EventFilterInput, $perPage: Int, $page: Int) {
    searchEvents(filter: $filter, perPage: $perPage, page: $page) {
      data {
        id
        title
        event_date
        location
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

const CREATE_EVENT = `
  mutation CreateEvent($input: EventInput!) {
    createEvent(input: $input) {
      id
      title
      event_date
      location
      created_by
      created_at
      deleted_at
    }
  }
`;

const UPDATE_EVENT = `
  mutation UpdateEvent($id: ID!, $input: EventInput!) {
    updateEvent(id: $id, input: $input) {
      id
      title
      event_date
      location
      created_by
      created_at
      deleted_at
    }
  }
`;

const DELETE_EVENT = `
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id)
  }
`;

const RESTORE_EVENT = `
  mutation RestoreEvent($id: ID!) {
    restoreEvent(id: $id)
  }
`;

// --- Utility ---
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// --- Toast Component ---
const Toast = ({ message, type, visible }) => {
  if (!visible) return null;
  const baseClasses = 'toast fixed top-5 right-5 z-[100] rounded-lg p-4 text-white shadow-lg transition-transform transform';
  const typeClasses = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
};

// --- Event Modal ---
const EventModal = ({ modalData, closeModal, handleSave }) => {
  const [formData, setFormData] = useState({ title: '', event_date: '', location: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (modalData.type === 'edit' && modalData.event) {
      const eventDate = modalData.event.event_date.split('T')[0]; // Convert to Y-m-d
      setFormData({
        title: modalData.event.title,
        event_date: eventDate,
        location: modalData.event.location || ''
      });
    } else {
      setFormData({ title: '', event_date: '', location: '' });
    }
    setErrors({});
  }, [modalData]);

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Tiêu đề sự kiện không được để trống.";
    if (!formData.event_date) newErrors.event_date = "Ngày diễn ra không hợp lệ.";
    if (formData.location.length > 255) newErrors.location = "Địa điểm không được vượt quá 255 ký tự.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const formattedData = {
        ...formData,
        event_date: formData.event_date.split('T')[0] // Strip time if present
      };
      handleSave(formattedData);
    }
  };

  if (modalData.type !== 'add' && modalData.type !== 'edit') return null;
  const isEditing = modalData.type === 'edit';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 backdrop-blur-sm p-4" onClick={closeModal}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-xl font-semibold text-gray-800">{isEditing ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện mới'}</h3>
          <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><CloseIcon /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Tiêu đề sự kiện <span className="text-red-500">*</span></label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={`bg-gray-50 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full p-2.5`} />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Ngày diễn ra <span className="text-red-500">*</span></label>
            <input type="date" value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} className={`bg-gray-50 border ${errors.event_date ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full p-2.5`} />
            {errors.event_date && <p className="text-red-500 text-xs mt-1">{errors.event_date}</p>}
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Địa điểm</label>
            <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className={`bg-gray-50 border ${errors.location ? 'border-red-500' : 'border-gray-300'} rounded-lg w-full p-2.5`} />
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
          </div>
          <div className="flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={closeModal} className="text-gray-700 bg-white border px-4 py-2 rounded-lg">Hủy</button>
            <button type="submit" className="text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg">{isEditing ? 'Cập nhật' : 'Tạo sự kiện'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Delete Modal ---
const DeleteModal = ({ modalData, closeModal, confirmDelete }) => {
  if (modalData.type !== 'delete') return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 text-center animate-scale-in">
        <svg className="mx-auto mb-4 text-red-500 w-12 h-12" fill="none" viewBox="0 0 20 20">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Bạn có chắc chắn muốn xóa?</h3>
        <p className="text-sm text-gray-500 mb-6">Bạn có thể khôi phục sự kiện này sau.</p>
        <div className="flex justify-center gap-4">
          <button onClick={closeModal} className="text-gray-700 bg-white border px-5 py-2 rounded-lg">Hủy</button>
          <button onClick={confirmDelete} className="text-white bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg">Vâng, xóa</button>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
export default function EventManager() {
  const [events, setEvents] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalData, setModalData] = useState({ type: null, event: null });
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });
  const ITEMS_PER_PAGE = 10;

  const showToast = (msg, type = 'success') => setToast({ message: msg, type, visible: true });

  const handleShowDeletedChange = (e) => {
    setShowDeleted(e.target.checked);
    setCurrentPage(1); // Reset to first page when toggling showDeleted
  };

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await graphqlRequest(
          searchQuery ? SEARCH_EVENTS : GET_PAGINATED_EVENTS,
          searchQuery
            ? { filter: { title: searchQuery, location: searchQuery, include_deleted: showDeleted }, perPage: ITEMS_PER_PAGE, page: currentPage }
            : { perPage: ITEMS_PER_PAGE, page: currentPage, includeDeleted: showDeleted }
        );
        const paginated = response.data.getPaginatedEvents || response.data.searchEvents;
        if (paginated) {
          setEvents(paginated.data);
          setCurrentPage(paginated.current_page);
          setTotalPages(paginated.last_page);
        } else {
          showToast('Không tìm thấy sự kiện', 'error');
        }
      } catch (error) {
        showToast(`Lỗi khi tải danh sách sự kiện: ${error.message}`, 'error');
      }
    };
    fetchEvents();
  }, [searchQuery, showDeleted, currentPage]);

  useEffect(() => {
    if (toast.visible) setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }, [toast]);

  const handleSaveEvent = async (formData) => {
    try {
      if (modalData.type === 'edit') {
        const res = await graphqlRequest(UPDATE_EVENT, { id: modalData.event.id, input: formData });
        if (res.data.updateEvent) {
          setEvents(events.map((e) => (e.id === modalData.event.id ? res.data.updateEvent : e)));
          showToast('Cập nhật sự kiện thành công');
        } else {
          throw new Error('Cập nhật thất bại: Không nhận được dữ liệu từ server');
        }
      } else {
        const res = await graphqlRequest(CREATE_EVENT, { input: formData });
        if (res.data.createEvent) {
          setEvents([res.data.createEvent, ...events]);
          showToast('Tạo sự kiện thành công');
        } else {
          throw new Error('Tạo thất bại: Không nhận được dữ liệu từ server');
        }
      }
      closeModal();
    } catch (error) {
      showToast(`Lỗi khi lưu sự kiện: ${error.message}`, 'error');
    }
  };

  const handleDeleteEvent = async () => {
    try {
      const res = await graphqlRequest(DELETE_EVENT, { id: modalData.event.id });
      if (res.data.deleteEvent) {
        setEvents(events.map((e) => (e.id === modalData.event.id ? { ...e, deleted_at: new Date().toISOString() } : e)));
        showToast('Xóa sự kiện thành công');
      } else {
        throw new Error('Xóa thất bại: Không nhận được dữ liệu từ server');
      }
      closeModal();
    } catch (error) {
      showToast(`Lỗi khi xóa sự kiện: ${error.message}`, 'error');
    }
  };

  const handleRestoreEvent = async (id) => {
    try {
      const res = await graphqlRequest(RESTORE_EVENT, { id });
      if (res.data.restoreEvent) {
        setEvents(events.filter((e) => e.id !== id)); // Remove from list since only deleted events are shown
        showToast('Khôi phục sự kiện thành công');
      } else {
        throw new Error('Khôi phục thất bại: Không nhận được dữ liệu từ server');
      }
    } catch (error) {
      const errorMessage = error.message.includes('trùng ngày hoặc tiêu đề')
        ? 'Không thể khôi phục: Sự kiện trùng tiêu đề hoặc ngày với sự kiện hiện có.'
        : `Lỗi khi khôi phục sự kiện: ${error.message}`;
      showToast(errorMessage, 'error');
    }
  };

  const closeModal = () => setModalData({ type: null, event: null });

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <Toast {...toast} />
      <EventModal modalData={modalData} closeModal={closeModal} handleSave={handleSaveEvent} />
      <DeleteModal modalData={modalData} closeModal={closeModal} confirmDelete={handleDeleteEvent} />

      <div className="p-4 max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Quản lý Sự kiện</h1>
          <p className="text-gray-500 mt-2">Thêm, sửa, xóa và tìm kiếm sự kiện dễ dàng</p>
        </header>

        <div className="bg-white p-5 rounded-xl shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button onClick={() => setModalData({ type: 'add', event: null })} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
            <PlusIcon /> Thêm mới
          </button>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative">
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm sự kiện..." className="pl-10 pr-4 py-2 border rounded-lg w-64" />
              <div className="absolute left-3 top-1/2 -translate-y-1/2"><SearchIcon /></div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showDeleted} onChange={handleShowDeletedChange} /> Hiển thị sự kiện đã xóa
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Tiêu đề</th>
                <th className="px-6 py-3">Ngày giờ</th>
                <th className="px-6 py-3">Địa điểm</th>
                <th className="px-6 py-3">Người tạo</th>
                <th className="px-6 py-3">Ngày tạo</th>
                <th className="px-6 py-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {events.length > 0 ? (
                events.map((e) => (
                  <tr key={e.id} className={`hover:bg-gray-50 ${showDeleted ? 'bg-gray-100 opacity-75' : ''}`}>
                    <td className="px-6 py-3 font-medium">{e.title}</td>
                    <td className="px-6 py-3">{formatDate(e.event_date)}</td>
                    <td className="px-6 py-3">{e.location || 'N/A'}</td>
                    <td className="px-6 py-3">{e.created_by}</td>
                    <td className="px-6 py-3">{formatDate(e.created_at)}</td>
                    <td className="px-6 py-3 text-center">
                      {showDeleted ? (
                        <button onClick={() => handleRestoreEvent(e.id)} className="text-green-500 hover:text-green-700"><RestoreIcon /></button>
                      ) : (
                        <>
                          <button onClick={() => setModalData({ type: 'edit', event: e })} className="text-indigo-500 hover:text-indigo-700"><EditIcon /></button>
                          <button onClick={() => setModalData({ type: 'delete', event: e })} className="text-red-500 hover:text-red-700 ml-2"><DeleteIcon /></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">{showDeleted ? 'Không có sự kiện đã xóa' : 'Không có sự kiện nào'}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <span>Trang <b>{currentPage}</b> / <b>{totalPages}</b></span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">Trước</button>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Sau</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}