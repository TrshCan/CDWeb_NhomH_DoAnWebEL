import { useState } from "react";
import "../assets/css/QuestionRenderer.css";

/**
 * Component để render các loại câu hỏi khác nhau
 * Hỗ trợ 15+ loại câu hỏi
 */
function QuestionRenderer({ question, answer, onAnswerChange }) {
  const [localAnswer, setLocalAnswer] = useState(answer || {});

  const handleChange = (value) => {
    const newAnswer = {
      question_id: question.id,
      ...value,
    };
    setLocalAnswer(newAnswer);
    onAnswerChange(question.id, newAnswer);
  };

  const handleTextChange = (text) => {
    handleChange({ answer_text: text });
  };

  const handleSingleChoice = (optionId) => {
    handleChange({ selected_option_id: optionId });
  };

  const handleMultipleChoice = (optionId) => {
    const currentAnswers = localAnswer.selected_option_id || [];
    const isArray = Array.isArray(currentAnswers);

    if (!isArray) {
      handleChange({ selected_option_id: [optionId] });
      return;
    }

    const newAnswers = currentAnswers.includes(optionId)
      ? currentAnswers.filter((id) => id !== optionId)
      : [...currentAnswers, optionId];

    handleChange({ selected_option_id: newAnswers });
  };

  const renderOptions = (type, isImageType = false) => {
    if (!question.options || question.options.length === 0) {
      return <p className="no-options">Không có lựa chọn cho câu hỏi này.</p>;
    }

    return question.options.map((option, optIndex) => {
      const isChecked =
        type === "multiple"
          ? Array.isArray(localAnswer.selected_option_id) &&
            localAnswer.selected_option_id.includes(option.id)
          : localAnswer.selected_option_id === option.id;

      // Nếu là loại hình ảnh - luôn render dạng card
      if (isImageType) {
        return (
          <label
            key={option.id}
            className={`image-option ${isChecked ? "selected" : ""}`}
            style={{ animationDelay: `${optIndex * 50}ms` }}
          >
            <input
              type={type === "multiple" ? "checkbox" : "radio"}
              name={type === "multiple" ? undefined : `question-${question.id}`}
              value={option.id}
              checked={isChecked}
              onChange={() =>
                type === "multiple"
                  ? handleMultipleChoice(option.id)
                  : handleSingleChoice(option.id)
              }
            />
            <div className="image-option-content">
              {option.image ? (
                <img src={option.image} alt={option.option_text || "Option"} className="option-image-large" />
              ) : (
                <div className="option-image-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
              )}
              <span className="option-text-below">{option.option_text || `Lựa chọn ${optIndex + 1}`}</span>
              <span className="image-check-overlay">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            </div>
          </label>
        );
      }

      // Render option thông thường (có thể có hình ảnh nhỏ)
      return (
        <label
          key={option.id}
          className="answer-option"
          style={{ animationDelay: `${optIndex * 50}ms` }}
        >
          <input
            type={type === "multiple" ? "checkbox" : "radio"}
            name={type === "multiple" ? undefined : `question-${question.id}`}
            value={option.id}
            checked={isChecked}
            onChange={() =>
              type === "multiple"
                ? handleMultipleChoice(option.id)
                : handleSingleChoice(option.id)
            }
          />
          <span className={`option-indicator ${type === "multiple" ? "checkbox" : ""}`}></span>
          {option.image && (
            <img src={option.image} alt={option.option_text} className="option-image" />
          )}
          <span className="option-text">{option.option_text}</span>
          <span className="option-check">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        </label>
      );
    });
  };

  // Định nghĩa các loại câu hỏi theo backend
  const QUESTION_TYPES = {
    // Text-based
    SHORT_TEXT: ["text", "văn bản ngắn", "short_text"],
    LONG_TEXT: ["văn bản dài", "long_text", "textarea", "paragraph"],
    
    // Single choice (radio)
    SINGLE_CHOICE: [
      "single_choice",
      "danh sách (nút chọn)",
      "danh sách có nhận xét (radio)",
      "giới tính",
      "có/không",
    ],
    
    // Single choice with image
    SINGLE_IMAGE: ["chọn hình ảnh từ danh sách (radio)", "single_image"],
    
    // Multiple choice (checkbox)
    MULTIPLE_CHOICE: ["multiple_choice", "nhiều lựa chọn"],
    
    // Multiple choice with image
    MULTIPLE_IMAGE: ["chọn nhiều hình ảnh", "multiple_image"],
    
    // Rating scale
    FIVE_POINT: ["lựa chọn 5 điểm", "five_point", "rating"],
    
    // Matrix
    MATRIX: ["ma trận (chọn điểm)", "matrix"],
    
    // Additional types
    NUMBER: ["number", "số"],
    EMAIL: ["email", "thư điện tử"],
    PHONE: ["phone", "số điện thoại", "telephone"],
    URL: ["url", "liên kết"],
    DATE: ["date", "ngày tháng", "ngày"],
    TIME: ["time", "giờ", "thời gian"],
    DATETIME: ["datetime", "ngày giờ"],
    FILE: ["file", "tải file", "upload"],
  };

  const matchType = (typeValue, typeList) => {
    if (!typeValue) return false;
    const normalized = typeValue.toLowerCase().trim();
    return typeList.some((t) => t.toLowerCase() === normalized);
  };

  // Render dựa trên question_type
  const renderQuestionInput = () => {
    const type = question.question_type || "text";

    // 1. Văn bản ngắn (Short Text)
    if (matchType(type, QUESTION_TYPES.SHORT_TEXT)) {
      return (
        <div className="answer-input-wrapper">
          <input
            type="text"
            className="answer-input"
            placeholder="Nhập câu trả lời..."
            value={localAnswer.answer_text || ""}
            onChange={(e) => handleTextChange(e.target.value)}
            maxLength={question.max_length || undefined}
          />
          {question.max_length && (
            <span className="char-count">
              {(localAnswer.answer_text || "").length} / {question.max_length}
            </span>
          )}
        </div>
      );
    }

    // 2. Văn bản dài (Long Text)
    if (matchType(type, QUESTION_TYPES.LONG_TEXT)) {
      return (
        <div className="answer-input-wrapper">
          <textarea
            className="answer-textarea"
            placeholder="Nhập câu trả lời..."
            value={localAnswer.answer_text || ""}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={5}
            maxLength={question.max_length || undefined}
          />
          {question.max_length && (
            <span className="char-count">
              {(localAnswer.answer_text || "").length} / {question.max_length}
            </span>
          )}
        </div>
      );
    }

    // 3. Danh sách (nút chọn) / Giới tính / Có-Không - Single Choice
    if (matchType(type, QUESTION_TYPES.SINGLE_CHOICE)) {
      return <div className="answer-options">{renderOptions("single")}</div>;
    }

    // 4. Chọn hình ảnh từ danh sách (Radio) - Single Image Choice
    if (matchType(type, QUESTION_TYPES.SINGLE_IMAGE)) {
      return (
        <div className="answer-options image-options-grid">
          {renderOptions("single", true)}
        </div>
      );
    }

    // 5. Nhiều lựa chọn - Multiple Choice
    if (matchType(type, QUESTION_TYPES.MULTIPLE_CHOICE)) {
      return (
        <div className="answer-options">
          <p className="multiple-hint">Chọn tất cả đáp án phù hợp</p>
          {renderOptions("multiple")}
        </div>
      );
    }

    // 6. Chọn nhiều hình ảnh - Multiple Image Choice
    if (matchType(type, QUESTION_TYPES.MULTIPLE_IMAGE)) {
      return (
        <div className="answer-options image-options-grid">
          <p className="multiple-hint">Chọn tất cả hình ảnh phù hợp</p>
          {renderOptions("multiple", true)}
        </div>
      );
    }

    // 7. Lựa chọn 5 điểm - Five Point Scale
    if (matchType(type, QUESTION_TYPES.FIVE_POINT)) {
      const maxRating = question.max_length || 5;
      return (
        <div className="rating-scale">
          {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
            <label key={rating} className="rating-option">
              <input
                type="radio"
                name={`question-${question.id}`}
                value={rating}
                checked={localAnswer.selected_option_id === rating || localAnswer.answer_text === String(rating)}
                onChange={() => {
                  // Nếu có options, dùng selected_option_id
                  if (question.options && question.options.length > 0) {
                    const option = question.options.find((o) => o.option_text === String(rating));
                    if (option) {
                      handleSingleChoice(option.id);
                    } else {
                      handleTextChange(String(rating));
                    }
                  } else {
                    handleTextChange(String(rating));
                  }
                }}
              />
              <span className="rating-number">{rating}</span>
            </label>
          ))}
        </div>
      );
    }

    // 8. Ma trận (chọn điểm) - Matrix
    if (matchType(type, QUESTION_TYPES.MATRIX)) {
      // Nếu có options, render như single choice
      if (question.options && question.options.length > 0) {
        return <div className="answer-options">{renderOptions("single")}</div>;
      }
      return (
        <div className="matrix-question">
          <textarea
            className="answer-textarea"
            placeholder="Nhập câu trả lời..."
            value={localAnswer.answer_text || ""}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={3}
          />
        </div>
      );
    }

    // 9. Number
    if (matchType(type, QUESTION_TYPES.NUMBER) || question.numeric_only) {
      return (
        <div className="answer-input-wrapper">
          <input
            type="number"
            className="answer-input"
            placeholder="Nhập số..."
            value={localAnswer.answer_text || ""}
            onChange={(e) => handleTextChange(e.target.value)}
            max={question.max_length || undefined}
          />
        </div>
      );
    }

    // 10. Email
    if (matchType(type, QUESTION_TYPES.EMAIL)) {
      return (
        <div className="answer-input-wrapper">
          <input
            type="email"
            className="answer-input"
            placeholder="Nhập email..."
            value={localAnswer.answer_text || ""}
            onChange={(e) => handleTextChange(e.target.value)}
          />
        </div>
      );
    }

    // 11. Phone
    if (matchType(type, QUESTION_TYPES.PHONE)) {
      return (
        <div className="answer-input-wrapper">
          <input
            type="tel"
            className="answer-input"
            placeholder="Nhập số điện thoại..."
            value={localAnswer.answer_text || ""}
            onChange={(e) => handleTextChange(e.target.value)}
          />
        </div>
      );
    }

    // 12. URL
    if (matchType(type, QUESTION_TYPES.URL)) {
      return (
        <div className="answer-input-wrapper">
          <input
            type="url"
            className="answer-input"
            placeholder="Nhập URL..."
            value={localAnswer.answer_text || ""}
            onChange={(e) => handleTextChange(e.target.value)}
          />
        </div>
      );
    }

    // 13. Date
    if (matchType(type, QUESTION_TYPES.DATE)) {
      return (
        <div className="answer-input-wrapper">
          <input
            type="date"
            className="answer-input"
            value={localAnswer.answer_text || ""}
            onChange={(e) => handleTextChange(e.target.value)}
          />
        </div>
      );
    }

    // 14. Time
    if (matchType(type, QUESTION_TYPES.TIME)) {
      return (
        <div className="answer-input-wrapper">
          <input
            type="time"
            className="answer-input"
            value={localAnswer.answer_text || ""}
            onChange={(e) => handleTextChange(e.target.value)}
          />
        </div>
      );
    }

    // 15. DateTime
    if (matchType(type, QUESTION_TYPES.DATETIME)) {
      return (
        <div className="answer-input-wrapper">
          <input
            type="datetime-local"
            className="answer-input"
            value={localAnswer.answer_text || ""}
            onChange={(e) => handleTextChange(e.target.value)}
          />
        </div>
      );
    }

    // 16. File Upload
    if (matchType(type, QUESTION_TYPES.FILE)) {
      return (
        <div className="file-upload-wrapper">
          <input
            type="file"
            className="file-input"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                handleTextChange(file.name);
              }
            }}
            accept={question.allowed_file_types || undefined}
          />
          {question.allowed_file_types && (
            <p className="help-text">Loại file cho phép: {question.allowed_file_types}</p>
          )}
          {question.max_file_size_kb && (
            <p className="help-text">Kích thước tối đa: {question.max_file_size_kb} KB</p>
          )}
        </div>
      );
    }

    // Default: Nếu có options thì render single choice, không thì text
    if (question.options && question.options.length > 0) {
      return <div className="answer-options">{renderOptions("single")}</div>;
    }

    return (
      <div className="answer-input-wrapper">
        <textarea
          className="answer-textarea"
          placeholder="Nhập câu trả lời..."
          value={localAnswer.answer_text || ""}
          onChange={(e) => handleTextChange(e.target.value)}
          rows={5}
        />
      </div>
    );
  };

  return (
    <div className="question-renderer">
      {question.image && (
        <div className="question-image-wrapper">
          <img src={question.image} alt="Question" className="question-image" />
        </div>
      )}
      {renderQuestionInput()}
      {question.help_text && <p className="help-text">{question.help_text}</p>}
    </div>
  );
}

export default QuestionRenderer;
