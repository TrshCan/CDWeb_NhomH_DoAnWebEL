import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../assets/css/SurveysMade.css";
import "../assets/css/BackButton.css";
import { getSurveysMadeByUser, duplicateSurvey, deleteSurvey, getSurveyDetails } from "../api/graphql/survey";
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

  // Load surveys from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userIdStr = localStorage.getItem("userId");
        const token = localStorage.getItem("token");
        
        if (!userIdStr || !token) {
          toast.error("Vui lòng đăng nhập để xem khảo sát đã tạo");
          navigate("/login");
          return;
        }
        
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
        
        // Check if it's an authentication error
        if (err.message?.includes("Authentication") || 
            err.message?.includes("Unauthorized") ||
            err.message?.includes("Invalid or expired token")) {
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại");
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          localStorage.removeItem("user");
          navigate("/login");
        } else {
          toast.error("Không tải được danh sách khảo sát");
        }
        
        setSurveys([]);
        setFilteredSurveys([]);
        surveysRef.current = [];
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  // Helper function to check if survey exists and is not deleted
  const checkSurveyExists = async (surveyId, surveyTitle) => {
    try {
      await getSurveyDetails(surveyId);
      return true;
    } catch (error) {
      // Extract error message
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
        // Refresh list silently first, then show error
        await refreshSurveysList(true);
        toast.error(`Khảo sát "${surveyTitle}" đã bị xóa hoặc không tồn tại.`);
        return false;
      }
      
      // For other errors, still return false but don't refresh
      return false;
    }
  };

  // Action handlers
  const handleCreateSurvey = () => {
    setIsCreateModalOpen(true);
  };

  const handleViewResults = async (surveyId, surveyTitle) => {
    // Check if survey exists and is not deleted
    const exists = await checkSurveyExists(surveyId, surveyTitle);
    if (!exists) {
      return;
    }
    
    navigate(`/surveys/${surveyId}/overview`);
  };

  const handleEditSurvey = async (surveyId) => {
    // Find survey title from current list
    const survey = surveys.find(s => s.id === surveyId);
    const surveyTitle = survey?.title || `ID: ${surveyId}`;
    
    // Check if survey exists and is not deleted
    const exists = await checkSurveyExists(surveyId, surveyTitle);
    if (!exists) {
      return;
    }
    
    setSelectedSurveyId(surveyId);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (surveyId, updatedSurvey) => {
    try {
      // Refresh the surveys list to get the latest data (silently)
      await refreshSurveysList(true);
    } catch (error) {
      console.error("Error updating survey:", error);
      // Don't re-throw since modal already handled the API call
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
    try {
      // Refresh the surveys list to get the latest data (silently)
      await refreshSurveysList(true);
    } catch (error) {
      console.error("Error refreshing surveys list:", error);
      // Don't show error toast as the modal already handled the creation
    }
  };

  const handleDuplicateSurvey = async (surveyId, surveyTitle) => {
    // Check if survey exists and is not deleted
    const exists = await checkSurveyExists(surveyId, surveyTitle);
    if (!exists) {
      return;
    }
    
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
      
      // Ưu tiên lấy message từ validation errors
      let errorMessage = '';
      
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        const firstError = error.graphQLErrors[0];
        
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
      }
      
      // Nếu không có graphQL errors, dùng error.message
      if (!errorMessage && error.message) {
        errorMessage = error.message;
      }
      
      // Fallback nếu vẫn không có message
      if (!errorMessage) {
        errorMessage = 'Không thể tạo bản sao khảo sát';
      }
      
      // Handle specific error messages
      if (errorMessage.includes('Đang xử lý yêu cầu')) {
        errorMessage = 'Đang xử lý yêu cầu. Vui lòng đợi và thử lại sau vài giây.';
      }
      
      toast.error(errorMessage);
    }
  };


  const handleDeleteSurvey = async (surveyId, surveyTitle) => {
    // Check if survey exists and is not deleted
    const exists = await checkSurveyExists(surveyId, surveyTitle);
    if (!exists) {
      return;
    }
    
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
      
      // Ưu tiên lấy message từ validation errors
      let errorMessage = '';
      
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        const firstError = error.graphQLErrors[0];
        
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
      }
      
      // Nếu không có graphQL errors, dùng error.message
      if (!errorMessage && error.message) {
        errorMessage = error.message;
      }
      
      // Fallback nếu vẫn không có message
      if (!errorMessage) {
        errorMessage = 'Không thể xóa khảo sát';
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
    navigate(-1);
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
                          onClick={() =>
                            handleViewResults(survey.id, survey.title)
                          }
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
