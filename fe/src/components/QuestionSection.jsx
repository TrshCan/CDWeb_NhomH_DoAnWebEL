import React, { useState, useRef, useEffect } from "react";
import SectionHeader from "./SectionHeader";
import QuestionItem from "./QuestionItem";
import { DotsHorizontalIcon } from "../icons";

/**
 * Yêu cầu chính:
 * - Icon trong header chỉ để thu/mở.
 * - Nhấn vào tiêu đề thì chỉnh sửa ngay (contentEditable), chỉ đổi bg xám,
 *   không thay đổi font/line-height/layout.
 */
export default function QuestionSection({
  questionItems = [],
  activeSection,
  handleSetSection,
  onDuplicate,
  onDelete,
  onGroupTitleChange, // optional: bắn tiêu đề ra ngoài nếu cần
  onTextChange,
}) {
  const [items, setItems] = useState(questionItems);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [groupTitle, setGroupTitle] = useState("Nhóm câu hỏi đầu tiên của tôi");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const titleRef = useRef(null);
  const menuRef = useRef(null);

  // Cập nhật local items khi số lượng phần tử thay đổi
  useEffect(() => {
    setItems(questionItems);
  }, [questionItems]);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Đồng bộ tiêu đề ra ngoài nếu cần
  useEffect(() => {
    if (typeof onGroupTitleChange === "function") {
      onGroupTitleChange(groupTitle);
    }
  }, [groupTitle, onGroupTitleChange]);

  // Đảm bảo hiển thị text = groupTitle khi không ở chế độ edit
  useEffect(() => {
    if (titleRef.current && !isEditingTitle) {
      titleRef.current.innerText = groupTitle;
    }
  }, [groupTitle, isEditingTitle]);

  // Đưa caret về cuối nội dung
  const moveCaretToEnd = (el) => {
    try {
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch {
      // bỏ qua lỗi selection không cần thiết
    }
  };

  // Di chuyển câu hỏi (local); App có thể xử lý phía ngoài nếu cần
  const handleMove = (index, direction) => {
    const movedId = items[index] ? items[index].id : null;

    setItems((prev) => {
      const arr = [...prev];
      const to = direction === "up" ? index - 1 : index + 1;
      if (to < 0 || to >= arr.length) return prev;
      [arr[index], arr[to]] = [arr[to], arr[index]];
      return arr;
    });

    if (movedId && typeof handleSetSection === "function") {
      handleSetSection(`question-${movedId}`);
    }
  };

  return (
    <div className="mb-8">
      <SectionHeader
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed((v) => !v)} // CHỈ icon gọi để thu/mở
        badge={items.length}
        renderTitle={
          <span
            ref={titleRef}
            className={`text-md font-semibold px-2 py-1 rounded cursor-text inline-block transition-colors ${
              isEditingTitle ? "bg-gray-200" : "bg-transparent"
            } focus:outline-none`}
            // contentEditable giữ nguyên kiểu chữ/layout; chỉ đổi bg khi edit
            contentEditable={isEditingTitle}
            suppressContentEditableWarning={true}
            title="Nhấn để chỉnh sửa tiêu đề"
            onClick={(e) => {
              e.stopPropagation(); // không trigger thu/mở
              // bật edit và focus caret về cuối
              setIsEditingTitle(true);
              setTimeout(() => {
                if (titleRef.current) {
                  titleRef.current.focus();
                  moveCaretToEnd(titleRef.current);
                }
              }, 0);
            }}
            onBlur={(e) => {
              // Chuẩn hoá nội dung, không để xuống dòng dư thừa
              const text = e.currentTarget.innerText
                .replace(/\s+/g, " ")
                .trim();
              if (text) {
                setGroupTitle(text);
                e.currentTarget.innerText = text;
              } else {
                // Nếu xoá hết, khôi phục lại tiêu đề cũ
                e.currentTarget.innerText = groupTitle;
              }
              setIsEditingTitle(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur(); // Enter = xác nhận
              }
              if (e.key === "Escape") {
                e.preventDefault();
                // Esc = huỷ, revert text
                if (titleRef.current) {
                  titleRef.current.innerText = groupTitle;
                }
                e.currentTarget.blur();
              }
            }}
          />
        }
      >
        {/* Actions bên phải (menu 3 chấm) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((p) => !p);
            }}
          >
            <DotsHorizontalIcon />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-sm z-10 border border-gray-100">
              <ul className="py-2">
                <li>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate?.();
                      setIsMenuOpen(false);
                    }}
                  >
                    DUPLICATE GROUP
                  </button>
                </li>
                <li>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.();
                      setIsMenuOpen(false);
                    }}
                  >
                    DELETE GROUP
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </SectionHeader>

      {/* Vùng nội dung có hiệu ứng thu/mở mượt */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isCollapsed 
            ? "max-h-0 overflow-hidden" 
            : "max-h-[9999px] overflow-hidden"
        }`}
        style={{ position: 'relative' }}
      >
        <div 
          className="bg-white rounded-sm shadow-lg border border-gray-200 divide-y divide-gray-200"
          style={{ 
            overflow: 'visible', 
            position: 'relative'
          }}
        >
          {items.map((question, index) => {
            const qid = question.id ?? index + 1;
            const sectionId = `question-${qid}`;
            const isActive = activeSection === sectionId;

            return (
              <div
                key={qid}
                id={sectionId}
                className={`scroll-mt-24 relative ${isActive ? "" : ""}`}
                style={{ 
                  overflow: 'visible', 
                  position: 'relative'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetSection(sectionId);
                }}
              >
                <QuestionItem
                  question={question}
                  index={index}
                  totalQuestions={items.length}
                  isActive={isActive}
                  onClick={() => handleSetSection(sectionId)}
                  moveQuestionItem={handleMove}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                  onTextChange={onTextChange}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
