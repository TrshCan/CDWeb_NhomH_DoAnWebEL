import React, { useState, useEffect } from "react";
import { graphqlRequest } from "../api/graphql";
import toast from "react-hot-toast";

export default function LogPanel({ surveyId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!surveyId) return;
    
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const query = `
          query GetAuditLogs($survey_id: ID!) {
            auditLogs(survey_id: $survey_id) {
              id
              user_name
              action
              entity_type
              entity_id
              details
              ip_address
              created_at
            }
          }
        `;
        
        const response = await graphqlRequest(query, { survey_id: surveyId });
        setLogs(response.data.auditLogs || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching logs:", err);
        setError(err.message || "Không thể tải log");
        toast.error("Không thể tải log hoạt động");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [surveyId]);

  const getActionLabel = (action) => {
    const labels = {
      create: "Tạo mới",
      update: "Cập nhật",
      delete: "Xóa",
      duplicate: "Sao chép",
      move: "Di chuyển",
    };
    return labels[action] || action;
  };

  const getEntityLabel = (entityType) => {
    const labels = {
      survey: "Khảo sát",
      question: "Câu hỏi",
      option: "Lựa chọn",
      group: "Nhóm",
    };
    return labels[entityType] || entityType;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải log...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 font-medium">Lỗi: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700"
          >
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto p-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Log hoạt động</h2>
          <span className="text-sm text-gray-600">{logs.length} bản ghi</span>
        </div>

        {logs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600">Chưa có log hoạt động nào</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Hành động
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.user_name || "Guest"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-violet-100 text-violet-800">
                        {getActionLabel(log.action)} {getEntityLabel(log.entity_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.details || `${getEntityLabel(log.entity_type)} ID: ${log.entity_id}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
