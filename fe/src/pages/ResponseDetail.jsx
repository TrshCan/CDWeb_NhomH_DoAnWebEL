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
            {currentQuestions.map((question) => (
              <div
                key={question.id}
                className={`question-card ${expandedQuestions.has(question.id) ? "expanded" : ""}`}
              >
                <div
                  className="question-header"
                  onClick={() => toggleQuestion(question.id)}
                >
                  <div className="question-header-content">
                    <h3>{question.question}</h3>
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
                <div className="question-answer">
                  {question.type === "text" ? (
                    <div className="answer-text">
                      {question.answerText || "No response provided."}
                    </div>
                  ) : question.options && question.options.length > 0 ? (
                    <div className="answer-options">
                      {question.options.map((option) => {
                        const isSelected = option.selected;
                        const isCorrect = option.isCorrect;
                        const hasCorrectAnswer = question.options.some(opt => opt.isCorrect);
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
                  ) : (
                    <div className="answer-text">No options available.</div>
                  )}
                </div>
              </div>
            ))}
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
