import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Chart, registerables } from "chart.js";
import toast from "react-hot-toast";
import { getSurveyRawData } from "../api/graphql/survey";
import "../assets/css/RawDataList.css";
import { exportSurveyOverviewCSV } from "../utils/exports/overview/csv";
import { exportSurveyOverviewExcel } from "../utils/exports/overview/excel";
import { exportSurveyOverviewPDF } from "../utils/exports/overview/pdf";

Chart.register(...registerables);

export default function SurveyOverview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { surveyId } = useParams();
  const [surveyTitle, setSurveyTitle] = useState("Khảo sát");
  const [surveyStatus, setSurveyStatus] = useState("Đã đóng");
  const [totalResponses, setTotalResponses] = useState(0);
  const [completionRate, setCompletionRate] = useState("85%");
  const [rawData, setRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [filterKhoa, setFilterKhoa] = useState("all");
  const [filterKhoaHoc, setFilterKhoaHoc] = useState("all");
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Chart refs for question-specific charts
  const chartRefs = useRef({});
  const chartInstances = useRef({});

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getSurveyRawData(parseInt(surveyId));

        if (data && data.responses) {
          setRawData(data.responses);
          setFilteredData(data.responses);
          setTotalResponses(data.responses.length);
          setSurveyTitle(data.title || "Khảo sát");
          
          // Calculate completion rate (mock for now)
          const rate = data.responses.length > 0 
            ? Math.min(100, Math.round((data.responses.length / 150) * 100))
            : 0;
          setCompletionRate(`${rate}%`);
        } else {
          setRawData([]);
          setFilteredData([]);
          setTotalResponses(0);
          setSurveyTitle("Khảo sát");
          setCompletionRate("0%");
        }
      } catch (err) {
        console.error(err);
        toast.error("Không tải được dữ liệu");
        setRawData([]);
        setFilteredData([]);
        setTotalResponses(0);
      } finally {
        setLoading(false);
      }
    };

    if (surveyId) {
      fetchData();
    }
  }, [surveyId]);

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

  const prepareExportData = () => {
    return filteredData.map((item) => ({
      "Mã SV": item.studentId,
      "Tên Sinh viên": item.studentName,
      "Khoa": item.khoa,
      "Ngày Hoàn thành": item.completedDate,
    }));
  };

  const handleDownload = (format) => {
    setShowDownloadModal(false);
    setTimeout(() => {
      try {
        if (format === 'csv') {
          const rows = prepareExportData();
          if (!rows.length) throw new Error('Không có dữ liệu để xuất');
          exportSurveyOverviewCSV({ rows, title: surveyTitle });
          toast.success('Đã tải xuống CSV');
        } else if (format === 'excel') {
          exportSurveyOverviewExcel({ title: surveyTitle, filteredData });
          toast.success('Đã tải xuống Excel');
        } else if (format === 'pdf') {
          exportSurveyOverviewPDF({ title: surveyTitle, filteredData });
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

    setFilteredData(filtered);
    updateChartsWithFilteredData(filtered);
    toast.success(`Đã áp dụng lọc: ${filtered.length} lượt phản hồi`);
  };

  const handleResetFilter = () => {
    setFilterKhoa("all");
    setFilterKhoaHoc("all");
    setFilteredData(rawData);
    updateChartsWithFilteredData(rawData);
    toast.success("Đã đặt lại bộ lọc");
  };

  // Mock question data - Replace with actual API data later
  const getQuestionData = (filteredData) => {
    // Mock data structure - replace with real question/answer data from API
    return {
      q1: {
        question: "Bạn thường truy cập trang social bao nhiêu lần một tuần?",
        type: "single_choice",
        labels: ["1 lần hoặc ít hơn", "2-3 lần", "4-5 lần", "Hơn 5 lần"],
        data: [Math.floor(filteredData.length * 0.13), Math.floor(filteredData.length * 0.5), Math.floor(filteredData.length * 0.27), Math.floor(filteredData.length * 0.1)],
        highlight: `50% (${Math.floor(filteredData.length * 0.5)} lượt) chọn "2-3 lần"`,
      },
      q2: {
        question: "Mức độ hữu ích của chức năng 'Nhóm học tập'?",
        type: "single_choice",
        labels: ["Rất không hữu ích", "Không hữu ích", "Bình thường", "Hữu ích", "Rất hữu ích"],
        data: [Math.floor(filteredData.length * 0.03), Math.floor(filteredData.length * 0.07), Math.floor(filteredData.length * 0.17), Math.floor(filteredData.length * 0.27), Math.floor(filteredData.length * 0.46)],
        highlight: `60% chọn "Rất hữu ích"`,
      },
      q3: {
        question: "Bạn có đề xuất tính năng nào khác không?",
        type: "text",
        words: [
          ["Sách cũ", Math.floor(filteredData.length * 0.33)],
          ["Dark mode", Math.floor(filteredData.length * 0.27)],
          ["Thông báo", Math.floor(filteredData.length * 0.2)],
          ["Tìm kiếm", Math.floor(filteredData.length * 0.13)],
          ["Nhóm học", Math.floor(filteredData.length * 0.1)],
        ],
        highlight: `Từ khóa nổi bật: "Sách cũ", "Dark mode", "Thông báo"`,
      },
      q4: {
        question: "Bạn có muốn trang web thông báo về sự kiện Đoàn trường không?",
        type: "single_choice",
        labels: ["Có", "Không"],
        data: [Math.floor(filteredData.length * 0.92), Math.floor(filteredData.length * 0.08)],
        highlight: `92% trả lời "Có"`,
      },
    };
  };

  const updateChartsWithFilteredData = (data) => {
    const questionData = getQuestionData(data);
    
    // Update Q1 chart (pie)
    if (chartInstances.current.q1) {
      chartInstances.current.q1.data.datasets[0].data = questionData.q1.data;
      chartInstances.current.q1.update();
    }

    // Update Q2 chart (bar)
    if (chartInstances.current.q2) {
      chartInstances.current.q2.data.datasets[0].data = questionData.q2.data;
      chartInstances.current.q2.update();
    }

    // Update Q4 chart (bar)
    if (chartInstances.current.q4) {
      chartInstances.current.q4.data.datasets[0].data = questionData.q4.data;
      chartInstances.current.q4.update();
    }

    // Update word cloud for Q3 (if implemented)
    // TODO: Implement word cloud update
  };

  // Initialize charts
  useEffect(() => {
    if (loading || filteredData.length === 0) return;

    const questionData = getQuestionData(filteredData);

    // Initialize Q1 Pie Chart
    if (!chartInstances.current.q1 && chartRefs.current.q1) {
      const ctx = chartRefs.current.q1.getContext("2d");
      chartInstances.current.q1 = new Chart(ctx, {
        type: "pie",
        data: {
          labels: questionData.q1.labels,
          datasets: [{
            data: questionData.q1.data,
            backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"],
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
              labels: { color: "#6b7280", font: { size: 12 } },
            },
            title: {
              display: true,
              text: "Tần suất truy cập",
              color: "#374151",
              font: { size: 14, weight: "bold" },
            },
          },
        },
      });
    }

    // Initialize Q2 Bar Chart
    if (!chartInstances.current.q2 && chartRefs.current.q2) {
      const ctx = chartRefs.current.q2.getContext("2d");
      chartInstances.current.q2 = new Chart(ctx, {
        type: "bar",
        data: {
          labels: questionData.q2.labels,
          datasets: [{
            label: "Số lượt",
            data: questionData.q2.data,
            backgroundColor: "#3b82f6",
            borderRadius: 8,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: "Mức độ hữu ích",
              color: "#374151",
              font: { size: 14, weight: "bold" },
            },
          },
          scales: {
            x: {
              ticks: { color: "#6b7280" },
              grid: { color: "#e5e7eb" },
            },
            y: {
              ticks: { color: "#6b7280" },
              grid: { color: "#e5e7eb" },
              beginAtZero: true,
            },
          },
        },
      });
    }

    // Initialize Q4 Bar Chart
    if (!chartInstances.current.q4 && chartRefs.current.q4) {
      const ctx = chartRefs.current.q4.getContext("2d");
      chartInstances.current.q4 = new Chart(ctx, {
        type: "bar",
        data: {
          labels: questionData.q4.labels,
          datasets: [{
            label: "Số lượt",
            data: questionData.q4.data,
            backgroundColor: "#3b82f6",
            borderRadius: 8,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: "Thông báo sự kiện",
              color: "#374151",
              font: { size: 14, weight: "bold" },
            },
          },
          scales: {
            x: {
              ticks: { color: "#6b7280" },
              grid: { color: "#e5e7eb" },
            },
            y: {
              ticks: { color: "#6b7280" },
              grid: { color: "#e5e7eb" },
              beginAtZero: true,
            },
          },
        },
      });
    }

    return () => {
      Object.values(chartInstances.current).forEach((chart) => {
        if (chart) chart.destroy();
      });
      chartInstances.current = {};
    };
  }, [loading, filteredData]);

  const questionData = filteredData.length > 0 ? getQuestionData(filteredData) : null;

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
        ) : questionData ? (
          <>
            <h2 className="section-title">Chi tiết Kết quả Câu hỏi</h2>

            {/* Question Results */}
            <div className="question-results">
              {/* Q1 */}
              <div className="question-card">
                <div className="question-header">
                  <span className="question-number">1</span>
                  <h3 className="question-text">{questionData.q1.question}</h3>
                </div>
                <div className="question-chart">
                  <canvas ref={(el) => (chartRefs.current.q1 = el)}></canvas>
                </div>
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
                  <span>{questionData.q1.highlight}</span>
                </div>
              </div>

              {/* Q2 */}
              <div className="question-card">
                <div className="question-header">
                  <span className="question-number">2</span>
                  <h3 className="question-text">{questionData.q2.question}</h3>
                </div>
                <div className="question-chart">
                  <canvas ref={(el) => (chartRefs.current.q2 = el)}></canvas>
                </div>
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
                  <span>{questionData.q2.highlight}</span>
                </div>
              </div>

              {/* Q3 - Word Cloud */}
              <div className="question-card question-card-wide">
                <div className="question-header">
                  <span className="question-number">3</span>
                  <h3 className="question-text">{questionData.q3.question}</h3>
                </div>
                <div className="word-cloud">
                  {questionData.q3.words.map(([word, count], idx) => (
                    <span
                      key={idx}
                      className="word-tag"
                      style={{
                        fontSize: `${0.9 + (count / filteredData.length) * 2}rem`,
                      }}
                    >
                      {word}
                      <span className="word-count">{count}</span>
                    </span>
                  ))}
                </div>
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
                  <span>{questionData.q3.highlight}</span>
                </div>
              </div>

              {/* Q4 */}
              <div className="question-card">
                <div className="question-header">
                  <span className="question-number">4</span>
                  <h3 className="question-text">{questionData.q4.question}</h3>
                </div>
                <div className="question-chart">
                  <canvas ref={(el) => (chartRefs.current.q4 = el)}></canvas>
                </div>
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
                  <span>{questionData.q4.highlight}</span>
                </div>
              </div>
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
