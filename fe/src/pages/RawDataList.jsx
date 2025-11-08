import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Chart, registerables } from "chart.js";
import toast from "react-hot-toast";
import "../assets/css/RawDataList.css";

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
  
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const pieChartInstance = useRef(null);
  const barChartInstance = useRef(null);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        // const data = await getSurveyRawData(surveyId);
        
        // Mock data
        const mockData = [
          {
            id: "12345",
            studentId: "20210123",
            studentName: "Nguyễn Văn A",
            khoa: "cntt",
            completedDate: "10/09/2025 10:30",
          },
          {
            id: "12344",
            studentId: "20220456",
            studentName: "Lê Thị B",
            khoa: "kinhte",
            completedDate: "10/09/2025 09:45",
          },
          {
            id: "12343",
            studentId: "20210789",
            studentName: "Trần Văn C",
            khoa: "cntt",
            completedDate: "09/09/2025 18:20",
          },
        ];

        setRawData(mockData);
        setFilteredData(mockData);
        setTotalResponses(mockData.length);
        setSurveyTitle("Mức độ Hài lòng Trang Social");
      } catch (err) {
        console.error(err);
        toast.error("Không tải được dữ liệu");
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
    navigate("/surveys/made");
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

  // Initialize charts
  useEffect(() => {
    if (pieChartRef.current && !pieChartInstance.current) {
      const pieCtx = pieChartRef.current.getContext("2d");
      pieChartInstance.current = new Chart(pieCtx, {
        type: "pie",
        data: {
          labels: ["Sinh viên Năm nhất", "Sinh viên Năm hai", "Sinh viên Năm ba", "Khách"],
          datasets: [
            {
              data: [50, 40, 30, 30],
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

    if (barChartRef.current && !barChartInstance.current) {
      const barCtx = barChartRef.current.getContext("2d");
      barChartInstance.current = new Chart(barCtx, {
        type: "bar",
        data: {
          labels: ["CNTT", "Kinh tế", "Khác"],
          datasets: [
            {
              label: "Số lượng Phản hồi",
              data: [90, 40, 20],
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
  }, []);

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
        <h1>Khảo sát: {surveyTitle}</h1>

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

