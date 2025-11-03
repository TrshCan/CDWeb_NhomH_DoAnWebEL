import React, { useState } from "react";
import WelcomeSection from "./components/WelcomeSection";
import QuestionSection from "./components/QuestionSection";
import AddSection from "./components/AddSection";
import EndSection from "./components/EndSection";
import QuestionTypeModal from "./components/QuestionTypeModal";

import SidebarRail from "./components/SidebarRail";
import StructurePanel from "./components/StructurePanel";
import SettingsPanel from "./components/SettingsPanel";
import GeneralSettingsForm from "./components/GeneralSettingsForm";
import PublishAccessForm from "./components/PublishAccessForm";

export default function App() {
  const [activeSection, setActiveSection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // panel: null | 'structure' | 'settings'
  const [openPanel, setOpenPanel] = useState(null);
  const [settingsTab, setSettingsTab] = useState("general"); // luôn vào Tổng quát đầu tiên

  const [questionItems, setQuestionItems] = useState([
    {
      id: 1,
      text: "Câu hỏi của bạn ở đây",
      helpText: "Mô tả trợ giúp tùy chọn",
      type: "Mặc định",
    },
  ]);

  // STATE: Tổng quát (5 field)
  const [generalSettings, setGeneralSettings] = useState({
    title: "",
    type: "survey",
    object: "public",
    base_language: "vi",
    owner: "",
  });

  // STATE: Xuất bản & truy cập (thời gian)
  const [publishSettings, setPublishSettings] = useState({
    start_at: "",
    end_at: "",
  });

  // Khi mở panel "settings", luôn đưa về tab Tổng quát
  const handleOpenPanel = (panel) => {
    setOpenPanel(panel);
    if (panel === "settings") setSettingsTab("general");
  };

  const handleSetSection = (sectionId) => {
    setActiveSection(sectionId);
    requestAnimationFrame(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleToggleModal = () => setIsModalOpen((prev) => !prev);

  // di chuyển câu hỏi
  const moveQuestionItem = (index, direction) => {
    setQuestionItems((prevItems) => {
      const newItems = [...prevItems];
      const [removed] = newItems.splice(index, 1);
      if (direction === "up" && index > 0)
        newItems.splice(index - 1, 0, removed);
      else if (direction === "down" && index < newItems.length)
        newItems.splice(index + 1, 0, removed);
      else return prevItems;

      const updatedItems = newItems.map((item, i) => ({ ...item, id: i + 1 }));
      const newActiveId = updatedItems.find(
        (item) => item.text === removed.text
      )?.id;
      if (newActiveId) setActiveSection(`question-${newActiveId}`);
      return updatedItems;
    });
  };

  const addQuestionItem = (questionType = "Mặc định") => {
    setQuestionItems((prevItems) => {
      const newId =
        prevItems.length > 0 ? Math.max(...prevItems.map((i) => i.id)) + 1 : 1;
      const newItem = {
        id: newId,
        text: `Câu hỏi mới (${questionType})`,
        helpText: "Mô tả trợ giúp tùy chọn",
        type: questionType,
      };
      const newItems = [...prevItems, newItem];
      setActiveSection(`question-${newId}`);
      return newItems.map((item, index) => ({ ...item, id: index + 1 }));
    });
  };

  const handleSelectQuestionType = (questionType) => {
    handleToggleModal();
    addQuestionItem(questionType);
  };

  // ===== Panel bên trái =====
  const renderLeftPanel = () => {
    if (!openPanel) return null;
    return (
      <div
        className="fixed inset-y-0 left-[55px] w-72 z-40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full flex flex-col bg-white border-r border-gray-300">
          {/* Header */}
          <div className="px-4 pt-4">
            <div className="h-12 bg-gray-200 flex items-center justify-between px-4">
              <span className="font-semibold text-gray-800">
                {openPanel === "structure" ? "Kết cấu" : "Cài đặt"}
              </span>
              <button
                type="button"
                className="p-1 rounded hover:bg-gray-200"
                onClick={() => setOpenPanel(null)}
                aria-label="Đóng"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Nội dung panel */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {openPanel === "structure" ? (
              <StructurePanel
                questionItems={questionItems}
                activeSection={activeSection}
                onSelect={handleSetSection}
              />
            ) : (
              <SettingsPanel tab={settingsTab} onSelect={setSettingsTab} />
            )}
          </div>
        </div>
      </div>
    );
  };

  // ===== Render chính =====
  return (
    <>
      <div
        className="min-h-screen bg-gray-100 font-sans overflow-visible"
        onClick={() => setActiveSection(null)}
      >
        <SidebarRail active={openPanel} onOpen={handleOpenPanel} />
        {renderLeftPanel()}

        <div
          className="transition-all duration-300 pl-16 overflow-visible"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-4xl mx-auto p-4 overflow-visible relative isolate">
            {/* Khi đang ở Settings -> CHỈ hiển thị form theo tab; ẩn toàn bộ phần survey */}
            {openPanel === "settings" ? (
              settingsTab === "general" ? (
                <GeneralSettingsForm
                  value={generalSettings}
                  onChange={setGeneralSettings}
                />
              ) : settingsTab === "publish" ? (
                <PublishAccessForm
                  value={publishSettings}
                  onChange={setPublishSettings}
                />
              ) : null
            ) : (
              <>
                {/* Welcome Section */}
                <div
                  id="welcome"
                  className="scroll-mt-24 relative z-10 overflow-visible"
                >
                  <WelcomeSection
                    isActive={activeSection === "welcome"}
                    onClick={() => handleSetSection("welcome")}
                  />
                </div>

                {/* Question Section */}
                <QuestionSection
                  questionItems={questionItems}
                  moveQuestionItem={moveQuestionItem}
                  activeSection={activeSection}
                  handleSetSection={handleSetSection}
                />

                {/* Add Section */}
                <AddSection
                  onAddClick={handleToggleModal}
                  isModalOpen={isModalOpen}
                />

                {/* End Section */}
                <div
                  id="end"
                  className="scroll-mt-24 relative z-10 overflow-visible"
                >
                  <EndSection
                    isActive={activeSection === "end"}
                    onClick={() => handleSetSection("end")}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <QuestionTypeModal
        isOpen={isModalOpen}
        onClose={handleToggleModal}
        onSelectQuestionType={handleSelectQuestionType}
      />
    </>
  );
}
