import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { graphqlRequest } from "../../api/graphqls";
import AdminSidebar from "../../components/AdminSidebar";


const statusConfig = {
  pending: { text: 'Chưa bắt đầu', color: 'gray', actions: ['activate'], icon: '⏳' },
  active: { text: 'Đang hoạt động', color: 'green', actions: ['pause', 'close'], icon: '🟢' },
  paused: { text: 'Tạm dừng', color: 'yellow', actions: ['activate', 'close'], icon: '⏸️' },
  closed: { text: 'Đã đóng', color: 'red', actions: [], icon: '🔴' },
};

const actionConfig = {
  activate: { text: 'Kích hoạt', message: "Bạn có chắc chắn muốn kích hoạt khảo sát '{surveyName}' ngay bây giờ?", success: "Khảo sát đã được kích hoạt thành công." },
  pause: { text: 'Tạm dừng', message: "Bạn có chắc chắn muốn tạm dừng khảo sát '{surveyName}'?", success: "Khảo sát đã được tạm dừng." },
  close: { text: 'Đóng', message: "Bạn có chắc chắn muốn đóng khảo sát '{surveyName}'? Hành động này không thể hoàn tác.", success: "Khảo sát đã được đóng thành công." },
  view_results: { text: 'Xem kết quả' },
  review_results: { text: 'Xem lại kết quả' },
};

const colorMap = {
  gray: 'text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300 shadow-sm',
  green: 'text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-sm',
  yellow: 'text-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 shadow-sm',
  red: 'text-red-700 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 shadow-sm',
};

const StatusManagementAdmin = () => {
  const navigate = useNavigate();
  const [surveysState, setSurveysState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date()); // Thời gian thực
  const [currentUserRole, setCurrentUserRole] = useState(localStorage.getItem('userRole') || 'admin');
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
  const itemsPerPage = 10;
  const lastRefreshTime = useRef(0); // Lưu thời gian refresh cuối cùng
  const isRefreshing = useRef(false); // Flag để tránh refresh đồng thời
  const [processingActions, setProcessingActions] = useState(new Set()); // Track các action đang xử lý

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  // Helper functions để quản lý processing actions
  const startProcessing = (actionKey) => {
    setProcessingActions((prev) => new Set([...prev, actionKey]));
  };

  const stopProcessing = (actionKey) => {
    setProcessingActions((prev) => {
      const newSet = new Set(prev);
      newSet.delete(actionKey);
      return newSet;
    });
  };

  const isProcessing = (actionKey) => {
    return processingActions.has(actionKey);
  };

  // Load surveys từ API
  const loadSurveys = async (silent = false) => {
    // Tránh refresh đồng thời
    if (isRefreshing.current) {
      return;
    }

    // Kiểm tra thời gian refresh cuối cùng (tránh refresh quá thường xuyên)
    const now = Date.now();
    if (!silent && now - lastRefreshTime.current < 3000) {
      return; // Chỉ refresh nếu đã qua 3 giây
    }

    try {
      isRefreshing.current = true;
      if (!silent) {
        setLoading(true);
      }
      
      // Lấy thông tin user từ localStorage
      const userRole = localStorage.getItem('userRole') || 'admin';
      const userId = parseInt(localStorage.getItem('userId'));
      
      // Cập nhật currentUserRole
      setCurrentUserRole(userRole);
      
      const result = await graphqlRequest(`
        query {
          stateSurveys {
            id
            title
            description
            start_at
            end_at
            status
            allow_review
            created_by
            type
            object
          }
        }
      `);

      if (result.errors) {
        console.error('GraphQL Errors:', result.errors);
        if (!silent) {
          showToast('Lỗi tải danh sách khảo sát', 'error');
        }
        return;
      }

      const surveysData = result.data?.stateSurveys || [];
      
      // Lọc surveys theo quyền
      let filteredSurveys = surveysData;
      if (userRole === 'lecturer' && userId) {
        // Giảng viên chỉ thấy khảo sát của mình
        filteredSurveys = surveysData.filter(s => Number(s.created_by) === userId);
      }
      // Admin thấy tất cả (không filter)
      
      // Map dữ liệu từ API sang format của component
      const mappedSurveys = filteredSurveys.map(s => ({
        id: Number(s.id),
        name: s.title,
        status: s.status,
        start_at: s.start_at,
        end_at: s.end_at,
        allowReview: s.allow_review || false,
        description: s.description,
        type: s.type,
        object: s.object,
        created_by: s.created_by
      }));

      setSurveysState(mappedSurveys);
      lastRefreshTime.current = now;
    } catch (error) {
      console.error('Lỗi tải surveys:', error);
      if (!silent) {
        showToast('Không thể tải danh sách khảo sát', 'error');
      }
    } finally {
      setLoading(false);
      isRefreshing.current = false;
    }
  };

  // Load surveys khi mount
  useEffect(() => {
    loadSurveys();
  }, []);

  // Cập nhật thời gian thực mỗi giây
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Auto-refresh surveys định kỳ (mỗi 30 giây)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      loadSurveys(true); // Silent refresh
    }, 30000); // 30 giây

    return () => clearInterval(refreshInterval);
  }, []);

  // Kiểm tra và refresh ngay khi đến thời gian start/end
  useEffect(() => {
    if (surveysState.length === 0) return;

    const checkAndRefresh = () => {
      const now = currentTime.getTime();
      let shouldRefresh = false;
      
      surveysState.forEach(survey => {
        // Kiểm tra thời gian bắt đầu: nếu đã đến hoặc vượt qua thời gian bắt đầu
        if (survey.start_at && survey.status === 'pending') {
          const startTime = new Date(survey.start_at).getTime();
          // Nếu đã đến thời gian bắt đầu (trong vòng 30 giây sau khi đến)
          if (now >= startTime && now <= startTime + 30000) {
            shouldRefresh = true;
          }
        }
        
        // Kiểm tra thời gian kết thúc: nếu đã đến hoặc vượt qua thời gian kết thúc
        if (survey.end_at && survey.status !== 'closed') {
          const endTime = new Date(survey.end_at).getTime();
          // Nếu đã đến thời gian kết thúc (trong vòng 30 giây sau khi đến)
          if (now >= endTime && now <= endTime + 30000) {
            shouldRefresh = true;
          }
        }
      });

      if (shouldRefresh) {
        console.log('Auto-refresh triggered by time event');
        loadSurveys(true); // Silent refresh để không làm gián đoạn UI
      }
    };

    // Kiểm tra mỗi 5 giây để phát hiện sự kiện
    const checkTimer = setInterval(checkAndRefresh, 5000);
    return () => clearInterval(checkTimer);
  }, [currentTime, surveysState]);

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
    // Ưu tiên status từ database - không override status đã được set thủ công
    // Chỉ tính toán lại cho các trường hợp tự động (đóng khi quá thời gian)
    
    const now = currentTime;
    
    // Ưu tiên status từ database trước
    const dbStatus = survey.status || 'pending';
    
    // Nếu status là closed, luôn trả về closed
    if (dbStatus === 'closed') return 'closed';
    
    // Nếu status là paused, trả về paused (giữ nguyên)
    if (dbStatus === 'paused') return 'paused';
    
    // Xử lý thời gian
    const startDate = survey.start_at ? new Date(survey.start_at) : null;
    const endDate = survey.end_at ? new Date(survey.end_at) : null;
    
    // CHỈ tự động đóng nếu đã quá thời gian kết thúc (không override status thủ công)
    // Nếu status đã được set thủ công là 'active' hoặc 'paused', giữ nguyên
    if (endDate && now > endDate && (dbStatus === 'active' || dbStatus === 'paused')) {
      // Tự động đóng khi quá thời gian (hiển thị cảnh báo, backend sẽ xử lý)
      return 'closed';
    }
    
    // Nếu status là active hoặc paused, trả về nguyên status từ database
    // (KHÔNG override dựa trên start_at - đây là status đã được set thủ công)
    if (dbStatus === 'active' || dbStatus === 'paused') {
      return dbStatus;
    }
    
    // Nếu status là pending, giữ nguyên pending (KHÔNG tự động kích hoạt)
    if (dbStatus === 'pending') {
      return 'pending';
    }
    
    // Mặc định trả về status hiện tại từ database
    return dbStatus;
  };

  // 🔹 Function để lấy available actions cho một survey
  const getAvailableActions = (survey) => {
    const effectiveStatusKey = getEffectiveStatus(survey);
    const statusInfo = statusConfig[effectiveStatusKey];
    let actions = [];
    // Admin và Lecturer có quyền quản lý đầy đủ
    if (currentUserRole === 'admin' || currentUserRole === 'lecturer') {
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
      <div className="bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-sm text-gray-600 font-medium">
            Trang <span className="text-blue-600 font-semibold">{currentPage}</span> trên <span className="text-blue-600 font-semibold">{totalPages}</span> 
            <span className="text-gray-500 ml-1">({surveysState.length} khảo sát)</span>
          </span>
          <div className="inline-flex rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => handlePageChange(-1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-5 py-2.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 transition-all duration-200 border-r border-gray-200"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Trước
            </button>
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-5 py-2.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 transition-all duration-200"
            >
              Sau
              <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
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

  const handleToggleReview = async (surveyId, isAllowed) => {
    const actionKey = `toggle-review-${surveyId}`;
    
    // Ngăn spam click
    if (isProcessing(actionKey)) {
      return;
    }

    try {
      startProcessing(actionKey);
      
      const result = await graphqlRequest(`
        mutation ToggleReviewPermission($id: ID!, $allowReview: Boolean!) {
          toggleReviewPermission(id: $id, allowReview: $allowReview) {
            survey {
              id
              title
              status
              allow_review
              start_at
              end_at
            }
            message
          }
        }
      `, {
        id: String(surveyId),
        allowReview: isAllowed
      });

      if (result.errors) {
        const errorMessage = result.errors[0]?.message || 'Không thể cập nhật quyền xem lại';
        showToast(errorMessage, 'error');
        return;
      }

      const response = result.data?.toggleReviewPermission;
      if (response?.survey) {
        // Cập nhật state với dữ liệu từ server
        setSurveysState((prev) => prev.map((s) => 
          s.id === surveyId 
            ? { 
                ...s, 
                allowReview: response.survey.allow_review,
                status: response.survey.status
              } 
            : s
        ));
        showToast(response.message || (isAllowed ? 'Đã BẬT quyền xem lại kết quả.' : 'Đã TẮT quyền xem lại kết quả.'), 'success');
        // Reload để đảm bảo dữ liệu đồng bộ
        await loadSurveys();
      } else {
        showToast(response?.message || 'Cập nhật thất bại', 'error');
      }
    } catch (error) {
      console.error('Lỗi toggle review permission:', error);
      showToast('Lỗi hệ thống khi cập nhật quyền xem lại', 'error');
    } finally {
      stopProcessing(actionKey);
    }
  };

  const showConfirmationModal = (surveyId, action) => {
    const survey = surveysState.find((s) => s.id === surveyId);
    if (!survey) return;
    
    let message = actionConfig[action].message.replace('{surveyName}', survey.name);
    
    // Nếu là kích hoạt và chưa đến thời gian bắt đầu, thêm cảnh báo
    if (action === 'activate' && survey.start_at) {
      const startTime = new Date(survey.start_at);
      const now = currentTime;
      if (now < startTime) {
        const timeDiff = Math.round((startTime - now) / (1000 * 60)); // phút
        message += `\n\n⚠️ Cảnh báo: Khảo sát sẽ được kích hoạt sớm ${timeDiff} phút so với thời gian dự kiến (${startTime.toLocaleString('vi-VN')}).`;
      }
    }
    
    setActiveAction({ surveyId, action });
    setConfirmationModal({
      show: true,
      title: 'Xác nhận hành động',
      text: message,
    });
  };

  const hideConfirmationModal = () => {
    setConfirmationModal({ show: false, title: '', text: '' });
    setActiveAction({ surveyId: null, action: null });
  };

  const handleConfirmAction = async () => {
    const { surveyId, action } = activeAction;
    
    if (!surveyId || !action) {
      return;
    }

    const actionKey = `change-status-${surveyId}-${action}`;
    
    // Ngăn spam click
    if (isProcessing(actionKey)) {
      return;
    }

    hideConfirmationModal();

    // Map action sang status
    const statusMap = {
      'activate': 'active',
      'pause': 'paused',
      'close': 'closed'
    };

    const newStatus = statusMap[action];
    if (!newStatus) {
      showToast('Hành động không hợp lệ', 'error');
      return;
    }

    try {
      startProcessing(actionKey);
      
      const result = await graphqlRequest(`
        mutation ChangeSurveyStatus($id: ID!, $status: SurveyStatus!) {
          changeSurveyStatus(id: $id, status: $status) {
            survey {
              id
              title
              status
              allow_review
              start_at
              end_at
            }
            message
          }
        }
      `, {
        id: String(surveyId),
        status: newStatus
      });

      if (result.errors) {
        const errorMessage = result.errors[0]?.message || 'Không thể thay đổi trạng thái';
        showToast(errorMessage, 'error');
        return;
      }

      const response = result.data?.changeSurveyStatus;
      if (response?.survey) {
        // Cập nhật state với dữ liệu từ server
        setSurveysState((prev) => prev.map((s) => 
          s.id === surveyId 
            ? { 
                ...s, 
                status: response.survey.status,
                allowReview: response.survey.allow_review || s.allowReview
              } 
            : s
        ));
        showToast(response.message || actionConfig[action].success, 'success');
        // Reload để đảm bảo dữ liệu đồng bộ
        await loadSurveys();
      } else {
        showToast(response?.message || 'Thay đổi trạng thái thất bại', 'error');
      }
    } catch (error) {
      console.error('Lỗi change status:', error);
      showToast('Lỗi hệ thống khi thay đổi trạng thái', 'error');
    } finally {
      stopProcessing(actionKey);
    }
  };


  const getResultsContent = () => {
    if (!selectedSurvey) return null;
    const status = getEffectiveStatus(selectedSurvey);
    let contentHtml = '';

    if (currentUserRole === 'admin' || currentUserRole === 'lecturer') {
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

      if (currentUserRole === 'admin' || currentUserRole === 'lecturer') {
        const isToggleProcessing = isProcessing(`toggle-review-${survey.id}`);
        reviewPermissionHtml = (
          <td className="px-6 py-5">
            <label className={`relative inline-flex items-center ${isToggleProcessing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} group`}>
              <input
                type="checkbox"
                className="sr-only peer review-toggle"
                checked={survey.allowReview}
                disabled={isToggleProcessing}
                onChange={(e) => handleToggleReview(survey.id, e.target.checked)}
              />
              <div className="w-12 h-6 bg-gray-300 peer-checked:bg-blue-600 rounded-full shadow-inner transition-colors duration-200 peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 peer-checked:translate-x-6"></div>
            </label>
          </td>
        );
      } else {
        reviewPermissionHtml = <td className={(currentUserRole === 'admin' || currentUserRole === 'lecturer') ? 'px-6 py-5' : 'hidden'}></td>;
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
              className={`inline-flex justify-center items-center gap-2 rounded-lg border shadow-sm px-4 py-2 text-sm font-medium transition-all duration-200 ${
                isDropdownOpen
                  ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-md'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
              Tùy chọn
              <svg
                className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isDropdownOpen && (
              <div
                className={`absolute right-0 w-56 rounded-lg shadow-xl bg-white border border-gray-200 z-50 transition-all duration-200 ease-out opacity-100 transform translate-y-0 ${positionClasses}`}
              >
                <div className="py-1.5 max-h-64 overflow-y-auto">
                  {availableActions.map((action) => {
                    const isActionProcessing = isProcessing(`change-status-${survey.id}-${action}`);
                    return (
                      <button
                        key={action}
                        type="button"
                        disabled={isActionProcessing}
                        className={`block w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 ${
                          isActionProcessing
                            ? 'text-gray-400 cursor-not-allowed opacity-50'
                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isActionProcessing) {
                            handleActionClick(survey.id, action);
                            setOpenDropdownId(null);
                          }
                        }}
                      >
                        <span className="flex items-center gap-2">
                          {isActionProcessing && (
                            <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          )}
                          {!isActionProcessing && action === 'activate' && <span className="text-green-600">▶</span>}
                          {!isActionProcessing && action === 'pause' && <span className="text-amber-600">⏸</span>}
                          {!isActionProcessing && action === 'close' && <span className="text-red-600">⏹</span>}
                          {!isActionProcessing && (action === 'view_results' || action === 'review_results') && <span className="text-blue-600">👁</span>}
                          {actionConfig[action].text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400 italic">Không có hành động</span>
        );

      return (
        <tr key={survey.id} className="bg-white hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 border-b border-gray-100 transition-all duration-300 group cursor-pointer">
          <td className="px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 relative">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 group-hover:from-blue-400 group-hover:to-blue-600 transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:scale-125"></div>
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-blue-400 opacity-0 group-hover:opacity-30 group-hover:animate-ping"></div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors duration-200" title={survey.name}>
                  {survey.name}
                </div>
                {survey.description && (
                  <div className="text-xs text-gray-500 truncate mt-1 group-hover:text-gray-600 transition-colors duration-200" title={survey.description}>
                    {survey.description}
                  </div>
                )}
              </div>
            </div>
          </td>
          <td className="px-6 py-5">
            <span className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold ${colorMap[statusInfo.color]} transition-all duration-200 hover:scale-105 hover:shadow-md`}>
              <span className="text-sm">{statusInfo.icon}</span>
              <span>{statusInfo.text}</span>
            </span>
          </td>
          {reviewPermissionHtml}
          <td className="px-6 py-5 text-center relative">{actions}</td>
        </tr>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex">
      <AdminSidebar />
      <div className="flex-1 w-full h-screen antialiased text-slate-700 bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col overflow-hidden">
        <header className="bg-white shadow-md border-b border-gray-200 px-6 py-5 flex-shrink-0">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <button 
                onClick={() => navigate('/')} 
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Trở về trang chủ"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Trang chủ
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-slate-800 via-blue-700 to-slate-800 bg-clip-text text-transparent">
                    Quản Lý Trạng Thái Khảo Sát
                  </h1>
                </div>
                <p className="text-sm md:text-base text-slate-500 ml-[52px]">Thay đổi trạng thái hoạt động và quyền xem lại của các khảo sát.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-5 rounded-2xl shadow-lg border-2 border-blue-100/50 flex-1 lg:flex-none relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200/20 rounded-full -ml-12 -mb-12 blur-xl"></div>
                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                      <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">Thời gian hiện tại</div>
                    </div>
                    <div className="text-base md:text-lg font-mono font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                      {currentTime.toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => loadSurveys()}
                    disabled={loading || isRefreshing.current}
                    className="flex-shrink-0 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 transform hover:rotate-180 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-indigo-600 disabled:hover:rotate-0 disabled:active:scale-100"
                    title="Làm mới danh sách"
                  >
                    <svg className={`w-5 h-5 ${loading || isRefreshing.current ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 🔹 Bỏ overflow-hidden để dropdown không bị clip */}
        <div className="flex-1 overflow-auto bg-gradient-to-b from-gray-50 to-white">
          <div className="h-full flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100"></div>
                    </div>
                  </div>
                  <p className="mt-6 text-gray-600 font-medium text-lg">Đang tải danh sách khảo sát...</p>
                  <p className="mt-2 text-gray-400 text-sm">Vui lòng đợi trong giây lát</p>
                </div>
              </div>
            ) : surveysState.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center max-w-md">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Không có khảo sát nào</h3>
                  <p className="text-gray-500">Hiện tại chưa có khảo sát nào trong hệ thống.</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto px-6 py-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left text-gray-700 min-w-full">
                      <thead className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 text-gray-700 text-xs uppercase font-extrabold sticky top-0 z-10 border-b-2 border-gray-300 shadow-sm">
                        <tr>
                          <th className="px-6 py-5 text-gray-700 tracking-wider">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Tên khảo sát
                            </div>
                          </th>
                          <th className="px-6 py-5 text-gray-700 tracking-wider">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Trạng thái
                            </div>
                          </th>
                          {(currentUserRole === 'admin' || currentUserRole === 'lecturer') && (
                            <th className="px-6 py-5 text-gray-700 tracking-wider">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Cho phép xem lại
                              </div>
                            </th>
                          )}
                          <th className="px-6 py-5 text-center text-gray-700 tracking-wider">
                            <div className="flex items-center justify-center gap-2">
                              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                              </svg>
                              Hành động
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">{renderSurveyList()}</tbody>
                    </table>
                  </div>
                </div>
                <Pagination />
              </div>
            )}
          </div>
        </div>

        {confirmationModal.show && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-200 scale-100">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">{confirmationModal.title}</h2>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-6 whitespace-pre-line text-left leading-relaxed">{confirmationModal.text}</p>
                <div className="flex justify-end gap-3">
                  {(() => {
                    const actionKey = activeAction.surveyId && activeAction.action 
                      ? `change-status-${activeAction.surveyId}-${activeAction.action}` 
                      : null;
                    const isConfirmProcessing = actionKey ? isProcessing(actionKey) : false;
                    
                    return (
                      <>
                        <button
                          onClick={hideConfirmationModal}
                          disabled={isConfirmProcessing}
                          className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleConfirmAction}
                          disabled={isConfirmProcessing}
                          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:active:scale-100 flex items-center gap-2"
                        >
                          {isConfirmProcessing && (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          )}
                          Xác nhận
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="fixed top-6 right-6 space-y-3 z-50">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`px-5 py-3 rounded-xl shadow-xl text-white min-w-[300px] max-w-md transform transition-all duration-300 translate-x-0 ${
                toast.type === 'success' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                  : 'bg-gradient-to-r from-red-500 to-rose-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {toast.type === 'success' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <p className="flex-1 font-medium text-sm leading-relaxed">{toast.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatusManagementAdmin;