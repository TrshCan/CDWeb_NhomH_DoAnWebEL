import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import "../assets/css/ResponseDetail.css";
import "../assets/css/RawDataList.css";
import { getSurveyResponseDetail, getSurveyDetails } from "../api/graphql/survey";
import { exportResponseDetailCSV } from "../utils/exports/responseDetail/csv";
import { exportResponseDetailExcel } from "../utils/exports/responseDetail/excel";
import { exportResponseDetailPDF } from "../utils/exports/responseDetail/pdf";
import { ensureSurveyOwnership } from "../utils/surveyOwnership";
import { toVietnameseType } from "../utils/questionTypeMapping";

const normalizeType = (type) => (type || "").toString().toLowerCase();

const TEXT_BASED_TYPES = new Set(["text", "short_text", "long_text"]);
const MULTIPLE_TEXT_TYPES = new Set(["multiple_short_text"]);
const DATETIME_TYPES = new Set(["datetime"]);
const FILE_UPLOAD_TYPES = new Set(["file_upload"]);
const MATRIX_TYPES = new Set(["matrix_rating"]);
const CHOICE_WITH_COMMENT_TYPES = new Set(["single_choice_text"]);

const parseAnswerValue = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};

const formatAnswerText = (value) => {
  if (value === null || value === undefined) {
    return "No response provided.";
  }
  const stringified = String(value).trim();
  return stringified.length > 0 ? stringified : "No response provided.";
};

const formatDateTimeValue = (value) => {
  if (!value) {
    return "No response provided.";
  }
  const isoCandidate = value.includes(" ") && !value.includes("T") ? value.replace(" ", "T") : value;
  const parsed = new Date(isoCandidate);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const buildMultipleTextEntries = (rawValue) => {
  const parsed = parseAnswerValue(rawValue);
  if (!parsed) {
    return [];
  }

  if (Array.isArray(parsed)) {
    return parsed.map((item, idx) => {
      if (typeof item === "string") {
        return { label: `Trả lời ${idx + 1}`, value: item };
      }
      if (item && typeof item === "object") {
        const label = item.label || item.key || item.title || `Trả lời ${idx + 1}`;
        const value = item.value ?? item.answer ?? item.text ?? "";
        return { label, value };
      }
      return { label: `Trả lời ${idx + 1}`, value: item };
    });
  }

  if (typeof parsed === "object") {
    return Object.entries(parsed).map(([key, value], idx) => ({
      label: key || `Trả lời ${idx + 1}`,
      value,
    }));
  }

  return [];
};

const buildMatrixRows = (rawValue) => {
  const parsed = parseAnswerValue(rawValue);
  if (!parsed) {
    return [];
  }

  if (Array.isArray(parsed)) {
    return parsed.map((item, idx) => {
      if (item && typeof item === "object") {
        const label = item.label || item.row || item.question || `Hàng ${idx + 1}`;
        const value = item.value ?? item.answer ?? item.selection ?? item.column ?? item.optionId ?? "";
        return { label, value };
      }
      return { label: `Hàng ${idx + 1}`, value: item };
    });
  }

  if (typeof parsed === "object") {
    return Object.entries(parsed).map(([key, value], idx) => ({
      label: key || `Hàng ${idx + 1}`,
      value,
    }));
  }

  return [];
};

const formatMatrixCellValue = (value, optionLookup) => {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  const lookupKey = typeof value === "object" && value !== null ? value.optionId ?? value.id ?? value.value : value;
  if (lookupKey !== undefined && lookupKey !== null) {
    const matched = optionLookup.get(String(lookupKey));
    if (matched) {
      return matched;
    }
  }

  if (typeof value === "object") {
    if (value.label) return value.label;
    if (value.text) return value.text;
    if (value.value) return value.value;
    try {
      return JSON.stringify(value);
    } catch {
      return "N/A";
    }
  }

  return String(value);
};

const formatFileSize = (bytes) => {
  if (typeof bytes !== "number" || Number.isNaN(bytes) || bytes <= 0) {
    return null;
  }
  const thresholds = ["KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = -1;

  while (size >= 1024 && unitIndex < thresholds.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(1)} ${unitIndex === -1 ? "B" : thresholds[unitIndex]}`;
};

export default function ResponseDetail() {
  const navigate = useNavigate();
  const { surveyId, responseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [responseData, setResponseData] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [accessChecking, setAccessChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [surveyUpdatedAt, setSurveyUpdatedAt] = useState(null);
  const itemsPerPage = 10;

  const participant = responseData?.participant ?? {};
  const stats = responseData?.stats ?? {};
  const questions = responseData?.questions ?? [];
  const navigation = responseData?.navigation ?? null;

  const completionTimeDisplay = stats?.completionTime || "N/A";
  const answeredSummary = `${stats?.answeredQuestions ?? 0} / ${
    stats?.totalQuestions ?? 0
  }`;

  const formatScore = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return "0";
    }
    const fixed = value.toFixed(2);
    return fixed.endsWith(".00") ? fixed.slice(0, -3) : fixed;
  };

  const scoreSummary =
    typeof stats?.maxScore === "number" && stats.maxScore > 0
      ? `${formatScore(stats?.totalScore ?? 0)} / ${formatScore(stats.maxScore)}`
      : "N/A";

  const scorePercentageDisplay =
    typeof stats?.scorePercentage === "number"
      ? `${formatScore(stats.scorePercentage)}%`
      : null;

  useEffect(() => {
    let isMounted = true;
    const guardSurvey = async () => {
      if (!surveyId) return;
      setAccessChecking(true);
      const result = await ensureSurveyOwnership(Number(surveyId));
      if (!isMounted) return;

      if (result.allowed) {
        setHasAccess(true);
      } else {
        setHasAccess(false);
        if (result.reason === "AUTH_REQUIRED") {
          toast.error("Vui lòng đăng nhập để tiếp tục");
          navigate("/login", { replace: true });
        } else if (result.reason === "NOT_OWNER") {
          toast.error("Bạn không có quyền truy cập khảo sát này");
          navigate("/surveys/created", { replace: true });
        } else {
          toast.error("Không thể xác minh quyền truy cập khảo sát");
          navigate("/surveys/created", { replace: true });
        }
      }

      setAccessChecking(false);
    };

    guardSurvey();

    return () => {
      isMounted = false;
    };
  }, [surveyId, navigate]);

  useEffect(() => {
    if (!surveyId || !responseId || !hasAccess) return;

    const fetchResponseDetail = async () => {
      setLoading(true);
      try {
        // Fetch survey details to get updated_at
        const surveyDetails = await getSurveyDetails(parseInt(surveyId, 10));
        if (surveyDetails && surveyDetails.updated_at) {
          setSurveyUpdatedAt(surveyDetails.updated_at);
        }

        const data = await getSurveyResponseDetail(parseInt(surveyId, 10), responseId);
        if (!data) {
          setResponseData(null);
          toast.error("Response not found");
          return;
        }
        setResponseData(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load response details");
        setResponseData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchResponseDetail();
  }, [surveyId, responseId, hasAccess]);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedQuestions(new Set());
  }, [responseData]);

  const handleGoBack = () => {
    navigate(`/surveys/${surveyId}/raw-data`);
  };

  const handleNavigateResponse = (direction) => {
    if (!responseData?.navigation) {
      toast.error("No other responses available");
      return;
    }

    const targetId =
      direction === "prev"
        ? responseData.navigation.previous
        : responseData.navigation.next;

    if (!targetId) {
      toast.error(
        `No ${direction === "prev" ? "previous" : "next"} response available`
      );
      return;
    }

    navigate(`/surveys/${surveyId}/responses/${targetId}`);
    toast.success(
      `Viewing ${direction === "prev" ? "previous" : "next"} response`
    );
  };

  const handleDownloadPDF = () => {
    setShowDownloadModal(true);
  };

  const handleCloseDownloadModal = () => {
    setShowDownloadModal(false);
  };

  const checkDataFreshness = async () => {
    if (!surveyId || !surveyUpdatedAt) return true; // If no stored timestamp, assume fresh
    
    try {
      const currentSurvey = await getSurveyDetails(parseInt(surveyId, 10));
      const currentUpdatedAt = currentSurvey?.updated_at;
      
      if (currentUpdatedAt && currentUpdatedAt !== surveyUpdatedAt) {
        // Data is outdated
        const shouldContinue = window.confirm(
          "Dữ liệu khảo sát đã được cập nhật. Bạn có muốn tải lại dữ liệu mới nhất trước khi xuất file?\n\n" +
          "Nhấn OK để tải lại dữ liệu mới nhất\n" +
          "Nhấn Hủy để tiếp tục xuất file với dữ liệu hiện tại"
        );
        
        if (shouldContinue) {
          // User chose to reload - reload data
          setLoading(true);
          try {
            const data = await getSurveyResponseDetail(parseInt(surveyId, 10), responseId);
            
            if (data) {
              setResponseData(data);
            }
            
            if (currentSurvey && currentSurvey.updated_at) {
              setSurveyUpdatedAt(currentSurvey.updated_at);
            }
            
            toast.success("Đã tải lại dữ liệu mới nhất");
            return true; // Proceed with download after reload
          } catch (err) {
            console.error(err);
            toast.error("Không thể tải lại dữ liệu");
            return false; // Cancel download if reload fails
          } finally {
            setLoading(false);
          }
        } else {
          // User clicked Cancel (Hủy) - proceed with current data
          return true;
        }
      }
      
      return true; // Data is fresh
    } catch (error) {
      console.error("Error checking data freshness:", error);
      // If check fails, allow download to proceed
      return true;
    }
  };

  const handleDownload = async (format) => {
    if (!responseData) {
      toast.error("No data to export");
      return;
    }
    
    // Check if data is fresh before downloading
    const canProceed = await checkDataFreshness();
    if (!canProceed) {
      return; // User chose to reload but it failed
    }
    
    // Close modal after check
    setShowDownloadModal(false);
    
    try {
      if (format === "csv") {
        exportResponseDetailCSV({ responseData });
        toast.success("CSV downloaded successfully");
      } else if (format === "excel") {
        exportResponseDetailExcel({ responseData });
        toast.success("Excel downloaded successfully");
      } else if (format === "pdf") {
        exportResponseDetailPDF({ responseData });
        toast.success("PDF downloaded successfully");
      } else {
        toast.error("Unsupported format");
      }
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to export data");
    }
  };

  const toggleQuestion = (questionId) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const expandAll = () => {
    if (!questions || questions.length === 0) return;
    const allIds = new Set(questions.map((q) => q.id));
    setExpandedQuestions(allIds);
  };

  const collapseAll = () => {
    setExpandedQuestions(new Set());
  };

  const renderOptionList = (question) => {
    if (!question?.options || question.options.length === 0) {
      return <div className="answer-text">No options available.</div>;
    }

    const hasCorrectAnswer = question.options.some((opt) => opt.isCorrect);

    return (
      <div className="answer-options">
        {question.options.map((option) => {
          const isSelected = Boolean(option.selected);
          const isCorrect = Boolean(option.isCorrect);
          const isCorrectAndSelected = isSelected && isCorrect;
          const isWrong = isSelected && !isCorrect && hasCorrectAnswer;
          const isSelectedNoCorrect = isSelected && !hasCorrectAnswer;

          return (
            <div
              key={option.id}
              className={`answer-option ${
                isCorrectAndSelected ? "correct-selected" : ""
              } ${isWrong ? "wrong-selected" : ""} ${isSelectedNoCorrect ? "selected-no-correct" : ""}`}
            >
              <span className="option-text">{option.text}</span>
              {isCorrect && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="check-icon"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderFileUploadsAnswer = (answerText) => {
    const files = parseAnswerValue(answerText);
    if (Array.isArray(files) && files.length > 0) {
      return (
        <div className="file-answer-list">
          {files.map((file, idx) => {
            const fileName = file?.name || `File ${idx + 1}`;
            const href = file?.url || file?.downloadUrl || file?.path || file?.data || null;
            const sizeLabel = typeof file?.size === "number" ? formatFileSize(file.size) : null;

            return (
              <div key={`${fileName}-${idx}`} className="info-item">
                <span className="info-label">{fileName}</span>
                <span className="info-value">
                  {href ? (
                    <a href={href} download={fileName} target="_blank" rel="noopener noreferrer">
                      Download
                    </a>
                  ) : (
                    "Unavailable"
                  )}
                  {sizeLabel ? ` (${sizeLabel})` : ""}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    if (typeof answerText === "string" && answerText.trim() !== "") {
      return <div className="answer-text">{answerText}</div>;
    }

    return <div className="answer-text">No files uploaded.</div>;
  };

  const renderMultipleShortTextAnswer = (question) => {
    const entries = buildMultipleTextEntries(question.answerText);
    if (entries.length === 0) {
      return <div className="answer-text">{formatAnswerText(question.answerText)}</div>;
    }

    return (
      <div className="multi-text-answer">
        {entries.map((entry, idx) => (
          <div key={`${entry.label}-${idx}`} className="info-item">
            <span className="info-label">{entry.label}:</span>
            <span className="info-value">{formatAnswerText(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderMatrixAnswer = (question) => {
    const rows = buildMatrixRows(question.answerText);
    if (rows.length > 0) {
      const optionLookup = new Map(
        (question.options || []).map((opt) => [String(opt.id), opt.text])
      );
      return (
        <div className="matrix-answer">
          <table className="matrix-answer-table">
            <thead>
              <tr>
                <th>Hạng mục</th>
                <th>Đáp án</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={`${row.label}-${idx}`}>
                  <td>{row.label}</td>
                  <td>{formatMatrixCellValue(row.value, optionLookup)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (question.options && question.options.length > 0) {
      return renderOptionList(question);
    }

    return <div className="answer-text">{formatAnswerText(question.answerText)}</div>;
  };

  const renderAnswerContent = (question) => {
    const normalizedType = normalizeType(question.type);

    if (DATETIME_TYPES.has(normalizedType)) {
      return <div className="answer-text">{formatDateTimeValue(question.answerText)}</div>;
    }

    if (TEXT_BASED_TYPES.has(normalizedType)) {
      return <div className="answer-text">{formatAnswerText(question.answerText)}</div>;
    }

    if (MULTIPLE_TEXT_TYPES.has(normalizedType)) {
      return renderMultipleShortTextAnswer(question);
    }

    if (FILE_UPLOAD_TYPES.has(normalizedType)) {
      return renderFileUploadsAnswer(question.answerText);
    }

    if (CHOICE_WITH_COMMENT_TYPES.has(normalizedType)) {
      return (
        <>
          {renderOptionList(question)}
          {question.answerText ? (
            <div className="answer-text">
              <strong>Nhận xét:</strong> {formatAnswerText(question.answerText)}
            </div>
          ) : null}
        </>
      );
    }

    if (MATRIX_TYPES.has(normalizedType)) {
      return renderMatrixAnswer(question);
    }

    if (question.options && question.options.length > 0) {
      return renderOptionList(question);
    }

    return <div className="answer-text">{formatAnswerText(question.answerText)}</div>;
  };

  if (accessChecking || loading) {
    return (
      <div className="response-detail-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải chi tiết phản hồi...</p>
        </div>
      </div>
    );
  }

  if (!responseData) {
    return (
      <div className="response-detail-page">
        <div className="error-container">
          <p>Response not found</p>
          <button onClick={handleGoBack} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Pagination
  const totalPages = Math.ceil(questions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuestions = questions.slice(startIndex, endIndex);

  return (
    <div className="response-detail-page">
      {/* Header */}
      <header className="response-header">
        <h1>Response Details #{responseData.responseId}</h1>
        <div className="header-actions">
          <button
            onClick={() => handleNavigateResponse("prev")}
            className="icon-button"
            title="Previous response"
            disabled={!navigation?.previous}
            aria-disabled={!navigation?.previous}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => handleNavigateResponse("next")}
            className="icon-button"
            title="Next response"
            disabled={!navigation?.next}
            aria-disabled={!navigation?.next}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <button
            onClick={handleGoBack}
            className="icon-button"
            title="Back to list"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="icon-button"
            title="Download PDF"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>
      </header>

      {showDownloadModal && (
        <div className="modal-overlay" onClick={handleCloseDownloadModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Download Format</h3>
              <button className="modal-close" onClick={handleCloseDownloadModal}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <button className="download-option download-option-excel" onClick={() => handleDownload('excel')}>
                <div className="download-option-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                </div>
                <div className="download-option-content">
                  <h4>Excel</h4>
                  <p>Download as spreadsheet (.xlsx)</p>
                </div>
                <div className="download-option-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>

              <button className="download-option download-option-pdf" onClick={() => handleDownload('pdf')}>
                <div className="download-option-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div className="download-option-content">
                  <h4>PDF</h4>
                  <p>Download detailed report (.pdf)</p>
                </div>
                <div className="download-option-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>

              <button className="download-option download-option-csv" onClick={() => handleDownload('csv')}>
                <div className="download-option-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="9" y1="12" x2="15" y2="12" />
                    <line x1="9" y1="16" x2="15" y2="16" />
                  </svg>
                </div>
                <div className="download-option-content">
                  <h4>CSV</h4>
                  <p>Download data file (.csv)</p>
                </div>
                <div className="download-option-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="response-layout">
        {/* Sidebar */}
        <aside className="response-sidebar">
          <div className="stat-widgets">
            <div className="stat-widget stat-widget-blue">
              <h3>Completion Time</h3>
              <p>{completionTimeDisplay}</p>
            </div>
            <div className="stat-widget stat-widget-green">
              <h3>Questions Answered</h3>
              <p>{answeredSummary}</p>
            </div>
            <div className="stat-widget stat-widget-purple">
              <h3>Average Score</h3>
              <p>
                {scoreSummary}
                {scorePercentageDisplay ? (
                  <span className="stat-subtext"> ({scorePercentageDisplay})</span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="participant-info">
            <h2>Participant Information</h2>
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">{participant.name || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Student ID:</span>
              <span className="info-value">{participant.studentId || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Faculty:</span>
              <span className="info-value">{participant.faculty || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Class:</span>
              <span className="info-value">{participant.class || "N/A"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Completed:</span>
              <span className="info-value">{participant.completedAt || "N/A"}</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <section className="response-content">
          <h2 className="survey-title">Survey: {responseData.surveyTitle}</h2>

          <div className="content-controls">
            <span>Display answers:</span>
            <div className="control-buttons">
              <button onClick={expandAll} className="btn btn-secondary">
                Expand All
              </button>
              <button onClick={collapseAll} className="btn btn-secondary">
                Collapse All
              </button>
            </div>
          </div>

          <div className="questions-list">
            {currentQuestions.map((question) => {
              const typeLabel = toVietnameseType(question.type || "");
              return (
                <div
                  key={question.id}
                  className={`question-card ${expandedQuestions.has(question.id) ? "expanded" : ""}`}
                >
                  <div
                    className="question-header"
                    onClick={() => toggleQuestion(question.id)}
                  >
                    <div className="question-header-content">
                      <h3>
                        {question.question}
                        {typeLabel ? (
                          <span className="question-type-label">
                            {" ("}
                            {typeLabel}
                            {")"}
                          </span>
                        ) : null}
                      </h3>
                    </div>
                    <div className="question-header-right">
                      {question.points > 0 && (
                        <span className="question-points">
                          {formatScore(question.score ?? 0)} / {formatScore(question.points)} pts
                        </span>
                      )}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="chevron-icon"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                  <div className="question-answer">{renderAnswerContent(question)}</div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`pagination-button ${page === currentPage ? "active" : ""}`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
