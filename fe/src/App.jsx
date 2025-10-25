import React, { useState } from "react";
import WelcomeSection from "./components/WelcomeSection";
import QuestionSection from "./components/QuestionSection";
import AddSection from "./components/AddSection";
import EndSection from "./components/EndSection";
import QuestionTypeModal from "./components/QuestionTypeModal";

export default function App() {
  const [activeSection, setActiveSection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [questionItems, setQuestionItems] = useState([
    {
      id: 1,
      text: "Câu hỏi của bạn ở đây",
      helpText: "Mô tả trợ giúp tùy chọn",
      type: "Mặc định",
    },
  ]);

  const handleSetSection = (sectionId) => setActiveSection(sectionId);
  const handleToggleModal = () => setIsModalOpen((prev) => !prev);

  const moveQuestionItem = (index, direction) => {
    setQuestionItems((prevItems) => {
      const newItems = [...prevItems];
      const [removed] = newItems.splice(index, 1);

      if (direction === "up" && index > 0) {
        newItems.splice(index - 1, 0, removed);
      } else if (direction === "down" && index < newItems.length) {
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

  return (
    <>
      <div
        className="min-h-screen bg-gray-100 flex justify-center p-4 font-sans"
        onClick={() => setActiveSection(null)}
      >
        <div
          className="w-full max-w-3xl mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <WelcomeSection
            isActive={activeSection === "welcome"}
            onClick={() => handleSetSection("welcome")}
          />

          <QuestionSection
            questionItems={questionItems}
            moveQuestionItem={moveQuestionItem}
            activeSection={activeSection}
            handleSetSection={handleSetSection}
          />

          <AddSection
            onAddClick={handleToggleModal}
            isModalOpen={isModalOpen}
          />

          <EndSection
            isActive={activeSection === "end"}
            onClick={() => handleSetSection("end")}
          />
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
