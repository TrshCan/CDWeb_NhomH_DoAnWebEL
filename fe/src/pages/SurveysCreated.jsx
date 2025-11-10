import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../assets/css/SurveysMade.css";
import { getSurveysMadeByUser } from "../api/graphql/survey";

// Mock data - replace with actual API calls later
const mockSurveys = [
  {
    id: 1,
    title: "Khảo sát Mức độ Hài lòng với Trang Social",
    createdDate: "2025-09-01",
    endDate: "2025-09-25",
    status: "closed",
    responses: 150,
  },
  {
    id: 2,
    title: "Đánh giá Đề cương môn học - Cấu trúc Dữ liệu",
    createdDate: "2025-10-15",
    endDate: "2025-11-30",
    status: "open",
    responses: 85,
  },
  {
    id: 3,
    title: "Định hướng Đồ án Tốt nghiệp - Khóa 2021",
    createdDate: "2025-11-01",
    endDate: null,
    status: "draft",
    responses: 0,
  },
];

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

  // Load surveys from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userIdStr = localStorage.getItem("userId");
        if (!userIdStr) {
          toast.error("Vui lòng đăng nhập để xem khảo sát đã tạo");
          setSurveys([]);
          setFilteredSurveys([]);
          setLoading(false);
          return;
        }
        const data = await getSurveysMadeByUser(parseInt(userIdStr));
        const mapped = (data || []).map((s) => ({
          id: s.id,
          title: s.title,
          createdDate: s.created_at,
          endDate: s.end_at,
          status: s.status, // "open" | "closed" | "draft"
          responses: Number(s.responses ?? 0),
        }));
        setSurveys(mapped);
        setFilteredSurveys(mapped);
      } catch (err) {
        console.error(err);
        toast.error("Không tải được danh sách khảo sát");
        setSurveys([]);
        setFilteredSurveys([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate metrics
  const metrics = {
    total: surveys.length,
    open: surveys.filter((s) => s.status === "open").length,
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

  // Action handlers
  const handleCreateSurvey = () => {
    toast.success("Chuyển hướng đến trang Tạo Khảo sát Mới...");
    // navigate("/surveys/create");
  };

  const handleViewResults = (surveyId, surveyTitle) => {
    navigate(`/surveys/${surveyId}/overview`);
  };

  const handleEditSurvey = (surveyId, surveyTitle) => {
    toast.success(`Chỉnh sửa: ${surveyTitle}`);
    // navigate(`/surveys/${surveyId}/edit`);
  };

  const handleDuplicateSurvey = (surveyId, surveyTitle) => {
    toast.success(`Tạo bản sao: ${surveyTitle}`);
    // Duplicate logic here
  };

  const handleCloseSurvey = (surveyId, surveyTitle) => {
    if (window.confirm(`Bạn có chắc muốn đóng khảo sát: ${surveyTitle}?`)) {
      setSurveys(
        surveys.map((s) =>
          s.id === surveyId ? { ...s, status: "closed" } : s
        )
      );
      toast.success("Khảo sát đã được đóng");
    }
  };

  const handleDeleteSurvey = (surveyId, surveyTitle) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn XÓA vĩnh viễn khảo sát: ${surveyTitle}?`
      )
    ) {
      setSurveys(surveys.filter((s) => s.id !== surveyId));
      toast.success("Khảo sát đã được xóa");
    }
  };

  const getStatusBadge = (status) => {
    const labels = {
      open: "Đang mở",
      closed: "Đã đóng",
      draft: "Nháp",
    };

    return (
      <span
        className={`status-badge status-${status}`}
      >
        {labels[status]}
      </span>
    );
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="surveys-made-page">
      <div className="surveys-made-container">
        {/* Back Button */}
        <button onClick={handleGoBack} className="back-button">
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
              <option value="open">Đang mở</option>
              <option value="closed">Đã đóng</option>
              <option value="draft">Nháp</option>
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
                          onClick={() => handleEditSurvey(survey.id, survey.title)}
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
                            handleCloseSurvey(survey.id, survey.title)
                          }
                          className={`action-button action-button-close ${
                            survey.status === "closed" ? "disabled" : ""
                          }`}
                          title="Đóng"
                          disabled={survey.status === "closed"}
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
                              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
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
