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

  const handleExportData = () => {
    toast.success(`Đang xử lý xuất ${totalResponses} hàng dữ liệu thô sang Excel/CSV...`);
    // TODO: Implement actual export functionality
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
              onClick={handleExportData}
              aria-label="Xuất dữ liệu thô"
            >
              Xuất Dữ liệu Thô (Excel/CSV)
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
    </div>
  );
}

