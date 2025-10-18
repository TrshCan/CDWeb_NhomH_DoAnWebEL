import React, { useState } from 'react';

const surveys = [
  {
    id: 1,
    title: 'Đánh giá chất lượng giảng dạy Học kỳ 1',
    category: 'Giáo dục',
    type: 'Survey',
    status: 'active',
    time: '01/10 - 30/10/2025',
  },
  {
    id: 2,
    title: 'Bài kiểm tra giữa kỳ môn Kinh tế Vĩ mô',
    category: 'Kinh tế',
    type: 'Quiz',
    status: 'closed',
    time: '15/09 - 16/09/2025',
  },
  {
    id: 3,
    title: 'Khảo sát nhu cầu học Lập trình AI',
    category: 'Công nghệ Thông tin',
    type: 'Survey',
    status: 'pending',
    time: '15/11 - 30/11/2025',
  },
  {
    id: 4,
    title: 'Đánh giá cơ sở vật chất thư viện',
    category: 'Giáo dục',
    type: 'Survey',
    status: 'paused',
    time: '01/10 - 30/10/2025',
  },
];

const statusConfig = {
  active: { label: 'Đang hoạt động', class: 'bg-green-100 text-green-800' },
  closed: { label: 'Đã đóng', class: 'bg-gray-100 text-gray-800' },
  pending: { label: 'Chưa bắt đầu', class: 'bg-blue-100 text-blue-800' },
  paused: { label: 'Tạm dừng', class: 'bg-amber-100 text-amber-800' },
};

const categories = ['', 'Khoa học', 'Kinh tế', 'Giáo dục', 'Công nghệ Thông tin'];
const types = ['', 'Survey', 'Quiz'];
const statuses = ['', 'pending', 'active', 'paused', 'closed'];

const SurveyFilter = () => {
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    status: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    category: '',
    type: '',
    status: '',
    time: '',
  });
  const itemsPerPage = 3;

  const filteredSurveys = surveys.filter((survey) => {
    return (
      (!filters.category || survey.category === filters.category) &&
      (!filters.type || survey.type === filters.type) &&
      (!filters.status || survey.status === filters.status)
    );
  });

  const totalPages = Math.ceil(filteredSurveys.length / itemsPerPage);
  const paginatedSurveys = filteredSurveys.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
    setCurrentPage(1); // Reset to first page on filter
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleView = (survey) => {
    setSelectedSurvey(survey);
    setShowViewModal(true);
  };

  const handleEdit = (survey) => {
    setSelectedSurvey(survey);
    setEditForm({
      title: survey.title,
      category: survey.category,
      type: survey.type,
      status: survey.status,
      time: survey.time,
    });
    setShowEditModal(true);
  };

  const handleDeleteConfirm = (survey) => {
    setSelectedSurvey(survey);
    setShowDeleteModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedSurvey(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedSurvey(null);
    setEditForm({
      title: '',
      category: '',
      type: '',
      status: '',
      time: '',
    });
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedSurvey(null);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (selectedSurvey) {
      const updatedSurveys = surveys.map((s) =>
        s.id === selectedSurvey.id
          ? { ...s, ...editForm }
          : s
      );
      // In a real app, you'd update via API
      // surveys = updatedSurveys; // But since it's const, you'd need to make it state
      console.log('Updated surveys:', updatedSurveys); // Placeholder
    }
    closeEditModal();
  };

  const handleDelete = () => {
    if (selectedSurvey) {
      const updatedSurveys = surveys.filter((s) => s.id !== selectedSurvey.id);
      // In a real app, you'd delete via API
      console.log('Deleted survey:', selectedSurvey);
      console.log('Updated surveys:', updatedSurveys); // Placeholder
    }
    closeDeleteModal();
  };

  const ViewIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="currentColor"
      viewBox="0 0 256 256"
    >
      <path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.48c.35.79,8.82,19.58,27.65,38.41C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.35c18.83-18.83,27.3-37.62,27.65-38.41A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231,128,133.33,133.33,0,0,1,207.93,158.75C185.67,180.81,158.78,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z" />
    </svg>
  );

  const EditIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="currentColor"
      viewBox="0 0 256 256"
    >
      <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z" />
    </svg>
  );

  const DeleteIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="currentColor"
      viewBox="0 0 256 256"
    >
      <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z" />
    </svg>
  );

  // Modal Components
  const Modal = ({ isOpen, onClose, title, children, footer, size = 'max-w-md' }) => (
    isOpen && (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-50 backdrop-blur-md overflow-y-auto" 
          aria-modal="true" 
          role="dialog"
          onClick={onClose}
        />
        {/* Modal */}
        <div className="fixed inset-0 z-50 flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <div 
            className={`transform transition-all relative ${size} mx-auto max-w-2xl rounded-lg text-left shadow-xl ring-1 ring-black ring-opacity-5 overflow-hidden bg-white max-h-full`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex-1 text-left">
                {title}
              </h3>
              <button 
                type="button" 
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
                onClick={onClose}
              >
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>
            {/* Modal body */}
            <div className="p-4 md:p-5 space-y-4">
              {children}
            </div>
            {/* Modal footer */}
            {footer && (
              <div className="flex items-center p-4 md:p-5 border-t border-gray-200 rounded-b">
                {footer}
              </div>
            )}
          </div>
        </div>
      </>
    )
  );

  const ViewModalBody = () => (
    <div className="space-y-2 text-sm">
      {selectedSurvey && (
        <>
          <p><span className="font-semibold text-gray-700">Tiêu đề:</span> <span className="text-gray-900">{selectedSurvey.title}</span></p>
          <p><span className="font-semibold text-gray-700">Danh mục:</span> <span className="text-gray-900">{selectedSurvey.category}</span></p>
          <p><span className="font-semibold text-gray-700">Loại:</span> <span className="text-gray-900">{selectedSurvey.type}</span></p>
          <p className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Trạng thái:</span> 
            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${statusConfig[selectedSurvey.status].class}`}>
              {statusConfig[selectedSurvey.status].label}
            </span>
          </p>
          <p><span className="font-semibold text-gray-700">Thời gian:</span> <span className="text-gray-900">{selectedSurvey.time}</span></p>
        </>
      )}
    </div>
  );

  const ViewModalFooter = () => (
    <button 
      onClick={closeViewModal} 
      type="button" 
      className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
    >
      Đóng
    </button>
  );

  const EditModalBody = () => (
    <form onSubmit={handleEditSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Tiêu đề khảo sát</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          placeholder="Nhập tiêu đề khảo sát"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Danh mục</label>
        <select
          value={editForm.category}
          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 bg-white"
          required
        >
          <option value="">Chọn danh mục</option>
          {categories.filter(c => c).map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Loại khảo sát</label>
        <select
          value={editForm.type}
          onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 bg-white"
          required
        >
          <option value="">Chọn loại</option>
          {types.filter(t => t).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Trạng thái</label>
        <select
          value={editForm.status}
          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 bg-white"
          required
        >
          <option value="">Chọn trạng thái</option>
          {statuses.filter(s => s).map((s) => (
            <option key={s} value={s}>{statusConfig[s]?.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Thời gian</label>
        <input
          type="text"
          value={editForm.time}
          onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
          placeholder="Ví dụ: 01/10 - 30/10/2025"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
          required
        />
      </div>
    </form>
  );

  const EditModalFooter = () => (
    <>
      <button 
        type="button" 
        onClick={closeEditModal}
        className="py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100"
      >
        Hủy
      </button>
      <button 
        type="button" 
        onClick={handleEditSubmit}
        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center ms-auto"
      >
        Lưu thay đổi
      </button>
    </>
  );

  const DeleteModalBody = () => (
    <div className="text-center space-y-4">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-lg font-medium text-gray-900">Xác nhận xóa</p>
      <p className="text-sm text-gray-500">Bạn có chắc chắn muốn xóa khảo sát <span className="font-semibold text-gray-900">"{selectedSurvey?.title}"</span> không? Hành động này không thể hoàn tác.</p>
    </div>
  );

  const DeleteModalFooter = () => (
    <>
      <button 
        onClick={closeDeleteModal} 
        type="button" 
        className="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100"
      >
        Hủy
      </button>
      <button 
        onClick={handleDelete} 
        type="button" 
        className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center ms-auto"
      >
        Xóa
      </button>
    </>
  );

  return (
    <div className="bg-gray-50 p-8 font-inter">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Danh sách Khảo sát</h1>

        {/* Filter Card */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-6">Bộ lọc</h2>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-500 mb-2 text-left">
                Danh mục
              </label>
              <select
                id="category"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full p-3 pl-10 border border-gray-200 rounded-lg bg-white text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat || 'Tất cả danh mục'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-500 mb-2 text-left">
                Loại khảo sát
              </label>
              <select
                id="type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full p-3 pl-10 border border-gray-200 rounded-lg bg-white text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t || 'Tất cả'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-500 mb-2 text-left">
                Trạng thái
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full p-3 pl-10 border border-gray-200 rounded-lg bg-white text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {statusConfig[s]?.label || 'Tất cả'}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className="px-6 py-3 text-white bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold shadow-sm transition-colors"
            >
              Lọc
            </button>
          </form>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Tiêu đề khảo sát
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Danh mục
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Loại
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Thời gian
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedSurveys.map((survey) => (
                <tr key={survey.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {survey.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {survey.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {survey.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusConfig[survey.status].class}`}
                    >
                      {statusConfig[survey.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {survey.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button onClick={() => handleView(survey)} className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded" title="Xem">
                        <ViewIcon />
                      </button>
                      <button onClick={() => handleEdit(survey)} className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded" title="Chỉnh sửa">
                        <EditIcon />
                      </button>
                      <button onClick={() => handleDeleteConfirm(survey)} className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded" title="Xóa">
                        <DeleteIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-6 py-4 rounded-lg shadow-md mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến {Math.min(currentPage * itemsPerPage, filteredSurveys.length)} của {filteredSurveys.length} kết quả
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === page
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        <Modal 
          isOpen={showViewModal} 
          onClose={closeViewModal} 
          title="Xem chi tiết khảo sát"
          size="max-w-md"
          footer={<ViewModalFooter />}
        >
          <ViewModalBody />
        </Modal>

        <Modal 
          isOpen={showEditModal} 
          onClose={closeEditModal} 
          title="Chỉnh sửa khảo sát"
          size="max-w-md"
          footer={<EditModalFooter />}
        >
          <EditModalBody />
        </Modal>

        <Modal 
          isOpen={showDeleteModal} 
          onClose={closeDeleteModal} 
          title="Xác nhận xóa"
          size="max-w-sm"
          footer={<DeleteModalFooter />}
        >
          <DeleteModalBody />
        </Modal>
      </div>
    </div>
  );
};

export default SurveyFilter;