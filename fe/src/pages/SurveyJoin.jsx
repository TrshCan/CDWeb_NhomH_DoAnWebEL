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
  const [error, setError] = useState(null);
  const joinTicketRef = useRef(isTicketValidForSurvey(surveyId, joinToken));
  const questionRefs = useRef([]);

  useEffect(() => {
    joinTicketRef.current = isTicketValidForSurvey(surveyId, joinToken);
  }, [surveyId, joinToken]);

  useEffect(() => {
    const fetchSurvey = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("[SurveyJoin] Fetching survey:", {
          surveyId: parseInt(surveyId, 10),
          joinToken: joinToken ? `${joinToken.substring(0, 4)}...` : null,
          tokenLength: joinToken?.length,
          hasToken: !!joinToken
        });
        
        const data = await getSurveyJoinDetail(parseInt(surveyId, 10), joinToken);
        if (!data) {
          setError({
            title: "Survey Not Found",
            message: "The survey you're looking for doesn't exist or has been removed.",
            type: "not_found"
          });
          return;
        }

       
        const accessedViaModal = !!joinTicketRef.current;
        if (!data.is_accessible_directly && !accessedViaModal) {
          setError({
            title: "Access Restricted",
            message: "This survey cannot be accessed directly. Please start this survey via the Join Survey modal.",
            type: "access_restricted"
          });
          return;
        }

        if (accessedViaModal) {
          clearSurveyJoinTicket();
          joinTicketRef.current = null;
        }

        // Check if survey is closed
        if (data.status === 'closed') {
          setError({
            title: "Survey Closed",
            message: "This survey is closed and no longer accepting responses.",
            type: "closed"
          });
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
              setError({
                title: "Access Denied",
                message: `This survey is only available for ${surveyTarget}. Your current role (${userRole}) does not have access.`,
                type: "role_mismatch"
              });
              return;
            }
          }
        } else {
          setError({
            title: "Authentication Required",
            message: "You need to be logged in to join this survey. Please log in and try again.",
            type: "not_authenticated"
          });
          return;
        }

        setSurveyData(data);

        if (data.time_limit) {
          setTimeRemaining(data.time_limit * 60);
        }
      } catch (err) {
        console.error("Failed to load survey:", err);
        console.error("Error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          extensions: err.extensions
        });
        
        // Extract error message from various sources
        let errorMessage = err.message || "An unexpected error occurred while loading the survey. Please try again later.";
        let extMessage = err.extensions?.debugMessage || "";
        
        // Try to get error from response data
        if (err.response?.data?.errors?.[0]?.message) {
          errorMessage = err.response.data.errors[0].message;
          extMessage = err.response.data.errors[0]?.extensions?.debugMessage || "";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        
        // Check if user already completed the survey
        if (errorMessage.includes("already completed") || 
            errorMessage.includes("You already completed") || 
            (extMessage && extMessage.includes("You already completed"))) {
          setError({
            title: "Survey Already Completed",
            message: "You already completed this survey. Each user can only submit once.",
            type: "already_completed"
          });
        } else {
          setError({
            title: "Failed to Load Survey",
            message: errorMessage,
            type: "load_error"
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (!joinToken) {
      setLoading(false);
      setError({
        title: "Missing Access Token",
        message: "The survey access token is missing from the URL. Please use the correct link to join the survey.",
        type: "missing_token"
      });
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

  const [validationErrors, setValidationErrors] = useState({});

  const handleAnswerChange = (questionId, answerData) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerData,
    }));
    // Clear validation error when user answers
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  // Check if a question should be visible based on conditions
  const isQuestionVisible = (question) => {
    if (!question.conditions) {
      return true;
    }
    
    // Normalize conditions - có thể là array hoặc object
    let conditionsList = Array.isArray(question.conditions) ? question.conditions : [question.conditions];
    
    if (conditionsList.length === 0) {
      return true;
    }

    // Normalize ID để so sánh
    const normalizeId = (id) => String(id);
    
    // Kiểm tra tất cả conditions (AND logic)
    for (const condition of conditionsList) {
      // Format: { field: '25', operator: 'equals', value: '71' }
      // field = question_id, value = option_id
      const conditionQuestionId = condition.field || condition.question_id || condition.questionId;
      
      if (!conditionQuestionId) {
        continue;
      }
      
      // Tìm answer
      const answer = answers[conditionQuestionId] || answers[String(conditionQuestionId)] || answers[Number(conditionQuestionId)];
      
      if (!answer) return false;

      const selectedOptionId = answer.selected_option_id;
      
      if (selectedOptionId === undefined || selectedOptionId === null) return false;
      
      // Lấy required option IDs từ condition
      // value có thể là single value hoặc array
      const requiredValue = condition.value || condition.option_ids || condition.option_id || [];
      const requiredOptionIds = (Array.isArray(requiredValue) ? requiredValue : [requiredValue]).map(normalizeId);
      
      // Lấy selected option IDs
      const selectedOptionIds = (Array.isArray(selectedOptionId) ? selectedOptionId : [selectedOptionId]).map(normalizeId);
      
      // Xử lý theo operator
      const operator = condition.operator || 'equals';
      let conditionMet = false;
      
      switch (operator) {
        case 'equals':
        case 'is':
        case 'in':
          // Kiểm tra có giao nhau không
          conditionMet = selectedOptionIds.some((id) => requiredOptionIds.includes(id));
          break;
        case 'not_equals':
        case 'is_not':
        case 'not_in':
          // Kiểm tra không có giao nhau
          conditionMet = !selectedOptionIds.some((id) => requiredOptionIds.includes(id));
          break;
        case 'contains':
          // Kiểm tra chứa tất cả
          conditionMet = requiredOptionIds.every((id) => selectedOptionIds.includes(id));
          break;
        default:
          conditionMet = selectedOptionIds.some((id) => requiredOptionIds.includes(id));
      }
      
      if (!conditionMet) return false;
    }

    return true;
  };

  // Get visible questions
  const visibleQuestions = surveyData?.questions?.filter(isQuestionVisible) || [];

  // Check if answer is empty
  const isAnswerEmpty = (questionId) => {
    const answer = answers[questionId];
    if (!answer) return true;
    
    if (answer.answer_text !== undefined) {
      return !answer.answer_text || String(answer.answer_text).trim() === "";
    }
    
    if (answer.selected_option_id !== undefined) {
      if (Array.isArray(answer.selected_option_id)) {
        return answer.selected_option_id.length === 0;
      }
      return answer.selected_option_id === null || answer.selected_option_id === undefined;
    }
    
    return true;
  };

  // Validate required questions
  const validateRequiredQuestions = () => {
    const errors = {};
    const warnings = [];

    visibleQuestions.forEach((question) => {
      if (isAnswerEmpty(question.id)) {
        if (question.required === "hard") {
          errors[question.id] = "Câu hỏi này bắt buộc phải trả lời";
        } else if (question.required === "soft") {
          warnings.push(question.id);
        }
      }
    });

    return { errors, warnings };
  };

  // Get required label
  const getRequiredLabel = (required) => {
    switch (required) {
      case "hard":
        return { text: "Bắt buộc", className: "required-hard" };
      case "soft":
        return { text: "Nên trả lời", className: "required-soft" };
      default:
        return null;
    }
  };

  const handleAutoSubmit = async () => {
    toast.warning("Time's up! Submitting your answers...");
    await handleSubmit();
  };

  const handleSubmitClick = () => {
    const { errors, warnings } = validateRequiredQuestions();
    
    // Nếu có lỗi hard required
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      
      // Scroll đến câu hỏi đầu tiên bị lỗi
      const firstErrorQuestionId = Object.keys(errors)[0];
      const questionIndex = visibleQuestions.findIndex(
        (q) => String(q.id) === String(firstErrorQuestionId)
      );
      if (questionIndex !== -1) {
        scrollToQuestion(questionIndex);
      }
      
      toast.error(`Vui lòng trả lời ${Object.keys(errors).length} câu hỏi bắt buộc`);
      return;
    }
    
    // Nếu có warnings (soft required)
    if (warnings.length > 0) {
      const unansweredSoft = warnings.length;
      toast.warning(`Bạn còn ${unansweredSoft} câu hỏi chưa trả lời (không bắt buộc)`);
    }
    
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
        const successMessage = result.message || "Survey submitted successfully!";
        toast.success(successMessage, {
          autoClose: 3000,
          onClose: () => {
            navigate("/");
          }
        });
        // Fallback navigation in case toast onClose doesn't fire
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        // Handle specific error cases - DO NOT redirect on errors
        const errorMessage = result.message || "Failed to submit survey";
        
        if (errorMessage.includes("not authenticated") || errorMessage.includes("Invalid or expired token")) {
          toast.error("Please login before joining the survey", {
            autoClose: 4000,
          });
          // Only redirect for auth errors after showing message
          setTimeout(() => {
            navigate("/");
          }, 4000);
        } else if (errorMessage.includes("Survey not found") || errorMessage.includes("deleted")) {
          toast.error(errorMessage, {
            autoClose: 4000,
          });
          setTimeout(() => {
            navigate("/");
          }, 4000);
        } else if (errorMessage.includes("closed") || errorMessage.includes("no longer accepting")) {
          toast.error(errorMessage, {
            autoClose: 4000,
          });
          setTimeout(() => {
            navigate("/");
          }, 4000);
        } else if (errorMessage.includes("already completed") || errorMessage.includes("You have already completed")) {
          toast.error("You have already completed this survey. Each user can only submit once.", {
            autoClose: 5000,
          });
          setTimeout(() => {
            navigate("/");
          }, 5000);
        } else {
          // For other errors, show message but stay on page so user can see the error
          toast.error(errorMessage, {
            autoClose: 5000,
          });
          // Don't redirect - let user see the error and decide what to do
        }
      }
    } catch (err) {
      console.error("Failed to submit survey:", err);
      
      // Extract error message from various error types
      let errorMessage = "An unexpected error occurred. Please try again.";
      let extMessage = "";
      
      if (err.message) {
        errorMessage = err.message;
        extMessage = err.extensions?.debugMessage || "";
      } else if (err.response?.data?.errors?.[0]?.message) {
        errorMessage = err.response.data.errors[0].message;
        extMessage = err.response.data.errors[0]?.extensions?.debugMessage || "";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // Handle network errors
      if (err.message?.includes("Network Error") || err.message?.includes("Failed to fetch")) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      // Show error notification with longer duration
      toast.error(errorMessage, {
        autoClose: 6000,
        position: "top-center",
      });
      
      // Only redirect for specific critical errors
      if (
        errorMessage.includes("not authenticated") ||
        errorMessage.includes("Invalid or expired token") ||
        errorMessage.includes("Survey not found") ||
        errorMessage.includes("deleted") ||
        errorMessage.includes("closed") ||
        errorMessage.includes("no longer accepting") ||
        errorMessage.includes("already completed") ||
        errorMessage.includes("You already completed") ||
        (extMessage && extMessage.includes("You already completed"))
      ) {
        setTimeout(() => {
          navigate("/");
        }, 5000);
      }
      // For other errors (including network errors), stay on page so user can see the error and retry
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

  if (error) {
    const getErrorIcon = () => {
      switch (error.type) {
        case "not_found":
          return (
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          );
        case "access_restricted":
        case "role_mismatch":
          return (
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          );
        case "closed":
          return (
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          );
        case "not_authenticated":
          return (
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
          );
        case "missing_token":
          return (
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          );
        case "already_completed":
          return (
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          );
        default:
          return (
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          );
      }
    };

    return (
      <div className="survey-join-page">
        <div className="error-container">
          <div className="error-icon">
            {getErrorIcon()}
          </div>
          <h2 className="error-title">{error.title}</h2>
          <p className="error-message">{error.message}</p>
          <div className="error-actions">
            <button onClick={() => navigate("/")} className="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Go Home
            </button>
            {(error.type === "not_authenticated" || error.type === "role_mismatch") && (
              <button onClick={() => window.location.reload()} className="btn btn-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                Refresh
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!surveyData) {
    return (
      <div className="survey-join-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading survey...</p>
        </div>
      </div>
    );
  }

  const answeredCount = visibleQuestions.filter((q) => !isAnswerEmpty(q.id)).length;
  const totalQuestions = visibleQuestions.length;
  const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  
  // Count required questions
  const requiredHardCount = visibleQuestions.filter((q) => q.required === "hard").length;
  const answeredRequiredCount = visibleQuestions.filter(
    (q) => q.required === "hard" && !isAnswerEmpty(q.id)
  ).length;

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
              <h3>Câu hỏi</h3>
              {requiredHardCount > 0 && (
                <p className="required-info">
                  {answeredRequiredCount}/{requiredHardCount} câu bắt buộc
                </p>
              )}
              <div className="question-dots">
                {visibleQuestions.map((question, index) => (
                  <button
                    key={question.id}
                    onClick={() => scrollToQuestion(index)}
                    className={`question-dot ${
                      !isAnswerEmpty(question.id) ? "answered" : ""
                    } ${currentQuestionIndex === index ? "active" : ""} ${
                      question.required === "hard" ? "required" : ""
                    } ${validationErrors[question.id] ? "error" : ""}`}
                    title={`Câu ${index + 1}${
                      !isAnswerEmpty(question.id) ? " (Đã trả lời)" : ""
                    }${question.required === "hard" ? " - Bắt buộc" : ""}`}
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
            {visibleQuestions.map((question, index) => {
              const requiredLabel = getRequiredLabel(question.required);
              const hasError = validationErrors[question.id];
              
              return (
                <div
                  key={question.id}
                  ref={(el) => (questionRefs.current[index] = el)}
                  className={`question-card ${
                    !isAnswerEmpty(question.id) ? "answered" : ""
                  } ${hasError ? "has-error" : ""}`}
                >
                  <div className="question-header">
                    <div className="question-badge">
                      <span className="question-number">Q{index + 1}</span>
                      {!isAnswerEmpty(question.id) && (
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
                    <div className="question-meta">
                      {requiredLabel && (
                        <span className={`required-badge ${requiredLabel.className}`}>
                          {requiredLabel.text}
                        </span>
                      )}
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
                  </div>
                  <h3 className="question-text">{question.question_text}</h3>

                  <QuestionRenderer
                    question={question}
                    answer={answers[question.id]}
                    onAnswerChange={handleAnswerChange}
                  />
                  
                  {hasError && (
                    <div className="validation-error">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span>{hasError}</span>
                    </div>
                  )}
                </div>
              );
            })}
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
                Bạn đã trả lời {answeredCount} / {totalQuestions} câu hỏi.
              </p>
              {requiredHardCount > 0 && (
                <p className="modal-required-info">
                  Câu bắt buộc: {answeredRequiredCount}/{requiredHardCount}
                </p>
              )}
              {totalQuestions - answeredCount > 0 && (
                <p className="modal-warning">
                  Còn {totalQuestions - answeredCount} câu chưa trả lời
                </p>
              )}
              <p>Bạn có chắc chắn muốn nộp bài?</p>
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
