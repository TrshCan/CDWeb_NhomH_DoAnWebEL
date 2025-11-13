import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import "../assets/css/ResponseDetail.css";
import { getSurveyResponseDetail } from "../api/graphql/survey";

export default function ResponseDetail() {
  const navigate = useNavigate();
  const { surveyId, responseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [responseData, setResponseData] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
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
    const fetchResponseDetail = async () => {
      setLoading(true);
      try {
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

    if (surveyId && responseId) {
      fetchResponseDetail();
    }
  }, [surveyId, responseId]);

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
    toast.success("Downloading response as PDF...");
    // TODO: Implement PDF download
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

  if (loading) {
    return (
      <div className="response-detail-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading response details...</p>
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
                        const isCorrectAndSelected = isSelected && isCorrect;
                        const isWrong = isSelected && !isCorrect;
                        
                        return (
                          <div
                            key={option.id}
                            className={`answer-option ${
                              isCorrectAndSelected ? "correct-selected" : ""
                            } ${isWrong ? "wrong-selected" : ""}`}
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
