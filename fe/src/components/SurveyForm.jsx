import React, { useState, useEffect, useRef, useMemo, useCallback, startTransition } from "react";
import WelcomeSection from "./WelcomeSection";
import QuestionSection from "./QuestionSection";
import AddSection from "./AddSection";
import EndSection from "./EndSection";
import QuestionTypeModal from "./QuestionTypeModal";

import SidebarRail from "./SidebarRail";
import StructurePanel from "./StructurePanel";
import SettingsPanel from "./SettingsPanel";
import GeneralSettingsForm from "./GeneralSettingsForm";
import PublishAccessForm from "./PublishAccessForm";

import WelcomeSettingsPanel from "./WelcomeSettingsPanel";
import QuestionSettingsPanel from "./QuestionSettingsPanel";
import HeaderBar from "./HeaderBar";
import DeleteConfirmModal from "./DeleteConfirmModal";

import { Toaster, toast } from "react-hot-toast";
import { addQuestion, deleteQuestion, deleteQuestions } from "../api/questions";

export default function SurveyForm({ surveyId = null }) {
  const [activeSection, setActiveSection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // ✅ Cấu trúc: mảng các groups, mỗi group có id, title, và questions
  // Khởi tạo rỗng, sẽ load từ CSDL
  const [questionGroups, setQuestionGroups] = useState([]);

  // ✅ Memo hóa tất cả câu hỏi để tránh flatMap lặp lại
  const allQuestions = useMemo(
    () => questionGroups.flatMap((group) => group.questions),
    [questionGroups]
  );

  // Helper: lấy tất cả questionItems từ tất cả groups (giữ API cũ)
  // const getAllQuestionItems = () => allQuestions;

  // ✅ Memoize createDefaultOptions để tránh tạo lại mỗi lần render
  const createDefaultOptions = useCallback((questionType) => {
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
    if (questionType === "Ma trận (chọn điểm)") {
      return [
        { id: 1, text: "", isSubquestion: false }, // Answer option 1
        { id: 2, text: "", isSubquestion: false }, // Answer option 2
        { id: 3, text: "", isSubquestion: true },  // Subquestion 1
        { id: 4, text: "", isSubquestion: true },  // Subquestion 2
      ];
    }
    return [
      { id: 1, text: "" },
      { id: 2, text: "" },
      { id: 3, text: "" },
    ];
  }, []);

  // ✅ Helper function để tạo questionSettings từ backend data (tránh trùng lặp)
  const buildQuestionSettings = useCallback((backendQuestion, frontendQuestion) => {
    const questionSettingsData = {
      questionCode: backendQuestion.question_code || `Q${String(frontendQuestion.id).padStart(3, "0")}`,
      type: frontendQuestion.type,
      required: backendQuestion.required || "soft",
      image: backendQuestion.image || null,
      conditions: backendQuestion.conditions || [],
      defaultScenario: backendQuestion.default_scenario || 1,
      maxLength: backendQuestion.max_length || undefined,
      numericOnly: backendQuestion.numeric_only || false,
      maxQuestions: backendQuestion.max_questions || undefined,
      allowedFileTypes: backendQuestion.allowed_file_types || undefined,
      maxFileSizeKB: backendQuestion.max_file_size_kb || undefined,
      points: backendQuestion.points || 0,
    };

    // Thêm settings đặc biệt cho từng loại câu hỏi
    if (frontendQuestion.type === "Tải lên tệp") {
      questionSettingsData.maxQuestions = backendQuestion.max_questions || 1;
      questionSettingsData.allowedFileTypes = backendQuestion.allowed_file_types || "png, gif, doc, odt, jpg, jpeg, pdf";
      questionSettingsData.maxFileSizeKB = backendQuestion.max_file_size_kb || 10241;
    }

    if (frontendQuestion.type === "Văn bản ngắn" || frontendQuestion.type === "Văn bản dài" || frontendQuestion.type === "Nhiều văn bản ngắn") {
      questionSettingsData.maxLength = backendQuestion.max_length || (frontendQuestion.type === "Văn bản dài" ? 2500 : 256);
      questionSettingsData.numericOnly = backendQuestion.numeric_only || false;
    }

    return questionSettingsData;
  }, []);

  // STATE: Tổng quát
  const [generalSettings, setGeneralSettings] = useState({
    title: "",
    type: "survey",
    object: "public",
    base_language: "vi",
    owner: "",
  });

  // ✅ State để lưu surveyId thực tế từ CSDL
  const [currentSurveyId, setCurrentSurveyId] = useState(surveyId);
  
  // ✅ Ref để track surveyId đã load (tránh hiển thị toast 2 lần)
  const loadedSurveyIdRef = useRef(null);
  const isLoadingRef = useRef(false);
  
  // ✅ BroadcastChannel để đồng bộ giữa các tab/cửa sổ
  const broadcastChannelRef = useRef(null);

  // ✅ Load survey từ CSDL (chỉ chỉnh sửa, không tạo mới)
  useEffect(() => {
    const loadSurvey = async () => {
      // Nếu không có surveyId, không làm gì (tạo survey là công việc của người khác)
      if (!surveyId) {
        setLoading(false);
        loadedSurveyIdRef.current = null;
        isLoadingRef.current = false;
        return;
      }
      
      // ✅ Kiểm tra xem đã load surveyId này chưa hoặc đang load (tránh load và hiển thị toast 2 lần)
      // Chỉ load nếu surveyId thay đổi hoặc chưa load lần nào
      if (loadedSurveyIdRef.current === surveyId || isLoadingRef.current) {
        return;
      }
      
      isLoadingRef.current = true;
      
      setLoading(true);
      try {
        const { getSurvey } = await import('../api/surveys');
        
        // ✅ Load survey từ CSDL
        const surveyData = await getSurvey(surveyId);
        setCurrentSurveyId(surveyId);
        
        // ✅ Đánh dấu đã load surveyId này
        loadedSurveyIdRef.current = surveyId;
        
        // Cập nhật general settings từ CSDL
        setGeneralSettings({
          title: surveyData.title || "",
          type: surveyData.type || "survey",
          object: surveyData.object || "public",
          base_language: "vi",
          owner: surveyData.creator?.name || "",
        });

        // Cập nhật publish settings nếu có
        if (surveyData.start_at || surveyData.end_at) {
          setPublishSettings({
            start_at: surveyData.start_at || "",
            end_at: surveyData.end_at || "",
          });
        }

        // ✅ Load questions và convert sang format của questionGroups từ CSDL
        if (surveyData.questions && surveyData.questions.length > 0) {
          // ✅ Tối ưu: Thu thập tất cả data trước, sau đó batch update 1 lần
          const newQuestionSettings = {};
          const newSelectedAnswers = {};

          // Convert backend questions to frontend format
          const convertedQuestions = surveyData.questions.map((backendQuestion) => {
            // Convert options từ backend format sang frontend format
            const convertedOptions = (backendQuestion.options || []).map((backendOption) => {
              const frontendOption = {
                id: parseInt(backendOption.id) || Date.now() + Math.random(),
                text: backendOption.option_text || "",
              };
              
              // Xử lý cho Ma trận (chọn điểm) - có is_subquestion
              if (backendQuestion.question_type === "Ma trận (chọn điểm)") {
                frontendOption.isSubquestion = backendOption.is_subquestion || false;
              }
              
              // Xử lý image cho option nếu có
              if (backendOption.image) {
                frontendOption.image = backendOption.image;
              }
              
              return frontendOption;
            });

            // Tạo question object theo frontend format
            const frontendQuestion = {
              id: parseInt(backendQuestion.id),
              text: backendQuestion.question_text || "",
              helpText: backendQuestion.help_text || "",
              type: backendQuestion.question_type || "Danh sách (nút chọn)",
              options: convertedOptions.length > 0 ? convertedOptions : createDefaultOptions(backendQuestion.question_type || "Danh sách (nút chọn)"),
            };

            // Thêm maxLength nếu có
            if (backendQuestion.max_length) {
              frontendQuestion.maxLength = backendQuestion.max_length;
            }

            // ✅ Sử dụng helper function để tạo questionSettings (tránh trùng lặp)
            const questionId = String(frontendQuestion.id);
            newQuestionSettings[questionId] = buildQuestionSettings(backendQuestion, frontendQuestion);

            // ✅ Thu thập selectedAnswers cho Giới tính và Có/Không
            if (frontendQuestion.type === "Giới tính" || frontendQuestion.type === "Có/Không") {
              const noAnswerOption = frontendQuestion.options.find(
                (opt) => opt.text === "Không có câu trả lời"
              );
              if (noAnswerOption) {
                newSelectedAnswers[frontendQuestion.id] = noAnswerOption.id;
              }
            }

            return frontendQuestion;
          });

          // ✅ Batch update: Gộp tất cả state updates thành 1 lần để tránh nhiều re-render
          const newQuestionGroups = [
            {
              id: 1,
              title: "Nhóm câu hỏi",
              questions: convertedQuestions,
            },
          ];

          // Cập nhật tất cả states trong 1 batch (React sẽ tự động batch các setState trong event handler)
          setQuestionGroups(newQuestionGroups);
          setQuestionSettings((prev) => ({ ...prev, ...newQuestionSettings }));
          setSelectedAnswers((prev) => ({ ...prev, ...newSelectedAnswers }));
        } else {
          // ✅ Nếu không có questions, khởi tạo rỗng (không hardcode)
          setQuestionGroups([]);
        }

        toast.success(`Đã tải survey: ${surveyData.title}`);
      } catch (error) {
        toast.error('Không thể tải survey: ' + error.message);
        loadedSurveyIdRef.current = null; // Reset nếu lỗi để có thể thử lại
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    loadSurvey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId]); // Chỉ chạy khi surveyId thay đổi - chỉ load survey để chỉnh sửa, không tạo mới

  // ✅ Đồng bộ giữa các tab/cửa sổ khi có thay đổi từ tab khác
  useEffect(() => {
    if (!surveyId) return;

    // Tạo BroadcastChannel với tên channel dựa trên surveyId
    const channelName = `survey-${surveyId}`;
    const channel = new BroadcastChannel(channelName);
    broadcastChannelRef.current = channel;

    // Lắng nghe message từ các tab khác
    channel.onmessage = (event) => {
      const { type, data } = event.data;

      // Xử lý khi có câu hỏi bị xóa từ tab khác
      if (type === 'QUESTION_DELETED') {
        const { questionIds } = data;
        const questionIdsSet = new Set(questionIds.map(String));

        // Cập nhật state để xóa câu hỏi
        setQuestionGroups((prev) =>
          prev.map((group) => ({
            ...group,
            questions: group.questions.filter(
              (q) => !questionIdsSet.has(String(q.id))
            ),
          }))
        );

        // Xóa questionSettings và selectedAnswers
        setQuestionSettings((prev) => {
          const newSettings = { ...prev };
          questionIdsSet.forEach((qId) => delete newSettings[qId]);
          return newSettings;
        });

        setSelectedAnswers((prev) => {
          const newAnswers = { ...prev };
          questionIdsSet.forEach((qId) => delete newAnswers[qId]);
          return newAnswers;
        });

        // Nếu câu hỏi đang active bị xóa, reset active state
        if (activeQuestionId && questionIdsSet.has(activeQuestionId)) {
          setActiveSection(null);
          setActiveQuestionId(null);
          setRightPanel(null);
        }
      }

      // Xử lý khi có nhóm câu hỏi bị xóa từ tab khác
      if (type === 'GROUP_DELETED') {
        const { groupId, questionIds } = data;
        const questionIdsSet = new Set(questionIds.map(String));

        // Xóa group
        setQuestionGroups((prev) => prev.filter((g) => g.id !== groupId));

        // Xóa questionSettings và selectedAnswers
        setQuestionSettings((prev) => {
          const newSettings = { ...prev };
          questionIdsSet.forEach((qId) => delete newSettings[qId]);
          return newSettings;
        });

        setSelectedAnswers((prev) => {
          const newAnswers = { ...prev };
          questionIdsSet.forEach((qId) => delete newAnswers[qId]);
          return newAnswers;
        });

        // Nếu câu hỏi đang active bị xóa, reset active state
        if (activeQuestionId && questionIdsSet.has(activeQuestionId)) {
          setActiveSection(null);
          setActiveQuestionId(null);
          setRightPanel(null);
        }
      }

      // Xử lý khi có câu hỏi mới được thêm từ tab khác
      if (type === 'QUESTION_ADDED') {
        // Reload survey để lấy dữ liệu mới nhất
        const reloadSurvey = async () => {
          try {
            const { getSurvey } = await import('../api/surveys');
            const surveyData = await getSurvey(surveyId);

            if (surveyData.questions && surveyData.questions.length > 0) {
              const newQuestionSettings = {};
              const newSelectedAnswers = {};

              const convertedQuestions = surveyData.questions.map((backendQuestion) => {
                const convertedOptions = (backendQuestion.options || []).map((backendOption) => {
                  const frontendOption = {
                    id: parseInt(backendOption.id) || Date.now() + Math.random(),
                    text: backendOption.option_text || "",
                  };

                  if (backendQuestion.question_type === "Ma trận (chọn điểm)") {
                    frontendOption.isSubquestion = backendOption.is_subquestion || false;
                  }

                  if (backendOption.image) {
                    frontendOption.image = backendOption.image;
                  }

                  return frontendOption;
                });

                const frontendQuestion = {
                  id: parseInt(backendQuestion.id),
                  text: backendQuestion.question_text || "",
                  helpText: backendQuestion.help_text || "",
                  type: backendQuestion.question_type || "Danh sách (nút chọn)",
                  options: convertedOptions.length > 0 ? convertedOptions : createDefaultOptions(backendQuestion.question_type || "Danh sách (nút chọn)"),
                };

                if (backendQuestion.max_length) {
                  frontendQuestion.maxLength = backendQuestion.max_length;
                }

                const questionId = String(frontendQuestion.id);
                newQuestionSettings[questionId] = buildQuestionSettings(backendQuestion, frontendQuestion);

                if (frontendQuestion.type === "Giới tính" || frontendQuestion.type === "Có/Không") {
                  const noAnswerOption = frontendQuestion.options.find(
                    (opt) => opt.text === "Không có câu trả lời"
                  );
                  if (noAnswerOption) {
                    newSelectedAnswers[frontendQuestion.id] = noAnswerOption.id;
                  }
                }

                return frontendQuestion;
              });

              const newQuestionGroups = [
                {
                  id: 1,
                  title: "Nhóm câu hỏi",
                  questions: convertedQuestions,
                },
              ];

              setQuestionGroups(newQuestionGroups);
              setQuestionSettings((prev) => ({ ...prev, ...newQuestionSettings }));
              setSelectedAnswers((prev) => ({ ...prev, ...newSelectedAnswers }));
            }
          } catch (error) {
            console.error('Lỗi khi reload survey:', error);
          }
        };

        reloadSurvey();
      }
    };

    // Cleanup khi unmount
    return () => {
      channel.close();
      broadcastChannelRef.current = null;
    };
  }, [surveyId, activeQuestionId, createDefaultOptions, buildQuestionSettings]);

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

  // ✅ Memoize centerWidth để tránh tính toán lại mỗi lần render
  const centerWidth = useMemo(
    () => openPanel === "settings" ? "900px" : "750px",
    [openPanel]
  );

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

  // ✅ Memoize handlers để tránh re-render không cần thiết
  // Thay đổi văn bản câu hỏi
  const handleQuestionTextChange = useCallback((id, newText) => {
    setQuestionGroups((prev) =>
      prev.map((group) => ({
        ...group,
        questions: group.questions.map((item) =>
          item.id === id ? { ...item, text: newText } : item
        ),
      }))
    );
  }, []);

  // Thay đổi văn bản option
  const handleOptionChange = useCallback((questionId, optionId, newText) => {
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
  }, []);

  // Thay đổi ảnh cho từng option
  const handleOptionImageChange = useCallback((questionId, optionId, imageDataUrl) => {
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
  }, []);

  // Thêm option mới
  const handleAddOption = (questionId, isSubquestion = false) => {
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
              isSubquestion: isSubquestion, // Thêm thuộc tính isSubquestion cho Ma trận
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


  // ✅ Helper function để convert frontend question sang backend format
  const convertQuestionToBackend = useCallback((frontendQuestion, questionSettingsData, surveyIdParam) => {
    // ✅ Đảm bảo question_text không rỗng (backend yêu cầu String!)
    const questionText = frontendQuestion.text?.trim() || "Câu hỏi mới";
    
    return {
      survey_id: String(surveyIdParam), // Đảm bảo là string
      question_code: questionSettingsData?.questionCode || undefined,
      question_text: questionText, // Backend yêu cầu String! (không null)
      image: questionSettingsData?.image || null,
      question_type: frontendQuestion.type || "Danh sách (nút chọn)",
      required: questionSettingsData?.required || "soft",
      conditions: questionSettingsData?.conditions || null,
      default_scenario: questionSettingsData?.defaultScenario || 1,
      max_length: frontendQuestion.maxLength || questionSettingsData?.maxLength || null,
      numeric_only: questionSettingsData?.numericOnly || false,
      max_questions: questionSettingsData?.maxQuestions || null,
      allowed_file_types: questionSettingsData?.allowedFileTypes || null,
      max_file_size_kb: questionSettingsData?.maxFileSizeKB || null,
      help_text: frontendQuestion.helpText || null,
      points: questionSettingsData?.points || 0,
    };
  }, []);

  // ✅ Thêm câu hỏi mới vào group cuối cùng và lưu lên CSDL
  const addQuestionItem = async (questionType = "Mặc định", groupId = null) => {
    // ✅ Kiểm tra đã có surveyId chưa (survey phải được tạo trước bởi người khác)
    const surveyIdToUse = currentSurveyId || surveyId;
    
    if (!surveyIdToUse) {
      toast.error("Vui lòng chọn survey để chỉnh sửa");
      return;
    }

    // ✅ Tạo question mới TRƯỚC khi gọi setState (sử dụng functional update để đảm bảo có state mới nhất)
    let newItem = null;
    let newId = null;
    
    // ✅ Sử dụng functional update và tạo newItem trong callback
    setQuestionGroups((prev) => {
      // Tạo group mới nếu chưa có
      if (prev.length === 0) {
        const defaultOptions = createDefaultOptions(questionType);
        newId = Date.now(); // Temporary ID
        newItem = {
          id: newId,
          text: "",
          helpText: "",
          type: questionType,
          options: defaultOptions,
          maxLength: questionType === "Văn bản dài" ? 2500 : questionType === "Văn bản ngắn" ? 256 : undefined,
        };
        return [
          {
            id: 1,
            title: "Nhóm câu hỏi",
            questions: [newItem],
          },
        ];
      }

      const targetGroup = groupId
        ? prev.find((g) => g.id === groupId)
        : prev[prev.length - 1];

      if (!targetGroup) {
        // Vẫn tạo newItem để có thể lưu
        const defaultOptions = createDefaultOptions(questionType);
        const maxId = Math.max(
          ...prev.flatMap((g) => g.questions.map((q) => q.id || 0)),
          0
        );
        newId = maxId + 1;
        newItem = {
          id: newId,
          text: "",
          helpText: "",
          type: questionType,
          options: defaultOptions,
          maxLength: questionType === "Văn bản dài" ? 2500 : questionType === "Văn bản ngắn" ? 256 : undefined,
        };
        // Thêm vào group đầu tiên nếu không tìm thấy targetGroup
        return prev.map((group, index) =>
          index === 0
            ? { ...group, questions: [...group.questions, newItem] }
            : group
        );
      }

      const maxId = Math.max(
        ...prev.flatMap((g) => g.questions.map((q) => q.id || 0)),
        0
      );
      newId = maxId + 1;

      const defaultOptions = createDefaultOptions(questionType);
      newItem = {
        id: newId,
        text: "",
        helpText: "",
        type: questionType,
        options: defaultOptions,
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

    // ✅ Đợi một chút để đảm bảo newItem được set (do closure trong callback)
    await new Promise(resolve => setTimeout(resolve, 10));

    // ✅ Kiểm tra newItem đã được set chưa
    if (!newItem) {
      toast.error("Không thể tạo câu hỏi mới");
      return;
    }

    // ✅ Lưu question lên CSDL
    if (newItem && surveyIdToUse) {
      try {
        // Tạo default questionSettings
        const defaultQuestionSettings = {
          questionCode: `Q${String(newId).padStart(3, "0")}`,
          type: questionType,
          required: "soft",
          image: null,
          conditions: [],
          defaultScenario: 1,
          points: 0,
        };

        // Thêm settings đặc biệt cho từng loại câu hỏi
        if (questionType === "Tải lên tệp") {
          defaultQuestionSettings.maxQuestions = 1;
          defaultQuestionSettings.allowedFileTypes = "png, gif, doc, odt, jpg, jpeg, pdf";
          defaultQuestionSettings.maxFileSizeKB = 10241;
        }

        if (questionType === "Văn bản ngắn" || questionType === "Văn bản dài" || questionType === "Nhiều văn bản ngắn") {
          defaultQuestionSettings.maxLength = questionType === "Văn bản dài" ? 2500 : 256;
          defaultQuestionSettings.numericOnly = false;
        }

        const questionSettingsData = questionSettings[newId] || defaultQuestionSettings;

        // Lưu questionSettings vào state
        setQuestionSettings((prev) => ({
          ...prev,
          [newId]: questionSettingsData,
        }));

        // Convert sang backend format
        const backendQuestionData = convertQuestionToBackend(newItem, questionSettingsData, surveyIdToUse);

        // ✅ Gọi API để lưu lên CSDL
        const savedQuestion = await addQuestion(backendQuestionData);

        // Cập nhật ID từ CSDL về frontend
        setQuestionGroups((prev) =>
          prev.map((group) => ({
            ...group,
            questions: group.questions.map((q) =>
              q.id === newId ? { ...q, id: parseInt(savedQuestion.id) } : q
            ),
          }))
        );

        // Cập nhật questionSettings với ID mới từ CSDL
        setQuestionSettings((prev) => {
          const newSettings = { ...prev };
          const oldSettings = newSettings[newId] || questionSettingsData;
          if (newSettings[newId]) {
            delete newSettings[newId];
          }
          newSettings[savedQuestion.id] = { ...oldSettings };
          return newSettings;
        });

        // Cập nhật activeSection với ID mới
        setActiveSection(`question-${savedQuestion.id}`);
        setActiveQuestionId(String(savedQuestion.id));

        } catch {
          // Lỗi đã được xử lý, không cần hiển thị toast
        }
    }
  };

  const handleSelectQuestionType = async (questionType) => {
    handleToggleModal();
    const groupId = window.__currentGroupId || null;
    await addQuestionItem(questionType, groupId);
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
  };

  const deleteGroup = (groupId) => {
    setDeleteModal({
      isOpen: true,
      action: async () => {
        // ✅ Tối ưu: Tìm group và lấy question IDs một lần
        const groupToDelete = questionGroups.find((g) => g.id === groupId);
        if (!groupToDelete) {
          toast.error("Không tìm thấy nhóm câu hỏi cần xóa");
          return;
        }
        
        const questionIdsToDelete = groupToDelete.questions.map((q) => String(q.id));
        const shouldResetActive = activeQuestionId && questionIdsToDelete.includes(activeQuestionId);
        const questionIdsSet = new Set(questionIdsToDelete);

        // ✅ Đóng modal ngay để UI responsive hơn
        setDeleteModal((prev) => ({ ...prev, isOpen: false }));

        // ✅ Lưu snapshot state để rollback nếu lỗi
        const stateSnapshot = {
          questionGroups: [...questionGroups],
          questionSettings: { ...questionSettings },
          selectedAnswers: { ...selectedAnswers },
          activeSection,
          activeQuestionId,
          rightPanel,
        };

        // ✅ OPTIMISTIC UPDATE: Update UI ngay lập tức với startTransition (không block UI)
        startTransition(() => {
          setQuestionGroups((prev) => prev.filter((g) => g.id !== groupId));
          
          setQuestionSettings((prev) => {
            const newSettings = { ...prev };
            questionIdsSet.forEach((qId) => delete newSettings[qId]);
            return newSettings;
          });

          setSelectedAnswers((prev) => {
            const newAnswers = { ...prev };
            questionIdsSet.forEach((qId) => delete newAnswers[qId]);
            return newAnswers;
          });

          if (shouldResetActive) {
            setActiveSection(null);
            setActiveQuestionId(null);
            setRightPanel(null);
          }
        });

        // Gọi API ở background (không block UI) - không cần await
        deleteQuestions(questionIdsToDelete)
          .then(() => {
            // ✅ Gửi message qua BroadcastChannel để đồng bộ với các tab khác
            if (broadcastChannelRef.current) {
              broadcastChannelRef.current.postMessage({
                type: 'GROUP_DELETED',
                data: {
                  groupId,
                  questionIds: questionIdsToDelete,
                },
              });
            }
          })
          .catch(() => {
            // Rollback state nếu lỗi
            setQuestionGroups(stateSnapshot.questionGroups);
            setQuestionSettings(stateSnapshot.questionSettings);
            setSelectedAnswers(stateSnapshot.selectedAnswers);
            setActiveSection(stateSnapshot.activeSection);
            setActiveQuestionId(stateSnapshot.activeQuestionId);
            setRightPanel(stateSnapshot.rightPanel);
          });
      },
      title: "Xác nhận xoá",
      message: "Bạn có chắc muốn xoá nhóm câu hỏi này? Tất cả câu hỏi bên trong cũng sẽ bị xóa, bạn không thể hoàn tác lựa chọn này.",
    });
  };

  const deleteQuestionItem = (groupId, index) => {
    setDeleteModal({
      isOpen: true,
      action: async () => {
        // ✅ Tối ưu: Tìm group và question một lần
        const group = questionGroups.find((g) => g.id === groupId);
        if (!group || index < 0 || index >= group.questions.length) {
          toast.error("Không tìm thấy câu hỏi cần xóa");
          return;
        }
        
        const questionToDelete = group.questions[index];
        const questionIdToDelete = String(questionToDelete.id);
        const isActiveQuestion = activeQuestionId === questionIdToDelete;
        const newQuestions = group.questions.filter((_, i) => i !== index);
        const hasNextQuestion = newQuestions.length > 0;
        const nextQuestion = hasNextQuestion ? newQuestions[Math.min(index, newQuestions.length - 1)] : null;

        // ✅ Đóng modal ngay để UI responsive hơn
        setDeleteModal((prev) => ({ ...prev, isOpen: false }));

        // ✅ Lưu snapshot state để rollback nếu lỗi
        const stateSnapshot = {
          questionGroups: questionGroups.map((g) => ({
            ...g,
            questions: [...g.questions],
          })),
          questionSettings: { ...questionSettings },
          selectedAnswers: { ...selectedAnswers },
          activeSection,
          activeQuestionId,
          rightPanel,
        };

        // ✅ OPTIMISTIC UPDATE: Update UI ngay lập tức với startTransition (không block UI)
        startTransition(() => {
          setQuestionGroups((prev) =>
            prev.map((g) =>
              g.id === groupId ? { ...g, questions: newQuestions } : g
            )
          );

          setQuestionSettings((prev) => {
            const newSettings = { ...prev };
            delete newSettings[questionIdToDelete];
            return newSettings;
          });

          setSelectedAnswers((prev) => {
            const newAnswers = { ...prev };
            delete newAnswers[questionIdToDelete];
            return newAnswers;
          });

          // Cập nhật active section
          if (isActiveQuestion) {
            if (hasNextQuestion) {
              setActiveSection(`question-${nextQuestion.id}`);
              setActiveQuestionId(String(nextQuestion.id));
            } else {
              setActiveSection(null);
              setActiveQuestionId(null);
              setRightPanel(null);
            }
          }
        });

        // Gọi API ở background (không block UI) - không cần await
        deleteQuestion(questionIdToDelete)
          .then(() => {
            // ✅ Gửi message qua BroadcastChannel để đồng bộ với các tab khác
            if (broadcastChannelRef.current) {
              broadcastChannelRef.current.postMessage({
                type: 'QUESTION_DELETED',
                data: {
                  questionIds: [questionIdToDelete],
                },
              });
            }
          })
          .catch(() => {
            // Rollback state nếu lỗi
            setQuestionGroups(stateSnapshot.questionGroups);
            setQuestionSettings(stateSnapshot.questionSettings);
            setSelectedAnswers(stateSnapshot.selectedAnswers);
            setActiveSection(stateSnapshot.activeSection);
            setActiveQuestionId(stateSnapshot.activeQuestionId);
            setRightPanel(stateSnapshot.rightPanel);
          });
      },
      title: "Xác nhận xoá",
      message: "Bạn có chắc muốn xoá câu hỏi này? Bạn không thể hoàn tác lựa chọn này.",
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải survey...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 font-sans overflow-visible pt-[60px]">
        <HeaderBar
          title={generalSettings?.title || "Survey mới"}
          savedAt={savedAt}
          onActivate={() => toast.success("Đã kích hoạt")}
          onMore={() => setOpenPanel(openPanel === "settings" ? null : "settings")}
          onAddQuestion={() => {
            handleToggleModal();
            window.__currentGroupId = null;
          }}
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
