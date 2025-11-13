import React, { useState, useEffect, useRef } from "react";
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
import QuestionSettingsPanel from "./components/QuestionSettingsPanel";
import HeaderBar from "./components/HeaderBar";

import { Toaster, toast } from "react-hot-toast";

export default function App() {
  const [activeSection, setActiveSection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // panel trái: null | 'structure' | 'settings'
  const [openPanel, setOpenPanel] = useState("structure");
  const [settingsTab, setSettingsTab] = useState("general");

  // panel phải: null | 'welcome' | 'question-{id}'
  const [rightPanel, setRightPanel] = useState(null);
  const [activeQuestionId, setActiveQuestionId] = useState(null);

  // Cấu trúc: mảng các groups, mỗi group có id, title, và questions
  const [questionGroups, setQuestionGroups] = useState([
    {
      id: 1,
      title: "Nhóm câu hỏi đầu tiên của tôi",
      questions: [
        {
          id: 1,
          text: "",
          helpText: "",
          type: "Nhiều lựa chọn",
          options: [
            { id: 1, text: "" },
            { id: 2, text: "" },
            { id: 3, text: "" },
          ],
        },
      ],
    },
  ]);

  // Helper: lấy tất cả questionItems từ tất cả groups (để tương thích với code cũ)
  const getAllQuestionItems = () => {
    return questionGroups.flatMap((group) => group.questions);
  };

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

  // STATE: Cài đặt câu hỏi (panel phải) - lưu theo question id
  const [questionSettings, setQuestionSettings] = useState({});

  // STATE: Đáp án đã chọn cho mỗi câu hỏi (để xử lý logic hiển thị)
  const [selectedAnswers, setSelectedAnswers] = useState({});

  // STATE: Chế độ xem (design/preview)
  const [viewMode, _setViewMode] = useState("design"); // "design" | "preview"

  // Log “Đã lưu lúc …” trên Header
  const [savedAt, setSavedAt] = useState(null);
  const handleGeneralChange = (v) => {
    setGeneralSettings(v);
    setSavedAt(new Date());
  };
  const handlePublishChange = (v) => {
    setPublishSettings(v);
    setSavedAt(new Date());
  };

  // Rộng khu giữa: 750 bình thường, 900 khi mở “Cài đặt”
  const centerWidth = openPanel === "settings" ? "900px" : "750px";

  const [prevRightPanel, setPrevRightPanel] = useState(null);
  const [savedRightPanel, setSavedRightPanel] = useState(null); // Lưu rightPanel khi mở modal thêm

  // Ref cho các phần tử không muốn bỏ chọn khi click vào
  const _centerContentRef = useRef(null);

  // Xử lý click outside để bỏ chọn câu hỏi
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Nếu click vào center content, panel, hoặc các phần tử interactive thì không bỏ chọn
      const centerContent = document.getElementById("center-750");
      const leftPanel = document.querySelector(
        '[class*="fixed"][class*="left-"]'
      );
      const rightPanel = document.querySelector(
        '[class*="fixed"][class*="right-"]'
      );
      const header = document.querySelector("header");
      const sidebarRail = document.querySelector(
        '[class*="fixed"][class*="left-0"]'
      );

      const clickedElement = e.target;
      const isClickOnContent = centerContent?.contains(clickedElement);
      const isClickOnLeftPanel = leftPanel?.contains(clickedElement);
      const isClickOnRightPanel = rightPanel?.contains(clickedElement);
      const isClickOnHeader = header?.contains(clickedElement);
      const isClickOnSidebarRail = sidebarRail?.contains(clickedElement);
      const isClickOnModal =
        clickedElement.closest('[role="dialog"]') ||
        clickedElement.closest(".modal");

      // Chỉ bỏ chọn khi click vào background (gray area)
      if (
        !isClickOnContent &&
        !isClickOnLeftPanel &&
        !isClickOnRightPanel &&
        !isClickOnHeader &&
        !isClickOnSidebarRail &&
        !isClickOnModal &&
        activeSection !== null
      ) {
        // Kiểm tra xem có phải click vào background gray không
        const bgElement = clickedElement.closest(".bg-gray-100");
        if (bgElement || clickedElement.classList.contains("bg-gray-100")) {
          setActiveSection(null);
          setRightPanel(null);
          setActiveQuestionId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeSection]);

  // Thay đổi văn bản câu hỏi
  const handleQuestionTextChange = (id, newText) => {
    setQuestionGroups((prev) =>
      prev.map((group) => ({
        ...group,
        questions: group.questions.map((item) =>
          item.id === id ? { ...item, text: newText } : item
        ),
      }))
    );
  };

  // Thay đổi văn bản option
  const handleOptionChange = (questionId, optionId, newText) => {
    setQuestionGroups((prev) =>
      prev.map((group) => ({
        ...group,
        questions: group.questions.map((q) =>
          q.id === questionId
            ? {
              ...q,
              options: q.options.map((opt) =>
                opt.id === optionId ? { ...opt, text: newText } : opt
              ),
            }
            : q
        ),
      }))
    );
  };

  // Thêm option mới
  const handleAddOption = (questionId) => {
    setQuestionGroups((prev) =>
      prev.map((group) => ({
        ...group,
        questions: group.questions.map((q) => {
          if (q.id === questionId) {
            const maxOptionId = Math.max(
              ...q.options.map((opt) => opt.id || 0)
            );
            const newOption = {
              id: maxOptionId + 1,
              text: "",
            };
            return { ...q, options: [...q.options, newOption] };
          }
          return q;
        }),
      }))
    );
  };

  // Xóa option
  const handleRemoveOption = (questionId, optionId) => {
    setQuestionGroups((prev) =>
      prev.map((group) => ({
        ...group,
        questions: group.questions.map((q) =>
          q.id === questionId
            ? {
              ...q,
              options: q.options.filter((opt) => opt.id !== optionId),
            }
            : q
        ),
      }))
    );
  };

  // Di chuyển option lên/xuống
  const handleMoveOption = (questionId, fromIndex, toIndex) => {
    setQuestionGroups((prev) =>
      prev.map((group) => ({
        ...group,
        questions: group.questions.map((q) => {
          if (q.id === questionId) {
            const newOptions = [...q.options];
            if (fromIndex !== toIndex && toIndex >= 0 && toIndex < newOptions.length) {
              const [removed] = newOptions.splice(fromIndex, 1);
              newOptions.splice(toIndex, 0, removed);
              return { ...q, options: newOptions };
            }
          }
          return q;
        }),
      }))
    );
  };

  const handleOpenPanel = (panel) => {
    // Nếu mở settings => lưu panel phải hiện tại và ẩn nó tạm thời
    if (panel === "settings") {
      if (rightPanel) setPrevRightPanel(rightPanel); // ✅ nhớ lại panel đang mở
      setRightPanel(null); // ẩn tạm
      setSettingsTab("general");
    }

    // Nếu rời khỏi settings => khôi phục panel phải trước đó
    if (openPanel === "settings" && panel !== "settings") {
      if (prevRightPanel) {
        setRightPanel(prevRightPanel); // ✅ bật lại panel cũ (vd: welcome)
        setPrevRightPanel(null);
      }
    }

    setOpenPanel(panel);
  };

  const handleSetSection = (sectionId) => {
    setActiveSection(sectionId);
    if (sectionId === "welcome") {
      setRightPanel("welcome");
      setActiveQuestionId(null);
    } else if (sectionId?.startsWith("question-")) {
      const questionId = sectionId.replace("question-", "");
      setRightPanel(`question-${questionId}`);
      setActiveQuestionId(questionId);
      // Khởi tạo cài đặt mặc định nếu chưa có
      if (!questionSettings[questionId]) {
        const allQuestions = getAllQuestionItems();
        const question = allQuestions.find((q) => String(q.id) === questionId);
        setQuestionSettings((prev) => ({
          ...prev,
          [questionId]: {
            questionCode: `Q${String(questionId).padStart(3, "0")}`,
            type: question?.type || "Danh sách (nút chọn)",
            required: "soft",
            image: null,
          },
        }));
      }
    } else {
      setRightPanel(null);
      setActiveQuestionId(null);
    }

    requestAnimationFrame(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        const yOffset = -100; // ⚙️ offset theo chiều cao header (60px) + margin
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    });
  };

  const handleToggleModal = () => {
    setIsModalOpen((prev) => {
      const newValue = !prev;
      // Khi mở modal: lưu rightPanel hiện tại và ẩn nó
      if (newValue) {
        setSavedRightPanel(rightPanel);
        setRightPanel(null);
      } else {
        // Khi đóng modal: khôi phục rightPanel
        if (savedRightPanel) {
          setRightPanel(savedRightPanel);
          setSavedRightPanel(null);
        }
      }
      return newValue;
    });
  };

  // Di chuyển câu hỏi trong group
  const moveQuestionItem = (groupId, index, direction) => {
    setQuestionGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        const newQuestions = [...group.questions];
        const [removed] = newQuestions.splice(index, 1);
        if (direction === "up" && index > 0) {
          newQuestions.splice(index - 1, 0, removed);
        } else if (direction === "down" && index < group.questions.length - 1) {
          newQuestions.splice(index + 1, 0, removed);
        } else {
          return group;
        }
        setActiveSection(`question-${removed.id}`);
        return { ...group, questions: newQuestions };
      })
    );
  };

  // Thêm câu hỏi mới vào group cuối cùng
  const addQuestionItem = (questionType = "Mặc định", groupId = null) => {
    setQuestionGroups((prev) => {
      if (prev.length === 0) {
        const newItem = {
          id: 1,
          text: "",
          helpText: "",
          type: questionType,
          options: [
            { id: 1, text: "" },
            { id: 2, text: "" },
            { id: 3, text: "" },
          ],
        };
        return [
          {
            id: 1,
            title: "Nhóm câu hỏi đầu tiên của tôi",
            questions: [newItem],
          },
        ];
      }

      const targetGroup = groupId
        ? prev.find((g) => g.id === groupId)
        : prev[prev.length - 1];

      if (!targetGroup) return prev;

      // Tìm id lớn nhất của tất cả questions
      const maxId = Math.max(
        ...prev.flatMap((g) => g.questions.map((q) => q.id || 0))
      );
      const newId = maxId + 1;
      const newItem = {
        id: newId,
        text: "",
        helpText: "",
        type: questionType,
        options: [
          { id: 1, text: "Subquestion 1" },
          { id: 2, text: "Subquestion 2" },
          { id: 3, text: "Subquestion 3" },
        ],
      };

      setActiveSection(`question-${newId}`);

      return prev.map((group) =>
        group.id === targetGroup.id
          ? { ...group, questions: [...group.questions, newItem] }
          : group
      );
    });
  };

  const handleSelectQuestionType = (questionType) => {
    handleToggleModal();
    const groupId = window.__currentGroupId || null;
    addQuestionItem(questionType, groupId);
    window.__currentGroupId = null;
  };

  // ===================== Duplicate & Delete =====================
  const duplicateQuestionItem = (groupId, index) => {
    setQuestionGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        const src = group.questions[index];
        if (!src) return group;

        // Tìm id lớn nhất của tất cả questions để tạo id mới
        const maxId = Math.max(
          ...prev.flatMap((g) => g.questions.map((q) => q.id || 0))
        );
        const newId = maxId + 1;

        const clone = {
          ...src,
          id: newId,
          text: "",
          options: src.options || [
            { id: 1, text: "Subquestion 1" },
            { id: 2, text: "Subquestion 2" },
            { id: 3, text: "Subquestion 3" },
          ],
        };
        const newQuestions = [...group.questions];
        newQuestions.splice(index + 1, 0, clone);
        setActiveSection(`question-${newId}`);
        return { ...group, questions: newQuestions };
      })
    );
    toast.success("Đã nhân bản câu hỏi");
  };

  // Duplicate toàn bộ group (duplicate group đầu tiên)
  const duplicateGroup = (groupId = null) => {
    setQuestionGroups((prev) => {
      if (prev.length === 0) return prev;

      // Nếu không có groupId, duplicate group đầu tiên
      const sourceGroup = groupId
        ? prev.find((g) => g.id === groupId)
        : prev[0];

      if (!sourceGroup) return prev;

      // Tìm id lớn nhất của groups và questions
      const maxGroupId = Math.max(...prev.map((g) => g.id || 0));
      const maxQuestionId = Math.max(
        ...prev.flatMap((g) => g.questions.map((q) => q.id || 0))
      );

      // Duplicate tất cả câu hỏi với id mới
      const duplicatedQuestions = sourceGroup.questions.map(
        (question, index) => ({
          ...question,
          id: maxQuestionId + index + 1,
        })
      );

      // Tạo group mới
      const newGroup = {
        id: maxGroupId + 1,
        title: sourceGroup.title,
        questions: duplicatedQuestions,
      };

      return [...prev, newGroup];
    });
    toast.success("Đã nhân bản nhóm câu hỏi");
  };

  // Delete group
  const deleteGroup = (groupId) => {
    const ok = window.confirm("Bạn có chắc muốn xoá nhóm câu hỏi này?");
    if (!ok) return;

    setQuestionGroups((prev) => {
      const filtered = prev.filter((g) => g.id !== groupId);
      if (filtered.length === 0) {
        // Nếu xóa hết, tạo group mặc định
        return [
          {
            id: 1,
            title: "Nhóm câu hỏi đầu tiên của tôi",
            questions: [{ id: 1, text: "", helpText: "", type: "Mặc định" }],
          },
        ];
      }
      return filtered;
    });
    toast.success("Đã xoá nhóm câu hỏi");
  };

  const deleteQuestionItem = (groupId, index) => {
    const ok = window.confirm("Bạn có chắc muốn xoá câu hỏi này?");
    if (!ok) return;

    setQuestionGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        if (index < 0 || index >= group.questions.length) return group;
        const newQuestions = group.questions.filter((_, i) => i !== index);

        if (newQuestions.length > 0) {
          const next = Math.min(index, newQuestions.length - 1);
          setActiveSection(`question-${newQuestions[next].id}`);
        } else {
          setActiveSection(null);
        }
        return { ...group, questions: newQuestions };
      })
    );
    toast.success("Đã xoá câu hỏi");
  };

  // ===================== LOGIC HIỂN THỊ/ẨN CÂU HỎI =====================
  // Xử lý khi người dùng chọn đáp án
  // Xử lý khi người dùng chọn đáp án
  // ✅ Hỗ trợ chọn nhiều đáp án nếu type === "Nhiều lựa chọn"
  const handleAnswerSelect = (questionId, optionId, questionType) => {
    setSelectedAnswers((prev) => {
      const prevValue = prev[questionId];

      // Nếu là câu "Nhiều lựa chọn" => cho phép nhiều đáp án (mảng)
      if (questionType === "Nhiều lựa chọn") {
        const optionIdStr = String(optionId);
        const prevArray = Array.isArray(prevValue)
          ? prevValue.map(String)
          : prevValue != null
            ? [String(prevValue)]
            : [];

        let newArray;
        if (prevArray.includes(optionIdStr)) {
          // Bỏ chọn nếu đang được chọn
          newArray = prevArray.filter((id) => id !== optionIdStr);
        } else {
          // Thêm nếu chưa được chọn
          newArray = [...prevArray, optionIdStr];
        }

        return {
          ...prev,
          [questionId]: newArray,
        };
      }

      // Các loại câu khác: vẫn là một đáp án duy nhất
      return {
        ...prev,
        [questionId]: optionId,
      };
    });
  };

  // Kiểm tra xem câu hỏi có nên hiển thị không dựa trên điều kiện
  // ✅ Hỗ trợ cả trường hợp selectedAnswers[field] là mảng (câu nhiều lựa chọn)
  const shouldShowQuestion = (questionId) => {
    // Trong chế độ thiết kế, luôn hiển thị tất cả câu hỏi
    if (viewMode === "design") {
      return true;
    }

    // Trong chế độ preview, áp dụng logic điều kiện
    const settings = questionSettings[questionId];
    if (!settings || !settings.conditions || settings.conditions.length === 0) {
      return true; // Không có điều kiện => luôn hiển thị
    }

    // Helper nhỏ: kiểm tra selected có chứa value (dù là scalar hay array)
    const matchSelected = (selected, value) => {
      if (Array.isArray(selected)) {
        return selected.map(String).includes(String(value));
      }
      return String(selected) === String(value);
    };

    // Kiểm tra từng điều kiện
    for (const condition of settings.conditions) {
      if (condition.type === "question" && condition.field && condition.value) {
        const selected = selectedAnswers[condition.field];
        if (matchSelected(selected, condition.value)) {
          return true; // Điều kiện thỏa mãn
        }
      } else if (
        condition.type === "participant" &&
        condition.field &&
        condition.value &&
        condition.targetQuestionId
      ) {
        const selected = selectedAnswers[condition.field];
        if (
          matchSelected(selected, condition.value) &&
          String(condition.targetQuestionId) === String(questionId)
        ) {
          return true; // Điều kiện thỏa mãn
        }
      }
    }

    return false; // Không có điều kiện nào thỏa mãn
  };

  // Lấy thông tin điều kiện hiển thị của câu hỏi (để hiển thị badge)
  const getQuestionConditionInfo = (questionId) => {
    const settings = questionSettings[questionId];
    if (!settings || !settings.conditions || settings.conditions.length === 0) {
      return null;
    }

    const allQuestions = getAllQuestionItems();
    const messages = [];

    for (const condition of settings.conditions) {
      if (condition.type === "question" && condition.field && condition.value) {
        const sourceQuestion = allQuestions.find(
          (q) => String(q.id) === String(condition.field)
        );
        const sourceQuestionIndex = allQuestions.findIndex(
          (q) => String(q.id) === String(condition.field)
        );
        const option = sourceQuestion?.options?.find(
          (opt) => String(opt.id) === String(condition.value)
        );

        if (sourceQuestion && option) {
          messages.push(
            `Hiển thị khi Câu ${sourceQuestionIndex + 1} chọn: ${option.text}`
          );
        }
      } else if (
        condition.type === "participant" &&
        condition.field &&
        condition.value &&
        condition.targetQuestionId
      ) {
        const sourceQuestion = allQuestions.find(
          (q) => String(q.id) === String(condition.field)
        );
        const sourceQuestionIndex = allQuestions.findIndex(
          (q) => String(q.id) === String(condition.field)
        );
        const option = sourceQuestion?.options?.find(
          (opt) => String(opt.id) === String(condition.value)
        );

        if (
          sourceQuestion &&
          option &&
          String(condition.targetQuestionId) === String(questionId)
        ) {
          messages.push(
            `Hiển thị khi Câu ${sourceQuestionIndex + 1} chọn: ${option.text}`
          );
        }
      }
    }

    return messages.length > 0 ? messages : null;
  };
  // =============================================================

  const renderLeftPanel = () => {
    if (!openPanel) return null;
    return (
      <div
        className="fixed top-[60px] left-[55px] h-[calc(100vh-60px)] w-72 z-40"
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
                questionGroups={questionGroups}
                activeSection={activeSection}
                onSelect={handleSetSection}
                onDuplicate={(groupId, questionIndex) => {
                  duplicateQuestionItem(groupId, questionIndex);
                }}
                onDelete={(groupId, questionIndex) => {
                  deleteQuestionItem(groupId, questionIndex);
                }}
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
      <div className="min-h-screen bg-gray-100 font-sans overflow-visible pt-[60px]">
        {/* Header 60px (full width, cố định) */}
        <HeaderBar
          title={generalSettings?.title}
          savedAt={savedAt}
          onActivate={() => toast.success("Đã kích hoạt")}
        // logoSrc="/logo.svg"
        />

        {/* Panel trái (1 lần) */}
        <SidebarRail active={openPanel} onOpen={handleOpenPanel} />
        {renderLeftPanel()}

        {/* Panel phải: Welcome settings (1 lần) - ẩn khi modal thêm mở */}
        {rightPanel === "welcome" && !isModalOpen && (
          <div className="fixed top-[60px] right-0 h-[calc(100vh-60px)] w-[300px] z-40 bg-white border-l border-gray-300">
            <WelcomeSettingsPanel
              value={welcomeSettings}
              onChange={setWelcomeSettings}
              onClose={() => {
                setRightPanel(null);
                setActiveSection(null); // ⬅️ khi nhấn X thì tắt panel và bỏ chọn
              }}
            />
          </div>
        )}

        {/* Panel phải: Question settings - ẩn khi modal thêm mở */}
        {rightPanel?.startsWith("question-") &&
          activeQuestionId &&
          !isModalOpen && (
            <div className="fixed top-[60px] right-0 h-[calc(100vh-60px)] w-[300px] z-40 bg-white border-l border-gray-300">
              <QuestionSettingsPanel
                value={questionSettings[activeQuestionId] || {}}
                onChange={(newSettings) => {
                  // Cập nhật cài đặt panel
                  setQuestionSettings((prev) => ({
                    ...prev,
                    [activeQuestionId]: newSettings,
                  }));

                  // Đồng bộ sang danh sách câu hỏi
                  setQuestionGroups((prev) =>
                    prev.map((group) => ({
                      ...group,
                      questions: group.questions.map((q) =>
                        String(q.id) === String(activeQuestionId)
                          ? { ...q, ...newSettings }
                          : q
                      ),
                    }))
                  );

                  setSavedAt(new Date());
                }}
                onClose={() => {
                  setRightPanel(null);
                  setActiveQuestionId(null);
                  setActiveSection(null);
                }}
                questionItems={getAllQuestionItems()}
                currentQuestionId={activeQuestionId}
              />
            </div>
          )}

        {/* ===== Trung tâm: 3 vùng cố định, KHÔNG xê dịch ===== */}
        <div className="overflow-visible" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start">
            {/* Spacer trái: 55px (offset) + 18rem (w-72) = 343px */}
            <div className="shrink-0 w-[343px]" />

            {/* Khối giữa: 750/900 "net", KHÔNG padding ngang, luôn giữa 2 spacer */}
            <div className="flex-1 flex justify-center">
              <div
                id="center-750"
                className="relative isolate"
                style={{ width: centerWidth, boxSizing: "content-box" }}
              >
                {/* KHÔNG đặt px-4 ở đây để khỏi mất width net */}
                <div className="flex flex-col space-y-6">
                  {openPanel === "settings" ? (
                    settingsTab === "general" ? (
                      <GeneralSettingsForm
                        value={generalSettings}
                        onChange={handleGeneralChange}
                      />
                    ) : settingsTab === "publish" ? (
                      <PublishAccessForm
                        value={publishSettings}
                        onChange={handlePublishChange}
                      />
                    ) : null
                  ) : (
                    <>
                      <div
                        id="welcome"
                        className="scroll-mt-[84px] relative z-10 overflow-visible mt-5"
                      >
                        <WelcomeSection
                          isActive={activeSection === "welcome"}
                          onClick={() => handleSetSection("welcome")}
                          questionCount={getAllQuestionItems().length}
                        />
                      </div>

                      {questionGroups.map((group) => (
                        <React.Fragment key={group.id}>
                          <QuestionSection
                            groupId={group.id}
                            groupTitle={group.title}
                            questionItems={group.questions.filter((q) =>
                              shouldShowQuestion(q.id)
                            )}
                            moveQuestionItem={(index, direction) =>
                              moveQuestionItem(group.id, index, direction)
                            }
                            activeSection={activeSection}
                            handleSetSection={handleSetSection}
                            onDuplicate={(questionIndex) => {
                              // Duplicate câu hỏi trong group hiện tại
                              duplicateQuestionItem(group.id, questionIndex);
                            }}
                            onDuplicateGroup={() => duplicateGroup(group.id)}
                            onDelete={(questionIndex) => {
                              // Xóa câu hỏi trong group hiện tại
                              deleteQuestionItem(group.id, questionIndex);
                            }}
                            onDeleteGroup={() => deleteGroup(group.id)}
                            onTextChange={handleQuestionTextChange}
                            onGroupTitleChange={(newTitle) => {
                              setQuestionGroups((prev) =>
                                prev.map((g) =>
                                  g.id === group.id
                                    ? { ...g, title: newTitle }
                                    : g
                                )
                              );
                            }}
                            onAnswerSelect={handleAnswerSelect}
                            selectedAnswers={selectedAnswers}
                            getQuestionConditionInfo={getQuestionConditionInfo}
                            onOptionChange={handleOptionChange}
                            onAddOption={handleAddOption}
                            onRemoveOption={handleRemoveOption}
                            onMoveOption={handleMoveOption}
                          />
                          <AddSection
                            onAddClick={() => {
                              handleToggleModal();
                              // Lưu groupId tạm thời để addQuestionItem sử dụng
                              window.__currentGroupId = group.id;
                            }}
                            isModalOpen={isModalOpen}
                          />
                        </React.Fragment>
                      ))}

                      <div
                        id="end"
                        className="scroll-mt-[84px] relative z-10 overflow-visible mb-5"
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
