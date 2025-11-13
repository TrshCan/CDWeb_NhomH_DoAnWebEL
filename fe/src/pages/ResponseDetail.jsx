import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import "../assets/css/ResponseDetail.css";

export default function ResponseDetail() {
  const navigate = useNavigate();
  const { surveyId, responseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [responseData, setResponseData] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchResponseDetail = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        // const data = await getResponseDetail(surveyId, responseId);
        
        // Mock data
        const mockData = {
          responseId: responseId,
          surveyTitle: "Student Satisfaction Survey",
          participant: {
            name: "Nguyen Van A",
            studentId: "20210123",
            faculty: "Computer Science",
            class: "21T1",
            completedAt: "10:30, 10/09/2025"
          },
          stats: {
            completionTime: "12m 34s",
            answeredQuestions: "15 / 15",
            averageScore: "8.5 / 10"
          },
          questions: Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            question: `Question ${i + 1}: What do you think about feature ${i + 1}?`,
            type: i % 3 === 0 ? "text" : "single_choice",
            answer: i % 3 === 0 
              ? "This is a detailed text response explaining my thoughts about this feature."
              : i % 2 === 0 
                ? "Very useful" 
                : "Needs improvement",
            options: i % 3 !== 0 ? ["Very useful", "Useful", "Neutral", "Needs improvement", "Not useful"] : null,
            selectedOption: i % 3 !== 0 ? (i % 2 === 0 ? "Very useful" : "Needs improvement") : null
          }))
        };

        setResponseData(mockData);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load response details");
      } finally {
        setLoading(false);
      }
    };

    fetchResponseDetail();
  }, [surveyId, responseId]);

  const handleGoBack = () => {
    navigate(`/surveys/${surveyId}/raw-data`);
  };

  const handleNavigateResponse = (direction) => {
    const newId = direction === "prev" 
      ? parseInt(responseId) - 1 
      : parseInt(responseId) + 1;
    navigate(`/surveys/${surveyId}/responses/${newId}`);
    toast.success(`Viewing ${direction === "prev" ? "previous" : "next"} response`);
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
    if (!responseData) return;
    const allIds = new Set(responseData.questions.map(q => q.id));
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
  const totalPages = Math.ceil(responseData.questions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuestions = responseData.questions.slice(startIndex, endIndex);

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
              <p>{responseData.stats.completionTime}</p>
            </div>
            <div className="stat-widget stat-widget-green">
              <h3>Questions Answered</h3>
              <p>{responseData.stats.answeredQuestions}</p>
            </div>
            <div className="stat-widget stat-widget-purple">
              <h3>Average Score</h3>
              <p>{responseData.stats.averageScore}</p>
            </div>
          </div>

          <div className="participant-info">
            <h2>Participant Information</h2>
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">{responseData.participant.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Student ID:</span>
              <span className="info-value">{responseData.participant.studentId}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Faculty:</span>
              <span className="info-value">{responseData.participant.faculty}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Class:</span>
              <span className="info-value">{responseData.participant.class}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Completed:</span>
              <span className="info-value">{responseData.participant.completedAt}</span>
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
                  <h3>{question.question}</h3>
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
                <div className="question-answer">
                  {question.type === "text" ? (
                    <div className="answer-text">{question.answer}</div>
                  ) : (
                    <div className="answer-options">
                      {question.options.map((option, index) => (
                        <div
                          key={index}
                          className={`answer-option ${
                            option === question.selectedOption ? "selected" : ""
                          }`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
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
