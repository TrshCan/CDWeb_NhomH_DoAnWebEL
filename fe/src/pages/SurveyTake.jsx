import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, Calendar, Upload } from "lucide-react";
import { getSurvey } from "../api/surveys";
import toast, { Toaster } from "react-hot-toast";

export default function SurveyTake() {
  const { surveyId } = useParams();
  const navigate = useNavigate();

  const [showWarning, setShowWarning] = useState(true);
  const [surveyData, setSurveyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!surveyId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getSurvey(surveyId);

        let allQuestions = [];
        if (data.questionGroups && data.questionGroups.length > 0) {
          allQuestions = data.questionGroups.flatMap((group) => group.questions || []);
        } else if (data.questions) {
          allQuestions = data.questions;
        }

        setSurveyData({
          title: data.title || "Untitled survey",
          questions: allQuestions,
          status: data.status,
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

  // Kiểm tra điều kiện hiển thị câu hỏi
  const shouldShowQuestion = (question) => {
    const conditions = question.conditions;
    if (!conditions || conditions.length === 0) {
      return true;
    }

    const matchSelected = (selected, value) => {
      if (Array.isArray(selected)) {
        return selected.map(String).includes(String(value));
      }
      return String(selected) === String(value);
    };

    for (const condition of conditions) {
      if (condition.type === "question" && condition.field && condition.value) {
        const selected = answers[condition.field];
        if (matchSelected(selected, condition.value)) {
          return true;
        }
      }
    }

    return false;
  };

  // Kiểm tra câu hỏi bắt buộc
  const isQuestionRequired = (question) => {
    return question.required === "hard" || question.required === true;
  };

  // Kiểm tra câu hỏi đã được trả lời chưa
  const isQuestionAnswered = (questionId, answer) => {
    if (answer === undefined || answer === null || answer === "") {
      return false;
    }
    if (Array.isArray(answer) && answer.length === 0) {
      return false;
    }
    if (typeof answer === "object" && !Array.isArray(answer)) {
      // Cho loại có nhận xét hoặc matrix
      if (answer.selected !== undefined) {
        return answer.selected !== null && answer.selected !== "";
      }
      return Object.keys(answer).length > 0;
    }
    return true;
  };

  // Validate tất cả câu hỏi bắt buộc
  const validateRequiredQuestions = () => {
    const errors = {};
    const visibleQuestions = surveyData?.questions?.filter(shouldShowQuestion) || [];
    
    for (const question of visibleQuestions) {
      if (isQuestionRequired(question)) {
        if (!isQuestionAnswered(question.id, answers[question.id])) {
          errors[question.id] = "Câu hỏi này bắt buộc phải trả lời";
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Xử lý submit
  const handleSubmit = () => {
    if (!validateRequiredQuestions()) {
      toast.error("Vui lòng trả lời tất cả câu hỏi bắt buộc");
      // Scroll đến câu hỏi lỗi đầu tiên
      const firstErrorId = Object.keys(validationErrors)[0];
      if (firstErrorId) {
        const element = document.getElementById(`question-${firstErrorId}`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // TODO: Submit answers to backend
    toast.success("Đã gửi khảo sát thành công!");
    navigate(-1);
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // Clear validation error khi user trả lời
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const handleMultipleAnswerChange = (questionId, optionId, checked) => {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...current, optionId] };
      } else {
        return { ...prev, [questionId]: current.filter((id) => id !== optionId) };
      }
    });
    // Clear validation error khi user trả lời
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
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

  const { questions, status } = surveyData || {};
  const isActive = status === "active";

  return (
    <div className="min-h-screen bg-white">
      <div className="h-1 bg-green-0 w-9"></div>
      {/* Thanh ngang ở giữa phía trên warning - có dải xanh đầu */}
      <div className="flex justify-center mt-[50px]">
        <div className="relative w-full h-0.5 bg-gray-300" style={{ maxWidth: "1009px" }}>
          <div
            className="absolute left-0 top-0 h-full bg-green-500"
            style={{ width: "50px" }}
          ></div>
        </div>
      </div>

      {/* Container chung - căn giữa */}
      <div className="mx-auto mt-10 px-4" style={{ maxWidth: "1009px" }}>
        {/* Warning banner - chỉ hiển thị khi chưa kích hoạt */}
        {showWarning && !isActive && (
          <div
            className="flex items-center justify-between px-4 rounded border mb-8"
            style={{
              width: "100%",
              height: "42px",
              backgroundColor: "#ffe046",
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

        {/* Questions */}
        <div className="flex flex-col" style={{ gap: "30px" }}>
          {questions?.filter(shouldShowQuestion).map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              answer={answers[question.id]}
              onAnswerChange={handleAnswerChange}
              onMultipleAnswerChange={handleMultipleAnswerChange}
              isRequired={isQuestionRequired(question)}
              hasError={!!validationErrors[question.id]}
              errorMessage={validationErrors[question.id]}
            />
          ))}
        </div>

        {/* Submit button */}
        <div className="flex justify-end mt-10 mb-10">
          <button
            onClick={handleSubmit}
            className="text-white font-medium rounded-sm hover:opacity-90 transition"
            style={{
              width: "94px",
              height: "54px",
              backgroundColor: "#22c55e",
            }}
          >
            Gửi
          </button>
        </div>
        
        <Toaster position="top-center" />

        <div className="h-1 bg-white"></div>
      </div>
    </div>
  );
}


// Component hiển thị từng câu hỏi
function QuestionCard({ 
  question, 
  answer, 
  onAnswerChange, 
  onMultipleAnswerChange,
  isRequired = false,
  hasError = false,
  errorMessage = ""
}) {
  const options = question.options || [];
  const questionType = question.question_type;
  const datePickerRef = useRef(null);
  const [dateInputValue, setDateInputValue] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Format date cho hiển thị MM/DD/YYYY
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Xử lý input date với mask
  const handleDateInputChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length > 8) value = value.substring(0, 8);

    let formatted = value;
    if (value.length > 2) formatted = value.substring(0, 2) + "/" + value.substring(2);
    if (value.length > 4) formatted = value.substring(0, 2) + "/" + value.substring(2, 4) + "/" + value.substring(4);

    setDateInputValue(formatted);

    if (value.length === 8) {
      const dateForStorage = `${value.substring(4, 8)}-${value.substring(0, 2)}-${value.substring(2, 4)}`;
      onAnswerChange(question.id, dateForStorage);
    }
  };

  // Render UI cho loại Giới tính
  const renderGenderType = () => (
    <div className="mt-4 flex gap-4 flex-wrap">
      {options.map((option) => {
        const isSelected = String(answer) === String(option.id);
        const isNoAnswer = option.option_text === "Không có câu trả lời";
        const isFemale = option.option_text === "Nữ";
        const isMale = option.option_text === "Nam";

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onAnswerChange(question.id, option.id)}
            className="relative group"
            style={{
              width: isNoAnswer ? "173px" : "90px",
              height: "75px",
            }}
          >
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center rounded-lg border-2 transition-all
                ${isSelected ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-green-300"}`}
            >
              {isFemale && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isSelected ? "#22c55e" : "#6b7280"} strokeWidth="2">
                  <circle cx="12" cy="8" r="5" />
                  <path d="M12 13v8M9 18h6" />
                </svg>
              )}
              {isMale && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isSelected ? "#22c55e" : "#6b7280"} strokeWidth="2">
                  <circle cx="10" cy="14" r="5" />
                  <path d="M19 5l-5.4 5.4M19 5h-5M19 5v5" />
                </svg>
              )}
              <span className={`text-sm mt-1 ${isSelected ? "text-green-600" : isNoAnswer ? "text-green-600" : "text-gray-600"}`}>
                {option.option_text}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );

  // Render UI cho loại Có/Không
  const renderYesNoType = () => (
    <div className="mt-4 flex gap-4 flex-wrap">
      {options.map((option) => {
        const isSelected = String(answer) === String(option.id);
        const isNoAnswer = option.option_text === "Không có câu trả lời";
        const isYes = option.option_text === "Có";
        const isNo = option.option_text === "Không";

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onAnswerChange(question.id, option.id)}
            className="relative group"
            style={{
              width: isNoAnswer ? "173px" : "90px",
              height: "75px",
            }}
          >
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center rounded-lg border-2 transition-all
                ${isSelected ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-green-300"}`}
            >
              {isYes && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isSelected ? "#22c55e" : "#6b7280"} strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {isNo && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isSelected ? "#22c55e" : "#6b7280"} strokeWidth="3">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
              <span className={`text-sm mt-1 ${isSelected ? "text-green-600" : isNoAnswer ? "text-green-600" : "text-gray-600"}`}>
                {option.option_text}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );

  // Render UI cho loại 5 điểm
  const renderFivePointScale = () => (
    <div className="mt-4">
      <div className="flex items-center gap-12">
        {[1, 2, 3, 4, 5].map((point) => {
          const isSelected = answer === point;
          return (
            <div key={point} className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => onAnswerChange(question.id, point)}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all
                  ${isSelected ? "border-green-300" : "border-gray-400 hover:border-green-300"}`}
              >
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-green-300"></div>
                )}
              </button>
              <span className="text-gray-700 font-medium text-sm">{point}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Render UI cho loại Radio (Danh sách nút chọn)
  const renderRadioType = () => (
    <div className="mt-4 space-y-3">
      <p className="text-gray-500 italic text-sm">Chọn một trong những câu trả lời sau</p>
      {options.map((option) => {
        const isNoAnswer = option.option_text === "Không có câu trả lời";
        const isSelected = String(answer?.selected) === String(option.id) || String(answer) === String(option.id);
        return (
          <label key={option.id} className="flex items-center gap-3 cursor-pointer">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                ${isSelected ? "border-green-400" : "border-gray-400"}`}
              onClick={() => {
                if (questionType === "Danh sách có nhận xét (Radio)") {
                  onAnswerChange(question.id, { selected: option.id, comment: answer?.comment || "" });
                } else {
                  onAnswerChange(question.id, option.id);
                }
              }}
            >
              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>}
            </div>
            <span
              className={isNoAnswer ? "text-green-600" : "text-gray-700"}
              onClick={() => {
                if (questionType === "Danh sách có nhận xét (Radio)") {
                  onAnswerChange(question.id, { selected: option.id, comment: answer?.comment || "" });
                } else {
                  onAnswerChange(question.id, option.id);
                }
              }}
            >
              {option.option_text}
            </span>
          </label>
        );
      })}
    </div>
  );

  // Render UI cho loại Danh sách có nhận xét (Radio)
  const renderRadioWithComment = () => (
    <div className="mt-4">
      <div className="space-y-3">
        <p className="text-gray-500 italic text-sm">Chọn một trong những câu trả lời sau</p>
        {options.map((option) => {
          const isNoAnswer = option.option_text === "Không có câu trả lời";
          const isSelected = String(answer?.selected) === String(option.id);
          return (
            <label key={option.id} className="flex items-center gap-3 cursor-pointer">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                  ${isSelected ? "border-green-400" : "border-gray-400"}`}
                onClick={() => onAnswerChange(question.id, { selected: option.id, comment: answer?.comment || "" })}
              >
                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>}
              </div>
              <span
                className={isNoAnswer ? "text-green-600" : "text-gray-700"}
                onClick={() => onAnswerChange(question.id, { selected: option.id, comment: answer?.comment || "" })}
              >
                {option.option_text}
              </span>
            </label>
          );
        })}
      </div>
      {/* Ô nhận xét */}
      <div className="mt-4">
        <textarea
          placeholder="Nhập nhận xét của bạn tại đây."
          value={answer?.comment || ""}
          onChange={(e) => onAnswerChange(question.id, { selected: answer?.selected, comment: e.target.value })}
          className="w-full border-2 border-gray-300 rounded-md p-3 text-sm text-gray-700 placeholder:italic placeholder:text-gray-500 focus:outline-none focus:border-green-500 resize-none"
          rows={3}
          style={{ maxWidth: "300px" }}
        />
      </div>
    </div>
  );

  // Render UI cho loại Checkbox
  const renderCheckboxType = () => (
    <div className="mt-4 space-y-3">
      <p className="text-gray-500 italic text-sm">Chọn nhiều câu trả lời</p>
      {options.map((option) => {
        const isChecked = Array.isArray(answer) && answer.includes(option.id);
        return (
          <label key={option.id} className="flex items-center gap-3 cursor-pointer">
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                ${isChecked ? "border-green-400 bg-green-400" : "border-gray-400"}`}
              onClick={() => onMultipleAnswerChange(question.id, option.id, !isChecked)}
            >
              {isChecked && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="text-gray-700">{option.option_text}</span>
          </label>
        );
      })}
    </div>
  );

  // Render UI cho loại Văn bản ngắn
  const renderShortText = () => (
    <div className="mt-4">
      <input
        type="text"
        value={answer || ""}
        onChange={(e) => onAnswerChange(question.id, e.target.value)}
        placeholder="Nhập câu trả lời của bạn ở đây"
        maxLength={question.max_length || 256}
        className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 focus:outline-none focus:border-green-500 bg-transparent text-gray-700"
      />
    </div>
  );

  // Render UI cho loại Văn bản dài
  const renderLongText = () => (
    <div className="mt-4">
      <textarea
        value={answer || ""}
        onChange={(e) => onAnswerChange(question.id, e.target.value)}
        placeholder="Nhập câu trả lời của bạn ở đây"
        maxLength={question.max_length || 2500}
        rows={5}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-green-500 resize-none text-gray-700"
      />
    </div>
  );

  // Render UI cho loại Ngày giờ
  const renderDateTime = () => (
    <div className="mt-4 relative">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={dateInputValue}
          onChange={handleDateInputChange}
          placeholder="MM/DD/YYYY"
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-green-500 w-40"
        />
        <button
          type="button"
          onClick={() => datePickerRef.current?.showPicker?.()}
          className="p-2 text-gray-500 hover:text-green-500"
        >
          <Calendar size={20} />
        </button>
        <input
          ref={datePickerRef}
          type="date"
          className="absolute opacity-0 w-0 h-0"
          onChange={(e) => {
            if (e.target.value) {
              setDateInputValue(formatDateForDisplay(e.target.value));
              onAnswerChange(question.id, e.target.value);
            }
          }}
        />
      </div>
    </div>
  );

  // Render UI cho loại Tải lên tệp
  const renderFileUpload = () => (
    <div className="mt-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors cursor-pointer"
        onClick={() => document.getElementById(`file-${question.id}`)?.click()}
      >
        <Upload className="mx-auto text-gray-400 mb-2" size={32} />
        <p className="text-gray-500">Nhấn để chọn tệp hoặc kéo thả vào đây</p>
        <p className="text-gray-400 text-sm mt-1">
          Loại tệp: {question.allowed_file_types || "png, gif, doc, odt, jpg, jpeg, pdf"}
        </p>
        <input
          type="file"
          id={`file-${question.id}`}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setUploadedFiles([...uploadedFiles, file]);
              onAnswerChange(question.id, file.name);
            }
          }}
        />
      </div>
      {uploadedFiles.length > 0 && (
        <div className="mt-2 space-y-1">
          {uploadedFiles.map((file, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
              <span>📎 {file.name}</span>
              <button
                type="button"
                onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                className="text-red-500 hover:text-red-700"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render UI cho loại Ma trận
  const renderMatrixType = () => {
    const answerOptions = options.filter((o) => !o.is_subquestion);
    const subquestions = options.filter((o) => o.is_subquestion);

    return (
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-left border-b"></th>
              {answerOptions.map((opt) => (
                <th key={opt.id} className="p-3 text-center text-sm text-gray-600 border-b">
                  {opt.option_text}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subquestions.map((sub) => (
              <tr key={sub.id} className="border-b">
                <td className="p-3 text-gray-700">{sub.option_text}</td>
                {answerOptions.map((opt) => (
                  <td key={opt.id} className="p-3 text-center">
                    <div className="flex justify-center">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all
                          ${answer?.[sub.id] === opt.id ? "border-green-400" : "border-gray-400 hover:border-green-300"}`}
                        onClick={() => {
                          const newAnswer = { ...(answer || {}), [sub.id]: opt.id };
                          onAnswerChange(question.id, newAnswer);
                        }}
                      >
                        {answer?.[sub.id] === opt.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                        )}
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render UI cho loại Nhiều văn bản ngắn
  const renderMultipleShortText = () => {
    // Trong loại này, tất cả options đều là subquestion (câu hỏi con)
    const subquestions = options.length > 0 ? options : [];
    return (
      <div className="mt-4 space-y-4">
        {subquestions.map((sub) => (
          <div key={sub.id} className="flex flex-col gap-2">
            <span className="text-gray-700 font-medium" style={{ width: "290px", wordWrap: "break-word" }}>
              {sub.option_text}
            </span>
            <input
              type="text"
              value={answer?.[sub.id] || ""}
              onChange={(e) => {
                const newAnswer = { ...(answer || {}), [sub.id]: e.target.value };
                onAnswerChange(question.id, newAnswer);
              }}
              placeholder="Nhập câu trả lời của bạn tại đây."
              maxLength={256}
              className="border-2 border-gray-400 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:border-green-500"
              style={{ width: "300px", height: "40px" }}
            />
          </div>
        ))}
      </div>
    );
  };

  // Render UI cho loại Chọn hình ảnh (Radio)
  const renderImageRadio = () => (
    <div className="mt-4 flex flex-wrap gap-4">
      {options.map((option) => {
        const isSelected = String(answer) === String(option.id);
        return (
          <div
            key={option.id}
            onClick={() => onAnswerChange(question.id, option.id)}
            className={`cursor-pointer rounded-lg border-2 p-2 transition-all
              ${isSelected ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-green-300"}`}
          >
            {option.image && (
              <img src={option.image} alt={option.option_text} className="w-24 h-24 object-cover rounded" />
            )}
            <p className="text-center text-sm mt-1 text-gray-700">{option.option_text}</p>
          </div>
        );
      })}
    </div>
  );

  // Render UI cho loại Chọn nhiều hình ảnh
  const renderImageCheckbox = () => (
    <div className="mt-4 flex flex-wrap gap-4">
      {options.map((option) => {
        const isChecked = Array.isArray(answer) && answer.includes(option.id);
        return (
          <div
            key={option.id}
            onClick={() => onMultipleAnswerChange(question.id, option.id, !isChecked)}
            className={`cursor-pointer rounded-lg border-2 p-2 transition-all relative
              ${isChecked ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-green-300"}`}
            style={{ width: "160px", height: "160px" }}
          >
            {/* Checkbox indicator */}
            <div className={`absolute top-2 right-2 w-5 h-5 rounded border-2 flex items-center justify-center
              ${isChecked ? "border-green-400 bg-green-400" : "border-gray-400"}`}>
              {isChecked && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            {option.image ? (
              <img 
                src={option.image} 
                alt={option.option_text} 
                className="w-full h-28 object-cover rounded"
              />
            ) : (
              <div className="w-full h-28 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-gray-400 text-xs">Chưa có ảnh</span>
              </div>
            )}
            <p className="text-center text-sm mt-1 text-gray-700 truncate">{option.option_text}</p>
          </div>
        );
      })}
    </div>
  );

  // Render options dựa trên loại câu hỏi
  const renderOptions = () => {
    switch (questionType) {
      case "Giới tính":
        return renderGenderType();
      case "Có/Không":
        return renderYesNoType();
      case "Lựa chọn 5 điểm":
        return renderFivePointScale();
      case "Danh sách (nút chọn)":
        return renderRadioType();
      case "Danh sách có nhận xét (Radio)":
        return renderRadioWithComment();
      case "Danh sách (hộp kiểm)":
      case "Nhiều lựa chọn":
        return renderCheckboxType();
      case "Văn bản ngắn":
        return renderShortText();
      case "Văn bản dài":
        return renderLongText();
      case "Ngày giờ":
        return renderDateTime();
      case "Tải lên tệp":
        return renderFileUpload();
      case "Ma trận (chọn điểm)":
        return renderMatrixType();
      case "Nhiều văn bản ngắn":
        return renderMultipleShortText();
      case "Chọn hình ảnh từ danh sách (Radio)":
        return renderImageRadio();
      case "Chọn nhiều hình ảnh":
        return renderImageCheckbox();
      default:
        if (options.length > 0) return renderRadioType();
        return null;
    }
  };

  return (
    <div
      id={`question-${question.id}`}
      className={`rounded bg-white p-6 border-2 transition-colors ${
        hasError ? "border-red-400" : "border-gray-200"
      }`}
      style={{ width: "1009px" }}
    >
      {/* Question text với dấu * nếu bắt buộc */}
      <div className="flex items-start gap-1">
        <h3 className="text-xl font-semibold text-gray-900">
          {question.question_text}
        </h3>
        {isRequired && (
          <span className="text-red-500 text-2xl font-bold">*</span>
        )}
      </div>

      {/* Help text */}
      {question.help_text && (
        <p className="text-gray-500 italic mt-1">{question.help_text}</p>
      )}

      {/* Error message */}
      {hasError && errorMessage && (
        <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
      )}

      {/* Question image */}
      {question.image && (
        <div className="mt-4">
          <img
            src={question.image}
            alt="Question"
            className="max-w-full h-auto rounded"
            style={{ maxHeight: "300px" }}
          />
        </div>
      )}

      {/* Options */}
      {renderOptions()}
    </div>
  );
}
