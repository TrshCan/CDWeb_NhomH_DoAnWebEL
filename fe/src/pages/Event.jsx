import React, { useState, useMemo, useEffect } from 'react';

// --- SVG Icons as Components ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const SearchIcon = () => <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const RestoreIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l16 16" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;


// --- Mock Data ---
const generateMockData = () => {
    const mockEvents = [
        { id: 1, title: "Hội thảo AI trong tương lai", event_time: "09:30", location: "Trung tâm Hội nghị Quốc gia", created_by: "Admin A", created_at: "2025-10-10T10:00:00Z", deleted_at: null },
        { id: 2, title: "Buổi nói chuyện về Blockchain", event_time: "14:00", location: "Đại học Bách Khoa", created_by: "Admin B", created_at: "2025-10-11T11:30:00Z", deleted_at: null },
        { id: 3, title: "Ngày hội việc làm IT 2025", event_time: "08:00", location: "Sân vận động Mỹ Đình", created_by: "Admin A", created_at: "2025-09-15T09:00:00Z", deleted_at: "2025-10-01T12:00:00Z" },
        { id: 4, title: "Workshop Thiết kế UI/UX", event_time: "10:00", location: "Toong Coworking Space", created_by: "Admin C", created_at: "2025-10-12T14:00:00Z", deleted_at: null },
        { id: 5, title: "Cuộc thi Lập trình viên Toàn quốc", event_time: "13:30", location: "Online", created_by: "Admin B", created_at: "2025-10-15T16:00:00Z", deleted_at: null },
    ];
    for (let i = 6; i <= 25; i++) {
        const hour = String(Math.floor(Math.random() * 12) + 8).padStart(2, '0');
        const minute = String(Math.floor(Math.random() * 4) * 15).padStart(2, '0');
        mockEvents.push({ id: i, title: `Sự kiện Demo thứ ${i}`, event_time: `${hour}:${minute}`, location: `Địa điểm ${i}`, created_by: "Admin Demo", created_at: new Date().toISOString(), deleted_at: null });
    }
    return mockEvents;
};

const currentUser = "Admin Demo";
const ITEMS_PER_PAGE = 10;

// --- Utility Functions ---
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// --- Reusable Components ---

const Toast = ({ message, type, visible }) => {
    if (!visible) return null;
    const baseClasses = 'toast fixed top-5 right-5 z-[100] rounded-lg p-4 text-white shadow-lg transition-transform transform';
    const typeClasses = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    return (
        <div className={`${baseClasses} ${typeClasses}`}>
            <span>{message}</span>
        </div>
    );
};

const EventModal = ({ modalData, closeModal, handleSave }) => {
    const [formData, setFormData] = useState({ title: '', event_time: '', location: '' });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (modalData.type === 'edit' && modalData.event) {
            setFormData({
                title: modalData.event.title,
                event_time: modalData.event.event_time,
                location: modalData.event.location || ''
            });
        } else {
            setFormData({ title: '', event_time: '', location: '' });
        }
        setErrors({});
    }, [modalData]);

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = "Tiêu đề sự kiện không được để trống.";
        if (!formData.event_time) newErrors.event_time = "Giờ diễn ra không hợp lệ.";
        if (formData.location.length > 255) newErrors.location = "Địa điểm không được vượt quá 255 ký tự.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) handleSave(formData);
    };

    if (modalData.type !== 'add' && modalData.type !== 'edit') return null;

    const isEditing = modalData.type === 'edit';

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 backdrop-blur-sm p-4" onClick={closeModal}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">{isEditing ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện mới'}</h3>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-700">Tiêu đề sự kiện <span className="text-red-500">*</span></label>
                        <input type="text" id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={`bg-gray-50 border ${errors.title ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5`} />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                    </div>
                    <div>
                        <label htmlFor="event_time" className="block mb-2 text-sm font-medium text-gray-700">Giờ diễn ra <span className="text-red-500">*</span></label>
                        <input type="time" id="event_time" value={formData.event_time} onChange={(e) => setFormData({ ...formData, event_time: e.target.value })} className={`bg-gray-50 border ${errors.event_time ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5`} />
                        {errors.event_time && <p className="text-red-500 text-xs mt-1">{errors.event_time}</p>}
                    </div>
                    <div>
                        <label htmlFor="location" className="block mb-2 text-sm font-medium text-gray-700">Địa điểm</label>
                        <input type="text" id="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} maxLength="255" className={`bg-gray-50 border ${errors.location ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5`} />
                        {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                    </div>
                    <div className="flex items-center justify-end pt-4 border-t gap-3">
                        <button type="button" onClick={closeModal} className="text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors">Hủy</button>
                        <button type="submit" className="text-white bg-indigo-600 hover:bg-indigo-700 font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm">{isEditing ? 'Cập nhật' : 'Tạo sự kiện'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DeleteModal = ({ modalData, closeModal, confirmDelete }) => {
    if (modalData.type !== 'delete') return null;
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 text-center animate-scale-in">
                <svg className="mx-auto mb-4 text-red-500 w-12 h-12" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <h3 className="mb-2 text-lg font-semibold text-gray-800">Bạn có chắc chắn muốn xóa?</h3>
                <p className="text-sm text-gray-500 mb-6">Bạn có thể khôi phục sự kiện này sau.</p>
                <div className="flex justify-center gap-4">
                     <button onClick={closeModal} type="button" className="text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 font-semibold py-2 px-5 rounded-lg transition-colors">
                        Hủy bỏ
                    </button>
                    <button onClick={confirmDelete} type="button" className="text-white bg-red-600 hover:bg-red-700 font-semibold py-2 px-5 rounded-lg transition-colors">
                        Vâng, chắc chắn
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---
export default function App() {
    const [events, setEvents] = useState([]);
    const [showDeleted, setShowDeleted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [modalData, setModalData] = useState({ type: null, event: null });
    const [toast, setToast] = useState({ message: '', type: 'success', visible: false });

    useEffect(() => {
        setEvents(generateMockData());
    }, []);

    useEffect(() => {
        if (toast.visible) {
            const timer = setTimeout(() => setToast(p => ({ ...p, visible: false })), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const isDeletedMatch = showDeleted ? event.deleted_at !== null : event.deleted_at === null;
            const searchLower = searchQuery.toLowerCase();
            const searchMatch = searchQuery === '' ||
                event.title.toLowerCase().includes(searchLower) ||
                (event.location && event.location.toLowerCase().includes(searchLower)) ||
                event.event_time.includes(searchQuery);
            return isDeletedMatch && searchMatch;
        });
    }, [events, showDeleted, searchQuery]);

    const paginatedEvents = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredEvents, currentPage]);
    
    const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);

    const showToast = (message, type = 'success') => {
        setToast({ message, type, visible: true });
    };
    
    const handleSaveEvent = (formData) => {
        if (modalData.type === 'edit') {
            setEvents(events.map(e => e.id === modalData.event.id ? { ...e, ...formData } : e));
            showToast("Cập nhật sự kiện thành công.");
        } else {
            const newEvent = {
                id: Date.now(), ...formData, created_by: currentUser,
                created_at: new Date().toISOString(), deleted_at: null,
            };
            setEvents([newEvent, ...events]);
            showToast("Tạo sự kiện mới thành công.");
        }
        closeModal();
    };

    const handleDeleteEvent = () => {
        setEvents(events.map(e => e.id === modalData.event.id ? { ...e, deleted_at: new Date().toISOString() } : e));
        showToast("Xóa sự kiện thành công.");
        closeModal();
    };
    
    const handleRestoreEvent = (eventId) => {
         setEvents(events.map(e => e.id === eventId ? { ...e, deleted_at: null } : e));
         showToast("Khôi phục sự kiện thành công.");
    };

    const closeModal = () => setModalData({ type: null, event: null });
    
    const handlePageChange = (direction) => {
        setCurrentPage(prev => Math.max(1, Math.min(totalPages, prev + direction)));
    };

    return (
        <div className="min-h-screen bg-gray-100 text-gray-800">
            <Toast message={toast.message} type={toast.type} visible={toast.visible} />
            <EventModal modalData={modalData} closeModal={closeModal} handleSave={handleSaveEvent} />
            <DeleteModal modalData={modalData} closeModal={closeModal} confirmDelete={handleDeleteEvent} />

            <div className="flex items-center justify-center p-4">
                <main className="w-full max-w-7xl">
                    <header className="mb-8 text-center">
                        <h1 className="text-4xl font-bold text-gray-900">Quản lý Sự kiện</h1>
                        <p className="text-gray-500 mt-2">Thêm, sửa, xóa và khôi phục các sự kiện một cách dễ dàng.</p>
                    </header>

                    <div className="bg-white p-5 rounded-xl shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <button onClick={() => setModalData({ type: 'add', event: null })} className="w-full sm:w-auto bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                            <PlusIcon />
                            Thêm mới
                        </button>
                        <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-4">
                            <div className="relative w-full sm:w-64">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sự kiện..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2"><SearchIcon /></div>
                            </div>
                            <label className="flex items-center space-x-2 cursor-pointer select-none">
                                <input type="checkbox" checked={showDeleted} onChange={(e) => { setShowDeleted(e.target.checked); setCurrentPage(1); }} className="form-checkbox h-5 w-5 text-indigo-600 rounded-md border-gray-300 focus:ring-indigo-500" />
                                <span className="text-sm font-medium text-gray-700">Hiển thị đã xóa</span>
                            </label>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-100">
                                <tr>
                                    <th scope="col" className="px-6 py-4 font-semibold">Tiêu đề sự kiện</th>
                                    <th scope="col" className="px-6 py-4 font-semibold">Giờ diễn ra</th>
                                    <th scope="col" className="px-6 py-4 font-semibold">Địa điểm</th>
                                    <th scope="col" className="px-6 py-4 font-semibold">Người tạo</th>
                                    <th scope="col" className="px-6 py-4 font-semibold">Ngày tạo</th>
                                    <th scope="col" className="px-6 py-4 font-semibold text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {paginatedEvents.length > 0 ? paginatedEvents.map(event => (
                                    <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{event.title}</td>
                                        <td className="px-6 py-4">{event.event_time}</td>
                                        <td className="px-6 py-4">{event.location || 'N/A'}</td>
                                        <td className="px-6 py-4">{event.created_by}</td>
                                        <td className="px-6 py-4">{formatDate(event.created_at)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-3">
                                                {event.deleted_at ? (
                                                    <button onClick={() => handleRestoreEvent(event.id)} className="text-green-500 hover:text-green-700" title="Khôi phục">
                                                        <RestoreIcon />
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button onClick={() => setModalData({ type: 'edit', event })} className="text-gray-400 hover:text-indigo-600" title="Sửa">
                                                            <EditIcon />
                                                        </button>
                                                        <button onClick={() => setModalData({ type: 'delete', event })} className="text-gray-400 hover:text-red-600" title="Xóa">
                                                            <DeleteIcon />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="text-center p-8 text-gray-500">
                                            <p>Không có sự kiện nào để hiển thị.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {totalPages > 1 && (
                         <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                            <span className="text-sm text-gray-700">
                                Trang <b>{currentPage}</b> trên <b>{totalPages}</b>
                            </span>
                            <div className="inline-flex rounded-md shadow-sm -space-x-px">
                                <button onClick={() => handlePageChange(-1)} disabled={currentPage === 1} className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Trước
                                </button>
                                <button onClick={() => handlePageChange(1)} disabled={currentPage === totalPages} className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Sau
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

