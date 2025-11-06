import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css/survey-completed.css";

const mockDidSurveys = [
  { id: 1, name: "Khảo sát Mức độ Hài lòng với Trang Social", creator: "Khoa CNTT", completedAt: "2025-09-10", canView: true },
  { id: 2, name: "Đánh giá Cơ sở vật chất Khu học tập", creator: "Phòng QLĐT", completedAt: "2025-07-20", canView: false },
  { id: 3, name: "Thu thập thông tin Đồ án Tốt nghiệp", creator: "Bộ môn Kỹ thuật", completedAt: "2025-05-15", canView: false },
];

export default function SurveysDid() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [permission, setPermission] = useState("all"); // all | can | cannot
  const [creator, setCreator] = useState("all");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  const creators = useMemo(() => {
    const set = new Set(mockDidSurveys.map((s) => s.creator));
    return ["all", ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const start = dateStart ? new Date(dateStart) : null;
    const end = dateEnd ? new Date(dateEnd) : null;

    return mockDidSurveys.filter((s) => {
      // search by name
      if (q && !s.name.toLowerCase().includes(q)) return false;

      // permission filter
      if (permission === "can" && !s.canView) return false;
      if (permission === "cannot" && s.canView) return false;

      // creator filter
      if (creator !== "all" && s.creator !== creator) return false;

      // date range filter (inclusive)
      if (start || end) {
        const completed = new Date(s.completedAt);
        if (start && completed < start) return false;
        if (end) {
          const endOfDay = new Date(end);
          endOfDay.setHours(23, 59, 59, 999);
          if (completed > endOfDay) return false;
        }
      }

      return true;
    });
  }, [query, permission, creator, dateStart, dateEnd]);

  const goBack = () => navigate(-1);

  const handleView = (survey) => {
    if (!survey.canView) return;
    // navigate(`/surveys/${survey.id}/my-response`);
    // Placeholder to match prototype behavior
    alert(`Chuyển hướng đến trang chi tiết phản hồi cá nhân cho: ${survey.name}.`);
  };

  return (
    <div className="surveys-made-page">
      <div className="surveys-made-container">
        <button onClick={goBack} className="back-button" aria-label="Quay lại">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>

        <div className="surveys-made-card">
          <div className="surveys-made-header">
            <h1 className="surveys-made-title">Khảo sát Đã Hoàn thành</h1>
            <p className="surveys-made-subtitle">Danh sách các khảo sát bạn đã tham gia và gửi phản hồi.</p>
          </div>

          <div className="controls-section" role="search">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên khảo sát..."
              aria-label="Tìm kiếm khảo sát"
              className="search-input flex-1"
            />

            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              className="status-select"
              aria-label="Lọc theo quyền xem kết quả"
            >
              <option value="all">Tất cả quyền xem</option>
              <option value="can">Được phép xem</option>
              <option value="cannot">Không được phép</option>
            </select>

            <select
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              className="status-select"
              aria-label="Lọc theo người tạo"
            >
              {creators.map((c) => (
                <option key={c} value={c}>{c === "all" ? "Tất cả người tạo" : c}</option>
              ))}
            </select>

            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="status-select"
              aria-label="Từ ngày hoàn thành"
            />

            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="status-select"
              aria-label="Đến ngày hoàn thành"
            />
          </div>

          <div className="table-container">
            <table className="table-wrapper" role="grid">
              <thead className="table-header">
                <tr>
                  <th>Tên Khảo sát</th>
                  <th>Người tạo</th>
                  <th>Ngày Hoàn thành</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-state">Không có khảo sát phù hợp</td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id} className="table-row">
                      <td>{s.name}</td>
                      <td>{s.creator}</td>
                      <td>{new Date(s.completedAt).toLocaleDateString("vi-VN")}</td>
                      <td>
                        <div className="action-buttons">
                          {s.canView ? (
                            <button
                              onClick={() => handleView(s)}
                              className="action-button action-button-view"
                              title="Xem Lại Phản hồi"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              disabled
                              className="action-button action-button-no-view"
                              title="Bạn không được phép xem kết quả"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.742-4.419M6.5 6.5C8.338 5.552 10.378 5 12 5c4.477 0 8.268 2.943 9.542 7a9.97 9.97 0 01-3.23 4.568M3 3l18 18" />
                              </svg>
                            </button>
                          )}
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

