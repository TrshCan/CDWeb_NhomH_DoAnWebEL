import React, { useState, useRef, useEffect } from "react";
import SectionHeader from "./SectionHeader";
import QuestionItem from "./QuestionItem";
import { DotsHorizontalIcon } from "../icons";

export default function QuestionSection({
  questionItems = [],
  activeSection,
  handleSetSection,
}) {
  const [items, setItems] = useState(questionItems);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    // chỉ cập nhật lại nếu số lượng phần tử thay đổi rõ rệt
    if (questionItems.length !== items.length) {
      setItems(questionItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionItems]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // đổi chỗ hai câu hỏi
  const handleMove = (index, direction) => {
    const movedId = items[index] ? items[index].id : null;

    setItems((prev) => {
      const arr = [...prev];
      const to = direction === "up" ? index - 1 : index + 1;
      if (to < 0 || to >= arr.length) return prev;
      [arr[index], arr[to]] = [arr[to], arr[index]];
      return arr; // không renumber id
    });

    if (movedId && typeof handleSetSection === "function") {
      handleSetSection(`question-${movedId}`);
    }
  };

  return (
    <div className="mb-8">
      <SectionHeader
        title="Nhóm câu hỏi đầu tiên của tôi"
        badge={items.length}
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
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-semibold">
                    DUPLICATE GROUP
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 font-semibold">
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
          {items.map((question, index) => {
            const qid = question.id ?? index + 1;
            const sectionId = `question-${qid}`;
            const isActive = activeSection === sectionId;

            return (
              <div
                key={qid}
                id={sectionId} // ✅ id để scrollIntoView bám vào
                className={`scroll-mt-24 ${isActive ? "" : ""}`}
                onClick={(e) => {
                  e.stopPropagation(); // tránh reset activeSection
                  handleSetSection(sectionId); // chọn & cuộn đến item
                }}
              >
                <QuestionItem
                  question={question}
                  index={index}
                  totalQuestions={items.length}
                  isActive={isActive}
                  onClick={() => handleSetSection(sectionId)}
                  moveQuestionItem={handleMove}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
