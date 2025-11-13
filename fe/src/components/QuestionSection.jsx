import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  groupId,
  groupTitle: initialGroupTitle,
  questionItems = [],
  activeSection,
  handleSetSection,
  moveQuestionItem,
  onDuplicate,
  onDuplicateGroup,
  onDelete,
  onDeleteGroup,
  onGroupTitleChange, // optional: bắn tiêu đề ra ngoài nếu cần
  onTextChange,
  onAnswerSelect,
  selectedAnswers,
  getQuestionConditionInfo,
  onOptionChange,
  onAddOption,
  onRemoveOption,
  onMoveOption,
}) {
  const [items, setItems] = useState(questionItems);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRef = useRef(null);

  const [groupTitle, setGroupTitle] = useState(
    initialGroupTitle || "Nhóm câu hỏi đầu tiên của tôi"
  );
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const titleRef = useRef(null);
  const menuRef = useRef(null);
  const handlersRef = useRef({
    onDuplicateGroup: onDuplicateGroup,
    onDeleteGroup: onDeleteGroup,
  });
  const prevQuestionItemsRef = useRef(questionItems);
  const onGroupTitleChangeRef = useRef(onGroupTitleChange);

  // Cập nhật handlers khi props thay đổi
  useEffect(() => {
    handlersRef.current = {
      onDuplicateGroup: onDuplicateGroup,
      onDeleteGroup: onDeleteGroup,
    };
    onGroupTitleChangeRef.current = onGroupTitleChange;
  }, [onDuplicateGroup, onDeleteGroup, onGroupTitleChange]);

  // Cập nhật local items khi props thay đổi
  // So sánh nội dung thực tế để tránh infinite loop khi array reference thay đổi
  useEffect(() => {
    const prevItems = prevQuestionItemsRef.current;
    
    // Kiểm tra nhanh: length khác nhau => cập nhật
    if (!prevItems || prevItems.length !== questionItems.length) {
      setItems(questionItems);
      prevQuestionItemsRef.current = questionItems;
      return;
    }
    
    // So sánh từng item để phát hiện thay đổi, bao gồm cả image
    // Kiểm tra xem có item nào thay đổi không (id, text, image, options)
    let hasChanges = false;
    
    for (let i = 0; i < questionItems.length; i++) {
      const newItem = questionItems[i];
      const prevItem = prevItems[i];
      
      if (!prevItem || 
          newItem.id !== prevItem.id ||
          newItem.text !== prevItem.text ||
          newItem.image !== prevItem.image || // ✅ Quan trọng: so sánh image
          JSON.stringify(newItem.options) !== JSON.stringify(prevItem.options)) {
        hasChanges = true;
        break;
      }
    }
    
    // Cập nhật nếu có thay đổi
    if (hasChanges) {
      setItems(questionItems);
      prevQuestionItemsRef.current = questionItems;
    }
  }, [questionItems]);

  useEffect(() => {
    if (initialGroupTitle) {
      setGroupTitle(initialGroupTitle);
    }
  }, [initialGroupTitle]);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event) => {
      // Kiểm tra xem click có phải vào button hoặc menu không
      const isClickOnButton = menuButtonRef.current?.contains(event.target);
      const isClickOnMenu = event.target.closest(".group-menu-portal");

      if (!isClickOnButton && !isClickOnMenu) {
        setIsMenuOpen(false);
      }
    };

    // Delay để tránh đóng ngay khi mở
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Đồng bộ tiêu đề ra ngoài nếu cần (chỉ khi groupTitle thay đổi)
  // Sử dụng ref để tránh re-run khi callback function reference thay đổi
  useEffect(() => {
    if (typeof onGroupTitleChangeRef.current === "function") {
      onGroupTitleChangeRef.current(groupTitle);
    }
  }, [groupTitle]);

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

    // Gọi moveQuestionItem từ App với groupId
    if (typeof moveQuestionItem === "function" && groupId) {
      moveQuestionItem(index, direction);
      return;
    }

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
            ref={menuButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              if (!isMenuOpen && menuButtonRef.current) {
                const rect = menuButtonRef.current.getBoundingClientRect();
                const scrollTop =
                  window.pageYOffset || document.documentElement.scrollTop;
                setMenuPosition({
                  top: rect.top + scrollTop,
                  left: rect.right + 12,
                });
              }
              setIsMenuOpen((p) => !p);
            }}
          >
            <DotsHorizontalIcon />
          </button>
          {isMenuOpen &&
            createPortal(
              <div
                className="group-menu-portal absolute bg-white rounded-md shadow-lg border border-gray-200"
                style={{
                  left: `${menuPosition.left}px`,
                  top: `${menuPosition.top}px`,
                  width: "140px",
                  height: "80px",
                  zIndex: 99999,
                }}
              >
                <ul className="py-1">
                  <li>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 text-[11px] text-gray-900 hover:text-purple-700 font-semibold uppercase"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        // Gọi hàm sau khi đóng menu
                        setTimeout(() => {
                          if (onDuplicateGroup) {
                            onDuplicateGroup();
                          }
                        }, 0);
                      }}
                    >
                      Duplicate group
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 text-[11px] text-red-600 hover:text-red-400 font-semibold uppercase"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        // Gọi hàm sau khi đóng menu
                        setTimeout(() => {
                          if (onDeleteGroup) {
                            onDeleteGroup();
                          }
                        }, 0);
                      }}
                    >
                      Delete group
                    </button>
                  </li>
                </ul>
              </div>,
              document.body
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
        style={{ position: "relative" }}
      >
        <div
          className="bg-white rounded-sm shadow-lg border border-gray-200 divide-y divide-gray-200"
          style={{
            overflow: "visible",
            position: "relative",
          }}
        >
          {items.map((question, index) => {
            const qid = question.id;
            const sectionId = `question-${qid}`;
            const isActive = activeSection === sectionId;

            return (
              <div
                key={qid}
                id={sectionId}
                className={`scroll-mt-24 relative ${isActive ? "" : ""}`}
                style={{
                  overflow: "visible",
                  position: "relative",
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
                  onDuplicate={(questionIndex) => {
                    // Duplicate câu hỏi trong group hiện tại, không tạo group mới
                    if (typeof onDuplicate === "function") {
                      onDuplicate(questionIndex);
                    }
                  }}
                  onDelete={() => {
                    // onDelete từ App đã được bind với groupId và index
                    if (typeof onDelete === "function") {
                      onDelete(index);
                    }
                  }}
                  onTextChange={onTextChange}
                  onAnswerSelect={onAnswerSelect}
                  selectedAnswer={selectedAnswers?.[qid]}
                  conditionInfo={getQuestionConditionInfo?.(qid)}
                  onOptionChange={onOptionChange}
                  onAddOption={onAddOption}
                  onRemoveOption={onRemoveOption}
                  onMoveOption={onMoveOption}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
