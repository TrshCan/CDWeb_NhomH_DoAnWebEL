import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getSurveyJoinDetail,
  submitSurveyAnswers,
} from "../api/graphql/survey";
import "../assets/css/SurveyJoin.css";
import {
  clearSurveyJoinTicket,
  isTicketValidForSurvey,
} from "../utils/surveyJoinTicket";
import QuestionRenderer from "../components/QuestionRenderer";

function SurveyJoin() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const joinToken = searchParams.get("token");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [surveyData, setSurveyData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const joinTicketRef = useRef(isTicketValidForSurvey(surveyId, joinToken));
  const questionRefs = useRef([]);

  useEffect(() => {
    joinTicketRef.current = isTicketValidForSurvey(surveyId, joinToken);
  }, [surveyId, joinToken]);

  useEffect(() => {
    const fetchSurvey = async () => {
      setLoading(true);
      try {
        const data = await getSurveyJoinDetail(parseInt(surveyId, 10), joinToken);
        if (!data) {
          toast.error("Survey not found");
          setTimeout(() => navigate("/"), 1000);
          return;
        }

       
        const accessedViaModal = !!joinTicketRef.current;
        if (!data.is_accessible_directly && !accessedViaModal) {
          toast.error("Please start this survey via the Join Survey modal");
          setTimeout(() => navigate("/"), 1000);
          return;
        }

        if (accessedViaModal) {
          clearSurveyJoinTicket();
          joinTicketRef.current = null;
        }

        // Check if survey is closed
        if (data.status === 'closed') {
          toast.error("This survey is closed and no longer accepting responses");
          setTimeout(() => navigate("/"), 1000);
          return;
        }

        // Get current user from localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        
        // Check if user role matches survey target
        if (user) {
          const userRole = user.role;
          const surveyTarget = data.object;
          
          if (userRole !== 'admin') {
            if (
              (surveyTarget === 'students' && userRole !== 'student') ||
              (surveyTarget === 'lecturers' && userRole !== 'lecturer')
            ) {
              toast.error(`This survey is for ${surveyTarget} only`);
              setTimeout(() => navigate("/"), 1000);
              return;
            }
          }
        } else {
          toast.error("Please login before joining the survey");
          setTimeout(() => navigate("/"), 1000);
          return;
        }

        setSurveyData(data);

        if (data.time_limit) {
          setTimeRemaining(data.time_limit * 60);
        }
      } catch (err) {
        console.error("Failed to load survey:", err);
        toast.error(err.message || "Failed to load survey");
        setTimeout(() => navigate("/"), 1000);
      } finally {
        setLoading(false);
      }
    };

    if (!joinToken) {
      setLoading(false);
      toast.error("Missing survey access token");
      setTimeout(() => navigate("/"), 1000);
      return;
    }

    if (surveyId) {
      fetchSurvey();
    }
  }, [surveyId, navigate, joinToken]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  useEffect(() => {
    const timer = setTimeout(() => setShowProgress(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = questionRefs.current.indexOf(entry.target);
            if (index !== -1) {
              setCurrentQuestionIndex(index);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    questionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [surveyData]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (questionId, answerData) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerData,
    }));
  };

  const handleAutoSubmit = async () => {
    toast.warning("Time's up! Submitting your answers...");
    await handleSubmit();
  };

  const handleSubmitClick = () => {
    setShowSubmitModal(true);
  };

  const handleSubmit = async () => {
    setShowSubmitModal(false);
    setSubmitting(true);

    try {
      const answerArray = Object.values(answers).flatMap((ans) => {
        if (!ans || !ans.question_id) return [];

        // MULTIPLE CHOICE - array of option IDs
        if (Array.isArray(ans.selected_option_id)) {
          return ans.selected_option_id.map((optionId) => ({
            question_id: Number(ans.question_id),
            selected_option_id: Number(optionId),
          }));
        }

        // TEXT-BASED QUESTIONS (text, number, email, phone, url, date, time, etc.)
        if (ans.answer_text !== undefined && ans.answer_text !== null) {
          const trimmedText = String(ans.answer_text).trim();
          if (trimmedText === "") return [];
          
          return [
            {
              question_id: Number(ans.question_id),
              answer_text: trimmedText,
            },
          ];
        }

        // SINGLE CHOICE - single option ID
        if (ans.selected_option_id !== undefined && ans.selected_option_id !== null) {
          return [
            {
              question_id: Number(ans.question_id),
              selected_option_id: Number(ans.selected_option_id),
            },
          ];
        }

        return [];
      });

      const result = await submitSurveyAnswers(
        parseInt(surveyId, 10),
        answerArray
      );

      if (result.success) {
        toast.success(result.message || "Survey submitted successfully!");
        navigate("/");
      } else {
        // Handle specific error cases
        const errorMessage = result.message || "Failed to submit survey";
        
        if (errorMessage.includes("not authenticated") || errorMessage.includes("Invalid or expired token")) {
          toast.error("Please login before joining the survey");
          navigate("/");
        } else if (errorMessage.includes("Survey not found")) {
          toast.error("Survey not found");
          navigate("/");
        } else if (errorMessage.includes("no questions") || errorMessage.includes("No valid answers")) {
          toast.error(errorMessage);
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (err) {
      console.error("Failed to submit survey:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="survey-join-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading survey...</p>
        </div>
      </div>
    );
  }

  if (!surveyData) {
    return (
      <div className="survey-join-page">
        <div className="error-container">
          <p>Survey not found</p>
          <button onClick={() => navigate("/")} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = surveyData.questions.length;
  const progressPercentage = (answeredCount / totalQuestions) * 100;

  const scrollToQuestion = (index) => {
    questionRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <div className="survey-join-page">
      {/* Fixed Header */}
      <div className="survey-fixed-header">
        <div className="header-left">
          <button
            onClick={() => navigate("/")}
            className="back-button"
            title="Back to home"
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
          <div className="header-info">
            <h1 className="survey-title-compact">{surveyData.title}</h1>
            <div className="progress-info">
              <span className="progress-text">
                {answeredCount} / {totalQuestions} answered
              </span>
            </div>
          </div>
        </div>
        <div className="header-right">
          {timeRemaining !== null && (
            <div
              className={`timer ${timeRemaining < 60 ? "timer-warning" : ""} ${
                timeRemaining < 300 ? "timer-pulse" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{formatTime(timeRemaining)}</span>
            </div>
          )}
          <button
            onClick={handleSubmitClick}
            className="submit-button-header"
            disabled={submitting || answeredCount === 0}
          >
            {submitting ? (
              <>
                <div className="button-spinner"></div>
                Submitting...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                Submit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={`progress-bar-container ${showProgress ? "show" : ""}`}>
        <div
          className="progress-bar-fill"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="survey-container">
        {/* Sidebar Navigation */}
        <aside className="survey-sidebar">
          <div className="sidebar-content">
            <div className="survey-info-card">
              <h2>Survey Info</h2>
              {surveyData.description && (
                <p className="info-description">{surveyData.description}</p>
              )}
              <div className="info-stats">
                <div className="stat-item">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                  </svg>
                  <div>
                    <span className="stat-label">Questions</span>
                    <span className="stat-value">{totalQuestions}</span>
                  </div>
                </div>
                {surveyData.total_points > 0 && (
                  <div className="stat-item">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <div>
                      <span className="stat-label">Total Points</span>
                      <span className="stat-value">
                        {surveyData.total_points}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="question-navigator">
              <h3>Questions</h3>
              <div className="question-dots">
                {surveyData.questions.map((question, index) => (
                  <button
                    key={question.id}
                    onClick={() => scrollToQuestion(index)}
                    className={`question-dot ${
                      answers[question.id] ? "answered" : ""
                    } ${currentQuestionIndex === index ? "active" : ""}`}
                    title={`Question ${index + 1}${
                      answers[question.id] ? " (Answered)" : ""
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Questions Content */}
        <main className="survey-main-content">
          <div className="welcome-card">
            <div className="welcome-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h1>{surveyData.title}</h1>
            {surveyData.description && <p>{surveyData.description}</p>}
            <div className="welcome-meta">
              <span>{totalQuestions} Questions</span>
              {surveyData.total_points > 0 && <span>•</span>}
              {surveyData.total_points > 0 && (
                <span>{surveyData.total_points} Points</span>
              )}
              {surveyData.time_limit && <span>•</span>}
              {surveyData.time_limit && (
                <span>{surveyData.time_limit} Minutes</span>
              )}
            </div>
          </div>

          <div className="questions-list">
            {surveyData.questions.map((question, index) => (
              <div
                key={question.id}
                ref={(el) => (questionRefs.current[index] = el)}
                className={`question-card ${
                  answers[question.id] ? "answered" : ""
                }`}
              >
                <div className="question-header">
                  <div className="question-badge">
                    <span className="question-number">Q{index + 1}</span>
                    {answers[question.id] && (
                      <svg
                        className="check-mark"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  {question.points > 0 && (
                    <span className="question-points">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {question.points} pts
                    </span>
                  )}
                </div>
                <h3 className="question-text">{question.question_text}</h3>

                <QuestionRenderer
                  question={question}
                  answer={answers[question.id]}
                  onAnswerChange={handleAnswerChange}
                />
              </div>
            ))}
          </div>

          <div className="final-submit-section">
            <div className="submit-card">
              <h3>Ready to submit?</h3>
              <p>
                You've answered {answeredCount} out of {totalQuestions}{" "}
                questions.
              </p>
              <div className="submit-actions">
                <button
                  onClick={() => navigate("/")}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitClick}
                  className="btn btn-primary btn-large"
                  disabled={submitting || answeredCount === 0}
                >
                  {submitting ? (
                    <>
                      <div className="button-spinner"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="9 11 12 14 22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                      Submit Survey
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showSubmitModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowSubmitModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit Survey?</h3>
              <button
                className="modal-close"
                onClick={() => setShowSubmitModal(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>
                You have answered {answeredCount} out of {totalQuestions}{" "}
                questions.
              </p>
              <p>Are you sure you want to submit your answers?</p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn btn-primary">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SurveyJoin;
