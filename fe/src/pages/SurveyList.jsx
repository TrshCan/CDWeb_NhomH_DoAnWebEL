// fe/src/pages/SurveyList.jsx
import React, { useState, useEffect } from 'react';
import { getSurveys } from '../api/surveys';
import { toast } from 'react-hot-toast';
import { 
  FileText, 
  Plus, 
  Edit, 
  Eye, 
  HelpCircle, 
  Tag, 
  Users,
  Loader2 
} from 'lucide-react';

export default function SurveyList({ onEditSurvey }) {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    setLoading(true);
    try {
      const data = await getSurveys();
      setSurveys(data);
    } catch (error) {
      toast.error('Không thể tải danh sách surveys: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      paused: 'bg-orange-100 text-orange-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      active: 'Đang hoạt động',
      pending: 'Chờ kích hoạt',
      paused: 'Tạm dừng',
      closed: 'Đã đóng',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    return type === 'quiz' ? (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
        Quiz
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
        Khảo sát
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý Surveys</h1>
              <p className="mt-1 text-sm text-gray-500">
                Tổng số: {surveys.length} surveys
              </p>
            </div>
            <button
              onClick={() => onEditSurvey(null)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              Tạo Survey Mới
            </button>
          </div>
        </div>
      </div>

      {/* Survey List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {surveys.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có survey nào</h3>
            <p className="mt-1 text-sm text-gray-500">
              Bắt đầu bằng cách tạo survey mới
            </p>
            <div className="mt-6">
              <button
                onClick={() => onEditSurvey(null)}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Tạo Survey Đầu Tiên
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {surveys.map((survey) => (
              <div
                key={survey.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeBadge(survey.type)}
                        {getStatusBadge(survey.status)}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {survey.title}
                      </h3>
                      {survey.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {survey.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      {survey.questions?.length || 0} câu hỏi
                    </div>
                    {survey.category && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Tag className="w-4 h-4 mr-2" />
                        {survey.category.name}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-2" />
                      {survey.object === 'public' ? 'Công khai' : 
                       survey.object === 'students' ? 'Sinh viên' : 'Giảng viên'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditSurvey(survey.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                    >
                      <Edit className="w-4 h-4" />
                      Chỉnh sửa
                    </button>
                    <button
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
