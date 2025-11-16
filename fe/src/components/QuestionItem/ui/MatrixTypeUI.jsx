import React from "react";
import EditableField from "../../EditableField";
import { PlusIcon } from "../../../icons";

export default function MatrixTypeUI({
  question,
  options,
  isActive,
  onOptionChange,
  onRemoveOption,
  onMoveOption,
  onAddOption,
  onAnswerSelect,
  selectedAnswer,
  draggedIndex,
  setDraggedIndex,
  dragOverIndex,
  setDragOverIndex,
}) {
  // Parse selected answers (format: { subquestionId: optionId })
  const selectedAnswers = React.useMemo(() => {
    if (!selectedAnswer) return {};
    try {
      return JSON.parse(selectedAnswer);
    } catch {
      return {};
    }
  }, [selectedAnswer]);

  // Lấy danh sách subquestions và answer options
  const subquestions = options.filter(opt => opt.isSubquestion);
  const answerOptions = options.filter(opt => !opt.isSubquestion);

  // Handle radio selection
  const handleRadioSelect = (subquestionId, optionId) => {
    const newAnswers = { ...selectedAnswers, [subquestionId]: optionId };
    onAnswerSelect?.(question.id, JSON.stringify(newAnswers), question.type);
  };

  // Đồng bộ width giữa header và body columns
  React.useEffect(() => {
    answerOptions.forEach((option) => {
      const headerCols = document.querySelectorAll(`.answer-option-col-${option.id}`);
      if (headerCols.length >= 2) {
        const headerCol = headerCols[0];
        const bodyCol = headerCols[1];
        
        // Reset width để tính toán lại
        headerCol.style.width = 'auto';
        bodyCol.style.width = 'auto';
        
        // Lấy width lớn nhất
        const maxWidth = Math.max(headerCol.offsetWidth, bodyCol.offsetWidth);
        
        // Set cùng width cho cả hai
        headerCols.forEach(col => {
          col.style.width = `${maxWidth}px`;
        });
      }
    });
  }, [answerOptions, options, isActive]);

  // Drag handlers cho subquestions
  const createSubquestionDragHandlers = (optionIndex) => {
    const handleDragStart = (e) => {
      setDraggedIndex(optionIndex);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", optionIndex.toString());
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";
      if (dragOverIndex !== optionIndex) {
        setDragOverIndex(optionIndex);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setDragOverIndex(null);
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (draggedIndex !== null && draggedIndex !== optionIndex && onMoveOption) {
        onMoveOption(question.id, draggedIndex, optionIndex);
      }
      setDraggedIndex(null);
      setDragOverIndex(null);
    };

    const handleDragEnd = () => {
      setDraggedIndex(null);
      setDragOverIndex(null);
    };

    return {
      handleDragStart,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleDragEnd,
    };
  };

  // Drag handlers cho answer options
  const createAnswerOptionDragHandlers = (optionIndex) => {
    const handleDragStart = (e) => {
      setDraggedIndex(optionIndex);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", optionIndex.toString());
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";
      if (dragOverIndex !== optionIndex) {
        setDragOverIndex(optionIndex);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setDragOverIndex(null);
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (draggedIndex !== null && draggedIndex !== optionIndex && onMoveOption) {
        onMoveOption(question.id, draggedIndex, optionIndex);
      }
      setDraggedIndex(null);
      setDragOverIndex(null);
    };

    const handleDragEnd = () => {
      setDraggedIndex(null);
      setDragOverIndex(null);
    };

    return {
      handleDragStart,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleDragEnd,
    };
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        paddingLeft: "28px",
        paddingRight: "28px",
      }}
    >
      {/* Container chính với position relative */}
      <div
        style={{
          width: "720px",
          position: "relative",
          display: "flex",
          gap: "8px",
        }}
      >
        {/* Phần scroll */}
        <div
          style={{
            flex: 1,
            overflowX: "auto",
            overflowY: "visible",
            position: "relative",
          }}
        >
          {/* Bảng ma trận */}
          <div
            style={{
              minWidth: "fit-content",
              display: "inline-block",
              position: "relative",
              paddingRight: isActive ? "58px" : "0", // Space cho nút + bên phải
              paddingBottom: isActive ? "58px" : "0", // Space cho nút + bên dưới (38px + 10px margin + 10px extra)
            }}
          >
            {/* Header row - Answer options */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                marginBottom: "8px",
                paddingLeft: "180px", // Space cho cột subquestion
                marginLeft: "-10px",
              }}
            >
              {answerOptions.map((option, optionIndex) => {
                const isDragging = draggedIndex === optionIndex;
                const isDragOver = dragOverIndex === optionIndex;
                const dragHandlers = createAnswerOptionDragHandlers(optionIndex);

                return (
                  <div
                    key={option.id}
                    data-option-id={option.id}
                    className={`answer-option-col-${option.id}`}
                    style={{
                      minWidth: "120px",
                      minHeight: "50px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                      opacity: isDragging ? 0.5 : 1,
                      backgroundColor: isDragOver ? "#f3f4f6" : "transparent",
                      transition: "all 0.2s",
                      marginRight: "20px",
                      flex: "0 0 auto",
                    }}
                    onDragOver={dragHandlers.handleDragOver}
                    onDragLeave={dragHandlers.handleDragLeave}
                    onDrop={dragHandlers.handleDrop}
                  >
                    {isActive && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveOption?.(question.id, option.id);
                          }}
                          className="hover:bg-red-100 rounded-full transition-colors"
                          title="Xóa answer option"
                          style={{
                            width: "13px",
                            height: "13px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#ef4444",
                            border: "none",
                            padding: "0",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="8"
                            height="8"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                        <div
                          draggable={isActive}
                          onDragStart={dragHandlers.handleDragStart}
                          onDragEnd={dragHandlers.handleDragEnd}
                          className="cursor-move hover:bg-gray-200 rounded transition-colors"
                          title="Nhấn giữ và kéo để di chuyển"
                          style={{
                            width: "18px",
                            height: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "2px",
                            userSelect: "none",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="10"
                            viewBox="0 0 18 10"
                            fill="currentColor"
                            className="text-gray-600"
                          >
                            <circle cx="2" cy="2" r="1.5" />
                            <circle cx="9" cy="2" r="1.5" />
                            <circle cx="16" cy="2" r="1.5" />
                            <circle cx="2" cy="8" r="1.5" />
                            <circle cx="9" cy="8" r="1.5" />
                            <circle cx="16" cy="8" r="1.5" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div style={{ 
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      width: "100%",
                    }}>
                      {isActive ? (
                        <EditableField
                          placeholder="Answer option"
                          initialValue={option.text}
                          inputClassName="text-sm text-gray-700 placeholder:italic placeholder:text-gray-400 font-medium text-center"
                          isTextarea={false}
                          onChange={(value) => onOptionChange?.(question.id, option.id, value)}
                        />
                      ) : (
                        <span 
                          className="text-sm text-gray-700 font-medium italic text-gray-400"
                          style={{
                            display: "block",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {option.text || "Answer option"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Body rows - Subquestions */}
            {subquestions.map((subquestion, subIndex) => {
              const isDragging = draggedIndex === subIndex;
              const isDragOver = dragOverIndex === subIndex;
              const dragHandlers = createSubquestionDragHandlers(subIndex);

              return (
                <div
                  key={subquestion.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    minHeight: "38px",
                    marginBottom: "4px",
                    opacity: isDragging ? 0.5 : 1,
                    backgroundColor: isDragOver ? "#f3f4f6" : "transparent",
                    transition: "all 0.2s",
                  }}
                  onDragOver={dragHandlers.handleDragOver}
                  onDragLeave={dragHandlers.handleDragLeave}
                  onDrop={dragHandlers.handleDrop}
                >
                  <div
                    style={{
                      width: "180px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {isActive && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveOption?.(question.id, subquestion.id);
                          }}
                          className="hover:bg-red-100 rounded-full transition-colors"
                          title="Xóa subquestion"
                          style={{
                            width: "13px",
                            height: "13px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#ef4444",
                            border: "none",
                            padding: "0",
                            flexShrink: 0,
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="8"
                            height="8"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                        <div
                          draggable={isActive}
                          onDragStart={dragHandlers.handleDragStart}
                          onDragEnd={dragHandlers.handleDragEnd}
                          className="cursor-move hover:bg-gray-200 rounded transition-colors"
                          title="Nhấn giữ và kéo để di chuyển"
                          style={{
                            width: "18px",
                            height: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "2px",
                            userSelect: "none",
                            flexShrink: 0,
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="10"
                            viewBox="0 0 18 10"
                            fill="currentColor"
                            className="text-gray-600"
                          >
                            <circle cx="2" cy="2" r="1.5" />
                            <circle cx="9" cy="2" r="1.5" />
                            <circle cx="16" cy="2" r="1.5" />
                            <circle cx="2" cy="8" r="1.5" />
                            <circle cx="9" cy="8" r="1.5" />
                            <circle cx="16" cy="8" r="1.5" />
                          </svg>
                        </div>
                      </>
                    )}
                    <div
                      style={{
                        width: "150px",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        whiteSpace: "normal",
                      }}
                    >
                      {isActive ? (
                        <EditableField
                          placeholder="Subquestion"
                          initialValue={subquestion.text}
                          inputClassName="text-sm text-gray-700 placeholder:italic placeholder:text-gray-400 font-medium"
                          isTextarea={true}
                          onChange={(value) => onOptionChange?.(question.id, subquestion.id, value)}
                        />
                      ) : (
                        <span
                          className="text-sm text-gray-700 font-medium italic text-gray-400"
                          style={{
                            display: "block",
                            wordWrap: "break-word",
                            overflowWrap: "break-word",
                            whiteSpace: "normal",
                          }}
                        >
                          {subquestion.text || "Subquestion"}
                        </span>
                      )}
                    </div>
                  </div>

                  {answerOptions.map((option) => (
                    <div
                      key={option.id}
                      data-option-id={option.id}
                      className={`answer-option-col-${option.id}`}
                      style={{
                        minWidth: "120px",
                        display: "flex",
                        marginRight: "20px",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: "0 0 auto",
                      }}
                    >
                      <input
                        type="radio"
                        name={`matrix-${question.id}-${subquestion.id}`}
                        checked={selectedAnswers[subquestion.id] === option.id}
                        onChange={() => handleRadioSelect(subquestion.id, option.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-violet-600 focus:ring-violet-500 cursor-pointer"
                        style={{
                          accentColor: "#7c3aed",
                          width: "24px",
                          height: "24px",
                        }}
                      />
                    </div>
                  ))}
                </div>
              );
            })}


          </div>
        </div>

        {/* Container cho 2 nút tạo hình chữ L */}
        {isActive && (
          <div
            style={{
              width: "50px",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0",
              alignSelf: "flex-start",
              marginTop: "0",
            }}
          >
            {/* Nút thêm Answer option - dọc bên phải */}
            <div
              style={{
                width: "50px",
                height: `${58 + subquestions.length * 42}px`,
                minHeight: "134px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#c4b5fd",
                border: "2px dashed #a78bfa",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              className="hover:bg-violet-300"
              onClick={(e) => {
                e.stopPropagation();
                onAddOption?.(question.id, false);
              }}
            >
              <PlusIcon className="w-6 h-6 text-violet-700" />
            </div>

            {/* Nút thêm Subquestion - ngang ở dưới */}
            <div
              style={{
                width: "510px",
                height: "38px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#c4b5fd",
                border: "2px dashed #a78bfa",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.2s",
                marginTop: "10px",
                marginRight: "50px",
                transform: "translateX(-460px)",
              }}
              className="hover:bg-violet-300"
              onClick={(e) => {
                e.stopPropagation();
                onAddOption?.(question.id, true);
              }}
            >
              <PlusIcon className="w-6 h-6 text-violet-700" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
