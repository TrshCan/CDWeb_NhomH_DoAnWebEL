import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { graphqlRequest } from '../api/graphql';

const statusConfig = {
  active: { label: 'Đang hoạt động', class: 'bg-green-100 text-green-800' },
  closed: { label: 'Đã đóng', class: 'bg-gray-100 text-gray-800' },
  paused: { label: 'Tạm dừng', class: 'bg-amber-100 text-amber-800' },
};

const categories = ['', 'Khoa học', 'Kinh tế', 'Giáo dục', 'Công nghệ Thông tin', 'Hỗ trợ sinh viên'];
const types = ['', 'survey', 'quiz'];
const statuses = ['', 'active', 'paused', 'closed'];
const objects = ['', 'public', 'students', 'lecturers'];

const categoryIdMap = {
  1: 'Khoa học',
  2: 'Kinh tế',
  3: 'Giáo dục',
  4: 'Công nghệ Thông tin',
  5: 'Hỗ trợ sinh viên',
};

const Modal = ({ isOpen, onClose, title, children, footer, size = 'max-w-lg' }) => (
  isOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={onClose}>
      <div
        className={`relative ${size} mx-auto max-w-2xl rounded-lg bg-white shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="flex justify-end p-6 border-t border-gray-200 gap-3">{footer}</div>}
      </div>
    </div>
  )
);

const ViewModalBody = ({ selectedSurvey, statusConfig, formatTimeRange }) => (
  <div className="space-y-6">
    {selectedSurvey && (
      <>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-xl font-semibold text-gray-900">{selectedSurvey.title}</h4>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                {selectedSurvey.category}
              </span>
              <span className="inline-flex items-center gap-2 rounded bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87V14.13a1 1 0 001.555.834l3.197-2.132a1 1 0 000-1.664z"/></svg>
                {selectedSurvey.type === 'survey' ? 'Survey' : 'Quiz'}
              </span>
              <span className={`inline-flex items-center gap-2 rounded px-3 py-1 text-xs font-semibold ${statusConfig[selectedSurvey.status]?.class}`}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                {statusConfig[selectedSurvey.status]?.label}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-500">Thời gian</div>
            <div className="mt-1 text-sm text-gray-900">{formatTimeRange(selectedSurvey.startAt, selectedSurvey.endAt)}</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-500">Điểm thưởng</div>
            <div className="mt-1 text-sm text-gray-900">{selectedSurvey.points}</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 md:col-span-2">
            <div className="text-xs font-medium text-gray-500">Đối tượng</div>
            <div className="mt-1 inline-flex items-center gap-2 rounded bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M9 20H4v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              {selectedSurvey.object === 'public' ? 'Công khai' : selectedSurvey.object === 'students' ? 'Sinh viên' : 'Giảng viên'}
            </div>
          </div>
        </div>
      </>
    )}
  </div>
);

const EditModalBody = ({ editForm, onSubmit, onChange, categories, types, statuses, objects, statusConfig }) => (
  <form id="editForm" onSubmit={onSubmit} className="space-y-6">
    <div>
      <label className="block text-left font-semibold mb-2">Tiêu đề</label>
      <input
        type="text"
        value={editForm.title}
        onChange={(e) => onChange.title(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
        required
        autoFocus
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-left font-semibold mb-2">Danh mục</label>
        <select
          value={editForm.category}
          onChange={(e) => onChange.category(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        >
          <option value="">Chọn danh mục</option>
          {categories.filter(c => c).map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-left font-semibold mb-2">Loại</label>
        <select
          value={editForm.type}
          onChange={(e) => onChange.type(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        >
          <option value="">Chọn loại</option>
          {types.filter(t => t).map(t => (
            <option key={t} value={t}>
              {t === 'survey' ? 'Survey' : 'Quiz'}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-left font-semibold mb-2">Bắt đầu</label>
        <input
          type="date"
          value={editForm.startAt}
          onChange={(e) => onChange.startAt(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-left font-semibold mb-2">Kết thúc</label>
        <input
          type="date"
          value={editForm.endAt}
          onChange={(e) => onChange.endAt(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-left font-semibold mb-2">Điểm thưởng</label>
        <input
          type="number"
          min="0"
          value={editForm.points}
          onChange={(e) => onChange.points(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-left font-semibold mb-2">Đối tượng</label>
        <select
          value={editForm.object}
          onChange={(e) => onChange.object(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        >
          <option value="">Chọn đối tượng</option>
          <option value="public">Công khai</option>
          <option value="students">Sinh viên</option>
          <option value="lecturers">Giảng viên</option>
        </select>
      </div>
    </div>

    <div>
      <label className="block text-left font-semibold mb-2">Trạng thái</label>
      <select
        value={editForm.status}
        onChange={(e) => onChange.status(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
        required
      >
        <option value="">Chọn trạng thái</option>
        {statuses.filter(s => s).map(s => (
          <option key={s} value={s}>{statusConfig[s]?.label}</option>
        ))}
      </select>
    </div>
  </form>
);

const AddModalBody = ({ addForm, onSubmit, onChange, categories, types, statuses, objects, statusConfig }) => (
  <form id="addForm" onSubmit={onSubmit} className="space-y-6">
    <div>
      <label className="block text-left font-semibold mb-2">Tiêu đề</label>
      <input
        type="text"
        value={addForm.title}
        onChange={(e) => onChange.title(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
        required
        autoFocus
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-left font-semibold mb-2">Danh mục</label>
        <select
          value={addForm.category}
          onChange={(e) => onChange.category(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        >
          <option value="">Chọn danh mục</option>
          {categories.filter(c => c).map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-left font-semibold mb-2">Loại</label>
        <select
          value={addForm.type}
          onChange={(e) => onChange.type(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        >
          <option value="">Chọn loại</option>
          {types.filter(t => t).map(t => (
            <option key={t} value={t}>
              {t === 'survey' ? 'Survey' : 'Quiz'}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-left font-semibold mb-2">Bắt đầu</label>
        <input
          type="date"
          value={addForm.startAt}
          onChange={(e) => onChange.startAt(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-left font-semibold mb-2">Kết thúc</label>
        <input
          type="date"
          value={addForm.endAt}
          onChange={(e) => onChange.endAt(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-left font-semibold mb-2">Điểm thưởng</label>
        <input
          type="number"
          min="0"
          value={addForm.points}
          onChange={(e) => onChange.points(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-left font-semibold mb-2">Đối tượng</label>
        <select
          value={addForm.object}
          onChange={(e) => onChange.object(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        >
          <option value="">Chọn đối tượng</option>
          <option value="public">Công khai</option>
          <option value="students">Sinh viên</option>
          <option value="lecturers">Giảng viên</option>
        </select>
      </div>
    </div>

    <div>
      <label className="block text-left font-semibold mb-2">Trạng thái</label>
      <select
        value={addForm.status}
        onChange={(e) => onChange.status(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
        required
      >
        <option value="">Chọn trạng thái</option>
        {statuses.filter(s => s).map(s => (
          <option key={s} value={s}>{statusConfig[s]?.label}</option>
        ))}
      </select>
    </div>
  </form>
);

const SurveyFilter = () => {
  const [surveysList, setSurveysList] = useState([]);
  const [filters, setFilters] = useState({ category: '', type: '', status: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [addForm, setAddForm] = useState({
    title: '',
    category: '',
    type: 'survey',
    status: 'active',
    startAt: '',
    endAt: '',
    points: 0,
    object: 'public',
  });

  const [editForm, setEditForm] = useState({
    title: '',
    category: '',
    type: '',
    status: '',
    startAt: '',
    endAt: '',
    points: 0,
    object: 'public',
  });

  const itemsPerPage = 3;

  // HANDLERS
  const handleEditTitleChange = useCallback((value) => setEditForm(prev => ({ ...prev, title: value })), []);
  const handleEditCategoryChange = useCallback((value) => setEditForm(prev => ({ ...prev, category: value })), []);
  const handleEditTypeChange = useCallback((value) => setEditForm(prev => ({ ...prev, type: value })), []);
  const handleEditStatusChange = useCallback((value) => setEditForm(prev => ({ ...prev, status: value })), []);
  const handleEditStartAtChange = useCallback((value) => setEditForm(prev => ({ ...prev, startAt: value })), []);
  const handleEditEndAtChange = useCallback((value) => setEditForm(prev => ({ ...prev, endAt: value })), []);
  const handleEditPointsChange = useCallback((value) => setEditForm(prev => ({ ...prev, points: parseInt(value) || 0 })), []);
  const handleEditObjectChange = useCallback((value) => setEditForm(prev => ({ ...prev, object: value })), []);

  const handleAddTitleChange = useCallback((value) => setAddForm(prev => ({ ...prev, title: value })), []);
  const handleAddCategoryChange = useCallback((value) => setAddForm(prev => ({ ...prev, category: value })), []);
  const handleAddTypeChange = useCallback((value) => setAddForm(prev => ({ ...prev, type: value })), []);
  const handleAddStatusChange = useCallback((value) => setAddForm(prev => ({ ...prev, status: value })), []);
  const handleAddStartAtChange = useCallback((value) => setAddForm(prev => ({ ...prev, startAt: value })), []);
  const handleAddEndAtChange = useCallback((value) => setAddForm(prev => ({ ...prev, endAt: value })), []);
  const handleAddPointsChange = useCallback((value) => setAddForm(prev => ({ ...prev, points: parseInt(value) || 0 })), []);
  const handleAddObjectChange = useCallback((value) => setAddForm(prev => ({ ...prev, object: value })), []);

  const pushToast = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const formatDateTime = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTimeRange = (start, end) => {
    if (!start || !end) return 'Chưa xác định';
    return `${formatDateTime(start)} - ${formatDateTime(end)}`;
  };

  const toDateTimeLocal = (dbString) => {
    if (!dbString) return '';
    return dbString.slice(0, 10);
  };

  const toDBDateTime = (dateString) => {
    if (!dateString) return null;
    return `${dateString} 00:00:00`;
  };

  // LOAD SURVEYS
  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    setLoading(true);
    try {
      const result = await graphqlRequest(`
        query {
          surveys(per_page: 100) {
            id
            title
            categories_id
            type
            status
            start_at
            end_at
            points
            object
            created_by
          }
        }
      `);

      if (result.errors) {
        console.error('GraphQL Errors:', result.errors);
        pushToast('Lỗi tải dữ liệu', 'error');
        return;
      }

      const surveysData = result.data?.surveys || [];
      const surveys = surveysData.map(s => ({
        id: Number(s.id),  // CHUYỂN ID → SỐ NGAY TỪ ĐẦU
        title: s.title,
        category: categoryIdMap[s.categories_id] || 'Không xác định',
        type: s.type,
        status: s.status,
        startAt: toDateTimeLocal(s.start_at),
        endAt: toDateTimeLocal(s.end_at),
        points: s.points,
        object: s.object,
      }));

      setSurveysList(surveys);
    } catch (error) {
      console.error('Lỗi tải:', error);
      pushToast('Không thể tải danh sách', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredSurveys = surveysList.filter(survey =>
    (!filters.category || survey.category === filters.category) &&
    (!filters.type || survey.type === filters.type) &&
    (!filters.status || survey.status === filters.status)
  );

  const totalPages = Math.ceil(filteredSurveys.length / itemsPerPage);
  const paginatedSurveys = filteredSurveys.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const handleView = (survey) => { setSelectedSurvey(survey); setShowViewModal(true); };

  const handleEdit = (survey) => {
    setSelectedSurvey({
      ...survey,
      id: Number(survey.id)  // ĐẢM BẢO ID LÀ SỐ
    });
    setEditForm({
      title: survey.title,
      category: survey.category,
      type: survey.type,
      status: survey.status,
      startAt: survey.startAt,
      endAt: survey.endAt,
      points: survey.points || 0,
      object: survey.object || 'public',
    });
    setShowEditModal(true);
  };

  const handleDeleteConfirm = (survey) => {
    setSelectedSurvey({
      ...survey,
      id: Number(survey.id)  // ĐẢM BẢO ID LÀ SỐ
    });
    setShowDeleteModal(true);
  };

  const handleAddClick = () => {
    setAddForm({
      title: '',
      category: '',
      type: 'survey',
      status: 'active',
      startAt: '',
      endAt: '',
      points: 0,
      object: 'public',
    });
    setShowAddModal(true);
  };

  const closeViewModal = () => { setShowViewModal(false); setSelectedSurvey(null); };
  const closeEditModal = () => { setShowEditModal(false); setSelectedSurvey(null); };
  const closeDeleteModal = () => { setShowDeleteModal(false); setSelectedSurvey(null); };
  const closeAddModal = () => setShowAddModal(false);

  // ADD SUBMIT
  const handleAddSubmit = async (e) => {
    e.preventDefault();

    if (!addForm.startAt || !addForm.endAt) {
      pushToast('Vui lòng chọn thời gian', 'error');
      return;
    }
    if (addForm.startAt >= addForm.endAt) {
      pushToast('Ngày kết thúc phải sau ngày bắt đầu', 'error');
      return;
    }

    try {
      setLoading(true);
      const categoryId = Object.entries(categoryIdMap).find(([_, name]) => name === addForm.category)?.[0];
      if (!categoryId) {
        pushToast('Vui lòng chọn danh mục hợp lệ', 'error');
        return;
      }

      const result = await graphqlRequest(`
        mutation CreateSurvey($input: SurveyInput!) {
          createSurvey(input: $input) {
            id title categories_id type status start_at end_at points object
          }
        }
      `, {
        input: {
          title: addForm.title,
          categories_id: parseInt(categoryId),
          type: addForm.type || 'survey',
          status: addForm.status || 'active',
          start_at: toDBDateTime(addForm.startAt),
          end_at: toDBDateTime(addForm.endAt),
          points: addForm.points || 0,
          object: addForm.object || 'public',
          created_by: 1
        }
      });

      if (result.errors?.length > 0) {
        const messages = result.errors.map(e => {
          let msg = e.message;
          if (e.extensions?.validation) {
            msg += '\n' + Object.entries(e.extensions.validation)
              .map(([field, errs]) => `${field}: ${errs.join(', ')}`)
              .join('\n');
          }
          return msg;
        }).join('\n');
        pushToast('Tạo khảo sát thất bại: ' + messages, 'error');
        return;
      }

      if (!result.data?.createSurvey) {
        pushToast('Tạo thất bại: Không nhận được dữ liệu', 'error');
        return;
      }

      const created = result.data.createSurvey;
      const newSurvey = {
        id: Number(created.id),  // CHUYỂN ID → SỐ
        title: created.title,
        category: addForm.category,
        type: created.type,
        status: created.status,
        startAt: toDateTimeLocal(created.start_at),
        endAt: toDateTimeLocal(created.end_at),
        points: created.points,
        object: created.object,
      };

      setSurveysList(prev => [...prev, newSurvey]);
      closeAddModal();
      pushToast('Tạo khảo sát thành công', 'success');
    } catch (error) {
      console.error('Lỗi hệ thống:', error);
      pushToast('Lỗi hệ thống: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // EDIT SUBMIT
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editForm.startAt || !editForm.endAt) {
      pushToast('Vui lòng chọn thời gian', 'error');
      return;
    }
    if (editForm.startAt >= editForm.endAt) {
      pushToast('Ngày kết thúc phải sau ngày bắt đầu', 'error');
      return;
    }

    try {
      setLoading(true);
      const categoryId = Object.entries(categoryIdMap).find(([_, name]) => name === editForm.category)?.[0];
      if (!categoryId) {
        pushToast('Danh mục không hợp lệ', 'error');
        return;
      }

      const result = await graphqlRequest(`
        mutation UpdateSurvey($id: Int!, $input: UpdateSurveyInput!) {
          updateSurvey(id: $id, input: $input) {
            id title categories_id type status start_at end_at points object
          }
        }
      `, {
        id: Number(selectedSurvey.id),  // CHUYỂN ID → SỐ
        input: {
          title: editForm.title,
          categories_id: parseInt(categoryId),
          type: editForm.type || 'survey',
          status: editForm.status || 'active',
          start_at: toDBDateTime(editForm.startAt),
          end_at: toDBDateTime(editForm.endAt),
          points: editForm.points || 0,
          object: editForm.object || 'public',
        }
      });

      if (result.errors?.length > 0) {
        pushToast('Cập nhật thất bại: ' + result.errors.map(e => e.message).join('; '), 'error');
        return;
      }

      if (!result.data?.updateSurvey) {
        pushToast('Cập nhật thất bại', 'error');
        return;
      }

      const updated = result.data.updateSurvey;
      const updatedSurvey = {
        id: Number(updated.id),  // CHUYỂN ID → SỐ
        title: updated.title,
        category: editForm.category,
        type: updated.type,
        status: updated.status,
        startAt: toDateTimeLocal(updated.start_at),
        endAt: toDateTimeLocal(updated.end_at),
        points: updated.points,
        object: updated.object,
      };

      setSurveysList(prev => prev.map(s => s.id === selectedSurvey.id ? updatedSurvey : s));
      closeEditModal();
      pushToast('Cập nhật thành công', 'success');
    } catch (error) {
      console.error('Lỗi:', error);
      pushToast('Lỗi hệ thống: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // DELETE – ĐÃ SỬA: id → Number
  const handleDelete = async () => {
    try {
      setLoading(true);
      const result = await graphqlRequest(`
        mutation DeleteSurvey($id: Int!) {
          deleteSurvey(id: $id)
        }
      `, { 
        id: Number(selectedSurvey.id)  // CHUYỂN CHUỖI → SỐ
      });

      if (result.errors?.length > 0) {
        pushToast('Xóa thất bại: ' + result.errors[0].message, 'error');
        return;
      }

      setSurveysList(prev => prev.filter(s => s.id !== selectedSurvey.id));
      closeDeleteModal();
      pushToast('Đã xóa khảo sát', 'success');
    } catch (error) {
      console.error('Lỗi xóa:', error);
      pushToast('Lỗi hệ thống', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ICONS
  const ViewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.48c.35.79,8.82,19.58,27.65,38.41C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.35c18.83-18.83,27.3-37.62,27.65-38.41A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231,128,133.33,133.33,0,0,1,207.93,158.75C185.67,180.81,158.78,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z" />
    </svg>
  );

  const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68L147.31,64l24-24L216,84.68Z" />
    </svg>
  );

  const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z" />
    </svg>
  );

  // FOOTERS
  const viewFooter = useMemo(() => (
    <button onClick={closeViewModal} className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600">Đóng</button>
  ), [closeViewModal]);

  const editFooter = useMemo(() => (
    <>
      <button onClick={closeEditModal} className="px-6 py-3 border rounded hover:bg-gray-50">Hủy</button>
      <button type="submit" form="editForm" className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600">Lưu</button>
    </>
  ), [closeEditModal]);

  const addFooter = useMemo(() => (
    <>
      <button onClick={closeAddModal} className="px-6 py-3 border rounded hover:bg-gray-50">Hủy</button>
      <button type="submit" form="addForm" className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600">Thêm</button>
    </>
  ), [closeAddModal]);

  const deleteFooter = useMemo(() => (
    <>
      <button onClick={closeDeleteModal} className="px-6 py-3 border rounded hover:bg-gray-50">Hủy</button>
      <button onClick={handleDelete} className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700">Xóa</button>
    </>
  ), [closeDeleteModal, handleDelete]);

  return (
    <div className="bg-gray-50 p-8">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[60] space-y-3">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg max-w-sm border ${
            t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-gray-50 border-gray-200 text-gray-800'
          }`}>
            <div className="mt-0.5">
              {t.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : t.type === 'error' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 6a9 9 0 110 12A9 9 0 0112 6z" /></svg>
              )}
            </div>
            <div className="flex-1 text-sm whitespace-pre-line">{t.message}</div>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="text-gray-400 hover:text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Danh sách Khảo sát</h1>
          <button onClick={handleAddClick} className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors">
            Thêm khảo sát
          </button>
        </div>

        {/* Bộ lọc */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-6">Bộ lọc</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Danh mục</label>
              <select name="category" value={filters.category} onChange={handleFilterChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {categories.map(cat => <option key={cat} value={cat}>{cat || 'Tất cả'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Loại</label>
              <select name="type" value={filters.type} onChange={handleFilterChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {types.map(t => <option key={t} value={t}>{t === 'survey' ? 'Survey' : t === 'quiz' ? 'Quiz' : 'Tất cả'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Trạng thái</label>
              <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {statuses.map(s => <option key={s} value={s}>{statusConfig[s]?.label || 'Tất cả'}</option>)}
              </select>
            </div>
            <button onClick={() => setCurrentPage(1)} className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors">
              Lọc
            </button>
          </div>
        </div>

        {/* Bảng */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Đang tải...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Tiêu đề</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Danh mục</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Loại</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Điểm</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Đối tượng</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Thời gian</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedSurveys.map(survey => (
                  <tr key={survey.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{survey.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{survey.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{survey.type === 'survey' ? 'Survey' : 'Quiz'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{survey.points}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{survey.object === 'public' ? 'Công khai' : survey.object === 'students' ? 'Sinh viên' : 'Giảng viên'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusConfig[survey.status]?.class}`}>
                        {statusConfig[survey.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatTimeRange(survey.startAt, survey.endAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button onClick={() => handleView(survey)} className="p-1 text-gray-500 hover:text-gray-900" title="Xem"><ViewIcon /></button>
                        <button onClick={() => handleEdit(survey)} className="p-1 text-gray-500 hover:text-gray-900" title="Sửa"><EditIcon /></button>
                        <button onClick={() => handleDeleteConfirm(survey)} className="p-1 text-gray-500 hover:text-red-600" title="Xóa"><DeleteIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredSurveys.length)} của {filteredSurveys.length}
            </div>
            <div className="flex space-x-2">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-2 border rounded disabled:opacity-50 hover:bg-gray-50">Trước</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i + 1} onClick={() => handlePageChange(i + 1)} className={`px-3 py-2 border rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'hover:bg-gray-50'}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-2 border rounded disabled:opacity-50 hover:bg-gray-50">Sau</button>
            </div>
          </div>
        )}

        {/* MODALS */}
        <Modal key="view-modal" isOpen={showViewModal} onClose={closeViewModal} title="Xem chi tiết" size="max-w-3xl" footer={viewFooter}>
          <ViewModalBody selectedSurvey={selectedSurvey} statusConfig={statusConfig} formatTimeRange={formatTimeRange} />
        </Modal>

        <Modal key="edit-modal" isOpen={showEditModal} onClose={closeEditModal} title="Chỉnh sửa" footer={editFooter}>
          <EditModalBody
            editForm={editForm}
            onSubmit={handleEditSubmit}
            onChange={{
              title: handleEditTitleChange,
              category: handleEditCategoryChange,
              type: handleEditTypeChange,
              status: handleEditStatusChange,
              startAt: handleEditStartAtChange,
              endAt: handleEditEndAtChange,
              points: handleEditPointsChange,
              object: handleEditObjectChange,
            }}
            categories={categories}
            types={types}
            statuses={statuses}
            objects={objects}
            statusConfig={statusConfig}
          />
        </Modal>

        <Modal key="add-modal" isOpen={showAddModal} onClose={closeAddModal} title="Thêm khảo sát" footer={addFooter}>
          <AddModalBody
            addForm={addForm}
            onSubmit={handleAddSubmit}
            onChange={{
              title: handleAddTitleChange,
              category: handleAddCategoryChange,
              type: handleAddTypeChange,
              status: handleAddStatusChange,
              startAt: handleAddStartAtChange,
              endAt: handleAddEndAtChange,
              points: handleAddPointsChange,
              object: handleAddObjectChange,
            }}
            categories={categories}
            types={types}
            statuses={statuses}
            objects={objects}
            statusConfig={statusConfig}
          />
        </Modal>

        <Modal key="delete-modal" isOpen={showDeleteModal} onClose={closeDeleteModal} title="Xác nhận xóa" size="max-w-sm" footer={deleteFooter}>
          <div className="text-center">
            <p className="text-lg font-medium">Bạn có chắc chắn muốn xóa?</p>
            <p className="text-sm text-gray-500 mt-2">"{selectedSurvey?.title}"</p>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default SurveyFilter;