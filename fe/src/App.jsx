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

import WelcomeSettingsPanel from "./components/WelcomeSettingsPanel";

import { Toaster, toast } from "react-hot-toast";

export default function App() {
  const [activeSection, setActiveSection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // panel trái: null | 'structure' | 'settings'
  const [openPanel, setOpenPanel] = useState(null);
  const [settingsTab, setSettingsTab] = useState("general");

  // panel phải: null | 'welcome'
  const [rightPanel, setRightPanel] = useState(null);

  const [questionItems, setQuestionItems] = useState([
    { id: 1, text: "", helpText: "", type: "Mặc định" },
  ]);

  // STATE: Tổng quát
  const [generalSettings, setGeneralSettings] = useState({
    title: "",
    type: "survey",
    object: "public",
    base_language: "vi",
    owner: "",
  });

  // STATE: Xuất bản & truy cập
  const [publishSettings, setPublishSettings] = useState({
    start_at: "",
    end_at: "",
  });

  // STATE: Cài đặt Welcome (panel phải)
  const [welcomeSettings, setWelcomeSettings] = useState({
    showWelcome: true,
    showXQuestions: true,
  });

  const centerWidth = openPanel === "settings" ? "900px" : "750px";

  const handleOpenPanel = (panel) => {
    setOpenPanel(panel);
    if (panel === "settings") setSettingsTab("general");
  };

  const handleSetSection = (sectionId) => {
    setActiveSection(sectionId);

    // Khi chọn Welcome -> mở panel phải
    if (sectionId === "welcome") {
      setRightPanel("welcome");
    }

    requestAnimationFrame(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleToggleModal = () => setIsModalOpen((prev) => !prev);

  // Di chuyển câu hỏi
  const moveQuestionItem = (index, direction) => {
    setQuestionItems((prevItems) => {
      const newItems = [...prevItems];
      const [removed] = newItems.splice(index, 1);
      if (direction === "up" && index > 0) {
        newItems.splice(index - 1, 0, removed);
      } else if (direction === "down" && index < prevItems.length - 1) {
        newItems.splice(index + 1, 0, removed);
      } else {
        return prevItems;
      }
      const updatedItems = newItems.map((item, i) => ({ ...item, id: i + 1 }));
      const newActiveId = updatedItems.find(
        (item) => item.text === removed.text
      )?.id;
      if (newActiveId) setActiveSection(`question-${newActiveId}`);
      return updatedItems;
    });
  };

  // Thêm câu hỏi mới
  const addQuestionItem = (questionType = "Mặc định") => {
    setQuestionItems((prevItems) => {
      const newId =
        prevItems.length > 0 ? Math.max(...prevItems.map((i) => i.id)) + 1 : 1;
      const newItem = { id: newId, text: "", helpText: "", type: questionType };
      const newItems = [...prevItems, newItem];
      setActiveSection(`question-${newId}`);
      return newItems.map((item, index) => ({ ...item, id: index + 1 }));
    });
  };

  const handleSelectQuestionType = (questionType) => {
    handleToggleModal();
    addQuestionItem(questionType);
  };

  // ===================== Duplicate & Delete =====================
  const duplicateQuestionItem = (index) => {
    setQuestionItems((prev) => {
      const src = prev[index];
      if (!src) return prev;
      const clone = { ...src, text: "" };
      const newItems = [...prev];
      newItems.splice(index + 1, 0, clone);
      const renumbered = newItems.map((it, i) => ({ ...it, id: i + 1 }));
      setActiveSection(`question-${index + 2}`);
      return renumbered;
    });
    toast.success("Đã nhân bản câu hỏi");
  };

  const deleteQuestionItem = (index) => {
    const ok = window.confirm("Bạn có chắc muốn xoá câu hỏi này?");
    if (!ok) return;

    setQuestionItems((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const newItems = prev.filter((_, i) => i !== index);
      const renumbered = newItems.map((it, i) => ({ ...it, id: i + 1 }));

      if (renumbered.length > 0) {
        const next = Math.min(index, renumbered.length - 1);
        setActiveSection(`question-${renumbered[next].id}`);
      } else {
        setActiveSection(null);
      }
      return renumbered;
    });
    toast.success("Đã xoá câu hỏi");
  };
  // =============================================================

  const renderLeftPanel = () => {
    if (!openPanel) return null;
    return (
      <div
        className="fixed inset-y-0 left-[55px] w-72 z-40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full flex flex-col bg-white border-r border-gray-300">
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

  return (
    <>
      <div
        className="min-h-screen bg-gray-100 font-sans overflow-visible"
        onClick={() => setActiveSection(null)}
      >
        <SidebarRail active={openPanel} onOpen={handleOpenPanel} />
        {renderLeftPanel()}

        {/* Panel phải: Cài đặt màn hình chào mừng (cố định, không đẩy layout) */}
        {rightPanel === "welcome" && (
          <div className="fixed inset-y-0 right-0 w-[300px] z-40 bg-white border-l border-gray-300">
            <WelcomeSettingsPanel
              value={welcomeSettings}
              onChange={setWelcomeSettings}
              onClose={() => setRightPanel(null)}
            />
          </div>
        )}

        {/* ===== Trung tâm: 3 vùng cố định, KHÔNG xê dịch ===== */}
        <div className="overflow-visible" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start">
            {/* Spacer trái: 55px (offset) + 18rem (w-72) = 343px */}
            <div className="shrink-0 w-[343px]" />

            {/* Khối giữa: 750px "net", KHÔNG padding ngang, luôn giữa 2 spacer */}
            <div className="flex-1 flex justify-center">
              <div
                id="center-750"
                className="relative isolate"
                style={{ width: centerWidth, boxSizing: "content-box" }}
              >
                {/* KHÔNG đặt px-4 ở div này để khỏi mất width net */}
                <div className="flex flex-col space-y-6">
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
                      <div
                        id="welcome"
                        className="scroll-mt-24 relative z-10 overflow-visible"
                      >
                        <WelcomeSection
                          isActive={activeSection === "welcome"}
                          onClick={() => handleSetSection("welcome")}
                        />
                      </div>

                      <QuestionSection
                        questionItems={questionItems}
                        moveQuestionItem={moveQuestionItem}
                        activeSection={activeSection}
                        handleSetSection={handleSetSection}
                        onDuplicate={duplicateQuestionItem}
                        onDelete={deleteQuestionItem}
                      />

                      <AddSection
                        onAddClick={handleToggleModal}
                        isModalOpen={isModalOpen}
                      />

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

            {/* Spacer phải: đúng bằng chiều rộng panel phải */}
            <div className="shrink-0 w-[300px]" />
          </div>
        </div>
      </div>

      <QuestionTypeModal
        isOpen={isModalOpen}
        onClose={handleToggleModal}
        onSelectQuestionType={handleSelectQuestionType}
      />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          success: { style: { background: "#16a34a", color: "#fff" } },
          error: { style: { background: "#dc2626", color: "#fff" } },
        }}
      />
    </>
  );
}
