import React, { useState, useEffect, useRef } from 'react';
import { graphqlRequest } from "../api/graphql";

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
  const [surveysState, setSurveysState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date()); // Thời gian thực
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
  const [isProcessing, setIsProcessing] = useState({ action: false, toggle: {} }); // Loading state cho actions
  const itemsPerPage = 10;
  const lastRefreshTime = useRef(0); // Lưu thời gian refresh cuối cùng
  const isRefreshing = useRef(false); // Flag để tránh refresh đồng thời

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
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
      // Map dữ liệu từ API sang format của component
      const mappedSurveys = surveysData.map(s => ({
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
      <div className="bg-white p-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-sm text-gray-700">
            Trang <b>{currentPage}</b> trên <b>{totalPages}</b> ({surveysState.length} khảo sát)
          </span>
          <div className="inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => handlePageChange(-1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Trước
            </button>
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

  const handleToggleReview = async (surveyId, isAllowed) => {
    // Prevent spam submit
    if (isProcessing.toggle[surveyId]) {
      return;
    }
    
    setIsProcessing(prev => ({ ...prev, toggle: { ...prev.toggle, [surveyId]: true } }));
    
    try {
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
        let errorMessage = result.errors[0]?.message || 'Không thể cập nhật quyền xem lại';
        
        // Handle specific error messages
        if (errorMessage.includes('Đang xử lý yêu cầu')) {
          errorMessage = 'Đang xử lý yêu cầu. Vui lòng đợi và thử lại sau vài giây.';
        } else if (errorMessage.includes('Dữ liệu đã được cập nhật')) {
          errorMessage = 'Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang trước khi cập nhật.';
        }
        
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
      let errorMessage = error.message || 'Lỗi hệ thống khi cập nhật quyền xem lại';
      if (errorMessage.includes('Đang xử lý yêu cầu')) {
        errorMessage = 'Đang xử lý yêu cầu. Vui lòng đợi và thử lại sau vài giây.';
      } else if (errorMessage.includes('Dữ liệu đã được cập nhật')) {
        errorMessage = 'Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang trước khi cập nhật.';
      }
      showToast(errorMessage, 'error');
    } finally {
      setIsProcessing(prev => ({ ...prev, toggle: { ...prev.toggle, [surveyId]: false } }));
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
    
    // Prevent spam submit
    if (isProcessing.action) {
      return;
    }
    
    setIsProcessing(prev => ({ ...prev, action: true }));
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
      setIsProcessing(prev => ({ ...prev, action: false }));
      return;
    }

    try {
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
        let errorMessage = result.errors[0]?.message || 'Không thể thay đổi trạng thái';
        
        // Handle specific error messages
        if (errorMessage.includes('Đang xử lý yêu cầu')) {
          errorMessage = 'Đang xử lý yêu cầu. Vui lòng đợi và thử lại sau vài giây.';
        } else if (errorMessage.includes('Dữ liệu đã được cập nhật')) {
          errorMessage = 'Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang trước khi cập nhật.';
        }
        
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
      let errorMessage = error.message || 'Lỗi hệ thống khi thay đổi trạng thái';
      if (errorMessage.includes('Đang xử lý yêu cầu')) {
        errorMessage = 'Đang xử lý yêu cầu. Vui lòng đợi và thử lại sau vài giây.';
      } else if (errorMessage.includes('Dữ liệu đã được cập nhật')) {
        errorMessage = 'Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang trước khi cập nhật.';
      }
      showToast(errorMessage, 'error');
    } finally {
      setIsProcessing(prev => ({ ...prev, action: false }));
    }
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
          <td className="px-4 md:px-6 py-4">
            <label className={`relative inline-flex items-center ${isProcessing.toggle[survey.id] ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                className="sr-only peer review-toggle"
                checked={survey.allowReview}
                disabled={isProcessing.toggle[survey.id]}
                onChange={(e) => handleToggleReview(survey.id, e.target.checked)}
              />
              <div className={`w-11 h-6 bg-gray-200 peer-checked:bg-blue-600 rounded-full after:content-[''] after:absolute after:w-5 after:h-5 after:bg-white after:rounded-full after:top-[2px] after:left-[2px] peer-checked:after:translate-x-full after:transition-all relative ${isProcessing.toggle[survey.id] ? 'opacity-50' : ''}`}>
                {isProcessing.toggle[survey.id] && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
            </label>
          </td>
        );
      } else {
        reviewPermissionHtml = <td className={currentUserRole === 'admin' ? 'px-4 md:px-6 py-4' : 'hidden'}></td>;
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
        <tr key={survey.id} className="bg-white hover:bg-gray-50 transition-colors">
          <td className="px-4 md:px-6 py-4 font-medium text-gray-900">
            <div className="max-w-md truncate" title={survey.name}>{survey.name}</div>
          </td>
          <td className="px-4 md:px-6 py-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[statusInfo.color]}`}>
              {statusInfo.text}
            </span>
          </td>
          {reviewPermissionHtml}
          <td className="px-4 md:px-6 py-4 text-center relative">{actions}</td>
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

      <div className="w-full h-screen antialiased text-slate-700 bg-gray-100 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Quản Lý Trạng Thái Khảo Sát</h1>
              <p className="text-sm md:text-base text-slate-500 mt-1">Thay đổi trạng thái hoạt động và quyền xem lại của các khảo sát.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <div className="text-xs md:text-sm text-gray-600">Thời gian hiện tại</div>
                <div className="text-sm md:text-lg font-mono font-semibold text-blue-600">
                  {currentTime.toLocaleString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
                <button
                  onClick={() => loadSurveys()}
                  className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  🔄 Làm mới
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 🔹 Bỏ overflow-hidden để dropdown không bị clip */}
        <div className="flex-1 overflow-auto bg-white">
          <div className="h-full flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Đang tải danh sách khảo sát...</p>
                </div>
              </div>
            ) : surveysState.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-12">
                <p className="text-gray-600 text-lg">Không có khảo sát nào</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm text-left text-gray-700 min-w-full">
                    <thead className="bg-gray-100 text-gray-900 text-xs uppercase font-semibold sticky top-0 z-10">
                      <tr>
                        <th className="px-4 md:px-6 py-3">Tên khảo sát</th>
                        <th className="px-4 md:px-6 py-3">Trạng thái</th>
                        {currentUserRole === 'admin' && <th className="px-4 md:px-6 py-3">Cho phép xem lại</th>}
                        <th className="px-4 md:px-6 py-3 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">{renderSurveyList()}</tbody>
                  </table>
                </div>
                <div className="border-t border-gray-200">
                  <Pagination />
                </div>
              </div>
            )}
          </div>
        </div>

        {confirmationModal.show && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{confirmationModal.title}</h2>
              <p className="text-gray-600 mb-6 whitespace-pre-line text-left">{confirmationModal.text}</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleConfirmAction}
                  disabled={isProcessing.action}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessing.action && (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isProcessing.action ? "Đang xử lý..." : "Xác nhận"}
                </button>
                <button 
                  onClick={hideConfirmationModal} 
                  disabled={isProcessing.action}
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
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