import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../assets/css/SurveysMade.css";
import "../assets/css/BackButton.css";
import { getSurveysMadeByUser, duplicateSurvey, deleteSurvey, getSurveyDetails, getCurrentUserProfile } from "../api/graphql/survey";
import EditSurveyModal from "../components/EditSurveyModal";
import CreateSurveyModal from "../components/CreateSurveyModal";


const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function SurveysCreated() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [filteredSurveys, setFilteredSurveys] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const surveysRef = useRef([]);

  // Check authentication and role on component mount
  useEffect(() => {
    const checkAccessAndFetchData = async () => {
      setLoading(true);
      
      const token = localStorage.getItem("token");
      const userIdStr = localStorage.getItem("userId");
      
      // Check if user is logged in
      if (!token || !userIdStr) {
        toast.error("Vui lòng đăng nhập để truy cập trang này");
        navigate("/login", { replace: true });
        setLoading(false);
        return;
      }
      
      try {
        // Fetch user profile to check role
        const userProfile = await getCurrentUserProfile(parseInt(userIdStr));
        
        if (!userProfile) {
          toast.error("Không thể xác thực người dùng");
          navigate("/login", { replace: true });
          setLoading(false);
          return;
        }
        
        const userRole = userProfile.role?.toLowerCase();
        
        // Check if user has lecturer or admin role
        if (userRole !== "lecturer" && userRole !== "admin") {
          toast.error("Bạn không có quyền truy cập trang này. Chỉ giảng viên và quản trị viên mới có thể tạo khảo sát.");
          navigate("/", { replace: true });
          setLoading(false);
          return;
        }
        
        // If access is granted, fetch surveys
        
        const data = await getSurveysMadeByUser(parseInt(userIdStr));
        const mapped = (data || []).map((s) => ({
          id: s.id,
          title: s.title,
          createdDate: s.created_at,
          startDate: s.start_at,
          endDate: s.end_at,
          status: s.status, // Use status directly from backend
          responses: Number(s.responses ?? 0),
        }));
        setSurveys(mapped);
        setFilteredSurveys(mapped);
        surveysRef.current = mapped;
      } catch (err) {
        console.error(err);
        
        // Extract error message from backend
        let errorMessage = 'Không tải được danh sách khảo sát';
        
        if (err.graphQLErrors && err.graphQLErrors.length > 0) {
          const firstError = err.graphQLErrors[0];
          
          if (firstError.extensions?.validation) {
            const validationErrors = firstError.extensions.validation;
            const validationMessages = Object.values(validationErrors)
              .flat()
              .filter(msg => msg && msg.trim() !== '');
            
            if (validationMessages.length > 0) {
              errorMessage = validationMessages.join(', ');
            }
          }
          
          if (errorMessage === 'Không tải được danh sách khảo sát' && firstError.message) {
            errorMessage = firstError.message;
          }
        } else if (err.message && err.message !== 'GraphQL error') {
          errorMessage = err.message;
        }
        
        // Check if it's an authentication error
        if (errorMessage.includes("Authentication") || 
            errorMessage.includes("Unauthorized") ||
            errorMessage.includes("Invalid or expired token")) {
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại");
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          navigate("/login");
        } else {
          toast.error(errorMessage);
        }
        
        setSurveys([]);
        setFilteredSurveys([]);
        surveysRef.current = [];
      } finally {
        setLoading(false);
      }
    };
    
    checkAccessAndFetchData();
  }, [navigate]);

  // Calculate metrics
  const metrics = {
    total: surveys.length,
    open: surveys.filter((s) => s.status === "active" || s.status === "open").length,
    totalResponses: surveys.reduce((sum, s) => sum + s.responses, 0),
  };

  // Filter surveys
  useEffect(() => {
    let filtered = surveys;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((survey) =>
        survey.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((survey) => survey.status === statusFilter);
    }

    setFilteredSurveys(filtered);
  }, [searchQuery, statusFilter, surveys]);

  const refreshSurveysList = useCallback(async (silent = false) => {
    const userIdStr = localStorage.getItem("userId");
    if (!userIdStr) return;
    
    try {
      const data = await getSurveysMadeByUser(parseInt(userIdStr));
      const mapped = (data || []).map((s) => ({
        id: s.id,
        title: s.title,
        createdDate: s.created_at,
        startDate: s.start_at,
        endDate: s.end_at,
        status: s.status, // Use status directly from backend
        responses: Number(s.responses ?? 0),
      }));
      
      // Compare with current list to detect deleted surveys
      const currentSurveys = surveysRef.current;
      if (!silent && currentSurveys.length > 0) {
        const currentIds = new Set(currentSurveys.map(s => s.id));
        const newIds = new Set(mapped.map(s => s.id));
        
        // Find deleted surveys
        const deletedSurveys = currentSurveys.filter(s => !newIds.has(s.id));
        
        if (deletedSurveys.length > 0) {
          if (deletedSurveys.length === 1) {
            toast.error(`Khảo sát "${deletedSurveys[0].title}" đã bị xóa. Đang làm mới danh sách...`);
          } else {
            toast.error(`${deletedSurveys.length} khảo sát đã bị xóa. Đang làm mới danh sách...`);
          }
        }
      }
      
      setSurveys(mapped);
      setFilteredSurveys(mapped);
      surveysRef.current = mapped;
    } catch (error) {
      console.error("Error refreshing surveys list:", error);
      if (!silent) {
        toast.error("Không thể làm mới danh sách khảo sát");
      }
    }
  }, []);

  // Periodic check for deleted surveys (every 30 seconds)
  useEffect(() => {
    if (loading || surveys.length === 0) return;
    
    const interval = setInterval(() => {
      refreshSurveysList(false);
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [loading, surveys.length, refreshSurveysList]);

  // Check for deleted surveys when window/tab gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (!loading && surveys.length > 0) {
        refreshSurveysList(false);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loading, surveys.length, refreshSurveysList]);

  // Helper function to handle survey not found errors
  const handleSurveyNotFoundError = async (error, surveyTitle) => {
    let errorMessage = '';
    
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      errorMessage = error.graphQLErrors[0].message || '';
    } else if (error.message && error.message !== "GraphQL error") {
      errorMessage = error.message;
    }
    
    // Check if survey is deleted or doesn't exist
    if (errorMessage.includes('đã bị xóa') || 
        errorMessage.includes('không tồn tại') ||
        errorMessage.includes('Invalid') ||
        errorMessage.includes('Khảo sát không tồn tại')) {
      // Refresh list silently to update UI
      await refreshSurveysList(true);
      toast.error(`Khảo sát "${surveyTitle}" đã bị xóa hoặc không tồn tại.`);
      return true; // Indicates it was a "not found" error
    }
    
    return false; // Not a "not found" error
  };

  // Action handlers
  const handleCreateSurvey = () => {
    setIsCreateModalOpen(true);
  };

  const handleViewResults = (surveyId) => {
    // Navigate directly - let the overview page handle any errors
    navigate(`/surveys/${surveyId}/overview`);
  };

  const handleEditSurvey = (surveyId) => {
    // Open modal directly - let the modal handle loading and errors
    setSelectedSurveyId(surveyId);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (surveyId, updatedSurvey) => {
    // Modal already handles success/error toasts
    // Just refresh the list silently
    try {
      await refreshSurveysList(true);
    } catch (error) {
      console.error("Error refreshing surveys list:", error);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedSurveyId(null);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleSaveCreate = async (newSurvey) => {
    // Modal already handles success/error toasts
    // Just refresh the list silently
    try {
      await refreshSurveysList(true);
    } catch (error) {
      console.error("Error refreshing surveys list:", error);
    }
  };

  const handleDuplicateSurvey = async (surveyId, surveyTitle) => {
    if (!window.confirm(`Bạn có chắc muốn tạo bản sao của khảo sát: ${surveyTitle}?`)) {
      return;
    }

    try {
      const duplicatedSurvey = await duplicateSurvey(surveyId);
      
      // Refresh the surveys list to get the latest data (silently)
      await refreshSurveysList(true);
      
      toast.success(`Đã tạo bản sao: ${duplicatedSurvey.title || surveyTitle}`);
    } catch (error) {
      console.error("Error duplicating survey:", error);
      
      // Check if it's a "not found" error and handle it
      const wasNotFound = await handleSurveyNotFoundError(error, surveyTitle);
      if (wasNotFound) {
        return; // Error already handled
      }
      
      // Extract error message from GraphQL response
      let errorMessage = 'Không thể tạo bản sao khảo sát';
      
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        const firstError = error.graphQLErrors[0];
        
        // Check validation errors first
        if (firstError.extensions?.validation) {
          const validationErrors = firstError.extensions.validation;
          const validationMessages = Object.values(validationErrors)
            .flat()
            .filter(msg => msg && msg.trim() !== '');
          
          if (validationMessages.length > 0) {
            errorMessage = validationMessages.join(', ');
          }
        }
        
        // If no validation errors, use the error message
        if (errorMessage === 'Không thể tạo bản sao khảo sát' && firstError.message) {
          errorMessage = firstError.message;
        }
      } else if (error.message && error.message !== 'GraphQL error') {
        errorMessage = error.message;
      }
      
      // Handle specific error messages
      if (errorMessage.includes('Đang xử lý yêu cầu')) {
        errorMessage = 'Đang xử lý yêu cầu. Vui lòng đợi và thử lại sau vài giây.';
      }
      
      toast.error(errorMessage);
    }
  };


  const handleDeleteSurvey = async (surveyId, surveyTitle) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn XÓA vĩnh viễn khảo sát: ${surveyTitle}?`
      )
    ) {
      return;
    }

    try {
      await deleteSurvey(surveyId);
      
      // Refresh the surveys list to get the latest data (silently)
      await refreshSurveysList(true);
      
      toast.success("Khảo sát đã được xóa");
    } catch (error) {
      console.error("Error deleting survey:", error);
      
      // Check if it's a "not found" error and handle it
      const wasNotFound = await handleSurveyNotFoundError(error, surveyTitle);
      if (wasNotFound) {
        return; // Error already handled
      }
      
      // Extract error message from GraphQL response
      let errorMessage = 'Không thể xóa khảo sát';
      
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        const firstError = error.graphQLErrors[0];
        
        // Check validation errors first
        if (firstError.extensions?.validation) {
          const validationErrors = firstError.extensions.validation;
          const validationMessages = Object.values(validationErrors)
            .flat()
            .filter(msg => msg && msg.trim() !== '');
          
          if (validationMessages.length > 0) {
            errorMessage = validationMessages.join(', ');
          }
        }
        
        // If no validation errors, use the error message
        if (errorMessage === 'Không thể xóa khảo sát' && firstError.message) {
          errorMessage = firstError.message;
        }
      } else if (error.message && error.message !== 'GraphQL error') {
        errorMessage = error.message;
      }
      
      // Handle specific error messages
      if (errorMessage.includes('Đang xử lý yêu cầu')) {
        errorMessage = 'Đang xử lý yêu cầu. Vui lòng đợi và thử lại sau vài giây.';
      } else if (errorMessage.includes('Khảo sát đã bị xóa trước đó') || errorMessage.includes('đã bị xóa')) {
        errorMessage = 'Khảo sát đã bị xóa trước đó. Không thể xóa lại.';
      }
      
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (status) => {
    const labels = {
      pending: "Chờ duyệt",
      active: "Đang hoạt động",
      paused: "Tạm dừng",
      closed: "Đã đóng",
    };

    const statusClass = status === "pending" ? "status-pending" :
                       status === "active" ? "status-active" :
                       status === "paused" ? "status-paused" :
                       status === "closed" ? "status-closed" :
                       "status-default";

    return (
      <span className={`status-badge ${statusClass}`}>
        {labels[status] || status}
      </span>
    );
  };

  const handleGoBack = () => {
    navigate("/");
  };

  return (
    <div className="surveys-made-page">
      <EditSurveyModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        surveyId={selectedSurveyId}
        onSave={handleSaveEdit}
      />
      <CreateSurveyModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSave={handleSaveCreate}
      />
      <div className="surveys-made-container">
        {/* Back Button */}
        <button onClick={handleGoBack} className="enhanced-back-button">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Quay lại
        </button>

        <div className="surveys-made-card">
          {/* Header */}
          <div className="surveys-made-header">
            <h1 className="surveys-made-title">
              Khảo sát Đã Tạo
            </h1>
            <p className="surveys-made-subtitle">
              Quản lý và theo dõi các khảo sát bạn đã tạo
            </p>
          </div>

        {/* Metrics Cards */}
        <div className="metrics-grid">
          <div className="metric-card metric-card-blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng số Khảo sát</p>
                <p className="text-3xl font-bold text-gray-800">
                  {metrics.total}
                </p>
              </div>
              <div className="metric-icon">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="metric-card metric-card-green">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Khảo sát Đang Mở</p>
                <p className="text-3xl font-bold text-gray-800">
                  {metrics.open}
                </p>
              </div>
              <div className="metric-icon">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="metric-card metric-card-purple">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng Lượt Phản hồi</p>
                <p className="text-3xl font-bold text-gray-800">
                  {metrics.totalResponses.toLocaleString()}
                </p>
              </div>
              <div className="metric-icon">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M7 10a4 4 0 100-8 4 4 0 000 8zm8 0a4 4 0 100-8 4 4 0 000 8z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="controls-section">
          <button
            onClick={handleCreateSurvey}
            className="create-button"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Tạo Khảo sát Mới
          </button>

          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input flex-1"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-select"
            >
              <option value="all">Tất cả Trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="active">Đang hoạt động</option>
              <option value="paused">Tạm dừng</option>
              <option value="closed">Đã đóng</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="table-wrapper">
            <thead className="table-header">
              <tr>
                <th>Tên Khảo sát</th>
                <th>Ngày Tạo</th>
                <th>Ngày Đóng</th>
                <th>Trạng thái</th>
                <th>Lượt TG</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {loading ? (
                <tr>
                  <td colSpan="6" className="empty-state">Đang tải...</td>
                </tr>
              ) : filteredSurveys.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    Không tìm thấy khảo sát nào
                  </td>
                </tr>
              ) : (
                filteredSurveys.map((survey) => (
                  <tr key={survey.id} className="table-row">
                    <td>
                      <div className="text-sm font-medium text-gray-900">
                        {survey.title}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-gray-600">
                        {formatDate(survey.createdDate)}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-gray-600">
                        {formatDate(survey.endDate)}
                      </div>
                    </td>
                    <td>{getStatusBadge(survey.status)}</td>
                    <td>
                      <div className="text-sm font-medium text-gray-900">
                        {survey.responses}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleViewResults(survey.id)}
                          className="action-button action-button-view"
                          title="Xem Kết quả"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditSurvey(survey.id)}
                          className="action-button action-button-edit"
                          title="Chỉnh sửa"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => navigate(`/surveys/${survey.id}/edit`)}
                          className="action-button action-button-edit"
                          title="Chỉnh sửa câu hỏi"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() =>
                            handleDuplicateSurvey(survey.id, survey.title)
                          }
                          className="action-button action-button-duplicate"
                          title="Sao chép"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteSurvey(survey.id, survey.title)
                          }
                          className="action-button action-button-delete"
                          title="Xóa"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  );
}
