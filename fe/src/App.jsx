import React, { useState, useEffect, useRef, useMemo } from "react";
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
import DeleteConfirmModal from "./components/DeleteConfirmModal";

import { Toaster, toast } from "react-hot-toast";

export default function App() {
  const [activeSection, setActiveSection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    action: null,
    title: "Xác nhận xoá",
    message: "Bạn không thể hoàn tác thao tác này!",
  });

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

  // ✅ Memo hóa tất cả câu hỏi để tránh flatMap lặp lại
  const allQuestions = useMemo(
    () => questionGroups.flatMap((group) => group.questions),
    [questionGroups]
  );

  // Helper: lấy tất cả questionItems từ tất cả groups (giữ API cũ)
  // const getAllQuestionItems = () => allQuestions;

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

  // Thay đổi ảnh cho từng option
  const handleOptionImageChange = (questionId, optionId, imageDataUrl) => {
    setQuestionGroups((prev) =>
      prev.map((group) => ({
        ...group,
        questions: group.questions.map((q) => {
          if (q.id !== questionId) return q;

          return {
            ...q,
            options: (q.options || []).map((opt) =>
              opt.id === optionId ? { ...opt, image: imageDataUrl } : opt
            ),
          };
        }),
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
            if (
              fromIndex !== toIndex &&
              toIndex >= 0 &&
              toIndex < newOptions.length
            ) {
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
    if (panel === "settings") {
      if (rightPanel) setPrevRightPanel(rightPanel);
      setRightPanel(null);
      setSettingsTab("general");
    }

    if (openPanel === "settings" && panel !== "settings") {
      if (prevRightPanel) {
        setRightPanel(prevRightPanel);
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
      if (!questionSettings[questionId]) {
        const question = allQuestions.find(
          (q) => String(q.id) === String(questionId)
        );
        const questionType = question?.type || "Danh sách (nút chọn)";
        const baseSettings = {
          questionCode: `Q${String(questionId).padStart(3, "0")}`,
          type: questionType,
          required: "soft",
          image: null,
        };

        // Thêm settings cho loại "Tải lên tệp"
        if (questionType === "Tải lên tệp") {
          baseSettings.maxQuestions = 1;
          baseSettings.allowedFileTypes = "png, gif, doc, odt, jpg, jpeg, pdf";
          baseSettings.maxFileSizeKB = 10241;
        }

        // Thêm settings cho loại "Văn bản ngắn"
        if (questionType === "Văn bản ngắn") {
          baseSettings.numericOnly = false;
          baseSettings.maxLength = 256;
        }

        setQuestionSettings((prev) => ({
          ...prev,
          [questionId]: baseSettings,
        }));
      }
    } else {
      setRightPanel(null);
      setActiveQuestionId(null);
    }

    requestAnimationFrame(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        const yOffset = -100;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    });
  };

  const handleToggleModal = () => {
    setIsModalOpen((prev) => {
      const newValue = !prev;
      if (newValue) {
        setSavedRightPanel(rightPanel);
        setRightPanel(null);
      } else {
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

  const createDefaultOptions = (questionType) => {
    if (questionType === "Danh sách (nút chọn)") {
      return [
        { id: 1, text: "" },
        { id: 2, text: "" },
        { id: 3, text: "" },
        { id: 4, text: "Không có câu trả lời" },
      ];
    }
    if (questionType === "Lựa chọn 5 điểm") {
      return []; // Không cần options cho loại 5 điểm
    }
    if (questionType === "Giới tính") {
      return [
        { id: 1, text: "Nữ" },
        { id: 2, text: "Nam" },
        { id: 3, text: "Không có câu trả lời" },
      ];
    }
    if (questionType === "Có/Không") {
      return [
        { id: 1, text: "Có" },
        { id: 2, text: "Không" },
        { id: 3, text: "Không có câu trả lời" },
      ];
    }
    return [
      { id: 1, text: "" },
      { id: 2, text: "" },
      { id: 3, text: "" },
    ];
  };

  // Thêm câu hỏi mới vào group cuối cùng
  const addQuestionItem = (questionType = "Mặc định", groupId = null) => {
    setQuestionGroups((prev) => {
      if (prev.length === 0) {
        const defaultOptions = createDefaultOptions(questionType);

        const newItem = {
          id: 1,
          text: "",
          helpText: "",
          type: questionType,
          options: defaultOptions,
          // Đặt maxLength mặc định dựa trên loại câu hỏi
          maxLength: questionType === "Văn bản dài" ? 2500 : questionType === "Văn bản ngắn" ? 256 : undefined,
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

      const maxId = Math.max(
        ...prev.flatMap((g) => g.questions.map((q) => q.id || 0))
      );
      const newId = maxId + 1;

      const defaultOptions = createDefaultOptions(questionType);

      const newItem = {
        id: newId,
        text: "",
        helpText: "",
        type: questionType,
        options: defaultOptions,
        // Đặt maxLength mặc định dựa trên loại câu hỏi
        maxLength: questionType === "Văn bản dài" ? 2500 : questionType === "Văn bản ngắn" ? 256 : undefined,
      };

      // Đặt mặc định chọn "Không có câu trả lời" cho loại Giới tính và Có/Không
      if (questionType === "Giới tính" || questionType === "Có/Không") {
        const noAnswerOption = defaultOptions.find(
          (opt) => opt.text === "Không có câu trả lời"
        );
        if (noAnswerOption) {
          setSelectedAnswers((prev) => ({
            ...prev,
            [newId]: noAnswerOption.id,
          }));
        }
      }

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

  // Thêm nhóm câu hỏi mới (không có câu hỏi)
  const addQuestionGroup = () => {
    setQuestionGroups((prev) => {
      const maxGroupId =
        prev.length > 0 ? Math.max(...prev.map((g) => g.id || 0)) : 0;
      const newGroupId = maxGroupId + 1;

      const newGroup = {
        id: newGroupId,
        title: "Tiêu đề nhóm",
        questions: [],
      };

      return [...prev, newGroup];
    });
  };

  // ===================== Duplicate & Delete =====================
  const duplicateQuestionItem = (groupId, index) => {
    setQuestionGroups((prev) => {
      return prev.map((group) => {
        if (group.id !== groupId) return group;
        const src = group.questions[index];
        if (!src) return group;

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

        // Copy questionSettings bao gồm ảnh từ câu hỏi gốc
        const srcSettings = questionSettings[src.id];
        if (srcSettings) {
          setQuestionSettings((prevSettings) => ({
            ...prevSettings,
            [newId]: {
              ...srcSettings,
              questionCode: `Q${String(newId).padStart(3, "0")}`,
            },
          }));
        }

        return { ...group, questions: newQuestions };
      });
    });
    toast.success("Đã nhân bản câu hỏi");
  };

  const duplicateGroup = (groupId = null) => {
    setQuestionGroups((prev) => {
      if (prev.length === 0) return prev;

      const sourceGroup = groupId
        ? prev.find((g) => g.id === groupId)
        : prev[0];

      if (!sourceGroup) return prev;

      const maxGroupId = Math.max(...prev.map((g) => g.id || 0));
      const maxQuestionId = Math.max(
        ...prev.flatMap((g) => g.questions.map((q) => q.id || 0))
      );

      const duplicatedQuestions = sourceGroup.questions.map(
        (question, index) => ({
          ...question,
          id: maxQuestionId + index + 1,
        })
      );

      const newGroup = {
        id: maxGroupId + 1,
        title: sourceGroup.title,
        questions: duplicatedQuestions,
      };

      // Copy questionSettings bao gồm ảnh cho tất cả câu hỏi trong group
      sourceGroup.questions.forEach((question, index) => {
        const srcSettings = questionSettings[question.id];
        const newQuestionId = maxQuestionId + index + 1;
        if (srcSettings) {
          setQuestionSettings((prevSettings) => ({
            ...prevSettings,
            [newQuestionId]: {
              ...srcSettings,
              questionCode: `Q${String(newQuestionId).padStart(3, "0")}`,
            },
          }));
        }
      });

      return [...prev, newGroup];
    });
    toast.success("Đã nhân bản nhóm câu hỏi");
  };

  const deleteGroup = (groupId) => {
    setDeleteModal({
      isOpen: true,
      action: () => {
        setQuestionGroups((prev) => {
          const filtered = prev.filter((g) => g.id !== groupId);
          if (filtered.length === 0) {
            return [
              {
                id: 1,
                title: "Nhóm câu hỏi đầu tiên của tôi",
                questions: [
                  { id: 1, text: "", helpText: "", type: "Mặc định" },
                ],
              },
            ];
          }
          return filtered;
        });
        toast.success("Đã xoá nhóm câu hỏi");
      },
      title: "Xác nhận xoá",
      message: "Bạn có chắc muốn xoá nhóm câu hỏi này?",
    });
  };

  const deleteQuestionItem = (groupId, index) => {
    setDeleteModal({
      isOpen: true,
      action: () => {
        setQuestionGroups((prev) => {
          return prev.map((group) => {
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
          });
        });
        toast.success("Đã xoá câu hỏi");
      },
      title: "Xác nhận xoá",
      message: "Bạn có chắc muốn xoá câu hỏi này?",
    });
  };

  // ===================== LOGIC HIỂN THỊ/ẨN CÂU HỎI =====================
  const handleAnswerSelect = (questionId, optionId, questionType) => {
    setSelectedAnswers((prev) => {
      const prevValue = prev[questionId];

      // Cho phép chọn nhiều với "Nhiều lựa chọn", "Lựa chọn 5 điểm" và "Chọn nhiều hình ảnh"
      if (
        questionType === "Nhiều lựa chọn" ||
        questionType === "Lựa chọn 5 điểm" ||
        questionType === "Chọn nhiều hình ảnh"
      ) {
        const optionIdStr = String(optionId);
        const prevArray = Array.isArray(prevValue)
          ? prevValue.map(String)
          : prevValue != null
          ? [String(prevValue)]
          : [];

        let newArray;
        if (prevArray.includes(optionIdStr)) {
          newArray = prevArray.filter((id) => id !== optionIdStr);
        } else {
          newArray = [...prevArray, optionIdStr];
        }

        return {
          ...prev,
          [questionId]: newArray,
        };
      }

      return {
        ...prev,
        [questionId]: optionId,
      };
    });
  };

  const shouldShowQuestion = (questionId) => {
    if (viewMode === "design") {
      return true;
    }

    const settings = questionSettings[questionId];
    if (!settings || !settings.conditions || settings.conditions.length === 0) {
      return true;
    }

    const matchSelected = (selected, value) => {
      if (Array.isArray(selected)) {
        return selected.map(String).includes(String(value));
      }
      return String(selected) === String(value);
    };

    for (const condition of settings.conditions) {
      if (condition.type === "question" && condition.field && condition.value) {
        const selected = selectedAnswers[condition.field];
        if (matchSelected(selected, condition.value)) {
          return true;
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
          return true;
        }
      }
    }

    return false;
  };

  const getQuestionConditionInfo = (questionId) => {
    const settings = questionSettings[questionId];
    if (!settings || !settings.conditions || settings.conditions.length === 0) {
      return null;
    }

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
        <HeaderBar
          title={generalSettings?.title}
          savedAt={savedAt}
          onActivate={() => toast.success("Đã kích hoạt")}
        />

        <SidebarRail active={openPanel} onOpen={handleOpenPanel} />
        {renderLeftPanel()}

        {rightPanel === "welcome" && !isModalOpen && (
          <div className="fixed top-[60px] right-0 h-[calc(100vh-60px)] w-[300px] z-40 bg-white border-l border-gray-300">
            <WelcomeSettingsPanel
              value={welcomeSettings}
              onChange={setWelcomeSettings}
              onClose={() => {
                setRightPanel(null);
                setActiveSection(null);
              }}
            />
          </div>
        )}

        {rightPanel?.startsWith("question-") &&
          activeQuestionId &&
          !isModalOpen && (
            <div className="fixed top-[60px] right-0 h-[calc(100vh-60px)] w-[300px] z-40 bg-white border-l border-gray-300">
              <QuestionSettingsPanel
                value={questionSettings[activeQuestionId] || {}}
                onChange={(newSettings) => {
                  const newType = newSettings.type;
                  const prevSettings = questionSettings[activeQuestionId] || {};
                  const oldType = prevSettings.type;

                  // Xử lý file upload settings khi thay đổi type
                  let finalSettings = { ...newSettings };
                  if (newType === "Tải lên tệp" && oldType !== "Tải lên tệp") {
                    // Thêm settings mặc định cho file upload
                    finalSettings.maxQuestions = 1;
                    finalSettings.allowedFileTypes =
                      "png, gif, doc, odt, jpg, jpeg, pdf";
                    finalSettings.maxFileSizeKB = 10241;
                    // Xóa settings của loại cũ nếu có
                    delete finalSettings.numericOnly;
                    delete finalSettings.maxLength;
                  } else if (
                    newType !== "Tải lên tệp" &&
                    oldType === "Tải lên tệp"
                  ) {
                    // Xóa settings file upload khi chuyển sang loại khác
                    delete finalSettings.maxQuestions;
                    delete finalSettings.allowedFileTypes;
                    delete finalSettings.maxFileSizeKB;
                  }

                  // Xử lý short text settings khi thay đổi type
                  if (
                    newType === "Văn bản ngắn" &&
                    oldType !== "Văn bản ngắn"
                  ) {
                    // Thêm settings mặc định cho văn bản ngắn
                    finalSettings.numericOnly = false;
                    finalSettings.maxLength = 256;
                    // Xóa settings của loại cũ nếu có
                    delete finalSettings.maxQuestions;
                    delete finalSettings.allowedFileTypes;
                    delete finalSettings.maxFileSizeKB;
                  } else if (
                    newType !== "Văn bản ngắn" &&
                    oldType === "Văn bản ngắn"
                  ) {
                    // Xóa settings văn bản ngắn khi chuyển sang loại khác
                    delete finalSettings.numericOnly;
                    delete finalSettings.maxLength;
                  }

                  setQuestionSettings((prev) => ({
                    ...prev,
                    [activeQuestionId]: finalSettings,
                  }));

                  setQuestionGroups((prevGroups) =>
                    prevGroups.map((group) => ({
                      ...group,
                      questions: group.questions.map((q) => {
                        if (String(q.id) !== String(activeQuestionId)) return q;

                        let updated = { ...q, ...finalSettings };
                        const questionNewType = finalSettings.type || q.type;
                        const questionOldType = q.type;

                        // Nếu thay đổi loại câu hỏi, cập nhật options
                        if (questionNewType !== questionOldType) {
                          const defaultOptions =
                            createDefaultOptions(questionNewType);
                          updated = {
                            ...updated,
                            options: defaultOptions,
                          };

                          // Đặt mặc định chọn "Không có câu trả lời" cho loại Giới tính và Có/Không
                          if (
                            questionNewType === "Giới tính" ||
                            questionNewType === "Có/Không"
                          ) {
                            const noAnswerOption = defaultOptions.find(
                              (opt) => opt.text === "Không có câu trả lời"
                            );
                            if (noAnswerOption) {
                              setSelectedAnswers((prev) => ({
                                ...prev,
                                [activeQuestionId]: noAnswerOption.id,
                              }));
                            }
                          }
                        } else if (questionNewType === "Danh sách (nút chọn)") {
                          const options = updated.options || [];

                          const hasNoAnswer = options.some(
                            (opt) =>
                              (opt.text || "").trim() === "Không có câu trả lời"
                          );

                          if (!hasNoAnswer) {
                            const maxOptionId =
                              options.length > 0
                                ? Math.max(...options.map((opt) => opt.id || 0))
                                : 0;

                            const noAnswerOption = {
                              id: maxOptionId + 1,
                              text: "Không có câu trả lời",
                            };

                            updated = {
                              ...updated,
                              options: [...options, noAnswerOption],
                            };
                          }
                        }

                        return updated;
                      }),
                    }))
                  );

                  setSavedAt(new Date());
                }}
                onClose={() => {
                  setRightPanel(null);
                  setActiveQuestionId(null);
                  setActiveSection(null);
                }}
                questionItems={allQuestions}
                currentQuestionId={activeQuestionId}
              />
            </div>
          )}

        <div className="overflow-visible" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start">
            <div className="shrink-0 w-[343px]" />

            <div className="flex-1 flex justify-center">
              <div
                id="center-750"
                className="relative isolate"
                style={{ width: centerWidth, boxSizing: "content-box" }}
              >
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
                          questionCount={allQuestions.length}
                          showWelcome={welcomeSettings.showWelcome}
                          showXQuestions={welcomeSettings.showXQuestions}
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
                              duplicateQuestionItem(group.id, questionIndex);
                            }}
                            onDuplicateGroup={() => duplicateGroup(group.id)}
                            onDelete={(questionIndex) => {
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
                            onOptionImageChange={handleOptionImageChange}
                          />
                          <AddSection
                            onAddClick={() => {
                              handleToggleModal();
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

            <div className="shrink-0 w-[300px]" />
          </div>
        </div>
      </div>

      <QuestionTypeModal
        isOpen={isModalOpen}
        onClose={handleToggleModal}
        onSelectQuestionType={handleSelectQuestionType}
        onAddGroup={addQuestionGroup}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={() => {
          if (deleteModal.action) {
            deleteModal.action();
          }
        }}
        title={deleteModal.title}
        message={deleteModal.message}
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
