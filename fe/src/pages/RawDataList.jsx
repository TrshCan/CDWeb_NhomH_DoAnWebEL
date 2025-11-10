import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Chart, registerables } from "chart.js";
import toast from "react-hot-toast";
import "../assets/css/RawDataList.css";
import { getSurveyRawData } from "../api/graphql/survey";

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
  const pieChartInstance = useRef(null);
  const barChartInstance = useRef(null);

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

  const handleDownload = (format) => {
    toast.success(`Đang tải xuống dữ liệu dạng ${format.toUpperCase()}...`);
    setShowDownloadModal(false);
    // TODO: Implement actual download logic
  };

  const handleViewDetail = (responseId) => {
    toast.success(`Chuyển hướng đến Chi tiết Câu trả lời cho Phản hồi ID: #${responseId}`);
    // TODO: Navigate to detail page
    // navigate(`/surveys/${surveyId}/responses/${responseId}`);
  };

  // Initialize and update charts with real data
  useEffect(() => {
    // Calculate data for charts
    const khoaCounts = rawData.reduce((acc, item) => {
      const khoa = item.khoa || "other";
      acc[khoa] = (acc[khoa] || 0) + 1;
      return acc;
    }, {});

    const barChartLabels = ["CNTT", "Kinh tế", "Khác"];
    const barChartData = [
      khoaCounts.cntt || 0,
      khoaCounts.kinhte || 0,
      khoaCounts.other || 0,
    ];

    // Initialize or update pie chart
    if (pieChartRef.current) {
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
      }
      const pieCtx = pieChartRef.current.getContext("2d");
      pieChartInstance.current = new Chart(pieCtx, {
        type: "pie",
        data: {
          labels: ["Sinh viên Năm nhất", "Sinh viên Năm hai", "Sinh viên Năm ba", "Khách"],
          datasets: [
            {
              data: [50, 40, 30, 30], // TODO: Calculate from actual data if available
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
          labels: barChartLabels,
          datasets: [
            {
              label: "Số lượng Phản hồi",
              data: barChartData,
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
              className="btn btn-success"
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
            <button
              className="btn btn-secondary"
              onClick={handleGoBack}
              aria-label="Quay lại kết quả tổng quan"
            >
              Quay lại Kết quả Tổng quan
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

