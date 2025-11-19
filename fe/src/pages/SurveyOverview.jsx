import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Chart, registerables } from "chart.js";
import toast from "react-hot-toast";
import { getSurveyRawData, getSurveyOverview } from "../api/graphql/survey";
import "../assets/css/RawDataList.css";
import { exportSurveyOverviewCSV } from "../utils/exports/overview/csv";
import { exportSurveyOverviewExcel } from "../utils/exports/overview/excel";
import { exportSurveyOverviewPDF } from "../utils/exports/overview/pdf";
import { ensureSurveyOwnership } from "../utils/surveyOwnership";

Chart.register(...registerables);

export default function SurveyOverview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { surveyId } = useParams();
  const [surveyTitle, setSurveyTitle] = useState("Khảo sát");
  const [surveyStatus, setSurveyStatus] = useState("Đã đóng");
  const [totalResponses, setTotalResponses] = useState(0);
  const [completionRate, setCompletionRate] = useState("0%");
  const [rawData, setRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [filterKhoa, setFilterKhoa] = useState("all");
  const [filterKhoaHoc, setFilterKhoaHoc] = useState("all");
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [accessChecking, setAccessChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Chart refs for question-specific charts
  const chartRefs = useRef({});
  const chartInstances = useRef({});

  // Guard access to prevent unauthorized viewing via URL manipulation
  useEffect(() => {
    let isMounted = true;

    const guardSurvey = async () => {
      if (!surveyId) return;
      setAccessChecking(true);
      const result = await ensureSurveyOwnership(Number(surveyId));
      if (!isMounted) return;

      if (result.allowed) {
        setHasAccess(true);
      } else {
        setHasAccess(false);
        if (result.reason === "AUTH_REQUIRED") {
          toast.error("Vui lòng đăng nhập để tiếp tục");
          navigate("/login", { replace: true });
        } else if (result.reason === "NOT_OWNER") {
          toast.error("Bạn không có quyền truy cập khảo sát này");
          navigate("/surveys/created", { replace: true });
        } else {
          toast.error("Không thể xác minh quyền truy cập khảo sát");
          navigate("/surveys/created", { replace: true });
        }
      }

      setAccessChecking(false);
    };

    guardSurvey();

    return () => {
      isMounted = false;
    };
  }, [surveyId, navigate]);

  // Fetch data
  useEffect(() => {
    if (!surveyId || !hasAccess) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch overview data for charts
        const overview = await getSurveyOverview(parseInt(surveyId));
        
        if (overview) {
          setOverviewData(overview);
          setTotalResponses(overview.totalResponses || 0);
          setSurveyTitle(overview.title || "Khảo sát");
          
          // Calculate completion rate (can be improved with target responses)
          const rate = overview.totalResponses > 0 
            ? Math.min(100, Math.round((overview.totalResponses / 150) * 100))
            : 0;
          setCompletionRate(`${rate}%`);
        }

        // Also fetch raw data for filters and export
        const rawDataResponse = await getSurveyRawData(parseInt(surveyId));
        if (rawDataResponse && rawDataResponse.responses) {
          setRawData(rawDataResponse.responses);
          setFilteredData(rawDataResponse.responses);
        } else {
          setRawData([]);
          setFilteredData([]);
        }
      } catch (err) {
        console.error(err);
        toast.error("Không tải được dữ liệu");
        setRawData([]);
        setFilteredData([]);
        setTotalResponses(0);
        setOverviewData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [surveyId, hasAccess]);

  // Determine active tab from URL
  useEffect(() => {
    if (location.pathname.includes("/raw-data")) {
      setActiveTab("raw-data");
    } else {
      setActiveTab("overview");
    }
  }, [location.pathname]);

  const handleGoBack = () => {
    navigate("/surveys/created");
  };

  const handleTabSwitch = (tab) => {
    if (tab === "raw-data") {
      navigate(`/surveys/${surveyId}/raw-data`);
    } else {
      navigate(`/surveys/${surveyId}/overview`);
    }
  };

  const handleViewRawData = () => {
    navigate(`/surveys/${surveyId}/raw-data`);
  };

  const handleOpenDownloadModal = () => {
    setShowDownloadModal(true);
  };

  const handleCloseDownloadModal = () => {
    setShowDownloadModal(false);
  };

  const handleDownload = (format) => {
    setShowDownloadModal(false);
    setTimeout(() => {
      try {
        if (!overviewData || !overviewData.questions || overviewData.questions.length === 0) {
          throw new Error('Không có dữ liệu tổng quan để xuất');
        }
        if (format === 'csv') {
          exportSurveyOverviewCSV({ overviewData });
          toast.success('Đã tải xuống CSV');
        } else if (format === 'excel') {
          exportSurveyOverviewExcel({ overviewData });
          toast.success('Đã tải xuống Excel');
        } else if (format === 'pdf') {
          exportSurveyOverviewPDF({ overviewData });
          toast.success('Đã tải xuống PDF');
        } else {
          toast.error('Định dạng không hỗ trợ');
        }
      } catch (e) {
        console.error(e);
        toast.error(e.message || 'Không thể xuất dữ liệu');
      }
    }, 100);
  };

  const handleApplyFilter = () => {
    let filtered = rawData;

    if (filterKhoa !== "all") {
      filtered = filtered.filter((item) => item.khoa === filterKhoa);
    }

    // TODO: Add filter by khoa-hoc (course year) when available
    // Note: Filtering by faculty doesn't affect overview charts as they show all responses
    // If you want to filter charts, you'd need to refetch overview data with filters

    setFilteredData(filtered);
    toast.success(`Đã áp dụng lọc: ${filtered.length} lượt phản hồi`);
  };

  const handleResetFilter = () => {
    setFilterKhoa("all");
    setFilterKhoaHoc("all");
    setFilteredData(rawData);
    toast.success("Đã đặt lại bộ lọc");
  };

  // Convert overview data to chart-friendly format
  const getQuestionData = (overviewData) => {
    if (!overviewData || !overviewData.questions) {
      return null;
    }

    const questionsMap = {};
    
    overviewData.questions.forEach((question, index) => {
      const key = `q${index + 1}`;
      
      if (question.question_type === 'text') {
        // Text question - word cloud data
        const words = question.answer_stats.map(stat => [stat.option_text, stat.count]);
        const topWords = words.slice(0, 5).map(w => w[0]).join('", "');
        
        questionsMap[key] = {
          question: question.question_text,
          type: "text",
          words: words,
          highlight: words.length > 0 
            ? `Từ khóa nổi bật: "${topWords}"`
            : "Chưa có dữ liệu",
        };
      } else {
        // Single or multiple choice question
        const labels = question.answer_stats.map(stat => stat.option_text || 'Không có');
        const data = question.answer_stats.map(stat => stat.count || 0);
        const total = data.reduce((sum, val) => sum + val, 0);
        
        // Find the most popular answer
        const maxIndex = data.indexOf(Math.max(...data));
        const maxLabel = labels[maxIndex] || '';
        const maxCount = data[maxIndex] || 0;
        const maxPercentage = total > 0 ? Math.round((maxCount / total) * 100) : 0;
        
        questionsMap[key] = {
          question: question.question_text,
          type: question.question_type,
          labels: labels,
          data: data,
          highlight: total > 0
            ? `${maxPercentage}% (${maxCount} lượt) chọn "${maxLabel}"`
            : "Chưa có dữ liệu",
        };
      }
    });
    
    return questionsMap;
  };

  const updateChartsWithFilteredData = (overviewData) => {
    const questionData = getQuestionData(overviewData);
    if (!questionData) return;
    
    // Update all charts dynamically based on available questions
    Object.keys(questionData).forEach((key, index) => {
      const qData = questionData[key];
      if (chartInstances.current[key]) {
        if (qData.type !== 'text') {
          // Update chart data for choice questions
          chartInstances.current[key].data.labels = qData.labels;
          chartInstances.current[key].data.datasets[0].data = qData.data;
          chartInstances.current[key].update();
        }
        // Text questions don't have charts, they use word clouds
      }
    });
  };

  // Initialize charts
  useEffect(() => {
    if (loading || !overviewData) return;

    const questionData = getQuestionData(overviewData);
    if (!questionData) return;

    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

    // Initialize charts for each question
    Object.keys(questionData).forEach((key) => {
      const qData = questionData[key];
      const chartRef = chartRefs.current[key];
      
      if (!chartRef || chartInstances.current[key]) return;
      
      // Skip text questions (they use word clouds, not charts)
      if (qData.type === 'text') return;

      const ctx = chartRef.getContext("2d");
      
      // Determine chart type: use pie for questions with 2-4 options, bar for others
      const usePie = qData.labels.length >= 2 && qData.labels.length <= 4;
      const chartType = usePie ? "pie" : "bar";
      
      chartInstances.current[key] = new Chart(ctx, {
        type: chartType,
        data: {
          labels: qData.labels,
          datasets: [{
            label: "Số lượt",
            data: qData.data,
            backgroundColor: chartType === "pie" 
              ? colors.slice(0, qData.labels.length)
              : "#3b82f6",
            borderRadius: chartType === "bar" ? 8 : 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: chartType === "pie",
              position: "top",
              labels: { 
                color: "#6b7280", 
                font: { size: 12 },
                padding: 10,
              },
            },
            title: {
              display: false, // Question text is shown in the card header
            },
          },
          scales: chartType === "bar" ? {
            x: {
              ticks: { color: "#6b7280" },
              grid: { color: "#e5e7eb" },
            },
            y: {
              ticks: { color: "#6b7280" },
              grid: { color: "#e5e7eb" },
              beginAtZero: true,
            },
          } : {},
        },
      });
    });

    return () => {
      Object.values(chartInstances.current).forEach((chart) => {
        if (chart) chart.destroy();
      });
      chartInstances.current = {};
    };
  }, [loading, overviewData]);

  const questionData = overviewData ? getQuestionData(overviewData) : null;

  if (accessChecking || loading) {
    return (
      <div className="raw-data-list-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="raw-data-list-page">
      <div className="raw-data-container">
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

        {/* Header Section */}
        <div className="header-section">
          <h1>{surveyTitle}</h1>
          <p className="subtitle">Tổng quan và phân tích kết quả khảo sát</p>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => handleTabSwitch("overview")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Tổng quan
          </button>
          <button
            className={`tab-button ${activeTab === "raw-data" ? "active" : ""}`}
            onClick={() => handleTabSwitch("raw-data")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
            </svg>
            Dữ liệu Chi tiết
          </button>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card summary-card-primary">
            <div className="summary-card-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="summary-card-content">
              <div className="summary-card-value">{totalResponses}</div>
              <div className="summary-card-label">Tổng Phản hồi</div>
            </div>
          </div>

          <div className="summary-card summary-card-success">
            <div className="summary-card-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="summary-card-content">
              <div className="summary-card-value">{completionRate}</div>
              <div className="summary-card-label">Tỷ lệ Hoàn thành</div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="action-bar">
          <button className="btn btn-primary" onClick={handleOpenDownloadModal}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Tải dữ liệu
          </button>
        </div>

        {/* Download Modal */}
        {showDownloadModal && (
          <div className="modal-overlay" onClick={handleCloseDownloadModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Chọn định dạng tải xuống</h3>
                <button className="modal-close" onClick={handleCloseDownloadModal}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <button
                  className="download-option download-option-excel"
                  onClick={() => handleDownload('excel')}
                >
                  <div className="download-option-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                  </div>
                  <div className="download-option-content">
                    <h4>Excel</h4>
                    <p>Tải xuống dạng bảng tính (.xlsx)</p>
                  </div>
                  <div className="download-option-arrow">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>

                <button
                  className="download-option download-option-pdf"
                  onClick={() => handleDownload('pdf')}
                >
                  <div className="download-option-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <div className="download-option-content">
                    <h4>PDF</h4>
                    <p>Tải xuống báo cáo đầy đủ (.pdf)</p>
                  </div>
                  <div className="download-option-arrow">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>

                <button
                  className="download-option download-option-csv"
                  onClick={() => handleDownload('csv')}
                >
                  <div className="download-option-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="9" y1="12" x2="15" y2="12" />
                      <line x1="9" y1="16" x2="15" y2="16" />
                    </svg>
                  </div>
                  <div className="download-option-content">
                    <h4>CSV</h4>
                    <p>Tải xuống dữ liệu thô (.csv)</p>
                  </div>
                  <div className="download-option-arrow">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="controls" style={{ marginBottom: "2rem" }}>
          <label htmlFor="filter-khoa" style={{ fontWeight: "bold", color: "#374151" }}>
            Lọc Dữ liệu:
          </label>
          <select
            id="filter-khoa"
            value={filterKhoa}
            onChange={(e) => setFilterKhoa(e.target.value)}
            aria-label="Lọc theo khoa"
          >
            <option value="all">Tất cả Khoa</option>
            <option value="cntt">Công nghệ Thông tin</option>
            <option value="kinhte">Kinh tế</option>
            <option value="other">Khác</option>
          </select>
          <select
            id="filter-khoa-hoc"
            value={filterKhoaHoc}
            onChange={(e) => setFilterKhoaHoc(e.target.value)}
            aria-label="Lọc theo khóa học"
          >
            <option value="all">Tất cả Khóa học</option>
            <option value="k21">K2021</option>
            <option value="k22">K2022</option>
            <option value="k23">K2023</option>
          </select>
          <button className="btn btn-primary" onClick={handleApplyFilter}>
            Áp dụng Lọc
          </button>
          <button className="btn btn-secondary" onClick={handleResetFilter}>
            Đặt lại
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "#6b7280" }}>Đang tải...</p>
          </div>
        ) : questionData && Object.keys(questionData).length > 0 ? (
          <>
            <h2 className="section-title">Chi tiết Kết quả Câu hỏi</h2>

            {/* Question Results */}
            <div className="question-results">
              {Object.keys(questionData).map((key, index) => {
                const qData = questionData[key];
                const isTextQuestion = qData.type === 'text';
                const maxCount = isTextQuestion 
                  ? (qData.words.length > 0 ? Math.max(...qData.words.map(w => w[1]), 1) : 1)
                  : (qData.data.length > 0 ? Math.max(...qData.data, 1) : 1);

                return (
                  <div 
                    key={key} 
                    className={`question-card ${isTextQuestion ? 'question-card-wide' : ''}`}
                  >
                    <div className="question-header">
                      <span className="question-number">{index + 1}</span>
                      <h3 className="question-text">{qData.question}</h3>
                    </div>
                    
                    {isTextQuestion ? (
                      // Text question - Word Cloud
                      <div className="word-cloud">
                        {qData.words.length > 0 ? (
                          qData.words.map(([word, count], idx) => (
                            <span
                              key={idx}
                              className="word-tag"
                              style={{
                                fontSize: `${0.9 + (count / maxCount) * 2}rem`,
                              }}
                            >
                              {word}
                              <span className="word-count">{count}</span>
                            </span>
                          ))
                        ) : (
                          <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                            Chưa có câu trả lời
                          </p>
                        )}
                      </div>
                    ) : (
                      // Choice question - Chart
                      <div className="question-chart">
                        <canvas ref={(el) => (chartRefs.current[key] = el)}></canvas>
                      </div>
                    )}
                    
                    <div className="question-insight">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                      <span>{qData.highlight}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "#6b7280" }}>Không có dữ liệu</p>
          </div>
        )}
      </div>
    </div>
  );
}
