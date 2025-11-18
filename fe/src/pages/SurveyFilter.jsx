import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { graphqlRequest } from '../api/graphql';

const statusConfig = {
  pending: { label: 'Chưa bắt đầu', class: 'bg-blue-100 text-blue-800' },
  active: { label: 'Đang hoạt động', class: 'bg-green-100 text-green-800' },
  paused: { label: 'Tạm dừng', class: 'bg-amber-100 text-amber-800' },
  closed: { label: 'Đã đóng', class: 'bg-gray-100 text-gray-800' },
};

const types = ['', 'survey', 'quiz'];
const statuses = ['', 'pending', 'active', 'paused', 'closed'];
const objects = ['', 'public', 'students', 'lecturers'];

const Modal = ({ isOpen, onClose, title, children, footer, size = 'max-w-3xl' }) => (
  isOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div
        className={`relative ${size} w-full mx-auto rounded-xl bg-white shadow-2xl overflow-hidden max-h-[98vh] overflow-y-auto transform transition-all animate-in fade-in zoom-in-95`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200 sticky top-0 z-10">
          <h3 className="text-3xl font-bold text-gray-900">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-900 hover:bg-white rounded-full p-2 transition-all duration-200 hover:scale-110"
            aria-label="Đóng"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-8">{children}</div>
        {footer && (
          <div className="flex justify-end px-8 py-6 bg-gray-50 border-t-2 border-gray-200 gap-4 sticky bottom-0 z-10">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
);

const ViewModalBody = ({ selectedSurvey, statusConfig, formatTimeRange }) => (
  <div className="space-y-4">
    {selectedSurvey && (
      <>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="text-lg font-bold text-gray-900 mb-2">{selectedSurvey.title}</h4>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-800 border-2 border-gray-200">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
                {selectedSurvey.category}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800 border-2 border-blue-200">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87V14.13a1 1 0 001.555.834l3.197-2.132a1 1 0 000-1.664z"/></svg>
                {selectedSurvey.type === 'survey' ? 'Survey' : 'Quiz'}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border-2 ${statusConfig[selectedSurvey.status]?.class} ${statusConfig[selectedSurvey.status]?.class?.includes('green') ? 'border-green-300' : statusConfig[selectedSurvey.status]?.class?.includes('red') || statusConfig[selectedSurvey.status]?.class?.includes('amber') ? 'border-amber-300' : 'border-gray-300'}`}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                {statusConfig[selectedSurvey.status]?.label}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
          <div className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Mô tả</div>
          <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{selectedSurvey.description || 'Chưa có mô tả'}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm">
            <div className="text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Thời gian
            </div>
            <div className="mt-1.5 text-sm font-semibold text-gray-900">{formatTimeRange(selectedSurvey.startAt, selectedSurvey.endAt)}</div>
          </div>
          <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 shadow-sm">
            <div className="text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
              <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Điểm thưởng
            </div>
            <div className="mt-1.5 text-lg font-bold text-amber-700">{selectedSurvey.type === 'quiz' ? `${selectedSurvey.points} điểm` : '—'}</div>
          </div>
          <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-emerald-50 to-green-50 p-4 shadow-sm">
            <div className="text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
              <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m4-4H8"/></svg>
              Giới hạn thời gian
            </div>
            <div className="mt-1.5 text-sm font-semibold text-gray-900">{selectedSurvey.timeLimit ? `${selectedSurvey.timeLimit} phút` : 'Không giới hạn'}</div>
          </div>
          <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 shadow-sm">
            <div className="text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Đối tượng</div>
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-800 border-2 border-purple-200">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M9 20H4v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              {selectedSurvey.object === 'public' ? 'Công khai' : selectedSurvey.object === 'students' ? 'Sinh viên' : 'Giảng viên'}
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Danh mục</div>
              <div className="mt-1 text-xs font-medium text-gray-900">{selectedSurvey.category}</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Loại</div>
              <div className="mt-1 text-xs font-medium text-gray-900">{selectedSurvey.type === 'survey' ? 'Survey' : 'Quiz'}</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Người tạo</div>
              <div className="mt-1 text-xs font-medium text-gray-900">{selectedSurvey.creatorName}</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Trạng thái</div>
              <div className="mt-1 text-xs font-medium text-gray-900">{statusConfig[selectedSurvey.status]?.label}</div>
            </div>
          </div>
        </div>
      </>
    )}
  </div>
);

const EditModalBody = ({ editForm, onSubmit, onChange, categories, types, statuses, objects, statusConfig }) => (
  <form id="editForm" onSubmit={onSubmit} className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="block text-left text-sm font-semibold mb-1.5">Tiêu đề</label>
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => onChange.title(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
          autoFocus
        />
      </div>
      <div className="col-span-2">
        <label className="block text-left text-sm font-semibold mb-1.5">Mô tả</label>
        <textarea
          value={editForm.description}
          onChange={(e) => onChange.description(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          rows="3"
          placeholder="Nhập mô tả cho khảo sát..."
          required
        />
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Danh mục</label>
        <select
          value={editForm.category}
          onChange={(e) => onChange.category(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        >
          <option value="">Chọn danh mục</option>
          {categories.filter(c => c).map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Loại</label>
        <select
          value={editForm.type}
          onChange={(e) => onChange.type(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
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
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Bắt đầu</label>
        <input
          type="datetime-local"
          value={editForm.startAt}
          onChange={(e) => onChange.startAt(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Kết thúc</label>
        <input
          type="datetime-local"
          value={editForm.endAt}
          onChange={(e) => onChange.endAt(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Điểm thưởng</label>
        <input
          type="number"
          min="0"
          value={editForm.points}
          onChange={(e) => onChange.points(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Giới hạn thời gian (phút)</label>
        <input
          type="number"
          min="1"
          value={editForm.timeLimit}
          onChange={(e) => onChange.timeLimit(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          placeholder="Ví dụ: 30"
        />
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Đối tượng</label>
        <select
          value={editForm.object}
          onChange={(e) => onChange.object(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        >
          <option value="">Chọn đối tượng</option>
          <option value="public">Công khai</option>
          <option value="students">Sinh viên</option>
          <option value="lecturers">Giảng viên</option>
        </select>
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Trạng thái</label>
        <select
          value={editForm.status}
          onChange={(e) => onChange.status(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        >
          <option value="">Chọn trạng thái</option>
          {statuses.filter(s => s).map(s => (
            <option key={s} value={s}>{statusConfig[s]?.label}</option>
          ))}
        </select>
      </div>
    </div>
  </form>
);

const AddModalBody = ({ addForm, onSubmit, onChange, categories, types, statuses, objects, statusConfig }) => (
  <form id="addForm" onSubmit={onSubmit} className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="block text-left text-sm font-semibold mb-1.5">Tiêu đề</label>
        <input
          type="text"
          value={addForm.title}
          onChange={(e) => onChange.title(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
          autoFocus
        />
      </div>
      <div className="col-span-2">
        <label className="block text-left text-sm font-semibold mb-1.5">Mô tả</label>
        <textarea
          value={addForm.description}
          onChange={(e) => onChange.description(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          rows="3"
          placeholder="Nhập mô tả cho khảo sát..."
          required
        />
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Danh mục</label>
        <select
          value={addForm.category}
          onChange={(e) => onChange.category(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        >
          <option value="">Chọn danh mục</option>
          {categories.filter(c => c).map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Loại</label>
        <select
          value={addForm.type}
          onChange={(e) => onChange.type(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
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
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Bắt đầu</label>
        <input
          type="datetime-local"
          value={addForm.startAt}
          onChange={(e) => onChange.startAt(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Kết thúc</label>
        <input
          type="datetime-local"
          value={addForm.endAt}
          onChange={(e) => onChange.endAt(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Điểm thưởng</label>
        <input
          type="number"
          min="0"
          value={addForm.points}
          onChange={(e) => onChange.points(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Giới hạn thời gian (phút)</label>
        <input
          type="number"
          min="1"
          value={addForm.timeLimit}
          onChange={(e) => onChange.timeLimit(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          placeholder="Ví dụ: 30"
        />
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Đối tượng</label>
        <select
          value={addForm.object}
          onChange={(e) => onChange.object(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        >
          <option value="">Chọn đối tượng</option>
          <option value="public">Công khai</option>
          <option value="students">Sinh viên</option>
          <option value="lecturers">Giảng viên</option>
        </select>
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Trạng thái</label>
        <select
          value={addForm.status}
          onChange={(e) => onChange.status(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          required
        >
          <option value="">Chọn trạng thái</option>
          {statuses.filter(s => s).map(s => (
            <option key={s} value={s}>{statusConfig[s]?.label}</option>
          ))}
        </select>
      </div>
    </div>
  </form>
);

const SurveyFilter = () => {
  const [surveysList, setSurveysList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryIdMap, setCategoryIdMap] = useState({});
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [filters, setFilters] = useState({ category: '', type: '', status: '', keyword: '', creatorName: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [addForm, setAddForm] = useState({
    title: '',
    description: '',
    category: '',
    type: 'survey',
    status: 'pending',
    startAt: '',
    endAt: '',
    points: 0,
    object: 'public',
    timeLimit: ''
  });

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    type: '',
    status: '',
    startAt: '',
    endAt: '',
    points: 0,
    object: 'public',
    timeLimit: ''
  });

  const itemsPerPage = 10;

  // HANDLERS
  const handleEditTitleChange = useCallback((value) => setEditForm(prev => ({ ...prev, title: value })), []);
  const handleEditDescriptionChange = useCallback((value) => setEditForm(prev => ({ ...prev, description: value })), []);
  const handleEditCategoryChange = useCallback((value) => setEditForm(prev => ({ ...prev, category: value })), []);
  const handleEditTypeChange = useCallback((value) => setEditForm(prev => ({ ...prev, type: value })), []);
  const handleEditStatusChange = useCallback((value) => setEditForm(prev => ({ ...prev, status: value })), []);
  const handleEditStartAtChange = useCallback((value) => setEditForm(prev => ({ ...prev, startAt: value })), []);
  const handleEditEndAtChange = useCallback((value) => setEditForm(prev => ({ ...prev, endAt: value })), []);
  const handleEditPointsChange = useCallback((value) => setEditForm(prev => ({ ...prev, points: parseInt(value) || 0 })), []);
  const handleEditObjectChange = useCallback((value) => setEditForm(prev => ({ ...prev, object: value })), []);
  const handleEditTimeLimitChange = useCallback((value) => setEditForm(prev => ({ ...prev, timeLimit: value === '' ? '' : Math.max(1, parseInt(value) || 1) })), []);

  const handleAddTitleChange = useCallback((value) => setAddForm(prev => ({ ...prev, title: value })), []);
  const handleAddDescriptionChange = useCallback((value) => setAddForm(prev => ({ ...prev, description: value })), []);
  const handleAddCategoryChange = useCallback((value) => setAddForm(prev => ({ ...prev, category: value })), []);
  const handleAddTypeChange = useCallback((value) => setAddForm(prev => ({ ...prev, type: value })), []);
  const handleAddStatusChange = useCallback((value) => setAddForm(prev => ({ ...prev, status: value })), []);
  const handleAddStartAtChange = useCallback((value) => setAddForm(prev => ({ ...prev, startAt: value })), []);
  const handleAddEndAtChange = useCallback((value) => setAddForm(prev => ({ ...prev, endAt: value })), []);
  const handleAddPointsChange = useCallback((value) => setAddForm(prev => ({ ...prev, points: parseInt(value) || 0 })), []);
  const handleAddObjectChange = useCallback((value) => setAddForm(prev => ({ ...prev, object: value })), []);
  const handleAddTimeLimitChange = useCallback((value) => setAddForm(prev => ({ ...prev, timeLimit: value === '' ? '' : Math.max(1, parseInt(value) || 1) })), []);

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
    // Chuyển từ DB format "YYYY-MM-DD HH:mm:ss" hoặc "YYYY-MM-DD HH:mm" sang "YYYY-MM-DDTHH:mm" cho datetime-local
    // Nếu không có thời gian, mặc định là 00:00
    if (dbString.includes(' ')) {
      const [datePart, timePart] = dbString.split(' ');
      const time = timePart ? timePart.slice(0, 5) : '00:00'; // Lấy HH:mm
      return `${datePart}T${time}`;
    }
    // Nếu chỉ có date, thêm T00:00
    return `${dbString.slice(0, 10)}T00:00`;
  };

  const toDBDateTime = (dateTimeString) => {
    if (!dateTimeString) return null;
    // Chuyển từ datetime-local format "YYYY-MM-DDTHH:mm" sang DB format "YYYY-MM-DD HH:mm:ss"
    if (dateTimeString.includes('T')) {
      const [datePart, timePart] = dateTimeString.split('T');
      const time = timePart || '00:00';
      // Đảm bảo có giây
      const timeWithSeconds = time.split(':').length === 2 ? `${time}:00` : time;
      return `${datePart} ${timeWithSeconds}`;
    }
    // Fallback: nếu không có T, giả sử là date format cũ
    return `${dateTimeString} 00:00:00`;
  };

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const result = await graphqlRequest(`
        query {
          categories {
            id
            name
          }
        }
      `);

      if (result.errors) {
        console.error('GraphQL Errors:', result.errors);
        pushToast('Lỗi tải danh mục', 'error');
        return;
      }

      const categoriesData = result.data?.categories || [];
      
      // Lọc và sắp xếp categories theo tên
      const categoriesList = categoriesData
        .filter(cat => cat.name && cat.name.trim() !== '') // Lọc các category có tên hợp lệ
        .map(cat => cat.name)
        .sort(); // Sắp xếp theo thứ tự alphabet
      
      const idMap = {};
      categoriesData.forEach(cat => {
        if (cat.id && cat.name) {
          idMap[cat.id] = cat.name;
        }
      });

      // Thêm option "Tất cả" ở đầu danh sách
      setCategories(['', ...categoriesList]);
      setCategoryIdMap(idMap);
    } catch (error) {
      console.error('Lỗi tải danh mục:', error);
      pushToast('Không thể tải danh sách danh mục', 'error');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadSurveys = useCallback(async (filterParams = {}) => {
    setLoading(true);
    try {
      // Xây dựng filter object cho GraphQL
      const graphQLFilter = {};
      
      // Chuyển đổi category name thành category ID
      if (filterParams.category) {
        const categoryId = Object.entries(categoryIdMap).find(([_, name]) => name === filterParams.category)?.[0];
        if (categoryId) {
          graphQLFilter.categories_id = parseInt(categoryId);
        }
      }
      
      if (filterParams.type) {
        graphQLFilter.type = filterParams.type;
      }
      
      if (filterParams.status) {
        graphQLFilter.status = filterParams.status;
      }

      if (filterParams.keyword) {
        graphQLFilter.keyword = filterParams.keyword;
      }

      if (filterParams.creatorName) {
        graphQLFilter.creator_name = filterParams.creatorName;
      }

      // Xây dựng query với filter
      const filterString = Object.keys(graphQLFilter).length > 0 
        ? `filter: { ${Object.entries(graphQLFilter).map(([key, value]) => {
            if (typeof value === 'string') {
              return `${key}: "${value}"`;
            }
            return `${key}: ${value}`;
          }).join(', ')} }`
        : '';

      const result = await graphqlRequest(`
        query {
          surveys(per_page: 100${filterString ? ', ' + filterString : ''}) {
            id
            title
            description
            categories_id
            type
            status
            start_at
            end_at
            time_limit
            points
            object
            created_by
            creator_name
          }
        }
      `);

      if (result.errors) {
        console.error('GraphQL Errors:', result.errors);
        pushToast('Lỗi tải dữ liệu', 'error');
        return;
      }

      const surveysData = result.data?.surveys || [];
      // Sử dụng categoryIdMap từ dependency của useCallback (luôn là giá trị mới nhất)
      const surveys = surveysData.map(s => ({
        id: Number(s.id),  // CHUYỂN ID → SỐ NGAY TỪ ĐẦU
        title: s.title,
        description: s.description || '',
        category: categoryIdMap[s.categories_id] || 'Không xác định',
        categoryId: s.categories_id,
        type: s.type,
        status: s.status,
        startAt: toDateTimeLocal(s.start_at),
        endAt: toDateTimeLocal(s.end_at),
        points: s.points,
        object: s.object,
        timeLimit: s.time_limit ?? '',
        creatorName: s.creator_name || (s.created_by ? `Người dùng #${s.created_by}` : 'Không xác định')
      }));

      setSurveysList(surveys);
    } catch (error) {
      console.error('Lỗi tải:', error);
      pushToast('Không thể tải danh sách', 'error');
    } finally {
      setLoading(false);
    }
  }, [categoryIdMap, pushToast]);

  // LOAD DATA
  useEffect(() => {
    loadCategories();
  }, []);

  // Load surveys sau khi categories đã được load và khi filters thay đổi
  useEffect(() => {
    if (Object.keys(categoryIdMap).length > 0) {
      loadSurveys(filters);
    }
  }, [filters, categoryIdMap, loadSurveys]);

  // Không cần filter client-side nữa vì đã filter ở server
  const filteredSurveys = surveysList;
  const totalPages = Math.ceil(filteredSurveys.length / itemsPerPage);
  const paginatedSurveys = filteredSurveys.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleFilterChange = (e) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(newFilters);
    setCurrentPage(1);
    // loadSurveys sẽ được gọi tự động qua useEffect khi filters thay đổi
  };

  const handleResetFilters = () => {
    setFilters({ category: '', type: '', status: '', keyword: '', creatorName: '' });
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
      description: survey.description || '',
      category: survey.category,
      type: survey.type,
      status: survey.status,
      startAt: survey.startAt,
      endAt: survey.endAt,
      points: survey.points || 0,
      object: survey.object || 'public',
      timeLimit: survey.timeLimit ?? ''
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

  const handleDuplicate = (survey) => {
    setSelectedSurvey({
      ...survey,
      id: Number(survey.id)
    });
    setShowDuplicateModal(true);
  };

  const handleDuplicateConfirm = async () => {
    if (!selectedSurvey) return;

    try {
      setLoading(true);
      const result = await graphqlRequest(`
        mutation DuplicateSurvey($id: Int!) {
          duplicateSurvey(id: $id) {
            id
            title
            description
            categories_id
            type
            status
            start_at
            end_at
            time_limit
            points
            object
            created_by
            creator_name
          }
        }
      `, {
        id: Number(selectedSurvey.id)
      });

      if (result.errors?.length > 0) {
        const errorMessage = result.errors[0].message || 'Sao chép thất bại';
        console.error('Lỗi sao chép survey:', result.errors);
        pushToast(errorMessage, 'error');
        return;
      }

      if (!result.data?.duplicateSurvey) {
        pushToast('Sao chép thất bại: Không nhận được dữ liệu', 'error');
        return;
      }

      const duplicated = result.data.duplicateSurvey;
      closeDuplicateModal();
      pushToast('Sao chép khảo sát thành công', 'success');
      // Reload với filters hiện tại
      loadSurveys(filters);
    } catch (error) {
      console.error('Lỗi sao chép:', error);
      const errorMessage = error.message || 'Lỗi hệ thống khi sao chép khảo sát';
      pushToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setAddForm({
      title: '',
      description: '',
      category: '',
      type: 'survey',
      status: 'pending',
      startAt: '',
      endAt: '',
      points: 0,
      object: 'public',
      timeLimit: ''
    });
    setShowAddModal(true);
  };

  const closeViewModal = () => { setShowViewModal(false); setSelectedSurvey(null); };
  const closeEditModal = () => { setShowEditModal(false); setSelectedSurvey(null); };
  const closeDeleteModal = () => { setShowDeleteModal(false); setSelectedSurvey(null); };
  const closeDuplicateModal = () => { setShowDuplicateModal(false); setSelectedSurvey(null); };
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
            id title description categories_id type status start_at end_at points object time_limit created_by creator_name
          }
        }
      `, {
        input: {
          title: addForm.title,
          description: addForm.description || '',
          categories_id: parseInt(categoryId),
          type: addForm.type || 'survey',
          status: addForm.status || 'pending',
          start_at: toDBDateTime(addForm.startAt),
          end_at: toDBDateTime(addForm.endAt),
          points: addForm.points || 0,
          object: addForm.object || 'public',
          created_by: 1,
          time_limit: addForm.timeLimit === '' ? null : parseInt(addForm.timeLimit)
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
        description: created.description || '',
        category: addForm.category,
        type: created.type,
        status: created.status,
        startAt: toDateTimeLocal(created.start_at),
        endAt: toDateTimeLocal(created.end_at),
        points: created.points,
        object: created.object,
        timeLimit: created.time_limit ?? '',
        creatorName: created.creator_name || (created.created_by ? `Người dùng #${created.created_by}` : 'Không xác định')
      };

      closeAddModal();
      pushToast('Tạo khảo sát thành công', 'success');
      // Reload với filters hiện tại
      loadSurveys(filters);
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

      // Chỉ gửi các trường hợp lệ/đã thay đổi để tránh vi phạm validation phía BE
      const input = {
        title: editForm.title,
        description: editForm.description || '',
        categories_id: parseInt(categoryId),
        type: editForm.type || 'survey',
        status: editForm.status || 'pending',
        object: editForm.object || 'public',
      };

      // start_at/end_at: chỉ gửi nếu thay đổi
      if (editForm.startAt !== selectedSurvey.startAt) {
        input.start_at = toDBDateTime(editForm.startAt);
      }
      if (editForm.endAt !== selectedSurvey.endAt) {
        input.end_at = toDBDateTime(editForm.endAt);
      }

      // points: chỉ gửi nếu là quiz, tránh rule `prohibited` khi type = survey
      if ((editForm.type || 'survey') === 'quiz') {
        input.points = editForm.points || 0;
      }

      const result = await graphqlRequest(`
        mutation UpdateSurvey($id: Int!, $input: UpdateSurveyInput!) {
          updateSurvey(id: $id, input: $input) {
            id title description categories_id type status start_at end_at points object time_limit created_by creator_name
          }
        }
      `, {
        id: Number(selectedSurvey.id),
        input
      });

      if (result.errors?.length > 0) {
        // Hiển thị chi tiết validation nếu có
        const messages = result.errors.map(e => {
          let msg = e.message;
          if (e.extensions?.validation) {
            msg += '\n' + Object.entries(e.extensions.validation)
              .map(([field, errs]) => `${field}: ${errs.join(', ')}`)
              .join('\n');
          }
          return msg;
        }).join('\n');
        pushToast('Cập nhật thất bại: ' + messages, 'error');
        return;
      }

      if (!result.data?.updateSurvey) {
        pushToast('Cập nhật thất bại', 'error');
        return;
      }

      const updated = result.data.updateSurvey;
      const updatedSurvey = {
        id: Number(updated.id),
        title: updated.title,
        description: updated.description || '',
        category: editForm.category,
        type: updated.type,
        status: updated.status,
        startAt: toDateTimeLocal(updated.start_at),
        endAt: toDateTimeLocal(updated.end_at),
        points: updated.points,
        object: updated.object,
        timeLimit: updated.time_limit ?? '',
        creatorName: updated.creator_name || (updated.created_by ? `Người dùng #${updated.created_by}` : 'Không xác định')
      };

      closeEditModal();
      pushToast('Cập nhật thành công', 'success');
      // Reload với filters hiện tại
      loadSurveys(filters);
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
        const errorMessage = result.errors[0].message || 'Xóa thất bại';
        console.error('Lỗi xóa survey:', result.errors);
        pushToast(errorMessage, 'error');
        return;
      }

      // Kiểm tra kết quả
      if (result.data?.deleteSurvey === true || result.data?.deleteSurvey === false) {
        closeDeleteModal();
        pushToast('Đã xóa khảo sát thành công', 'success');
        // Reload với filters hiện tại
        loadSurveys(filters);
      } else {
        pushToast('Xóa thất bại: Không nhận được phản hồi từ server', 'error');
      }
    } catch (error) {
      console.error('Lỗi xóa:', error);
      const errorMessage = error.message || 'Lỗi hệ thống khi xóa khảo sát';
      pushToast(errorMessage, 'error');
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

  const DuplicateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M184,64H40A16,16,0,0,0,24,80V216a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V80A16,16,0,0,0,184,64Zm0,152H40V80H184V216ZM216,40V192a8,8,0,0,1-16,0V48H72a8,8,0,0,1,0-16H200A16,16,0,0,1,216,40Z" />
    </svg>
  );

  // FOOTERS
  const viewFooter = useMemo(() => (
    <button 
      onClick={closeViewModal} 
      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
    >
      Đóng
    </button>
  ), [closeViewModal]);

  const editFooter = useMemo(() => (
    <>
      <button 
        onClick={closeEditModal} 
        className="px-8 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-semibold text-gray-700 transition-all duration-200"
      >
        Hủy
      </button>
      <button 
        type="submit" 
        form="editForm" 
        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        Lưu thay đổi
      </button>
    </>
  ), [closeEditModal]);

  const addFooter = useMemo(() => (
    <>
      <button 
        onClick={closeAddModal} 
        className="px-8 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-semibold text-gray-700 transition-all duration-200"
      >
        Hủy
      </button>
      <button 
        type="submit" 
        form="addForm" 
        className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        Thêm khảo sát
      </button>
    </>
  ), [closeAddModal]);

  const deleteFooter = useMemo(() => (
    <>
      <button 
        onClick={closeDeleteModal} 
        className="px-8 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-semibold text-gray-700 transition-all duration-200"
      >
        Hủy
      </button>
      <button 
        onClick={handleDelete} 
        className="px-8 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        Xóa khảo sát
      </button>
    </>
  ), [closeDeleteModal, handleDelete]);

  const duplicateFooter = useMemo(() => (
    <>
      <button 
        onClick={closeDuplicateModal} 
        className="px-8 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-semibold text-gray-700 transition-all duration-200"
      >
        Hủy
      </button>
      <button 
        onClick={handleDuplicateConfirm} 
        disabled={loading}
        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {loading ? 'Đang sao chép...' : 'Sao chép khảo sát'}
      </button>
    </>
  ), [closeDuplicateModal, handleDuplicateConfirm, loading]);

  return (
    <div className="bg-gray-50 p-8">
      {/* Toasts */}
      <div className="fixed top-6 right-6 z-[60] space-y-4 flex flex-col items-end">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`flex items-start gap-4 rounded-xl px-6 py-4 shadow-2xl max-w-md border-2 backdrop-blur-sm transform transition-all duration-300 animate-in slide-in-from-right-5 fade-in ${
              t.type === 'success' 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 text-green-900 shadow-green-200/50' 
                : t.type === 'error' 
                ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-400 text-red-900 shadow-red-200/50'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400 text-blue-900 shadow-blue-200/50'
            }`}
          >
            <div className={`flex-shrink-0 mt-0.5 ${
              t.type === 'success' ? 'text-green-600' :
              t.type === 'error' ? 'text-red-600' :
              'text-blue-600'
            }`}>
              {t.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : t.type === 'error' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1 text-base font-medium whitespace-pre-line leading-relaxed">{t.message}</div>
            <button 
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} 
              className={`flex-shrink-0 mt-0.5 transition-colors ${
                t.type === 'success' 
                  ? 'text-green-600 hover:text-green-800 hover:bg-green-100' 
                  : t.type === 'error' 
                  ? 'text-red-600 hover:text-red-800 hover:bg-red-100'
                  : 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'
              } rounded-full p-1`}
              aria-label="Đóng"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Danh sách Khảo sát</h1>
          <button onClick={handleAddClick} className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors">
            Thêm khảo sát
          </button>
        </div>

        {/* Bộ lọc */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Bộ lọc</h2>
            {(filters.category || filters.type || filters.status || filters.keyword || filters.creatorName) && (
              <button 
                onClick={handleResetFilters} 
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors"
                title="Xóa bộ lọc"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Xóa bộ lọc
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Tìm kiếm</label>
              <input 
                type="text"
                name="keyword"
                value={filters.keyword}
                onChange={handleFilterChange}
                placeholder="Tiêu đề hoặc mô tả..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Người tạo (Giảng viên)</label>
              <input 
                type="text"
                name="creatorName"
                value={filters.creatorName}
                onChange={handleFilterChange}
                placeholder="Tên giảng viên..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Danh mục</label>
              <select 
                name="category" 
                value={filters.category} 
                onChange={handleFilterChange} 
                disabled={categoriesLoading}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {categoriesLoading ? (
                  <option value="">Đang tải...</option>
                ) : categories.length > 0 ? (
                  categories.map(cat => (
                    <option key={cat || 'all'} value={cat}>
                      {cat || 'Tất cả'}
                    </option>
                  ))
                ) : (
                  <option value="">Không có danh mục</option>
                )}
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
          </div>
        </div>

        {/* Bảng */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Đang tải...</div>
          ) : paginatedSurveys.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="h-7 w-7 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-800">Không có khảo sát nào</p>
              <p className="mt-1 text-sm text-gray-500">Hãy thay đổi điều kiện lọc hoặc xóa bộ lọc để xem thêm kết quả.</p>
              {(filters.category || filters.type || filters.status || filters.keyword) && (
                <div className="mt-4">
                  <button 
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9M4 20v-5h-.418m0 0A8.003 8.003 0 0019.418 15" />
                    </svg>
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Tiêu đề</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Danh mục</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Loại</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Người tạo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Điểm</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Đối tượng</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Thời gian</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedSurveys.map(survey => (
                  <tr key={survey.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{survey.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{survey.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{survey.type === 'survey' ? 'Survey' : 'Quiz'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{survey.creatorName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{survey.points}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{survey.object === 'public' ? 'Công khai' : survey.object === 'students' ? 'Sinh viên' : 'Giảng viên'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${statusConfig[survey.status]?.class}`}>
                        {statusConfig[survey.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatTimeRange(survey.startAt, survey.endAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button onClick={() => handleView(survey)} className="p-1 text-gray-500 hover:text-gray-900 transition-colors" title="Xem"><ViewIcon /></button>
                        <button onClick={() => handleEdit(survey)} className="p-1 text-gray-500 hover:text-gray-900 transition-colors" title="Sửa"><EditIcon /></button>
                        <button onClick={() => handleDuplicate(survey)} className="p-1 text-gray-500 hover:text-purple-600 transition-colors" title="Sao chép"><DuplicateIcon /></button>
                        <button onClick={() => handleDeleteConfirm(survey)} className="p-1 text-gray-500 hover:text-red-600 transition-colors" title="Xóa"><DeleteIcon /></button>
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
        <Modal key="view-modal" isOpen={showViewModal} onClose={closeViewModal} title="Xem chi tiết" size="max-w-5xl" footer={viewFooter}>
          <ViewModalBody selectedSurvey={selectedSurvey} statusConfig={statusConfig} formatTimeRange={formatTimeRange} />
        </Modal>

        <Modal key="edit-modal" isOpen={showEditModal} onClose={closeEditModal} title="Chỉnh sửa khảo sát" size="max-w-6xl" footer={editFooter}>
          <EditModalBody
            editForm={editForm}
            onSubmit={handleEditSubmit}
            onChange={{
              title: handleEditTitleChange,
              description: handleEditDescriptionChange,
              category: handleEditCategoryChange,
              type: handleEditTypeChange,
              status: handleEditStatusChange,
              startAt: handleEditStartAtChange,
              endAt: handleEditEndAtChange,
              points: handleEditPointsChange,
              object: handleEditObjectChange,
              timeLimit: handleEditTimeLimitChange
            }}
            categories={categories}
            types={types}
            statuses={statuses}
            objects={objects}
            statusConfig={statusConfig}
          />
        </Modal>

        <Modal key="add-modal" isOpen={showAddModal} onClose={closeAddModal} title="Thêm khảo sát mới" size="max-w-6xl" footer={addFooter}>
          <AddModalBody
            addForm={addForm}
            onSubmit={handleAddSubmit}
            onChange={{
              title: handleAddTitleChange,
              description: handleAddDescriptionChange,
              category: handleAddCategoryChange,
              type: handleAddTypeChange,
              status: handleAddStatusChange,
              startAt: handleAddStartAtChange,
              endAt: handleAddEndAtChange,
              points: handleAddPointsChange,
              object: handleAddObjectChange,
              timeLimit: handleAddTimeLimitChange
            }}
            categories={categories}
            types={types}
            statuses={statuses}
            objects={objects}
            statusConfig={statusConfig}
          />
        </Modal>

        <Modal key="delete-modal" isOpen={showDeleteModal} onClose={closeDeleteModal} title="Xác nhận xóa khảo sát" size="max-w-lg" footer={deleteFooter}>
          <div className="text-center py-4">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-red-100 to-rose-100 mb-4 shadow-lg ring-4 ring-red-50">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Bạn có chắc chắn muốn xóa?</h3>
            <p className="text-sm text-gray-600 mb-4">Hành động này không thể hoàn tác. Khảo sát sẽ bị xóa vĩnh viễn.</p>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border-2 border-red-200 p-4 mb-4 shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-semibold text-gray-900">"{selectedSurvey?.title}"</span>
              </div>
              <div className="flex items-center justify-center gap-3 mt-2 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {selectedSurvey?.category}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {selectedSurvey?.type === 'survey' ? 'Survey' : 'Quiz'}
                </span>
              </div>
            </div>
            <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs text-amber-800 text-left">
                  <span className="font-semibold">Lưu ý:</span> Tất cả dữ liệu liên quan (câu hỏi, lựa chọn, câu trả lời) cũng sẽ bị xóa.
                </p>
              </div>
            </div>
          </div>
        </Modal>

        <Modal key="duplicate-modal" isOpen={showDuplicateModal} onClose={closeDuplicateModal} title="Xác nhận sao chép khảo sát" size="max-w-lg" footer={duplicateFooter}>
          <div className="text-center py-4">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-purple-100 via-indigo-100 to-purple-100 mb-4 shadow-lg ring-4 ring-purple-50">
              <svg className="h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
                <path d="M184,64H40A16,16,0,0,0,24,80V216a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V80A16,16,0,0,0,184,64Zm0,152H40V80H184V216ZM216,40V192a8,8,0,0,1-16,0V48H72a8,8,0,0,1,0-16H200A16,16,0,0,1,216,40Z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Bạn có muốn sao chép khảo sát này?</h3>
            <p className="text-sm text-gray-600 mb-4">Một bản sao hoàn chỉnh sẽ được tạo với tất cả câu hỏi và lựa chọn.</p>
            <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-purple-200 p-4 mb-4 shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-semibold text-gray-900">"{selectedSurvey?.title}"</span>
              </div>
              <div className="flex items-center justify-center gap-3 mt-2 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {selectedSurvey?.category}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {selectedSurvey?.type === 'survey' ? 'Survey' : 'Quiz'}
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 p-3 mb-2">
              <div className="flex items-start gap-2 text-left">
                <svg className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-purple-900 mb-1.5">Khảo sát mới sẽ có:</p>
                  <ul className="text-xs text-purple-800 space-y-1">
                    <li className="flex items-center gap-1.5">
                      <svg className="h-3 w-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Tiêu đề: <span className="font-semibold text-purple-900">"[Bản sao] {selectedSurvey?.title}"</span></span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <svg className="h-3 w-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Tất cả câu hỏi và lựa chọn từ khảo sát gốc</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <svg className="h-3 w-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Trạng thái mặc định: <span className="font-semibold">Chưa bắt đầu</span></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default SurveyFilter;