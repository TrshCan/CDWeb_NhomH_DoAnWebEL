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
  globalStartIndex = 0, // ✅ Thêm prop globalStartIndex
  activeSection,
  handleSetSection,
  moveQuestionItem,
  onDuplicate,
  onDuplicateGroup,
  onDelete,
  onDeleteGroup,
  onGroupTitleChange, // optional: bắn tiêu đề ra ngoài nếu cần
  onTextChange,
  onTextBlur,
  onHelpTextChange,
  onHelpTextBlur,
  onAnswerSelect,
  selectedAnswers,
  getQuestionConditionInfo,
  onOptionChange,
  onOptionBlur,
  onAddOption,
  onRemoveOption,
  onMoveOption,
  onOptionImageChange,
  surveyType,
  onCorrectAnswerChange,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRef = useRef(null);
  
  // Sử dụng trực tiếp questionItems - không cần state hoặc memo
  const items = questionItems;

  const [groupTitle, setGroupTitle] = useState(
    initialGroupTitle || "Nhóm câu hỏi đầu tiên của tôi"
  );
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const titleRef = useRef(null);
  const menuRef = useRef(null);
  
  // Sử dụng ref để lưu callbacks, tránh re-run useEffect không cần thiết
  const onGroupTitleChangeRef = useRef(onGroupTitleChange);
  const prevInitialTitleRef = useRef(initialGroupTitle);
  
  // Cập nhật ref khi callback thay đổi (không trigger re-render)
  useEffect(() => {
    onGroupTitleChangeRef.current = onGroupTitleChange;
  }, [onGroupTitleChange]);

  // Sync initialGroupTitle vào groupTitle CHỈ khi initialGroupTitle thay đổi GIÁ TRỊ
  // (không phải reference), và không phải do user đang edit
  useEffect(() => {
    if (
      initialGroupTitle &&
      initialGroupTitle !== prevInitialTitleRef.current &&
      !isEditingTitle
    ) {
      setGroupTitle(initialGroupTitle);
      prevInitialTitleRef.current = initialGroupTitle;
      
      // Cập nhật DOM nếu cần
      if (titleRef.current) {
        titleRef.current.innerText = initialGroupTitle;
      }
    }
  }, [initialGroupTitle, isEditingTitle]);

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

  // Đồng bộ tiêu đề ra ngoài - CHỈ khi user thay đổi, KHÔNG khi props thay đổi
  // Sử dụng ref để track xem đây có phải là thay đổi từ user không
  const userChangedTitleRef = useRef(false);
  
  useEffect(() => {
    // Chỉ gọi callback nếu user đã thay đổi title (không phải từ props)
    if (
      userChangedTitleRef.current &&
      typeof onGroupTitleChangeRef.current === "function" &&
      groupTitle !== initialGroupTitle &&
      groupId > 0
    ) {
      onGroupTitleChangeRef.current(groupTitle);
      userChangedTitleRef.current = false; // Reset flag
    }
  }, [groupTitle, initialGroupTitle, groupId]);

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

  // Di chuyển câu hỏi - gọi callback từ App
  const handleMove = (index, direction) => {
    const movedId = items[index] ? items[index].id : null;

    // Gọi moveQuestionItem từ App với groupId
    if (typeof moveQuestionItem === "function" && groupId) {
      moveQuestionItem(index, direction);
    }

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
            className={`text-md font-semibold px-2 py-1 rounded cursor-text inline-block transition-colors ${isEditingTitle ? "bg-gray-200" : "bg-transparent"
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
              if (text && text !== groupTitle) {
                // Đánh dấu là user đã thay đổi
                userChangedTitleRef.current = true;
                setGroupTitle(text);
                e.currentTarget.innerText = text;
              } else if (!text) {
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
          >
            {groupTitle}
          </span>
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
        className={`transition-all duration-300 ease-in-out ${isCollapsed
          ? "max-h-0 overflow-hidden"
          : "max-h-[9999px] overflow-visible"
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
              >
                <QuestionItem
                  question={question}
                  index={index}
                  totalQuestions={items.length}
                  isActive={isActive}
                  onClick={() => handleSetSection(sectionId)}
                  moveQuestionItem={handleMove}
                  onDuplicate={() => {
                    // Duplicate câu hỏi trong group hiện tại, truyền index local (trong group)
                    if (typeof onDuplicate === "function") {
                      onDuplicate(index); // Sử dụng index local, không phải globalStartIndex + index
                    }
                  }}
                  onDelete={() => {
                    // onDelete từ App đã được bind với groupId và index
                    if (typeof onDelete === "function") {
                      onDelete(index);
                    }
                  }}
                  onTextChange={onTextChange}
                  onTextBlur={onTextBlur}
                  onHelpTextChange={onHelpTextChange}
                  onHelpTextBlur={onHelpTextBlur}
                  onAnswerSelect={onAnswerSelect}
                  selectedAnswer={selectedAnswers?.[qid]}
                  conditionInfo={getQuestionConditionInfo?.(qid)}
                  onOptionChange={onOptionChange}
                  onOptionBlur={onOptionBlur}
                  onAddOption={onAddOption}
                  onRemoveOption={onRemoveOption}
                  onMoveOption={onMoveOption}
                  onOptionImageChange={onOptionImageChange}
                  surveyType={surveyType}
                  onCorrectAnswerChange={onCorrectAnswerChange}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
