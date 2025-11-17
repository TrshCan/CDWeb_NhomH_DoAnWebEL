// fe/src/App.jsx - Trang chính
import React, { useState } from "react";
import SurveyList from "./pages/SurveyList";
import SurveyForm from "./components/SurveyForm";
import { Toaster } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState("list"); // 'list' | 'edit'
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);

  const handleEditSurvey = (surveyId) => {
    setSelectedSurveyId(surveyId);
    setCurrentView("edit");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedSurveyId(null);
  };

  return (
    <>
      <Toaster position="top-right" />

      {currentView === "list" ? (
        <SurveyList onEditSurvey={handleEditSurvey} />
      ) : (
        <div>
          {/* Back button */}
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Quay lại danh sách
            </button>
          </div>

          {/* Survey Form */}
          <SurveyForm surveyId={selectedSurveyId} />
        </div>
      )}
    </>
  );
}
