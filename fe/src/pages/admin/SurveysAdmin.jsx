import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { graphqlRequest } from '../../api/graphql';
import AdminSidebar from "../../components/AdminSidebar";


const statusConfig = {
  pending: { label: 'Chưa bắt đầu', class: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300', icon: '⏳' },
  active: { label: 'Đang hoạt động', class: 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border-green-300', icon: '🟢' },
  paused: { label: 'Tạm dừng', class: 'bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800 border-amber-300', icon: '⏸️' },
  closed: { label: 'Đã đóng', class: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300', icon: '🔴' },
};

const types = ['', 'survey', 'quiz'];
const statuses = ['', 'pending', 'active', 'paused', 'closed'];
const objects = ['', 'public', 'students', 'lecturers'];

const Modal = ({ isOpen, onClose, title, children, footer, size = 'max-w-3xl' }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-md" onClick={onClose}>
      <div
        className={`relative ${size} w-full mx-auto rounded-xl bg-white shadow-2xl overflow-hidden max-h-[98vh] overflow-y-auto z-[101]`}
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative' }}
      >
        <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b-2 border-blue-200 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-900 hover:bg-white rounded-full p-2 transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md"
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
  );
};

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
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border-2 ${statusConfig[selectedSurvey.status]?.class} shadow-sm hover:scale-105 transition-transform duration-200`}>
                <span className="text-sm">{statusConfig[selectedSurvey.status]?.icon}</span>
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

const EditModalBody = ({ editForm, onSubmit, onChange, categories, types, statuses, objects, statusConfig, formErrors = {}, setFormErrors }) => (
  <form id="editForm" onSubmit={onSubmit} className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="block text-left text-sm font-semibold mb-1.5">Tiêu đề</label>
        <input
          type="text"
          value={editForm.title}
          maxLength={255}
          onChange={(e) => {
            const value = e.target.value;
            onChange.title(value);
          }}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none ${formErrors?.title ? 'border-red-500' : 'border-gray-300'}`}
          required
          autoFocus
        />
        <div className="flex justify-between items-center mt-1">
          {formErrors?.title && (
            <p className="text-red-500 text-xs">{formErrors.title}</p>
          )}
          <p className={`text-xs ml-auto ${editForm.title.length >= 250 ? 'text-orange-500' : editForm.title.length >= 255 ? 'text-red-500' : 'text-gray-400'}`}>
            {editForm.title.length}/255
          </p>
        </div>
      </div>
      <div className="col-span-2">
        <label className="block text-left text-sm font-semibold mb-1.5">Mô tả</label>
        <textarea
          value={editForm.description}
          maxLength={255}
          onChange={(e) => {
            const value = e.target.value;
            onChange.description(value);
          }}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none ${formErrors?.description ? 'border-red-500' : 'border-gray-300'}`}
          rows="3"
          placeholder="Nhập mô tả cho khảo sát..."
          required
        />
        <div className="flex justify-between items-center mt-1">
          {formErrors?.description && (
            <p className="text-red-500 text-xs">{formErrors.description}</p>
          )}
          <p className={`text-xs ml-auto ${editForm.description.length >= 250 ? 'text-orange-500' : editForm.description.length >= 255 ? 'text-red-500' : 'text-gray-400'}`}>
            {editForm.description.length}/255
          </p>
        </div>
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Danh mục</label>
        <select
          value={editForm.category}
          onChange={(e) => {
            onChange.category(e.target.value);
            // Clear error when user selects
            if (formErrors?.category) {
              setFormErrors(prev => ({ ...prev, category: undefined }));
            }
          }}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none ${formErrors?.category ? 'border-red-500' : 'border-gray-300'}`}
          required
        >
          <option value="">Chọn danh mục</option>
          {categories.filter(c => c).map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        {formErrors?.category && (
          <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>
        )}
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Loại</label>
        <select
          value={editForm.type}
          onChange={(e) => {
            onChange.type(e.target.value);
            // Clear error when user selects
            if (formErrors?.type) {
              setFormErrors(prev => ({ ...prev, type: undefined }));
            }
          }}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none ${formErrors?.type ? 'border-red-500' : 'border-gray-300'}`}
          required
        >
          <option value="">Chọn loại</option>
          {types.filter(t => t).map(t => (
            <option key={t} value={t}>
              {t === 'survey' ? 'Survey' : 'Quiz'}
            </option>
          ))}
        </select>
        {formErrors?.type && (
          <p className="text-red-500 text-xs mt-1">{formErrors.type}</p>
        )}
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
          onChange={(e) => {
            onChange.object(e.target.value);
            // Clear error when user selects
            if (formErrors?.object) {
              setFormErrors(prev => ({ ...prev, object: undefined }));
            }
          }}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none ${formErrors?.object ? 'border-red-500' : 'border-gray-300'}`}
          required
        >
          <option value="">Chọn đối tượng</option>
          <option value="public">Công khai</option>
          <option value="students">Sinh viên</option>
          <option value="lecturers">Giảng viên</option>
        </select>
        {formErrors?.object && (
          <p className="text-red-500 text-xs mt-1">{formErrors.object}</p>
        )}
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Trạng thái</label>
        <select
          value={editForm.status}
          onChange={(e) => {
            onChange.status(e.target.value);
            // Clear error when user selects
            if (formErrors?.status) {
              setFormErrors(prev => ({ ...prev, status: undefined }));
            }
          }}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none ${formErrors?.status ? 'border-red-500' : 'border-gray-300'}`}
          required
        >
          <option value="">Chọn trạng thái</option>
          {statuses.filter(s => s).map(s => (
            <option key={s} value={s}>{statusConfig[s]?.label}</option>
          ))}
        </select>
        {formErrors?.status && (
          <p className="text-red-500 text-xs mt-1">{formErrors.status}</p>
        )}
      </div>
    </div>
  </form>
);

const AddModalBody = ({ addForm, onSubmit, onChange, categories, types, statuses, objects, statusConfig, formErrors = {}, setFormErrors }) => (
  <form id="addForm" onSubmit={onSubmit} className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="block text-left text-sm font-semibold mb-1.5">Tiêu đề</label>
        <input
          type="text"
          value={addForm.title}
          maxLength={255}
          onChange={(e) => {
            const value = e.target.value;
            onChange.title(value);
          }}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none ${formErrors?.title ? 'border-red-500' : 'border-gray-300'}`}
          required
          autoFocus
        />
        <div className="flex justify-between items-center mt-1">
          {formErrors?.title && (
            <p className="text-red-500 text-xs">{formErrors.title}</p>
          )}
          <p className={`text-xs ml-auto ${addForm.title.length >= 250 ? 'text-orange-500' : addForm.title.length >= 255 ? 'text-red-500' : 'text-gray-400'}`}>
            {addForm.title.length}/255
          </p>
        </div>
      </div>
      <div className="col-span-2">
        <label className="block text-left text-sm font-semibold mb-1.5">Mô tả</label>
        <textarea
          value={addForm.description}
          maxLength={255}
          onChange={(e) => {
            const value = e.target.value;
            onChange.description(value);
          }}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none ${formErrors?.description ? 'border-red-500' : 'border-gray-300'}`}
          rows="3"
          placeholder="Nhập mô tả cho khảo sát..."
          required
        />
        <div className="flex justify-between items-center mt-1">
          {formErrors?.description && (
            <p className="text-red-500 text-xs">{formErrors.description}</p>
          )}
          <p className={`text-xs ml-auto ${addForm.description.length >= 250 ? 'text-orange-500' : addForm.description.length >= 255 ? 'text-red-500' : 'text-gray-400'}`}>
            {addForm.description.length}/255
          </p>
        </div>
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Danh mục</label>
        <select
          value={addForm.category}
          onChange={(e) => {
            onChange.category(e.target.value);
            // Clear error when user selects
            if (formErrors?.category) {
              setFormErrors(prev => ({ ...prev, category: undefined }));
            }
          }}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none ${formErrors?.category ? 'border-red-500' : 'border-gray-300'}`}
          required
        >
          <option value="">Chọn danh mục</option>
          {categories.filter(c => c).map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        {formErrors?.category && (
          <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>
        )}
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Loại</label>
        <select
          value={addForm.type}
          onChange={(e) => {
            onChange.type(e.target.value);
            // Clear error when user selects
            if (formErrors?.type) {
              setFormErrors(prev => ({ ...prev, type: undefined }));
            }
          }}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none ${formErrors?.type ? 'border-red-500' : 'border-gray-300'}`}
          required
        >
          <option value="">Chọn loại</option>
          {types.filter(t => t).map(t => (
            <option key={t} value={t}>
              {t === 'survey' ? 'Survey' : 'Quiz'}
            </option>
          ))}
        </select>
        {formErrors?.type && (
          <p className="text-red-500 text-xs mt-1">{formErrors.type}</p>
        )}
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
          onChange={(e) => {
            onChange.object(e.target.value);
            // Clear error when user selects
            if (formErrors?.object) {
              setFormErrors(prev => ({ ...prev, object: undefined }));
            }
          }}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none ${formErrors?.object ? 'border-red-500' : 'border-gray-300'}`}
          required
        >
          <option value="">Chọn đối tượng</option>
          <option value="public">Công khai</option>
          <option value="students">Sinh viên</option>
          <option value="lecturers">Giảng viên</option>
        </select>
        {formErrors?.object && (
          <p className="text-red-500 text-xs mt-1">{formErrors.object}</p>
        )}
      </div>
      <div>
        <label className="block text-left text-sm font-semibold mb-1.5">Trạng thái</label>
        <select
          value={addForm.status}
          onChange={(e) => {
            onChange.status(e.target.value);
            // Clear error when user selects
            if (formErrors?.status) {
              setFormErrors(prev => ({ ...prev, status: undefined }));
            }
          }}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none ${formErrors?.status ? 'border-red-500' : 'border-gray-300'}`}
          required
        >
          <option value="">Chọn trạng thái</option>
          {statuses.filter(s => s).map(s => (
            <option key={s} value={s}>{statusConfig[s]?.label}</option>
          ))}
        </select>
        {formErrors?.status && (
          <p className="text-red-500 text-xs mt-1">{formErrors.status}</p>
        )}
      </div>
    </div>
  </form>
);

const SurveyFilter = () => {
  const navigate = useNavigate();
  const [surveysList, setSurveysList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryIdMap, setCategoryIdMap] = useState({});
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [filters, setFilters] = useState({ category: '', type: '', status: '', keyword: '', creatorName: '' });
  const [formErrors, setFormErrors] = useState({ add: {}, edit: {}, filter: {} });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState({ add: false, edit: false, delete: false, duplicate: false });

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
            updated_at
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
        creatorName: s.creator_name || (s.created_by ? `Người dùng #${s.created_by}` : 'Không xác định'),
        updatedAt: s.updated_at || null
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
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    
    // Validate filter select fields
    if (name === 'type' && value && !['', 'survey', 'quiz'].includes(value)) {
      setFormErrors(prev => ({ ...prev, filter: { ...prev.filter, type: 'Loại không hợp lệ.' } }));
      pushToast('Loại không hợp lệ', 'error');
      return;
    }
    
    if (name === 'status' && value && !['', 'pending', 'active', 'paused', 'closed'].includes(value)) {
      setFormErrors(prev => ({ ...prev, filter: { ...prev.filter, status: 'Trạng thái không hợp lệ.' } }));
      pushToast('Trạng thái không hợp lệ', 'error');
      return;
    }
    
    // Validate category exists in list
    if (name === 'category' && value && !categories.includes(value)) {
      setFormErrors(prev => ({ ...prev, filter: { ...prev.filter, category: 'Danh mục không tồn tại.' } }));
      pushToast('Danh mục không tồn tại', 'error');
      return;
    }
    
    // Clear errors when valid value is selected
    if (formErrors.filter[name]) {
      setFormErrors(prev => ({ ...prev, filter: { ...prev.filter, [name]: '' } }));
    }
    
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
      id: Number(survey.id),  // ĐẢM BẢO ID LÀ SỐ
      updatedAt: survey.updatedAt || null  // Lưu updated_at để optimistic locking
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
    setFormErrors(prev => ({ ...prev, edit: {} }));
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

    // Prevent spam submit
    if (isSubmitting.duplicate) {
      return;
    }

    setIsSubmitting(prev => ({ ...prev, duplicate: true }));
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
        let errorMessage = result.errors[0].message || 'Sao chép thất bại';
        console.error('Lỗi sao chép survey:', result.errors);
        
        // Handle specific error messages
        if (errorMessage.includes('Đang xử lý yêu cầu')) {
          errorMessage = 'Đang xử lý yêu cầu. Vui lòng đợi và thử lại sau vài giây.';
        }
        
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
      let errorMessage = error.message || 'Lỗi hệ thống khi sao chép khảo sát';
      if (errorMessage.includes('Đang xử lý yêu cầu')) {
        errorMessage = 'Đang xử lý yêu cầu. Vui lòng đợi và thử lại sau vài giây.';
      }
      pushToast(errorMessage, 'error');
    } finally {
      setLoading(false);
      setIsSubmitting(prev => ({ ...prev, duplicate: false }));
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
    setFormErrors(prev => ({ ...prev, add: {} }));
    setShowAddModal(true);
  };

  const closeViewModal = () => { setShowViewModal(false); setSelectedSurvey(null); };
  const closeEditModal = () => { 
    setShowEditModal(false); 
    setSelectedSurvey(null);
    setFormErrors(prev => ({ ...prev, edit: {} }));
    setIsSubmitting(prev => ({ ...prev, edit: false }));
  };
  const closeDeleteModal = () => { 
    setShowDeleteModal(false); 
    setSelectedSurvey(null);
    setIsSubmitting(prev => ({ ...prev, delete: false }));
  };
  const closeDuplicateModal = () => { 
    setShowDuplicateModal(false); 
    setSelectedSurvey(null);
    setIsSubmitting(prev => ({ ...prev, duplicate: false }));
  };
  const closeAddModal = () => {
    setShowAddModal(false);
    setFormErrors(prev => ({ ...prev, add: {} }));
    setIsSubmitting(prev => ({ ...prev, add: false }));
  };

  // ADD SUBMIT
  const handleAddSubmit = async (e) => {
    e.preventDefault();

    // Prevent spam submit
    if (isSubmitting.add) {
      return;
    }

    // Validate select fields
    const validTypes = ['survey', 'quiz'];
    const validStatuses = ['pending', 'active', 'paused', 'closed'];
    const validObjects = ['public', 'students', 'lecturers'];
    
    if (!addForm.category || addForm.category.trim() === '') {
      setFormErrors(prev => ({ ...prev, add: { ...prev.add, category: 'Vui lòng chọn danh mục.' } }));
      pushToast('Vui lòng chọn danh mục', 'error');
      return;
    }
    
    if (!validTypes.includes(addForm.type)) {
      setFormErrors(prev => ({ ...prev, add: { ...prev.add, type: 'Loại khảo sát không hợp lệ.' } }));
      pushToast('Loại khảo sát không hợp lệ', 'error');
      return;
    }
    
    if (!validStatuses.includes(addForm.status)) {
      setFormErrors(prev => ({ ...prev, add: { ...prev.add, status: 'Trạng thái không hợp lệ.' } }));
      pushToast('Trạng thái không hợp lệ', 'error');
      return;
    }
    
    if (!validObjects.includes(addForm.object)) {
      setFormErrors(prev => ({ ...prev, add: { ...prev.add, object: 'Đối tượng không hợp lệ.' } }));
      pushToast('Đối tượng không hợp lệ', 'error');
      return;
    }
    
    // Validate category exists in list
    const categoryId = Object.entries(categoryIdMap).find(([_, name]) => name === addForm.category)?.[0];
    if (!categoryId || !categories.includes(addForm.category)) {
      setFormErrors(prev => ({ ...prev, add: { ...prev.add, category: 'Danh mục không tồn tại.' } }));
      pushToast('Danh mục không tồn tại', 'error');
      return;
    }

    if (!addForm.startAt || !addForm.endAt) {
      pushToast('Vui lòng chọn thời gian', 'error');
      return;
    }
    if (addForm.startAt >= addForm.endAt) {
      pushToast('Ngày kết thúc phải sau ngày bắt đầu', 'error');
      return;
    }

    setIsSubmitting(prev => ({ ...prev, add: true }));
    try {
      setLoading(true);

      // Lấy userId từ localStorage
      const userId = parseInt(localStorage.getItem("userId"));
      if (!userId) {
        pushToast('Bạn chưa đăng nhập. Vui lòng đăng nhập để tạo khảo sát.', 'error');
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
          created_by: userId,
          time_limit: addForm.timeLimit === '' ? null : parseInt(addForm.timeLimit)
        }
      });

      if (result.errors?.length > 0) {
        // Ưu tiên lấy message từ validation errors
        let errorMessage = '';
        const firstError = result.errors[0];
        
        // Kiểm tra validation errors trước
        if (firstError.extensions?.validation) {
          const validationErrors = firstError.extensions.validation;
          // Lấy tất cả messages từ validation errors
          const validationMessages = Object.values(validationErrors)
            .flat()
            .filter(msg => msg && msg.trim() !== '');
          
          if (validationMessages.length > 0) {
            errorMessage = validationMessages.join(', ');
          }
        }
        
        // Nếu không có validation errors, dùng message từ error
        if (!errorMessage && firstError.message) {
          errorMessage = firstError.message;
        }
        
        // Fallback nếu vẫn không có message
        if (!errorMessage) {
          errorMessage = 'Tạo khảo sát thất bại';
        }
        
        // Handle specific error messages
        if (errorMessage.includes('Đang xử lý yêu cầu')) {
          errorMessage = 'Đang xử lý yêu cầu. Vui lòng đợi và thử lại sau vài giây.';
        } else if (errorMessage.includes('Tiêu đề khảo sát đã tồn tại')) {
          // Hiển thị lỗi duplicate title và set form error
          setFormErrors(prev => ({ ...prev, add: { ...prev.add, title: errorMessage } }));
        }
        
        pushToast(errorMessage, 'error');
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
      let errorMessage = 'Lỗi hệ thống: ' + error.message;
      if (error.message.includes('Đang xử lý yêu cầu')) {
        errorMessage = 'Đang xử lý yêu cầu. Vui lòng đợi và thử lại sau vài giây.';
      } else if (error.message.includes('Dữ liệu đã được cập nhật')) {
        errorMessage = 'Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang trước khi cập nhật.';
      }
      pushToast(errorMessage, 'error');
    } finally {
      setLoading(false);
      setIsSubmitting(prev => ({ ...prev, add: false }));
    }
  };

  // EDIT SUBMIT
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // Prevent spam submit
    if (isSubmitting.edit) {
      return;
    }

    // Validate select fields
    const validTypes = ['survey', 'quiz'];
    const validStatuses = ['pending', 'active', 'paused', 'closed'];
    const validObjects = ['public', 'students', 'lecturers'];
    
    if (!editForm.category || editForm.category.trim() === '') {
      setFormErrors(prev => ({ ...prev, edit: { ...prev.edit, category: 'Vui lòng chọn danh mục.' } }));
      pushToast('Vui lòng chọn danh mục', 'error');
      return;
    }
    
    if (!validTypes.includes(editForm.type)) {
      setFormErrors(prev => ({ ...prev, edit: { ...prev.edit, type: 'Loại khảo sát không hợp lệ.' } }));
      pushToast('Loại khảo sát không hợp lệ', 'error');
      return;
    }
    
    if (!validStatuses.includes(editForm.status)) {
      setFormErrors(prev => ({ ...prev, edit: { ...prev.edit, status: 'Trạng thái không hợp lệ.' } }));
      pushToast('Trạng thái không hợp lệ', 'error');
      return;
    }
    
    if (!validObjects.includes(editForm.object)) {
      setFormErrors(prev => ({ ...prev, edit: { ...prev.edit, object: 'Đối tượng không hợp lệ.' } }));
      pushToast('Đối tượng không hợp lệ', 'error');
      return;
    }
    
    // Validate category exists in list
    const categoryId = Object.entries(categoryIdMap).find(([_, name]) => name === editForm.category)?.[0];
    if (!categoryId || !categories.includes(editForm.category)) {
      setFormErrors(prev => ({ ...prev, edit: { ...prev.edit, category: 'Danh mục không tồn tại.' } }));
      pushToast('Danh mục không tồn tại', 'error');
      return;
    }

    if (!editForm.startAt || !editForm.endAt) {
      pushToast('Vui lòng chọn thời gian', 'error');
      return;
    }
    if (editForm.startAt >= editForm.endAt) {
      pushToast('Ngày kết thúc phải sau ngày bắt đầu', 'error');
      return;
    }

    setIsSubmitting(prev => ({ ...prev, edit: true }));
    try {
      setLoading(true);

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

      // Gửi updated_at để optimistic locking
      if (selectedSurvey.updatedAt) {
        input.updated_at = selectedSurvey.updatedAt;
      }

      const result = await graphqlRequest(`
        mutation UpdateSurvey($id: Int!, $input: UpdateSurveyInput!) {
          updateSurvey(id: $id, input: $input) {
            id title description categories_id type status start_at end_at points object time_limit created_by creator_name updated_at
          }
        }
      `, {
        id: Number(selectedSurvey.id),
        input
      });

      if (result.errors?.length > 0) {
        // Ưu tiên lấy message từ validation errors
        let errorMessage = '';
        const firstError = result.errors[0];
        
        // Kiểm tra validation errors trước
        if (firstError.extensions?.validation) {
          const validationErrors = firstError.extensions.validation;
          // Lấy tất cả messages từ validation errors
          const validationMessages = Object.values(validationErrors)
            .flat()
            .filter(msg => msg && msg.trim() !== '');
          
          if (validationMessages.length > 0) {
            errorMessage = validationMessages.join(', ');
          }
        }
        
        // Nếu không có validation errors, dùng message từ error
        if (!errorMessage && firstError.message) {
          errorMessage = firstError.message;
        }
        
        // Fallback nếu vẫn không có message
        if (!errorMessage) {
          errorMessage = 'Cập nhật thất bại';
        }
        
        // Handle specific error messages
        if (errorMessage.includes('Đang xử lý yêu cầu')) {
          errorMessage = 'Đang xử lý yêu cầu. Vui lòng đợi và thử lại sau vài giây.';
        } else if (errorMessage.includes('Dữ liệu đã được cập nhật') || errorMessage.includes('Vui lòng tải lại trang')) {
          errorMessage = 'Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang trước khi cập nhật.';
        }
        
        pushToast(errorMessage, 'error');
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
        creatorName: updated.creator_name || (updated.created_by ? `Người dùng #${updated.created_by}` : 'Không xác định'),
        updatedAt: updated.updated_at || null
      };

      closeEditModal();
      pushToast('Cập nhật thành công', 'success');
      // Reload với filters hiện tại
      loadSurveys(filters);
    } catch (error) {
      console.error('Lỗi:', error);
      let errorMessage = 'Lỗi hệ thống: ' + (error.message || 'Không xác định');
      if (error.message && error.message.includes('Đang xử lý yêu cầu')) {
        errorMessage = 'Đang xử lý yêu cầu. Vui lòng đợi và thử lại sau vài giây.';
      } else if (error.message && (error.message.includes('Dữ liệu đã được cập nhật') || error.message.includes('Vui lòng tải lại trang'))) {
        errorMessage = 'Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang trước khi cập nhật.';
      }
      pushToast(errorMessage, 'error');
    } finally {
      setLoading(false);
      setIsSubmitting(prev => ({ ...prev, edit: false }));
    }
  };

  // DELETE – ĐÃ SỬA: id → Number
  const handleDelete = async () => {
    // Prevent spam submit
    if (isSubmitting.delete) {
      return;
    }

    setIsSubmitting(prev => ({ ...prev, delete: true }));
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
        let errorMessage = result.errors[0].message || 'Xóa thất bại';
        console.error('Lỗi xóa survey:', result.errors);
        
        // Handle specific error messages
        if (errorMessage.includes('Đang xử lý yêu cầu')) {
          errorMessage = 'Đang xử lý yêu cầu. Vui lòng đợi và thử lại sau vài giây.';
        } else if (errorMessage.includes('Khảo sát đã bị xóa trước đó') || errorMessage.includes('đã bị xóa')) {
          errorMessage = 'Khảo sát đã bị xóa trước đó. Không thể xóa lại.';
        }
        
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
      let errorMessage = error.message || 'Lỗi hệ thống khi xóa khảo sát';
      if (errorMessage.includes('Đang xử lý yêu cầu')) {
        errorMessage = 'Đang xử lý yêu cầu. Vui lòng đợi và thử lại sau vài giây.';
      } else if (errorMessage.includes('Khảo sát đã bị xóa trước đó') || errorMessage.includes('đã bị xóa')) {
        errorMessage = 'Khảo sát đã bị xóa trước đó. Không thể xóa lại.';
      }
      pushToast(errorMessage, 'error');
    } finally {
      setLoading(false);
      setIsSubmitting(prev => ({ ...prev, delete: false }));
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
        disabled={isSubmitting.edit}
        className="px-8 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-semibold text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Hủy
      </button>
      <button 
        type="submit" 
        form="editForm"
        disabled={isSubmitting.edit}
        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
      >
        {isSubmitting.edit && (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {isSubmitting.edit ? 'Đang xử lý...' : 'Lưu thay đổi'}
      </button>
    </>
  ), [closeEditModal, isSubmitting.edit]);

  const addFooter = useMemo(() => (
    <>
      <button 
        onClick={closeAddModal}
        disabled={isSubmitting.add}
        className="px-8 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-semibold text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Hủy
      </button>
      <button 
        type="submit" 
        form="addForm"
        disabled={isSubmitting.add}
        className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
      >
        {isSubmitting.add && (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {isSubmitting.add ? 'Đang xử lý...' : 'Thêm khảo sát'}
      </button>
    </>
  ), [closeAddModal, isSubmitting.add]);

  const deleteFooter = useMemo(() => (
    <>
      <button 
        onClick={closeDeleteModal}
        disabled={isSubmitting.delete}
        className="px-8 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-semibold text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Hủy
      </button>
      <button 
        onClick={handleDelete}
        disabled={isSubmitting.delete}
        className="px-8 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
      >
        {isSubmitting.delete && (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {isSubmitting.delete ? 'Đang xóa...' : 'Xóa khảo sát'}
      </button>
    </>
  ), [closeDeleteModal, handleDelete, isSubmitting.delete]);

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
    <div className="min-h-screen bg-gray-100 text-gray-800 flex">
      <AdminSidebar />
      <div className="flex-1 bg-gray-50 p-8">
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
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin/dashboard')} 
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-400 hover:shadow-md transition-all duration-200 transform hover:scale-105"
              title="Trở về trang chủ"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Trang chủ
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Danh sách Khảo sát</h1>
            </div>
          </div>
          <button 
            onClick={handleAddClick} 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm khảo sát
          </button>
        </div>

        {/* Bộ lọc */}
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-xl border-2 border-gray-100 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">Bộ lọc</h2>
            </div>
            {(filters.category || filters.type || filters.status || filters.keyword || filters.creatorName) && (
              <button 
                onClick={handleResetFilters} 
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border-2 border-gray-300 text-gray-700 bg-white hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                title="Xóa bộ lọc"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Xóa bộ lọc
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Tìm kiếm
              </label>
              <div className="relative">
                <input 
                  type="text"
                  name="keyword"
                  value={filters.keyword}
                  maxLength={255}
                  onChange={(e) => {
                    handleFilterChange(e);
                    // Clear error when user types
                    if (formErrors.filter.keyword) {
                      setFormErrors(prev => ({ ...prev, filter: { ...prev.filter, keyword: '' } }));
                    }
                  }}
                  placeholder="Tiêu đề hoặc mô tả..."
                  className={`w-full p-3 pr-16 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md ${formErrors.filter.keyword ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <span className={`text-xs ${filters.keyword.length >= 250 ? 'text-orange-500' : filters.keyword.length >= 255 ? 'text-red-500' : 'text-gray-400'}`}>
                    {filters.keyword.length}/255
                  </span>
                </div>
              </div>
              {formErrors.filter.keyword && (
                <p className="text-red-500 text-xs mt-1">{formErrors.filter.keyword}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Người tạo
              </label>
              <div className="relative">
                <input 
                  type="text"
                  name="creatorName"
                  value={filters.creatorName}
                  maxLength={255}
                  onChange={(e) => {
                    handleFilterChange(e);
                    // Clear error when user types
                    if (formErrors.filter.creatorName) {
                      setFormErrors(prev => ({ ...prev, filter: { ...prev.filter, creatorName: '' } }));
                    }
                  }}
                  placeholder="Tên giảng viên..."
                  className={`w-full p-3 pr-16 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md ${formErrors.filter.creatorName ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <span className={`text-xs ${filters.creatorName.length >= 250 ? 'text-orange-500' : filters.creatorName.length >= 255 ? 'text-red-500' : 'text-gray-400'}`}>
                    {filters.creatorName.length}/255
                  </span>
                </div>
              </div>
              {formErrors.filter.creatorName && (
                <p className="text-red-500 text-xs mt-1">{formErrors.filter.creatorName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Danh mục
              </label>
              <select 
                name="category" 
                value={filters.category} 
                onChange={handleFilterChange} 
                disabled={categoriesLoading}
                className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-100 disabled:cursor-not-allowed ${formErrors.filter.category ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
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
              {formErrors.filter.category && (
                <p className="text-red-500 text-xs mt-1">{formErrors.filter.category}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Loại
              </label>
              <select 
                name="type" 
                value={filters.type} 
                onChange={handleFilterChange} 
                className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md ${formErrors.filter.type ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
              >
                {types.map(t => <option key={t} value={t}>{t === 'survey' ? 'Survey' : t === 'quiz' ? 'Quiz' : 'Tất cả'}</option>)}
              </select>
              {formErrors.filter.type && (
                <p className="text-red-500 text-xs mt-1">{formErrors.filter.type}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Trạng thái
              </label>
              <select 
                name="status" 
                value={filters.status} 
                onChange={handleFilterChange} 
                className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md ${formErrors.filter.status ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
              >
                {statuses.map(s => <option key={s} value={s}>{statusConfig[s]?.label || 'Tất cả'}</option>)}
              </select>
              {formErrors.filter.status && (
                <p className="text-red-500 text-xs mt-1">{formErrors.filter.status}</p>
              )}
            </div>
          </div>
        </div>

        {/* Bảng */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-700">Đang tải dữ liệu...</p>
            </div>
          ) : paginatedSurveys.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-lg">
                <svg className="h-10 w-10 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-xl font-bold text-gray-800 mb-2">Không có khảo sát nào</p>
              <p className="text-sm text-gray-500 mb-6">Hãy thay đổi điều kiện lọc hoặc xóa bộ lọc để xem thêm kết quả.</p>
              {(filters.category || filters.type || filters.status || filters.keyword) && (
                <div className="mt-4">
                  <button 
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9M4 20v-5h-.418m0 0A8.003 8.003 0 0019.418 15" />
                    </svg>
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Tiêu đề</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Danh mục</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Loại</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Người tạo</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Điểm</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Đối tượng</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Thời gian</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedSurveys.map(survey => (
                  <tr key={survey.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{survey.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{survey.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{survey.type === 'survey' ? 'Survey' : 'Quiz'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{survey.creatorName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{survey.points}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{survey.object === 'public' ? 'Công khai' : survey.object === 'students' ? 'Sinh viên' : 'Giảng viên'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border-2 shadow-sm ${statusConfig[survey.status]?.class} transform group-hover:scale-105 transition-transform duration-200`}>
                        <span className="text-sm">{statusConfig[survey.status]?.icon}</span>
                        {statusConfig[survey.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{formatTimeRange(survey.startAt, survey.endAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button onClick={() => handleView(survey)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110" title="Xem"><ViewIcon /></button>
                        <button onClick={() => handleEdit(survey)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 transform hover:scale-110" title="Sửa"><EditIcon /></button>
                        <button onClick={() => handleDuplicate(survey)} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 transform hover:scale-110" title="Sao chép"><DuplicateIcon /></button>
                        <button onClick={() => handleDeleteConfirm(survey)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110" title="Xóa"><DeleteIcon /></button>
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
          <div className="mt-8 flex justify-between items-center bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4">
            <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Hiển thị <span className="text-blue-600 font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-blue-600 font-bold">{Math.min(currentPage * itemsPerPage, filteredSurveys.length)}</span> của <span className="text-blue-600 font-bold">{filteredSurveys.length}</span>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1} 
                className="px-4 py-2 border-2 border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-400 transition-all duration-200 font-semibold text-gray-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button 
                  key={i + 1} 
                  onClick={() => handlePageChange(i + 1)} 
                  className={`px-4 py-2 border-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                    currentPage === i + 1 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-lg' 
                      : 'border-gray-300 text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-400'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                onClick={() => handlePageChange(currentPage + 1)} 
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

        {/* MODALS */}
        <Modal key="view-modal" isOpen={showViewModal} onClose={closeViewModal} title="Xem chi tiết" size="max-w-5xl" footer={viewFooter}>
          <ViewModalBody selectedSurvey={selectedSurvey} statusConfig={statusConfig} formatTimeRange={formatTimeRange} />
        </Modal>

        <Modal key="edit-modal" isOpen={showEditModal} onClose={() => { closeEditModal(); setFormErrors(prev => ({ ...prev, edit: {} })); }} title="Chỉnh sửa khảo sát" size="max-w-6xl" footer={editFooter}>
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
            formErrors={formErrors.edit}
            setFormErrors={(errors) => setFormErrors(prev => ({ ...prev, edit: errors }))}
          />
        </Modal>

        <Modal key="add-modal" isOpen={showAddModal} onClose={() => { closeAddModal(); setFormErrors(prev => ({ ...prev, add: {} })); }} title="Thêm khảo sát mới" size="max-w-6xl" footer={addFooter}>
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
            formErrors={formErrors.add}
            setFormErrors={(errors) => setFormErrors(prev => ({ ...prev, add: errors }))}
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
    </div>
  );
};

export default SurveyFilter;