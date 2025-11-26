import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getSurveyShareByToken } from "../api/shares";
import { issueSurveyJoinTicket } from "../utils/surveyJoinTicket";

export default function JoinSurveyModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [surveyToken, setSurveyToken] = useState("");
  const [joiningSurvey, setJoiningSurvey] = useState(false);

  // Handle survey token submission
  const handleJoinSurvey = async (e) => {
    e.preventDefault();
    const token = surveyToken.trim();

    if (!token) {
      toast.error("Please enter a survey token");
      return;
    }

    try {
      setJoiningSurvey(true);
      const share = await getSurveyShareByToken(token);

      if (!share?.survey_id) {
        toast.error("Token không hợp lệ hoặc đã hết hạn");
        setJoiningSurvey(false);
        return;
      }

      toast.success(
        share?.survey?.title
          ? `Joining "${share.survey.title}"`
          : "Survey token accepted"
      );

      issueSurveyJoinTicket(share.survey_id, token);
      setSurveyToken("");
      onClose();
      navigate(`/surveys/${share.survey_id}/join?token=${token}`);
    } catch (error) {
      console.error("Failed to join survey:", error);

      // Extract error message from GraphQL response or error object
      let errorMessage = "Token không hợp lệ hoặc đã hết hạn";

      // Check for GraphQL errors first
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMessage = error.graphQLErrors[0].message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.errors?.[0]?.message) {
        errorMessage = error.response.data.errors[0].message;
      }

      // Display specific error messages for closed/deleted surveys
      if (errorMessage.includes("đã đóng") || errorMessage.includes("đã đóng và không còn nhận phản hồi")) {
        toast.error("Khảo sát đã đóng và không còn nhận phản hồi");
      } else if (errorMessage.includes("đã bị xóa") || errorMessage.includes("không tồn tại")) {
        toast.error("Khảo sát không tồn tại hoặc đã bị xóa");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setJoiningSurvey(false);
    }
  };

  const handleClose = () => {
    setSurveyToken("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] px-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Join Survey</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleJoinSurvey}>
          <div className="mb-4">
            <label
              htmlFor="surveyToken"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Enter Survey Token
            </label>
            <input
              type="text"
              id="surveyToken"
              value={surveyToken}
              onChange={(e) => setSurveyToken(e.target.value)}
              placeholder="e.g., ABC123"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              autoFocus
            />
            <p className="mt-2 text-xs text-gray-500">
              Enter the unique token provided by your instructor or survey
              creator.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={joiningSurvey}
              className={`flex-1 px-4 py-2.5 rounded-lg transition-all font-medium ${
                joiningSurvey
                  ? "bg-cyan-400 cursor-not-allowed text-white"
                  : "bg-cyan-600 hover:bg-cyan-700 text-white"
              }`}
            >
              {joiningSurvey ? "Joining..." : "Join Survey"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
