import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { getSurvey } from "../api/surveys";

export default function SurveyPreview() {
  const { surveyId } = useParams();
  const navigate = useNavigate();

  const [showWarning, setShowWarning] = useState(true);
  const [surveyData, setSurveyData] = useState({ title: "Untitled survey", questions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!surveyId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getSurvey(surveyId);
        
        // Lấy tất cả questions từ questionGroups hoặc questions trực tiếp
        let allQuestions = [];
        if (data.questionGroups && data.questionGroups.length > 0) {
          allQuestions = data.questionGroups.flatMap(group => group.questions || []);
        } else if (data.questions) {
          allQuestions = data.questions;
        }

        setSurveyData({
          title: data.title || "Untitled survey",
          questions: allQuestions,
          status: data.status
        });
      } catch (err) {
        console.error("Error fetching survey:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [surveyId]);

  const { title, questions, status } = surveyData;
  const questionCount = questions?.length || 0;
  const isActive = status === "active";

  const handleContinue = () => {
    navigate(`/surveys/${surveyId}/take`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-red-500">Lỗi: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top progress bar */}
      <div className="h-1 bg-green-0 w-9"></div>

      {/* Thanh ngang ở giữa phía trên warning - có dải xanh đầu */}
      <div className="flex justify-center mt-[50px]">
        <div className="relative w-full h-0.5 bg-gray-300" style={{ maxWidth: "995px" }}>
          {/* Dải xanh ở đầu thanh */}
          <div
            className="absolute left-0 top-0 h-full bg-green-500"
            style={{ width: "50px" }}
          ></div>
        </div>
      </div>

      {/* Container chung cho warning và content - căn giữa */}
      <div className="mx-auto mt-10" style={{ maxWidth: "995px" }}>
        {/* Warning banner - chỉ hiển thị khi chưa kích hoạt */}
        {showWarning && !isActive && (
          <div
            className="flex items-center justify-between px-4 rounded border"
            style={{
              width: "100%",
              height: "42px",
              backgroundColor: "#ffe046"
            }}
          >
            <span className="text-md text-gray-800">
              Khảo sát này hiện chưa được kích hoạt. Bạn sẽ không thể lưu phản hồi của bạn.
            </span>
            <button
              onClick={() => setShowWarning(false)}
              className="text-gray-600 hover:text-gray-800"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Main content - cùng container với warning */}
        <div className="mt-3">
          {/* Title - 750x52 */}
          <h1
            className="font-bold text-gray-900"
            style={{
              fontSize: "50px",
              lineHeight: "52px",
              fontFamily: "'Playfair Display', serif"
            }}
          >
            {title || "Untitled survey"}
          </h1>

          {/* Question count - 750x24 */}
          <p
            className="text-gray-900 mt-2"
            style={{
              fontWeight: "500",
              fontSize: "18px",
              lineHeight: "24px"
            }}
          >
            Có {questionCount} câu hỏi trong cuộc khảo sát này.
          </p>

          {/* Continue button - 94x54, căn phải thẳng với cuối warning */}
          <div className="flex justify-end mt-10">
            <button
              onClick={handleContinue}
              className="text-white font-medium rounded-sm transition"
              style={{
                width: "94px",
                height: "54px",
                backgroundColor: "#22c55e"
              }}
            >
              Tiếp theo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
