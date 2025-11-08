import React, { useState, useEffect, useRef } from 'react';
import { graphqlRequest } from "../api/graphql";

const now = new Date('2025-10-18T14:30:00'); // Giả lập thời gian hiện tại

const surveys = [
  { id: 1, name: 'Khảo sát chuẩn bị diễn ra', status: 'pending', start_at: '2025-10-10T09:00:00', end_at: '2025-10-15T17:00:00', allowReview: true },
  { id: 2, name: 'Khảo sát đang hoạt động', status: 'active', start_at: '2025-10-01T09:00:00', end_at: '2025-10-12T17:00:00', allowReview: false },
  { id: 3, name: 'Khảo sát đang tạm dừng', status: 'paused', start_at: '2025-10-05T09:00:00', end_at: '2025-10-20T17:00:00', allowReview: true },
  { id: 4, name: 'Khảo sát đã đóng (cho phép xem)', status: 'active', start_at: '2025-09-20T09:00:00', end_at: '2025-09-30T17:00:00', allowReview: true },
  { id: 5, name: 'Khảo sát đã đóng (không cho xem)', status: 'closed', start_at: '2025-10-01T09:00:00', end_at: '2025-10-30T17:00:00', allowReview: false },
];

const statusConfig = {
  pending: { text: 'Chưa bắt đầu', color: 'gray', actions: ['activate'] },
  active: { text: 'Đang hoạt động', color: 'green', actions: ['pause', 'close'] },
  paused: { text: 'Tạm dừng', color: 'yellow', actions: ['activate', 'close'] },
  closed: { text: 'Đã đóng', color: 'red', actions: [] },
};

const actionConfig = {
  activate: { text: 'Kích hoạt', message: "Bạn có chắc chắn muốn kích hoạt khảo sát '{surveyName}' ngay bây giờ?", success: "Khảo sát đã được kích hoạt thành công." },
  pause: { text: 'Tạm dừng', message: "Bạn có chắc chắn muốn tạm dừng khảo sát '{surveyName}'?", success: "Khảo sát đã được tạm dừng." },
  close: { text: 'Đóng', message: "Bạn có chắc chắn muốn đóng khảo sát '{surveyName}'? Hành động này không thể hoàn tác.", success: "Khảo sát đã được đóng thành công." },
  view_results: { text: 'Xem kết quả' },
  review_results: { text: 'Xem lại kết quả' },
};

const colorMap = {
  gray: 'text-gray-900 bg-gray-200',
  green: 'text-green-900 bg-green-200',
  yellow: 'text-yellow-900 bg-yellow-200',
  red: 'text-red-900 bg-red-200',
};

const StatusManagement = () => {
  const [surveysState, setSurveysState] = useState(surveys);
  const [currentUserRole, setCurrentUserRole] = useState('admin');
  const [activeAction, setActiveAction] = useState({ surveyId: null, action: null });
  const [currentView, setCurrentView] = useState('survey-list');
  const [viewAction, setViewAction] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [confirmationModal, setConfirmationModal] = useState({ show: false, title: '', text: '' });
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState('bottom'); // 'bottom' or 'top'
  const buttonRefs = useRef({}); // 🔹 ref riêng cho từng survey
  const itemsPerPage = 3;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId !== null && !event.target.closest('.dropdown')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  const getEffectiveStatus = (survey) => {
    const startDate = new Date(survey.start_at);
    const endDate = new Date(survey.end_at);
    if (survey.status === 'closed' || now > endDate) return 'closed';
    if (survey.status === 'paused') return 'paused';
    if (survey.status === 'active' && now >= startDate && now <= endDate) return 'active';
    if (now < startDate) return 'pending';
    return 'pending';
  };

  // 🔹 Function để lấy available actions cho một survey
  const getAvailableActions = (survey) => {
    const effectiveStatusKey = getEffectiveStatus(survey);
    const statusInfo = statusConfig[effectiveStatusKey];
    let actions = [];
    if (currentUserRole === 'admin') {
      actions = [...statusInfo.actions];
      if (effectiveStatusKey !== 'pending') actions.push('view_results');
    } else {
      if (effectiveStatusKey === 'closed' && survey.allowReview) actions.push('review_results');
    }
    return actions;
  };

  const totalPages = Math.ceil(surveysState.length / itemsPerPage);

  const paginatedSurveys = () => {
    const page = Math.min(currentPage, totalPages || 1);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return surveysState.slice(startIndex, endIndex);
  };

  const handlePageChange = (direction) => {
    setCurrentPage((prev) => Math.max(1, Math.min(totalPages, prev + direction)));
    setOpenDropdownId(null);
  };

  const Pagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="bg-white p-4 rounded-b-lg border-t border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-sm text-gray-700">
            Trang <b>{currentPage}</b> trên <b>{totalPages}</b>
          </span>
          <div className="inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => handlePageChange(-1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Trước
            </button>
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 🔹 Cập nhật logic dropdown flip với height estimate động
  const handleToggleDropdown = (surveyId) => {
    if (openDropdownId === surveyId) {
      setOpenDropdownId(null);
      return;
    }

    const survey = surveysState.find((s) => s.id === surveyId);
    if (!survey) return;

    const availableActions = getAvailableActions(survey);
    const numActions = availableActions.length;
    const actionHeight = 40; // Ước tính height mỗi action (py-2 + text)
    const dropdownHeightEstimate = 48 + (numActions * actionHeight); // padding + actions, không cần max-h vì sẽ scroll nếu quá

    const buttonElement = buttonRefs.current[surveyId];
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropdownPosition(spaceBelow < dropdownHeightEstimate ? 'top' : 'bottom');
    }

    setOpenDropdownId(surveyId);
  };

  const handleActionClick = (surveyId, action) => {
    if (action === 'view_results' || action === 'review_results') handleViewResults(surveyId, action);
    else showConfirmationModal(surveyId, action);
  };

  const handleViewResults = (surveyId, action) => {
    const survey = surveysState.find((s) => s.id === surveyId);
    if (!survey) return;
    setViewAction(action);
    setSelectedSurvey(survey);
    setCurrentView('survey-results');
    setOpenDropdownId(null);
  };

  const handleToggleReview = (surveyId, isAllowed) => {
    setSurveysState((prev) => prev.map((s) => (s.id === surveyId ? { ...s, allowReview: isAllowed } : s)));
    const message = isAllowed ? 'Đã BẬT quyền xem lại kết quả.' : 'Đã TẮT quyền xem lại kết quả.';
    showToast(message, 'success');
  };

  const showConfirmationModal = (surveyId, action) => {
    const survey = surveysState.find((s) => s.id === surveyId);
    if (!survey) return;
    setActiveAction({ surveyId, action });
    setConfirmationModal({
      show: true,
      title: 'Xác nhận hành động',
      text: actionConfig[action].message.replace('{surveyName}', survey.name),
    });
  };

  const hideConfirmationModal = () => {
    setConfirmationModal({ show: false, title: '', text: '' });
    setActiveAction({ surveyId: null, action: null });
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  const handleConfirmAction = () => {
    const { surveyId, action } = activeAction;
    hideConfirmationModal();
    setSurveysState((prev) =>
      prev.map((s) => {
        if (s.id === surveyId) {
          let newStatus = s.status;
          if (action === 'activate') newStatus = 'active';
          if (action === 'pause') newStatus = 'paused';
          if (action === 'close') newStatus = 'closed';
          return { ...s, status: newStatus };
        }
        return s;
      })
    );
    showToast(actionConfig[action].success, 'success');
  };

  const handleRoleChange = (role) => {
    setCurrentUserRole(role);
    setOpenDropdownId(null);
  };

  const getResultsContent = () => {
    if (!selectedSurvey) return null;
    const status = getEffectiveStatus(selectedSurvey);
    let contentHtml = '';

    if (currentUserRole === 'admin') {
      if (status === 'active' || status === 'paused') {
        contentHtml = (
          <>
            <h3 className="text-xl font-semibold text-blue-600">Đang xem kết quả tạm thời (real-time)</h3>
            <p className="mt-2 text-gray-600">Dữ liệu được cập nhật liên tục.</p>
          </>
        );
      } else if (status === 'closed') {
        contentHtml = (
          <>
            <h3 className="text-xl font-semibold text-green-600">Báo cáo kết quả cuối cùng</h3>
            <p className="mt-2 text-gray-600">Bạn có thể xem và xuất báo cáo chi tiết.</p>
          </>
        );
      }
    } else {
      if (viewAction === 'review_results') {
        contentHtml = (
          <>
            <h3 className="text-xl font-semibold text-green-600">Xem lại kết quả của bạn</h3>
            <p className="mt-2 text-gray-600">Hệ thống hiển thị lại khảo sát ở chế độ chỉ đọc (read-only).</p>
            <div className="w-full h-64 mt-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">[Mô phỏng SurveyJS Read-Only Mode]</p>
            </div>
          </>
        );
      } else {
        contentHtml = (
          <>
            <h3 className="text-xl font-semibold text-red-600">Không được phép xem</h3>
            <p className="mt-2 text-gray-600">Bạn không được phép xem lại kết quả khảo sát này.</p>
          </>
        );
      }
    }
    return contentHtml;
  };

  const renderSurveyList = () => {
    return paginatedSurveys().map((survey) => {
      const effectiveStatusKey = getEffectiveStatus(survey);
      const statusInfo = statusConfig[effectiveStatusKey];
      const availableActions = getAvailableActions(survey);
      let reviewPermissionHtml = null;

      if (currentUserRole === 'admin') {
        reviewPermissionHtml = (
          <td className="px-6 py-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer review-toggle"
                checked={survey.allowReview}
                onChange={(e) => handleToggleReview(survey.id, e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-checked:bg-blue-600 rounded-full after:content-[''] after:absolute after:w-5 after:h-5 after:bg-white after:rounded-full after:top-[2px] after:left-[2px] peer-checked:after:translate-x-full after:transition-all"></div>
            </label>
          </td>
        );
      } else {
        reviewPermissionHtml = <td className={currentUserRole === 'admin' ? 'px-6 py-4' : 'hidden'}></td>;
      }

      const isDropdownOpen = openDropdownId === survey.id;
      const positionClasses = dropdownPosition === 'top' ? 'origin-bottom-right -mt-2 mb-2 bottom-full' : 'origin-top-right mt-2';
      const actions =
        availableActions.length > 0 ? (
          <div className="relative inline-block text-left dropdown">
            <button
              ref={(el) => (buttonRefs.current[survey.id] = el)} // 🔹 ref riêng từng nút
              onClick={(e) => {
                e.stopPropagation();
                handleToggleDropdown(survey.id);
              }}
              className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Tùy chọn
              <svg
                className={`ml-2 h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isDropdownOpen && (
              <div
                className={`absolute right-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 ${positionClasses} dropdown-content show`}  // 🔹 Tăng z-index lên 50
              >
                <div className="py-1 max-h-48 overflow-y-auto">
                  {availableActions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleActionClick(survey.id, action);
                        setOpenDropdownId(null);
                      }}
                    >
                      {actionConfig[action].text}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-500">Không có</span>
        );

      return (
        <tr key={survey.id} className="bg-white border-b hover:bg-gray-50">
          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{survey.name}</td>
          <td className="px-6 py-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[statusInfo.color]}`}>
              {statusInfo.text}
            </span>
          </td>
          {reviewPermissionHtml}
          <td className="px-6 py-4 text-center relative">{actions}</td>
        </tr>
      );
    });
  };

  return (
    <>
      <style>{`
        .dropdown-content {
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .dropdown-content.show {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      <div className="container mx-auto p-4 md:p-8 antialiased text-slate-700 bg-gray-100 min-h-screen">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Quản Lý Trạng Thái Khảo Sát</h1>
          <p className="text-slate-500 mt-1">Thay đổi trạng thái hoạt động và quyền xem lại của các khảo sát.</p>
          
        </header>

        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">Xem với vai trò:</label>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="userRole"
                value="admin"
                checked={currentUserRole === 'admin'}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-900">Quản trị viên / Giảng viên</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="userRole"
                value="user"
                checked={currentUserRole === 'user'}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-900">Người tham gia</span>
            </label>
          </div>
        </div>

        {/* 🔹 Bỏ overflow-hidden để dropdown không bị clip */}
        <div className="bg-white rounded-lg shadow-md">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-100 text-gray-900 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Tên khảo sát</th>
                <th className="px-6 py-3">Trạng thái</th>
                {currentUserRole === 'admin' && <th className="px-6 py-3">Cho phép xem lại</th>}
                <th className="px-6 py-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>{renderSurveyList()}</tbody>
          </table>
          <Pagination />
        </div>

        {confirmationModal.show && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{confirmationModal.title}</h2>
              <p className="text-gray-600 mb-6">{confirmationModal.text}</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleConfirmAction}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Xác nhận
                </button>
                <button onClick={hideConfirmationModal} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="fixed top-4 right-4 space-y-2 z-50">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`px-4 py-2 rounded-md shadow-md text-white ${
                toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default StatusManagement;