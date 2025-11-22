import React, { useState, useEffect } from 'react';
import { graphqlRequest } from '../api/graphql';

// Map status từ backend sang frontend
const mapStatusToFrontend = (status) => {
  const statusMap = {
    'active': 'ongoing',
    'closed': 'finished',
    'pending': 'not-started',
    'paused': 'ongoing', // Tạm dừng cũng coi như đang diễn ra
  };
  return statusMap[status] || 'not-started';
};

const statusConfig = {
  ongoing: { label: 'Đang diễn ra', class: 'bg-green-100 text-green-800' },
  finished: { label: 'Đã kết thúc', class: 'bg-red-100 text-red-800' },
  'not-started': { label: 'Chưa bắt đầu', class: 'bg-gray-200 text-gray-700' },
};

const DuplicateSurvey = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [isProcessing, setIsProcessing] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [surveyToDuplicate, setSurveyToDuplicate] = useState(null);

  // Load danh sách surveys từ API
  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const result = await graphqlRequest(`
        query {
          surveys {
            id
            title
            status
            description
            start_at
            end_at
            time_limit
            points
            type
            object
            allow_review
            categories_id
          }
        }
      `);

      if (result.errors) {
        console.error('GraphQL Errors:', result.errors);
        showNotification('Lỗi tải danh sách khảo sát', 'error');
        return;
      }

      const surveysData = result.data?.surveys || [];
      // Map dữ liệu từ API sang format của component
      const mappedSurveys = surveysData.map(s => ({
        id: Number(s.id),
        name: s.title,
        status: mapStatusToFrontend(s.status),
        description: s.description,
        start_at: s.start_at,
        end_at: s.end_at,
        type: s.type,
        object: s.object,
        time_limit: s.time_limit,
        points: s.points,
        categories_id: s.categories_id,
        allow_review: s.allow_review,
      }));

      setSurveys(mappedSurveys);
    } catch (error) {
      console.error('Lỗi tải surveys:', error);
      showNotification('Không thể tải danh sách khảo sát', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  // Gọi GraphQL mutation để sao chép survey
  const duplicateSurveyApi = async (surveyId) => {
    const result = await graphqlRequest(`
      mutation DuplicateSurvey($id: Int!) {
        duplicateSurvey(id: $id) {
          id
          title
          status
          description
        }
      }
    `, {
      id: parseInt(surveyId)
    });

    if (result.errors) {
      const errorMessage = result.errors[0]?.message || 'Không thể sao chép khảo sát';
      throw new Error(errorMessage);
    }

    return result.data?.duplicateSurvey;
  };

  const handleDuplicateClick = (survey) => {
    setSurveyToDuplicate(survey);
    setIsDuplicateModalOpen(true);
  };

  const handleDuplicateConfirm = async () => {
    if (!surveyToDuplicate) return;

    const surveyId = surveyToDuplicate.id;
    const surveyName = surveyToDuplicate.name;

    setIsDuplicateModalOpen(false);
    setIsProcessing((prev) => ({ ...prev, [surveyId]: true }));
    
    try {
      const duplicatedSurvey = await duplicateSurveyApi(surveyId);
      
      if (duplicatedSurvey) {
        showNotification(`Khảo sát "${duplicatedSurvey.title}" đã được sao chép thành công.`, 'success');
        console.log(`[SUCCESS] Sao chép thành công. ID mới: ${duplicatedSurvey.id}`);
        
        // Reload danh sách surveys để hiển thị survey mới
        await loadSurveys();
        
        // Có thể chuyển hướng đến trang chỉnh sửa nếu cần
        // window.location.href = `/surveys/edit/${duplicatedSurvey.id}`;
      } else {
        throw new Error('Không nhận được dữ liệu từ server');
      }
    } catch (error) {
      const errorMessage = error.message || 'Không thể sao chép khảo sát, vui lòng thử lại sau.';
      showNotification(errorMessage, 'error');
      console.error(`[ERROR] ${errorMessage}`, error);
    } finally {
      setIsProcessing((prev) => ({ ...prev, [surveyId]: false }));
      setSurveyToDuplicate(null);
    }
  };

  const handleDuplicateCancel = () => {
    setIsDuplicateModalOpen(false);
    setSurveyToDuplicate(null);
  };

  // Icon Components
  const ViewIcon = ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );

  const DuplicateIcon = ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
      />
    </svg>
  );

  const CloseIcon = ({ className }) => (
    <svg
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 14 14"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-white py-6 px-4 font-sans">
      <div className="max-w-4xl mx-auto bg-transparent border border-gray-200 shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Quản Lý Khảo Sát</h2>
        <p className="text-gray-500 mb-6">Chọn một khảo sát để xem chi tiết hoặc sao chép.</p>

        {notification.message && (
          <div
            className={`p-4 mb-6 text-left font-medium ${
              notification.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {notification.message}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải danh sách khảo sát...</p>
          </div>
        ) : surveys.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">Không có khảo sát nào</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr] bg-gray-50 text-gray-500 text-xs font-semibold uppercase py-3 px-6 border-b border-gray-200">
              <span className="text-left">Tên Khảo Sát</span>
              <span className="text-left">Trạng Thái</span>
              <span className="text-left">Hành Động</span>
            </div>

            {surveys.map((survey) => (
            <div
              key={survey.id}
              className="grid grid-cols-[2fr_1fr_1fr] py-3 px-6 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors duration-200"
            >
              <span className="text-sm font-medium text-gray-800 text-left">{survey.name}</span>
              <span className="text-center">
                <span
                  className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${statusConfig[survey.status].class}`}
                >
                  {statusConfig[survey.status].label}
                </span>
              </span>
              <div className="flex space-x-4 justify-center">
                <button
                  className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                  title="Xem chi tiết"
                  onClick={() => {
                    setSelectedSurvey(survey);
                    setIsModalOpen(true);
                  }}
                >
                  <ViewIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDuplicateClick(survey)}
                  disabled={isProcessing[survey.id]}
                  className={`${
                    isProcessing[survey.id]
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:text-blue-800'
                  } transition-colors duration-200`}
                  title="Sao chép khảo sát"
                >
                  {isProcessing[survey.id] ? (
                    <svg
                      className="w-5 h-5 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <DuplicateIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          ))}
          </div>
        )}

        {isModalOpen && selectedSurvey && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsModalOpen(false);
              }
            }}
          >
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Chi tiết khảo sát</h3>
                    <p className="text-sm text-gray-500">Thông tin đầy đủ về khảo sát</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-6">
                  {/* Thông tin cơ bản */}
                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Thông tin cơ bản
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">ID Khảo sát</label>
                        <p className="mt-1 text-sm font-semibold text-gray-900">#{selectedSurvey.id}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Trạng thái</label>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[selectedSurvey.status].class}`}>
                            {statusConfig[selectedSurvey.status].label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tiêu đề và mô tả */}
                  <div className="bg-white rounded-lg p-5 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10m-7 4h7" />
                      </svg>
                      Nội dung
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Tên khảo sát</label>
                        <p className="mt-1 text-base font-semibold text-gray-900">{selectedSurvey.name}</p>
                      </div>
                      {selectedSurvey.description && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Mô tả</label>
                          <p className="mt-1 text-sm text-gray-700 leading-relaxed">{selectedSurvey.description}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Thông tin thời gian */}
                  <div className="bg-white rounded-lg p-5 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Thời gian
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedSurvey.start_at && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Thời gian bắt đầu</label>
                          <p className="mt-1 text-sm text-gray-900 font-medium">
                            {new Date(selectedSurvey.start_at).toLocaleString('vi-VN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      )}
                      {selectedSurvey.end_at && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Thời gian kết thúc</label>
                          <p className="mt-1 text-sm text-gray-900 font-medium">
                            {new Date(selectedSurvey.end_at).toLocaleString('vi-VN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      )}
                      {selectedSurvey.time_limit && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Giới hạn thời gian</label>
                          <p className="mt-1 text-sm text-gray-900 font-medium">{selectedSurvey.time_limit} phút</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Thông tin khác */}
                  <div className="bg-white rounded-lg p-5 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Thông tin khác
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Loại</label>
                        <p className="mt-1 text-sm text-gray-900 font-medium capitalize">
                          {selectedSurvey.type === 'survey' ? 'Khảo sát' : 'Câu đố'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Đối tượng</label>
                        <p className="mt-1 text-sm text-gray-900 font-medium capitalize">
                          {selectedSurvey.object === 'public' ? 'Công khai' : 
                           selectedSurvey.object === 'students' ? 'Sinh viên' : 'Giảng viên'}
                        </p>
                      </div>
                      {selectedSurvey.points !== undefined && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Điểm</label>
                          <p className="mt-1 text-sm text-gray-900 font-medium">{selectedSurvey.points} điểm</p>
                        </div>
                      )}
                      {selectedSurvey.allow_review !== undefined && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Cho phép xem lại</label>
                          <p className="mt-1 text-sm text-gray-900 font-medium">
                            {selectedSurvey.allow_review ? (
                              <span className="text-green-600 font-semibold">✓ Có</span>
                            ) : (
                              <span className="text-gray-400">✗ Không</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center space-x-2"
                  onClick={() => {
                    setIsModalOpen(false);
                    handleDuplicateClick(selectedSurvey);
                  }}
                >
                  <DuplicateIcon className="w-4 h-4" />
                  <span>Sao chép khảo sát</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal xác nhận sao chép */}
        {isDuplicateModalOpen && surveyToDuplicate && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleDuplicateCancel();
              }
            }}
          >
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Xác nhận sao chép</h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors"
                  onClick={handleDuplicateCancel}
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5">
                <p className="text-gray-700 mb-4">
                  Bạn có chắc chắn muốn sao chép khảo sát <strong className="font-semibold text-gray-900">'{surveyToDuplicate.name}'</strong>?
                </p>
                <p className="text-sm text-gray-500">
                  Bản sao sẽ được tạo với cấu trúc và nội dung tương tự khảo sát gốc.
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  onClick={handleDuplicateCancel}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  onClick={handleDuplicateConfirm}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DuplicateSurvey;