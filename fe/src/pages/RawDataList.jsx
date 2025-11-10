import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Chart, registerables } from "chart.js";
import toast from "react-hot-toast";
import "../assets/css/RawDataList.css";
import { getSurveyRawData } from "../api/graphql/survey";
import { exportSurveyRawCSV as exportCSV, sanitizeFileName } from "../utils/exports/surveyRaw/csv";
import { exportSurveyRawExcel as exportExcel } from "../utils/exports/surveyRaw/excel";
import { exportSurveyRawPDF as exportPDF } from "../utils/exports/surveyRaw/pdf";

// Register Chart.js components
Chart.register(...registerables);

export default function RawDataList() {
  const navigate = useNavigate();
  const { surveyId } = useParams();
  const [surveyTitle, setSurveyTitle] = useState("Khảo sát");
  const [totalResponses, setTotalResponses] = useState(0);
  const [rawData, setRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKhoa, setFilterKhoa] = useState("all");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("raw-data");
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const pieChartInstance = useRef(null);
  const barChartInstance = useRef(null);
  const lineChartInstance = useRef(null);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getSurveyRawData(surveyId);
        
        if (data && data.responses) {
          setRawData(data.responses);
          setFilteredData(data.responses);
          setTotalResponses(data.responses.length);
          setSurveyTitle(data.title || "Khảo sát");
        } else {
          setRawData([]);
          setFilteredData([]);
          setTotalResponses(0);
          setSurveyTitle("Khảo sát");
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

  // Filter data
  useEffect(() => {
    let filtered = rawData;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.studentName.toLowerCase().includes(query) ||
          item.studentId.includes(query)
      );
    }

    // Filter by khoa
    if (filterKhoa !== "all") {
      filtered = filtered.filter((item) => item.khoa === filterKhoa);
    }

    setFilteredData(filtered);
  }, [searchQuery, filterKhoa, rawData]);

  const handleGoBack = () => {
    navigate("/surveys/created");
  };

  const handleTabSwitch = (tab) => {
    if (tab === "overview") {
      navigate(`/surveys/${surveyId}/overview`);
    } else {
      navigate(`/surveys/${surveyId}/raw-data`);
    }
  };

  const handleOpenDownloadModal = () => {
    setShowDownloadModal(true);
  };

  const handleCloseDownloadModal = () => {
    setShowDownloadModal(false);
  };

  // Prepare data for export
  const prepareExportData = () => {
    return filteredData.map((item) => ({
      "ID Phản hồi": item.id,
      "Mã SV": item.studentId,
      "Tên Sinh viên": item.studentName,
      "Khoa": getKhoaLabel(item.khoa),
      "Ngày Hoàn thành": item.completedDate,
    }));
  };

  // Download CSV
  const downloadCSV = () => {
    try {
      const data = prepareExportData();
      exportCSV({ rows: data, title: surveyTitle });
      toast.success("Đã tải xuống file CSV thành công!");
    } catch (error) {
      console.error("Error downloading CSV:", error);
      toast.error(error.message || "Có lỗi xảy ra khi tải xuống CSV");
    }
  };

  // Download Excel
  const downloadExcel = () => {
    try {
      const data = prepareExportData();
      exportExcel({ rows: data, title: surveyTitle, filteredRawData: filteredData, getKhoaLabel });
      toast.success("Đã tải xuống file Excel thành công!");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast.error(error.message || "Có lỗi xảy ra khi tải xuống Excel");
    }
  };

  // Download PDF
  const downloadPDF = () => {
    try {
      const data = prepareExportData();
      exportPDF({ rows: data, title: surveyTitle });
      toast.success("Đã tải xuống file PDF thành công!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error(error.message || "Có lỗi xảy ra khi tải xuống PDF");
    }
  };

  const handleDownload = (format) => {
    setShowDownloadModal(false);
    
    // Small delay to close modal before download
    setTimeout(() => {
      switch (format.toLowerCase()) {
        case "csv":
          downloadCSV();
          break;
        case "excel":
          downloadExcel();
          break;
        case "pdf":
          downloadPDF();
          break;
        default:
          toast.error("Định dạng không hỗ trợ");
      }
    }, 100);
  };

  const handleViewDetail = (responseId) => {
    toast.success(`Chuyển hướng đến Chi tiết Câu trả lời cho Phản hồi ID: #${responseId}`);
    // TODO: Navigate to detail page
    // navigate(`/surveys/${surveyId}/responses/${responseId}`);
  };

  // Initialize and update charts with real data
  useEffect(() => {
    // Calculate data for bar chart - responses by faculty
    const facultyCounts = rawData.reduce((acc, item) => {
      const faculty = item.khoa || "Khác";
      acc[faculty] = (acc[faculty] || 0) + 1;
      return acc;
    }, {});

    // Get all unique faculty names and sort them
    const facultyLabels = Object.keys(facultyCounts).sort();
    const barChartData = facultyLabels.map(faculty => facultyCounts[faculty]);

    // Calculate data for pie chart - users' responses by year
    const currentYear = new Date().getFullYear(); // 2025
    const yearCounts = {
      "Sinh viên Năm nhất": 0,
      "Sinh viên Năm hai": 0,
      "Sinh viên Năm ba": 0,
      "Khác": 0,
    };

    rawData.forEach((item) => {
      const studentCode = item.studentId || "";
      
      // Extract first 2 digits from student_code
      // Handle cases where student_code might be a number or string
      const codeStr = String(studentCode);
      const firstTwoDigits = codeStr.substring(0, 2);
      const yearCode = parseInt(firstTwoDigits, 10);

      // Check if we have a valid 2-digit year code
      if (!isNaN(yearCode) && firstTwoDigits.length === 2) {
        // Calculate the year the student enrolled
        // If first 2 digits are "25", it means 2025, which is current year = 1st year
        // If first 2 digits are "24", it means 2024 = 2nd year
        // If first 2 digits are "23", it means 2023 = 3rd year
        const enrollmentYear = 2000 + yearCode;
        const yearDifference = currentYear - enrollmentYear;

        if (yearDifference === 0) {
          yearCounts["Sinh viên Năm nhất"]++;
        } else if (yearDifference === 1) {
          yearCounts["Sinh viên Năm hai"]++;
        } else if (yearDifference === 2) {
          yearCounts["Sinh viên Năm ba"]++;
        } else {
          // Older than 3rd year or future year (invalid)
          yearCounts["Khác"]++;
        }
      } else {
        // No valid student code or doesn't start with 2 digits
        yearCounts["Khác"]++;
      }
    });

    const pieChartLabels = Object.keys(yearCounts);
    const pieChartData = Object.values(yearCounts);

    // Calculate data for line chart - responses timeline by day
    const timelineCounts = rawData.reduce((acc, item) => {
      const completed = item.completedDate; // format like 'dd/mm/YYYY HH:MM'
      if (completed) {
        const [datePart] = completed.split(" ");
        const [dd, mm, yyyy] = datePart.split("/");
        if (dd && mm && yyyy) {
          const key = `${yyyy}-${mm}-${dd}`; // sortable
          acc[key] = (acc[key] || 0) + 1;
        }
      }
      return acc;
    }, {});
    const lineLabels = Object.keys(timelineCounts).sort();
    const lineData = lineLabels.map(l => timelineCounts[l]);

    // Initialize or update pie chart
    if (pieChartRef.current) {
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
      }
      const pieCtx = pieChartRef.current.getContext("2d");
      pieChartInstance.current = new Chart(pieCtx, {
        type: "pie",
        data: {
          labels: pieChartLabels,
          datasets: [
            {
              data: pieChartData,
              backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
              labels: { color: "#e0e0e0" },
            },
            title: {
              display: true,
              text: "Phân bố Người tham gia",
              color: "#e0e0e0",
            },
          },
        },
      });
    }

    // Initialize or update bar chart
    if (barChartRef.current) {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }
      const barCtx = barChartRef.current.getContext("2d");
      barChartInstance.current = new Chart(barCtx, {
        type: "bar",
        data: {
          labels: facultyLabels.length > 0 ? facultyLabels : ["Không có dữ liệu"],
          datasets: [
            {
              label: "Số lượng Phản hồi",
              data: facultyLabels.length > 0 ? barChartData : [0],
              backgroundColor: "#3b82f6",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            title: {
              display: true,
              text: "Phản hồi theo Khoa",
              color: "#e0e0e0",
            },
          },
          scales: {
            x: {
              ticks: { color: "#a0aec0" },
              grid: { color: "#4b5563" },
            },
            y: {
              ticks: { color: "#a0aec0" },
              grid: { color: "#4b5563" },
              beginAtZero: true,
            },
          },
        },
      });
    }

    // Initialize or update line chart
    if (lineChartRef.current) {
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
      }
      const lineCtx = lineChartRef.current.getContext("2d");
      lineChartInstance.current = new Chart(lineCtx, {
        type: "line",
        data: {
          labels: lineLabels,
          datasets: [
            {
              label: "Số câu trả lời theo thời gian",
              data: lineData,
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.2)",
              tension: 0.3,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: "Dòng thời gian số lượng phản hồi",
              color: "#e0e0e0",
            },
          },
          scales: {
            x: {
              ticks: { color: "#a0aec0" },
              grid: { color: "#4b5563" },
            },
            y: {
              beginAtZero: true,
              ticks: { color: "#a0aec0" },
              grid: { color: "#4b5563" },
            },
          },
        },
      });
    }

    // Cleanup function
    return () => {
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
        pieChartInstance.current = null;
      }
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
        barChartInstance.current = null;
      }
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
        lineChartInstance.current = null;
      }
    };
  }, [rawData]);

  const getKhoaLabel = (khoa) => {
    const labels = {
      cntt: "CNTT",
      kinhte: "Kinh tế",
    };
    return labels[khoa] || khoa;
  };

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

        <div className="header-section">
          <h1>Khảo sát: {surveyTitle}</h1>
          <p className="subtitle">Dữ liệu chi tiết các phản hồi</p>
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

        <div className="summary-bar">
          <p>Tổng số Phản hồi: <span>{totalResponses}</span></p>
          <div className="controls">
            <button
              className="btn btn-success download-btn"
              onClick={handleOpenDownloadModal}
              aria-label="Tải dữ liệu"
            >
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
        </div>

        <div className="charts-group" role="region" aria-label="Thống kê tổng quan">
          <div className="chart-container">
            <canvas id="pieChart" ref={pieChartRef}></canvas>
          </div>
          <div className="chart-container">
            <canvas id="barChart" ref={barChartRef}></canvas>
          </div>
          <div className="chart-container chart-container--full">
            <canvas id="lineChart" ref={lineChartRef}></canvas>
          </div>
        </div>

        <div
          className="controls"
          style={{ justifyContent: "flex-start", marginBottom: "20px" }}
        >
          <input
            type="text"
            id="searchInput"
            placeholder="Tìm kiếm theo Tên/Mã SV..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Tìm kiếm theo tên hoặc mã sinh viên"
          />
          <select
            id="filter-khoa"
            value={filterKhoa}
            onChange={(e) => setFilterKhoa(e.target.value)}
            aria-label="Lọc theo khoa"
          >
            <option value="all">Lọc theo Khoa</option>
            <option value="cntt">CNTT</option>
            <option value="kinhte">Kinh tế</option>
          </select>
          <button
            className="btn btn-primary"
            onClick={() => {}}
            aria-label="Áp dụng lọc"
          >
            Áp dụng Lọc
          </button>
        </div>

        <table id="raw-data-table" role="grid">
          <thead>
            <tr>
              <th>ID Phản hồi</th>
              <th>Mã SV</th>
              <th>Tên Sinh viên</th>
              <th>Khoa</th>
              <th>Ngày Hoàn thành</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                  Đang tải...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                  Không tìm thấy dữ liệu
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr
                  key={item.id}
                  data-name={item.studentName.toLowerCase()}
                  data-id={item.studentId}
                  data-khoa={item.khoa}
                >
                  <td>#{item.id}</td>
                  <td>{item.studentId}</td>
                  <td>{item.studentName}</td>
                  <td>{getKhoaLabel(item.khoa)}</td>
                  <td>{item.completedDate}</td>
                  <td className="action-cell">
                    <i
                      className="fas fa-eye action-icon tooltip"
                      onClick={() => handleViewDetail(item.id)}
                      aria-label={`Xem chi tiết phản hồi ${item.id}`}
                      data-tooltip="Xem Chi tiết"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleViewDetail(item.id);
                        }
                      }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
    </div>
  );
}

