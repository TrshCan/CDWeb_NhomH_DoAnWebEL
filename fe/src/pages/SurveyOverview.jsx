import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Chart, registerables } from "chart.js";
import toast from "react-hot-toast";
import { getSurveyRawData } from "../api/graphql/survey";
import "../assets/css/SurveyOverview.css";

Chart.register(...registerables);

export default function SurveyOverview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { surveyId } = useParams();
  const [surveyTitle, setSurveyTitle] = useState("Khảo sát");
  const [totalResponses, setTotalResponses] = useState(0);
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const pieChartInstance = useRef(null);
  const barChartInstance = useRef(null);
  const lineChartInstance = useRef(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getSurveyRawData(parseInt(surveyId));

        const transformedData = data.map((item) => ({
          id: item.id,
          studentId: item.student_id,
          studentName: item.student_name,
          khoa: item.faculty_name || "N/A",
          completedDate: new Date(item.completed_date).toLocaleString("vi-VN"),
        }));

        setRawData(transformedData);
        setTotalResponses(transformedData.length);
        setSurveyTitle(`Khảo sát #${surveyId}`);
      } catch (err) {
        console.error(err);
        toast.error("Không tải được dữ liệu: " + (err.message || "Lỗi không xác định"));
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

  // Initialize charts
  useEffect(() => {
    if (loading || rawData.length === 0) return;

    // Faculty distribution
    const facultyCounts = {};
    rawData.forEach((item) => {
      const faculty = item.khoa || "N/A";
      facultyCounts[faculty] = (facultyCounts[faculty] || 0) + 1;
    });

    // Pie Chart - Faculty Distribution
    if (pieChartRef.current && !pieChartInstance.current) {
      const pieCtx = pieChartRef.current.getContext("2d");
      pieChartInstance.current = new Chart(pieCtx, {
        type: "pie",
        data: {
          labels: Object.keys(facultyCounts),
          datasets: [
            {
              data: Object.values(facultyCounts),
              backgroundColor: [
                "#10b981",
                "#3b82f6",
                "#f59e0b",
                "#ef4444",
                "#8b5cf6",
                "#ec4899",
              ],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#374151", font: { size: 12 } },
            },
            title: {
              display: true,
              text: "Phân bố theo Khoa",
              color: "#1f2937",
              font: { size: 16, weight: "bold" },
            },
          },
        },
      });
    }

    // Bar Chart - Responses by Faculty
    if (barChartRef.current && !barChartInstance.current) {
      const barCtx = barChartRef.current.getContext("2d");
      barChartInstance.current = new Chart(barCtx, {
        type: "bar",
        data: {
          labels: Object.keys(facultyCounts),
          datasets: [
            {
              label: "Số lượng Phản hồi",
              data: Object.values(facultyCounts),
              backgroundColor: "#3b82f6",
              borderRadius: 8,
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
              text: "Phản hồi theo Khoa",
              color: "#1f2937",
              font: { size: 16, weight: "bold" },
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

    // Line Chart - Responses over time
    if (lineChartRef.current && !lineChartInstance.current) {
      const lineCtx = lineChartRef.current.getContext("2d");
      lineChartInstance.current = new Chart(lineCtx, {
        type: "line",
        data: {
          labels: ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"],
          datasets: [
            {
              label: "Phản hồi",
              data: [1, 2, 3, totalResponses],
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              tension: 0.4,
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
              text: "Xu hướng Phản hồi",
              color: "#1f2937",
              font: { size: 16, weight: "bold" },
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
  }, [loading, rawData, totalResponses]);

  return (
    <div className="survey-overview-page">
      <button onClick={handleGoBack} className="back-button">
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
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Quay lại
      </button>

      <div className="survey-overview-container">
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

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card stat-card-blue">
                <div className="stat-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
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
                <div className="stat-content">
                  <p className="stat-label">Tổng Phản hồi</p>
                  <p className="stat-value">{totalResponses}</p>
                </div>
              </div>

              <div className="stat-card stat-card-green">
                <div className="stat-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div className="stat-content">
                  <p className="stat-label">Tỷ lệ Hoàn thành</p>
                  <p className="stat-value">100%</p>
                </div>
              </div>

              <div className="stat-card stat-card-purple">
                <div className="stat-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="stat-content">
                  <p className="stat-label">Thời gian TB</p>
                  <p className="stat-value">5 phút</p>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
              <div className="chart-card">
                <canvas ref={pieChartRef}></canvas>
              </div>
              <div className="chart-card">
                <canvas ref={barChartRef}></canvas>
              </div>
              <div className="chart-card chart-card-wide">
                <canvas ref={lineChartRef}></canvas>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
