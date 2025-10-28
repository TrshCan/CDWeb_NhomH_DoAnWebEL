import React, { useState, useEffect } from 'react';
import { graphqlRequest } from '../api/graphql';

// Mapping categories_id to category names (adjust based on your backend data)
const categoryMap = {
  1: 'Khoa học',
  2: 'Kinh tế',
  3: 'Giáo dục',
  4: 'Công nghệ Thông tin',
};
const categories = ['', 'Khoa học', 'Kinh tế', 'Giáo dục', 'Công nghệ Thông tin'];
const types = ['', 'Survey', 'Quiz'];
const statuses = ['', 'pending', 'active', 'paused', 'closed'];

const statusConfig = {
  active: { label: 'Đang hoạt động', class: 'bg-green-100 text-green-800' },
  closed: { label: 'Đã đóng', class: 'bg-gray-100 text-gray-800' },
  pending: { label: 'Chưa bắt đầu', class: 'bg-blue-100 text-blue-800' },
  paused: { label: 'Tạm dừng', class: 'bg-amber-100 text-amber-800' },
};

const SurveyFilter = () => {
  const [surveysList, setSurveysList] = useState([]);
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    title: '',
    category: '',
    type: '',
    status: '',
    time: '',
  });
  const [editForm, setEditForm] = useState({
    title: '',
    category: '',
    type: '',
    status: '',
    time: '',
  });
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 3;

  // Fetch surveys from GraphQL
  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const query = `
          query GetSurveys($perPage: Int, $category: Int, $type: String, $status: String) {
            surveys(per_page: $perPage) {
              id
              title
              category {
                name
              }
              type
              status
              start_at
              end_at
            }
          }
        `;
        const variables = {
          perPage: itemsPerPage,
          category: filters.category ? Object.keys(categoryMap).find((key) => categoryMap[key] === filters.category) : null,
          type: filters.type || null,
          status: filters.status || null,
        };

        const response = await graphqlRequest(query, variables);
        const surveys = response.surveys.map((survey) => ({
          id: survey.id,
          title: survey.title,
          category: survey.category.name,
          type: survey.type,
          status: survey.status,
          time: `${new Date(survey.start_at).toLocaleDateString('vi-VN')} - ${new Date(survey.end_at).toLocaleDateString('vi-VN')}`,
        }));
        setSurveysList(surveys);
        setTotalPages(Math.ceil(surveys.length / itemsPerPage)); // Adjust based on backend pagination
      } catch (error) {
        console.error('Error fetching surveys:', error);
      }
    };

    fetchSurveys();
  }, [filters, currentPage]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleView = async (survey) => {
    try {
      const query = `
        query GetSurveyById($id: Int!) {
          getSurveyById(id: $id) {
            id
            title
            category {
              name
            }
            type
            status
            start_at
            end_at
          }
        }
      `;
      const response = await graphqlRequest(query, { id: survey.id });
      const surveyData = response.getSurveyById;
      setSelectedSurvey({
        ...surveyData,
        category: surveyData.category.name,
        time: `${new Date(surveyData.start_at).toLocaleDateString('vi-VN')} - ${new Date(surveyData.end_at).toLocaleDateString('vi-VN')}`,
      });
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching survey:', error);
    }
  };

  const handleEdit = async (survey) => {
    try {
      const query = `
        query GetSurveyById($id: Int!) {
          getSurveyById(id: $id) {
            id
            title
            categories_id
            type
            status
            start_at
            end_at
          }
        }
      `;
      const response = await graphqlRequest(query, { id: survey.id });
      const surveyData = response.getSurveyById;
      setSelectedSurvey(surveyData);
      setEditForm({
        title: surveyData.title,
        category: categoryMap[surveyData.categories_id] || '',
        type: surveyData.type || '',
        status: surveyData.status || '',
        time: `${new Date(surveyData.start_at).toLocaleDateString('vi-VN')} - ${new Date(surveyData.end_at).toLocaleDateString('vi-VN')}`,
      });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching survey for edit:', error);
    }
  };

  const handleDeleteConfirm = (survey) => {
    setSelectedSurvey(survey);
    setShowDeleteModal(true);
  };

  const handleAddClick = () => {
    setAddForm({
      title: '',
      category: '',
      type: '',
      status: '',
      time: '',
    });
    setShowAddModal(true);
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

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddForm({
      title: '',
      category: '',
      type: '',
      status: '',
      time: '',
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (selectedSurvey) {
      try {
        const [start_at, end_at] = editForm.time.split(' - ').map((date) => new Date(date.split('/').reverse().join('-')).toISOString());
        const mutation = `
          mutation UpdateSurvey($id: Int!, $input: UpdateSurveyInput!) {
            updateSurvey(id: $id, input: $input) {
              id
              title
              category {
                name
              }
              type
              status
              start_at
              end_at
            }
          }
        `;
        const variables = {
          id: selectedSurvey.id,
          input: {
            title: editForm.title,
            categories_id: parseInt(Object.keys(categoryMap).find((key) => categoryMap[key] === editForm.category)),
            type: editForm.type,
            status: editForm.status,
            start_at,
            end_at,
          },
        };
        const response = await graphqlRequest(mutation, variables);
        const updatedSurvey = response.updateSurvey;
        setSurveysList((prev) =>
          prev.map((s) =>
            s.id === updatedSurvey.id
              ? {
                  ...updatedSurvey,
                  category: updatedSurvey.category.name,
                  time: `${new Date(updatedSurvey.start_at).toLocaleDateString('vi-VN')} - ${new Date(updatedSurvey.end_at).toLocaleDateString('vi-VN')}`,
                }
              : s
          )
        );
        closeEditModal();
      } catch (error) {
        console.error('Error updating survey:', error);
      }
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const [start_at, end_at] = addForm.time.split(' - ').map((date) => new Date(date.split('/').reverse().join('-')).toISOString());
      const mutation = `
        mutation CreateSurvey($input: SurveyInput!) {
          createSurvey(input: $input) {
            id
            title
            category {
              name
            }
            type
            status
            start_at
            end_at
          }
        }
      `;
      const variables = {
        input: {
          title: addForm.title,
          categories_id: parseInt(Object.keys(categoryMap).find((key) => categoryMap[key] === addForm.category)),
          type: addForm.type,
          status: addForm.status,
          start_at,
          end_at,
          created_by: 1, // Replace with actual user ID from auth context
        },
      };
      const response = await graphqlRequest(mutation, variables);
      const newSurvey = response.createSurvey;
      setSurveysList((prev) => [
        ...prev,
        {
          ...newSurvey,
          category: newSurvey.category.name,
          time: `${new Date(newSurvey.start_at).toLocaleDateString('vi-VN')} - ${new Date(newSurvey.end_at).toLocaleDateString('vi-VN')}`,
        },
      ]);
      closeAddModal();
    } catch (error) {
      console.error('Error creating survey:', error);
    }
  };

  const handleDelete = async () => {
    if (selectedSurvey) {
      try {
        const mutation = `
          mutation DeleteSurvey($id: Int!) {
            deleteSurvey(id: $id)
          }
        `;
        await graphqlRequest(mutation, { id: selectedSurvey.id });
        setSurveysList((prev) => prev.filter((s) => s.id !== selectedSurvey.id));
        closeDeleteModal();
      } catch (error) {
        console.error('Error deleting survey:', error);
      }
    }
  };

  // Modal Component (Restored from original code)
  const Modal = ({ isOpen, onClose, title, children, footer, size = 'max-w-lg' }) => (
    isOpen && (
      <div className="fixed inset-0 z-50 flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div 
          className={`transform transition-all relative ${size} mx-auto max-w-2xl rounded-lg text-left shadow-2xl ring-1 ring-black ring-opacity-5 overflow-hidden bg-white max-h-[90vh] overflow-y-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b rounded-t border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-900 flex-1 text-left">
              {title}
            </h3>
            <button 
              type="button" 
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
              onClick={onClose}
            >
              <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>
          <div className="p-6 space-y-6">
            {children}
          </div>
          {footer && (
            <div className="flex items-center justify-end p-6 border-t border-gray-200 rounded-b gap-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    )
  );

  // Icon Components (Copy from your original code)
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

  // Modal Bodies and Footers (Restored from original code)
  const ViewModalBody = () => (
    <div className="space-y-4 text-base">
      {selectedSurvey && (
        <>
          <p><span className="font-semibold text-gray-700">Tiêu đề:</span> <span className="text-gray-900">{selectedSurvey.title}</span></p>
          <p><span className="font-semibold text-gray-700">Danh mục:</span> <span className="text-gray-900">{selectedSurvey.category}</span></p>
          <p><span className="font-semibold text-gray-700">Loại:</span> <span className="text-gray-900">{selectedSurvey.type}</span></p>
          <p className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Trạng thái:</span> 
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusConfig[selectedSurvey.status].class}`}>
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
      className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-6 py-3 text-center"
    >
      Đóng
    </button>
  );

  const EditModalBody = () => (
    <form onSubmit={handleEditSubmit} className="grid grid-cols-1 gap-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Tiêu đề khảo sát</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          placeholder="Nhập tiêu đề khảo sát"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-300 bg-white text-base"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Danh mục</label>
          <select
            value={editForm.category}
            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-300 bg-white text-base"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-300 bg-white text-base"
            required
          >
            <option value="">Chọn loại</option>
            {types.filter(t => t).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Trạng thái</label>
          <select
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-300 bg-white text-base"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-300 bg-white text-base"
            required
          />
        </div>
      </div>
    </form>
  );

  const EditModalFooter = () => (
    <>
      <button 
        type="button" 
        onClick={closeEditModal}
        className="py-3 px-6 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all duration-300"
      >
        Hủy
      </button>
      <button 
        type="button" 
        onClick={handleEditSubmit}
        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-6 py-3 text-center"
      >
        Lưu thay đổi
      </button>
    </>
  );

  const AddModalBody = () => (
    <form onSubmit={handleAddSubmit} className="grid grid-cols-1 gap-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Tiêu đề khảo sát</label>
        <input
          type="text"
          value={addForm.title}
          onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
          placeholder="Nhập tiêu đề khảo sát"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-300 bg-white text-base"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Danh mục</label>
          <select
            value={addForm.category}
            onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-300 bg-white text-base"
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
            value={addForm.type}
            onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-300 bg-white text-base"
            required
          >
            <option value="">Chọn loại</option>
            {types.filter(t => t).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Trạng thái</label>
          <select
            value={addForm.status}
            onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-300 bg-white text-base"
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
            value={addForm.time}
            onChange={(e) => setAddForm({ ...addForm, time: e.target.value })}
            placeholder="Ví dụ: 01/10 - 30/10/2025"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-300 bg-white text-base"
            required
          />
        </div>
      </div>
    </form>
  );

  const AddModalFooter = () => (
    <>
      <button 
        type="button" 
        onClick={closeAddModal}
        className="py-3 px-6 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all duration-300"
      >
        Hủy
      </button>
      <button 
        type="button" 
        onClick={handleAddSubmit}
        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-6 py-3 text-center"
      >
        Thêm khảo sát
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
      <p className="text-base text-gray-500">Bạn có chắc chắn muốn xóa khảo sát <span className="font-semibold text-gray-900">"{selectedSurvey?.title}"</span> không? Hành động này không thể hoàn tác.</p>
    </div>
  );

  const DeleteModalFooter = () => (
    <>
      <button 
        onClick={closeDeleteModal} 
        type="button" 
        className="py-3 px-6 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all duration-300"
      >
        Hủy
      </button>
      <button 
        onClick={handleDelete} 
        type="button" 
        className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-6 py-3 text-center"
      >
        Xóa
      </button>
    </>
  );

  const filteredSurveys = surveysList; // Filtering is handled in the GraphQL query
  const paginatedSurveys = filteredSurveys.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-gray-50 p-8 font-inter">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Danh sách Khảo sát</h1>
          <button
            onClick={handleAddClick}
            className="px-6 py-3 text-white bg-green-500 hover:bg-green-600 rounded-lg font-semibold shadow-sm transition-colors duration-300"
          >
            Thêm khảo sát
          </button>
        </div>

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
                className="w-full p-3 pl-10 border border-gray-200 rounded-lg bg-white text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300"
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
                className="w-full p-3 pl-10 border border-gray-200 rounded-lg bg-white text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300"
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
                className="w-full p-3 pl-10 border border-gray-200 rounded-lg bg-white text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300"
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
              className="px-6 py-3 text-white bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold shadow-sm transition-colors duration-300"
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
                <tr key={survey.id} className="hover:bg-gray-50 transition-colors duration-200">
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
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
                  } transition-all duration-300`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
          size="max-w-lg"
          footer={<ViewModalFooter />}
        >
          <ViewModalBody />
        </Modal>

        <Modal 
          isOpen={showEditModal} 
          onClose={closeEditModal} 
          title="Chỉnh sửa khảo sát"
          size="max-w-lg"
          footer={<EditModalFooter />}
        >
          <EditModalBody />
        </Modal>

        <Modal 
          isOpen={showAddModal} 
          onClose={closeAddModal} 
          title="Thêm khảo sát mới"
          size="max-w-lg"
          footer={<AddModalFooter />}
        >
          <AddModalBody />
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