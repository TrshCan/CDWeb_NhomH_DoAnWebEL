import React, { useState } from 'react';

const surveys = [
  {
    id: 1,
    name: 'Khảo sát hài lòng nhân viên Quý 4',
    status: 'ongoing',
  },
  {
    id: 2,
    name: 'Bài quiz kiến thức an toàn thông tin',
    status: 'finished',
  },
  {
    id: 3,
    name: 'Đánh giá khóa học "Lập trình Web Nâng cao"',
    status: 'not-started',
  },
  {
    id: 4,
    name: 'Khảo sát hệ thống cũ (Gây lỗi CSDL)',
    status: 'not-started',
  },
];

const statusConfig = {
  ongoing: { label: 'Đang diễn ra', class: 'bg-green-100 text-green-800' },
  finished: { label: 'Đã kết thúc', class: 'bg-red-100 text-red-800' },
  'not-started': { label: 'Chưa bắt đầu', class: 'bg-gray-200 text-gray-700' },
};

const DuplicateSurvey = () => {
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [isProcessing, setIsProcessing] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 2000);
  };

  const simulateApiCall = (surveyId) => {
    console.log(`[API SIM] Bắt đầu sao chép khảo sát với ID: ${surveyId}`);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        switch (surveyId) {
          case 1:
            resolve({ message: 'Khảo sát đã được sao chép thành công.', newSurveyId: 125 });
            break;
          case 2:
            reject({ message: 'Khảo sát không tồn tại hoặc đã bị xóa.' });
            break;
          case 3:
            reject({ message: 'Bạn không có quyền sao chép khảo sát này.' });
            break;
          case 4:
            reject({ message: 'Không thể sao chép khảo sát, vui lòng thử lại sau.' });
            break;
          default:
            reject({ message: 'Đã xảy ra lỗi không xác định.' });
        }
      }, 1500);
    });
  };

  const handleDuplicate = async (surveyId, surveyName) => {
    const message = `Bạn có chắc chắn muốn sao chép khảo sát '${surveyName}'?\n\nBản sao sẽ được tạo với cấu trúc và nội dung tương tự khảo sát gốc.`;
    if (!window.confirm(message)) {
      console.log('Người dùng đã hủy thao tác sao chép.');
      return;
    }

    setIsProcessing((prev) => ({ ...prev, [surveyId]: true }));
    try {
      const result = await simulateApiCall(surveyId);
      showNotification(result.message, 'success');
      console.log(`[SUCCESS] Sao chép thành công. ID mới: ${result.newSurveyId}`);
      setTimeout(() => {
        alert(`(Giả lập) Chuyển hướng đến trang chỉnh sửa khảo sát: /surveys/edit/${result.newSurveyId}`);
      }, 2000);
    } catch (error) {
      showNotification(error.message, 'error');
      console.error(`[ERROR] ${error.message}`);
    } finally {
      setIsProcessing((prev) => ({ ...prev, [surveyId]: false }));
    }
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
                  onClick={() => handleDuplicate(survey.id, survey.name)}
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

        {isModalOpen && selectedSurvey && (
          <div
            id="default-modal"
            tabindex="-1"
            aria-hidden="true"
            class="fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full"
          >
            <div class="relative p-4 w-full max-w-2xl max-h-full">
              <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
                <div class="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                    Chi tiết khảo sát
                  </h3>
                  <button
                    type="button"
                    class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                    data-modal-hide="default-modal"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <CloseIcon className="w-3 h-3" />
                    <span class="sr-only">Close modal</span>
                  </button>
                </div>
                <div class="p-4 md:p-5 space-y-4">
                  <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                    <strong>ID:</strong> {selectedSurvey.id}
                  </p>
                  <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                    <strong>Tên:</strong> {selectedSurvey.name}
                  </p>
                  <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                    <strong>Trạng thái:</strong> {statusConfig[selectedSurvey.status].label}
                  </p>
                </div>
                <div class="flex items-center p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-600">
                  <button
                    data-modal-hide="default-modal"
                    type="button"
                    class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Đóng
                  </button>
                  <button
                    data-modal-hide="default-modal"
                    type="button"
                    class="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                    onClick={() => {
                      setIsModalOpen(false);
                      handleDuplicate(selectedSurvey.id, selectedSurvey.name);
                    }}
                  >
                    Sao chép lại
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DuplicateSurvey;