import React, { useState, useRef, useEffect } from "react";
import SectionHeader from "./SectionHeader";
import QuestionItem from "./QuestionItem";
import { DotsHorizontalIcon } from "../icons";

export default function QuestionSection({
  questionItems,
  moveQuestionItem,
  activeSection,
  handleSetSection,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const menuRef = useRef(null);

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setIsMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  return (
    <div className="mb-8">
      <SectionHeader
        title="Nhóm câu hỏi đầu tiên của tôi"
        badge={questionItems.length}
        isCollapsed={isCollapsed}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="relative" ref={menuRef}>
          <button onClick={handleMenuToggle}>
            <DotsHorizontalIcon />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-sm z-10 border border-gray-100">
              <ul className="py-2">
                <li>
                  <button className="text-left w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-semibold">
                    DUPLICATE GROUP
                  </button>
                </li>
                <li>
                  <button className="text-left w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 font-semibold">
                    DELETE GROUP
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </SectionHeader>

      <div
        className={`transition-all duration-500 ease-in-out ${
          isCollapsed ? "max-h-0 overflow-hidden" : "max-h-[1000px]"
        }`}
      >
        <div className="bg-white rounded-sm shadow-lg border border-gray-200 divide-y divide-gray-200 overflow-visible">
          {questionItems.map((question, index) => (
            <QuestionItem
              key={question.id}
              question={question}
              index={index}
              totalQuestions={questionItems.length}
              isActive={activeSection === `question-${question.id}`}
              onClick={() => handleSetSection(`question-${question.id}`)}
              moveQuestionItem={moveQuestionItem}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
