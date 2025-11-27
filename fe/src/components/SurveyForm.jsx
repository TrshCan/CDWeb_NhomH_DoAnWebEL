import React, { useState, useEffect, useRef, useMemo, useCallback, startTransition } from "react";
import { useParams, useNavigate } from "react-router-dom";
import WelcomeSection from "./WelcomeSection";
import QuestionSection from "./QuestionSection";
import AddSection from "./AddSection";
import EndSection from "./EndSection";
import QuestionTypeModal from "./QuestionTypeModal";

import SidebarRail from "./SidebarRail";
import StructurePanel from "./StructurePanel";
import SettingsPanel from "./SettingsPanel";
import ShareSidePanel from "./ShareSidePanel";
import GeneralSettingsForm from "./GeneralSettingsForm";
import PublishAccessForm from "./PublishAccessForm";
import SharePanel from "./SharePanel";
import LogPanel from "./LogPanel";

import WelcomeSettingsPanel from "./WelcomeSettingsPanel";
import QuestionSettingsPanel from "./QuestionSettingsPanel";
import HeaderBar from "./HeaderBar";
import DeleteConfirmModal from "./DeleteConfirmModal";

import { Toaster, toast } from "react-hot-toast";
import { addQuestion, deleteQuestion, deleteQuestions, updateQuestion, updateOption, addOption, deleteOption, duplicateQuestion } from "../api/questions";
import { createQuestionGroup, updateQuestionGroup, deleteQuestionGroup, duplicateQuestionGroup } from "../api/groups";
import { toEnglishType, toVietnameseType } from "../utils/questionTypeMapping";

export default function SurveyForm({ surveyId: propSurveyId = null }) {
  const { surveyId: urlSurveyId } = useParams();
  const navigate = useNavigate();
  const surveyId = urlSurveyId || propSurveyId;
  
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

  // panel trái: null | 'structure' | 'settings' | 'share' | 'logs'
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
      questionCode: backendQuestion.question_code || "", // Backend sẽ tự tạo
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
    welcomeTitle: "",
    welcomeDescription: "",
    endTitle: "",
    endDescription: "",
  });

  // ✅ State để lưu surveyId thực tế từ CSDL
  const [currentSurveyId, setCurrentSurveyId] = useState(surveyId);

  // ✅ Ref để track surveyId đã load (tránh hiển thị toast 2 lần)
  const loadedSurveyIdRef = useRef(null);
  const isLoadingRef = useRef(false);

  // ✅ BroadcastChannel để đồng bộ giữa các tab/cửa sổ
  const broadcastChannelRef = useRef(null);

  // ✅ Track pending operations để hiển thị loading
  const [pendingOperations, setPendingOperations] = useState(0);

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
          welcomeTitle: surveyData.welcome_title || "",
          welcomeDescription: surveyData.welcome_description || "",
          endTitle: surveyData.end_title || "",
          endDescription: surveyData.end_description || "",
        });

        // Cập nhật publish settings nếu có
        if (surveyData.start_at || surveyData.end_at) {
          setPublishSettings({
            start_at: surveyData.start_at || "",
            end_at: surveyData.end_at || "",
          });
        }

        // ✅ Load questionGroups và questions từ CSDL
        const newQuestionSettings = {};
        const newSelectedAnswers = {};
        let newQuestionGroups = [];

        // Helper function để convert question từ backend sang frontend
        const convertBackendQuestion = (backendQuestion) => {
            // ✅ Convert English type from backend to Vietnamese for display
            const vietnameseType = toVietnameseType(backendQuestion.question_type || "single_choice");

            // Convert options từ backend format sang frontend format
            const convertedOptions = (backendQuestion.options || []).map((backendOption) => {
              // Đảm bảo ID luôn là số nguyên từ CSDL
              const optionId = backendOption.id ? parseInt(backendOption.id, 10) : null;
              const frontendOption = {
                id: (!isNaN(optionId) && optionId > 0) ? optionId : Date.now() + Math.random(),
                text: backendOption.option_text || "",
              };

              // Xử lý cho Ma trận (chọn điểm) - có is_subquestion
              if (vietnameseType === "Ma trận (chọn điểm)") {
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
              type: vietnameseType, // ✅ Use Vietnamese type for display
              options: convertedOptions.length > 0 ? convertedOptions : createDefaultOptions(vietnameseType),
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
        };

        // ✅ Xử lý questionGroups từ backend
        if (surveyData.questionGroups && surveyData.questionGroups.length > 0) {
          // Có groups từ backend → dùng chúng
          newQuestionGroups = surveyData.questionGroups.map((backendGroup) => ({
            id: parseInt(backendGroup.id),
            title: backendGroup.title || "Nhóm câu hỏi",
            questions: (backendGroup.questions || []).map(convertBackendQuestion),
          }));

          // ✅ Kiểm tra xem có câu hỏi nào không có group_id không (orphan questions)
          const allGroupQuestionIds = new Set(
            newQuestionGroups.flatMap(g => g.questions.map(q => q.id))
          );
          const orphanQuestions = (surveyData.questions || [])
            .filter(q => !allGroupQuestionIds.has(parseInt(q.id)))
            .map(convertBackendQuestion);

          // Nếu có orphan questions, gán chúng vào group đầu tiên
          if (orphanQuestions.length > 0 && newQuestionGroups.length > 0) {
            const firstGroupId = newQuestionGroups[0].id;
            
            // Cập nhật group_id cho orphan questions trong CSDL
            const updatePromises = orphanQuestions
              .filter((q) => {
                const numId = Number(q.id);
                return numId > 0 && numId < 1000000000000 && Number.isInteger(numId);
              })
              .map((q) =>
                updateQuestion(q.id, { group_id: String(firstGroupId) }).catch(() => null)
              );
            await Promise.all(updatePromises);

            // Thêm orphan questions vào group đầu tiên
            newQuestionGroups[0].questions = [
              ...newQuestionGroups[0].questions,
              ...orphanQuestions,
            ];
          }
        } else if (surveyData.questions && surveyData.questions.length > 0) {
          // Không có groups nhưng có questions → tạo group mặc định
          const convertedQuestions = surveyData.questions.map(convertBackendQuestion);
          
          // Tạo group mặc định trong CSDL
          try {
            const defaultGroup = await createQuestionGroup({
              survey_id: String(surveyId),
              title: "Nhóm câu hỏi",
              position: 1,
            });
            
            // Cập nhật group_id cho tất cả questions
            const updatePromises = convertedQuestions
              .filter((q) => {
                const numId = Number(q.id);
                return numId > 0 && numId < 1000000000000 && Number.isInteger(numId);
              })
              .map((q) =>
                updateQuestion(q.id, { group_id: String(defaultGroup.id), position: convertedQuestions.indexOf(q) + 1 })
              );
            await Promise.all(updatePromises);
            
            newQuestionGroups = [{
              id: parseInt(defaultGroup.id),
              title: defaultGroup.title,
              questions: convertedQuestions,
            }];
          } catch (error) {
            console.error('Không thể tạo group mặc định:', error);
            // Nếu không tạo được group, để rỗng và hiển thị lỗi
            toast.error('Không thể tạo nhóm câu hỏi mặc định');
            newQuestionGroups = [];
          }
        } else {
          // Không có gì → khởi tạo rỗng
          newQuestionGroups = [];
        }

        // Cập nhật tất cả states trong 1 batch
        setQuestionGroups(newQuestionGroups);
        setQuestionSettings((prev) => ({ ...prev, ...newQuestionSettings }));
        setSelectedAnswers((prev) => ({ ...prev, ...newSelectedAnswers }));

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
      console.log('[BroadcastChannel] Received:', type, data);

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
      
      // Xử lý khi có group title được cập nhật từ tab khác
      if (type === 'GROUP_TITLE_UPDATED') {
        const { groupId, title } = data;
        setQuestionGroups((prev) =>
          prev.map((g) =>
            g.id === groupId ? { ...g, title } : g
          )
        );
      }

      // Xử lý khi có field của câu hỏi được cập nhật từ tab khác (tối ưu - chỉ cập nhật field cụ thể)
      if (type === 'QUESTION_FIELD_UPDATED') {
        const { questionId, fieldName, value } = data;
        const questionIdStr = String(questionId);

        // Cập nhật chỉ field cụ thể (tối ưu - không reload toàn bộ)
        setQuestionGroups((prev) => {
          // Tạo array mới hoàn toàn để force React re-render
          return prev.map((group) => {
            // Kiểm tra xem group có chứa question cần update không
            const hasTargetQuestion = group.questions.some((q) => String(q.id) === questionIdStr);
            if (!hasTargetQuestion) return group;

            // Tạo group mới với questions array mới
            return {
              ...group,
              questions: group.questions.map((q) => {
                if (String(q.id) !== questionIdStr) return q;
                
                // Tạo object mới hoàn toàn với tất cả properties
                const updatedQuestion = {
                  ...q,
                  // Cập nhật field tương ứng
                  ...(fieldName === 'question_text' && { text: value }),
                  ...(fieldName === 'help_text' && { helpText: value }),
                  ...(fieldName === 'max_length' && { maxLength: value }),
                };
                
                return updatedQuestion;
              }),
            };
          });
        });

        // Cập nhật questionSettings nếu cần
        if (fieldName !== 'question_text' && fieldName !== 'help_text' && fieldName !== 'max_length') {
          setQuestionSettings((prev) => {
            const questionSettings = prev[questionIdStr];
            if (questionSettings) {
              return {
                ...prev,
                [questionIdStr]: {
                  ...questionSettings,
                  [fieldName]: value,
                },
              };
            }
            return prev;
          });
        }
      }

      // Xử lý khi có field của option được cập nhật từ tab khác (tối ưu - chỉ cập nhật field cụ thể)
      if (type === 'OPTION_FIELD_UPDATED') {
        const { optionId, fieldName, value } = data;
        const optionIdStr = String(optionId);

        // Cập nhật chỉ field cụ thể của option (tối ưu - không reload toàn bộ)
        setQuestionGroups((prev) =>
          prev.map((group) => ({
            ...group,
            questions: group.questions.map((q) => {
              const optionIndex = q.options?.findIndex((opt) => String(opt.id) === optionIdStr);
              if (optionIndex === -1 || optionIndex === undefined) return q;

              const updatedOptions = [...q.options];
              if (fieldName === 'option_text') {
                updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], text: value };
              } else if (fieldName === 'image') {
                updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], image: value };
              }
              // Có thể thêm các field khác nếu cần

              return {
                ...q,
                options: updatedOptions,
              };
            }),
          }))
        );
      }

      // Xử lý khi có option bị xóa từ tab khác
      if (type === 'OPTION_DELETED') {
        const { questionId, optionId } = data;
        const questionIdStr = String(questionId);
        const deletedOptionIdStr = String(optionId);

        // Xóa option khỏi question tương ứng
        setQuestionGroups((prev) =>
          prev.map((group) => ({
            ...group,
            questions: group.questions.map((q) => {
              if (String(q.id) !== questionIdStr) return q;

              return {
                ...q,
                options: (q.options || []).filter((opt) => String(opt.id) !== deletedOptionIdStr),
              };
            }),
          }))
        );
      }
      
      // Xử lý khi có option mới được thêm từ tab khác
      if (type === 'OPTION_ADDED') {
        const { questionId, option } = data;
        const questionIdStr = String(questionId);

        // Thêm option vào question tương ứng
        setQuestionGroups((prev) =>
          prev.map((group) => ({
            ...group,
            questions: group.questions.map((q) => {
              if (String(q.id) !== questionIdStr) return q;

              // Kiểm tra xem option đã tồn tại chưa (tránh duplicate)
              const optionExists = q.options?.some((opt) => String(opt.id) === String(option.id));
              if (optionExists) return q;

              return {
                ...q,
                options: [...(q.options || []), option],
              };
            }),
          }))
        );
      }

      // ✅ Xử lý khi có thứ tự options được thay đổi từ tab khác
      if (type === 'OPTIONS_REORDERED') {
        const { questionId, options } = data;
        const questionIdStr = String(questionId);

        // Cập nhật thứ tự options cho question tương ứng
        setQuestionGroups((prev) =>
          prev.map((group) => ({
            ...group,
            questions: group.questions.map((q) => {
              if (String(q.id) !== questionIdStr) return q;

              return {
                ...q,
                options: options,
              };
            }),
          }))
        );
      }

      // Xử lý khi có câu hỏi mới được thêm từ tab khác
      if (type === 'QUESTION_ADDED' || type === 'GROUP_ADDED') {
        // Reload survey để lấy dữ liệu mới nhất
        const reloadSurvey = async () => {
          try {
            console.log('[BroadcastChannel] Reloading survey...');
            const { getSurvey } = await import('../api/surveys');
            const surveyData = await getSurvey(surveyId);

            const newQuestionSettings = {};
            const newSelectedAnswers = {};

            // Helper function để convert backend question sang frontend format
            const convertBackendQuestion = (backendQuestion) => {
              // ✅ Convert English type from backend to Vietnamese for display
              const vietnameseType = toVietnameseType(backendQuestion.question_type || "single_choice");

              const convertedOptions = (backendQuestion.options || []).map((backendOption) => {
                const optionId = backendOption.id ? parseInt(backendOption.id, 10) : null;
                const frontendOption = {
                  id: (!isNaN(optionId) && optionId > 0) ? optionId : Date.now() + Math.random(),
                  text: backendOption.option_text || "",
                };

                if (vietnameseType === "Ma trận (chọn điểm)") {
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
                type: vietnameseType, // ✅ Use Vietnamese type for display
                options: convertedOptions.length > 0 ? convertedOptions : createDefaultOptions(vietnameseType),
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
            };

            // Xây dựng cấu trúc groups từ backend data
            let newQuestionGroups = [];

            if (surveyData.questionGroups && surveyData.questionGroups.length > 0) {
              // Có groups → map từng group
              newQuestionGroups = surveyData.questionGroups.map((backendGroup) => {
                const groupQuestions = (backendGroup.questions || []).map(convertBackendQuestion);
                console.log(`[BroadcastChannel] Group ${backendGroup.id} has ${groupQuestions.length} questions`);
                return {
                  id: parseInt(backendGroup.id),
                  title: backendGroup.title || "Nhóm câu hỏi",
                  questions: groupQuestions,
                };
              });
            } else if (surveyData.questions && surveyData.questions.length > 0) {
              // Không có groups nhưng có questions → tạo group mặc định
              const convertedQuestions = surveyData.questions.map(convertBackendQuestion);
              newQuestionGroups = [{
                id: 1,
                title: "Nhóm câu hỏi",
                questions: convertedQuestions,
              }];
            }

            // Force update bằng cách tạo array mới hoàn toàn
            setQuestionGroups([...newQuestionGroups]);
            setQuestionSettings((prev) => ({ ...prev, ...newQuestionSettings }));
            setSelectedAnswers((prev) => ({ ...prev, ...newSelectedAnswers }));
            console.log('[BroadcastChannel] Survey reloaded successfully, groups:', newQuestionGroups.length);
          } catch (error) {
            console.error('[BroadcastChannel] Error reloading survey:', error);
          }
        };

        reloadSurvey();
      }
      
      // Xử lý khi có general settings được cập nhật từ tab khác
      if (type === 'GENERAL_SETTINGS_UPDATED') {
        const { title, type: surveyType, object } = data;
        setGeneralSettings((prev) => ({ 
          ...prev, 
          title: title || prev.title,
          type: surveyType || prev.type,
          object: object || prev.object,
        }));
      }
      
      // Xử lý khi có publish settings được cập nhật từ tab khác
      if (type === 'PUBLISH_SETTINGS_UPDATED') {
        const { start_at, end_at } = data;
        setPublishSettings((prev) => ({ 
          ...prev, 
          start_at: start_at !== undefined ? start_at : prev.start_at,
          end_at: end_at !== undefined ? end_at : prev.end_at,
        }));
      }
      
      // Xử lý khi có welcome text được cập nhật từ tab khác
      if (type === 'WELCOME_UPDATED') {
        const { field, value } = data;
        setGeneralSettings((prev) => ({ ...prev, [field]: value }));
      }
      
      // Xử lý khi có end text được cập nhật từ tab khác
      if (type === 'END_UPDATED') {
        const { field, value } = data;
        setGeneralSettings((prev) => ({ ...prev, [field]: value }));
      }
      
      // Xử lý khi có loại câu hỏi được thay đổi từ tab khác
      if (type === 'QUESTION_TYPE_CHANGED') {
        const { questionId, newType, newOptions } = data;
        const questionIdStr = String(questionId);

        // Cập nhật type và options của câu hỏi
        setQuestionGroups((prev) =>
          prev.map((group) => ({
            ...group,
            questions: group.questions.map((q) => {
              if (String(q.id) !== questionIdStr) return q;

              return {
                ...q,
                type: newType,
                options: newOptions,
              };
            }),
          }))
        );

        // Cập nhật questionSettings
        setQuestionSettings((prev) => {
          const questionSettings = prev[questionIdStr];
          if (questionSettings) {
            return {
              ...prev,
              [questionIdStr]: {
                ...questionSettings,
                type: newType,
              },
            };
          }
          return prev;
        });

        // Đặt mặc định chọn "Không có câu trả lời" cho loại Giới tính và Có/Không
        if (newType === "Giới tính" || newType === "Có/Không") {
          const noAnswerOption = newOptions.find(
            (opt) => opt.text === "Không có câu trả lời"
          );
          if (noAnswerOption) {
            setSelectedAnswers((prev) => ({
              ...prev,
              [questionIdStr]: noAnswerOption.id,
            }));
          }
        }
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
  const handleGeneralChange = async (v) => {
    setGeneralSettings(v);
    
    // Gọi API cập nhật survey
    if (surveyId) {
      try {
        const { updateSurvey } = await import('../api/surveys');
        await updateSurvey(surveyId, {
          title: v.title,
          type: v.type,
          object: v.object,
        });
        setSavedAt(new Date());
        
        // Broadcast để đồng bộ với các tab khác
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            type: 'GENERAL_SETTINGS_UPDATED',
            data: { title: v.title, type: v.type, object: v.object },
          });
        }
      } catch (error) {
        console.error('Error updating survey:', error);
        toast.error('Không thể lưu thay đổi');
      }
    }
  };
  
  const handlePublishChange = async (v) => {
    setPublishSettings(v);
    
    // Gọi API cập nhật survey
    if (surveyId) {
      try {
        const { updateSurvey } = await import('../api/surveys');
        await updateSurvey(surveyId, {
          start_at: v.start_at,
          end_at: v.end_at,
        });
        setSavedAt(new Date());
        
        // Broadcast để đồng bộ với các tab khác
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            type: 'PUBLISH_SETTINGS_UPDATED',
            data: { start_at: v.start_at, end_at: v.end_at },
          });
        }
      } catch (error) {
        console.error('Error updating survey:', error);
        toast.error('Không thể lưu thay đổi');
      }
    }
  };

  // ✅ Handlers cho Welcome text
  const handleWelcomeTitleChange = useCallback((newText) => {
    setGeneralSettings((prev) => ({ ...prev, welcomeTitle: newText }));
  }, []);

  const handleWelcomeDescriptionChange = useCallback((newText) => {
    setGeneralSettings((prev) => ({ ...prev, welcomeDescription: newText }));
  }, []);

  const handleWelcomeTitleBlur = useCallback(async (newText) => {
    if (!currentSurveyId) return;
    try {
      const { updateSurvey } = await import('../api/surveys');
      await updateSurvey(currentSurveyId, { welcome_title: newText || "" });
      setSavedAt(new Date());
      
      // Broadcast
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'WELCOME_UPDATED',
          data: { field: 'welcomeTitle', value: newText || "" },
        });
      }
    } catch (error) {
      console.error('Lỗi khi lưu welcome title:', error);
    }
  }, [currentSurveyId]);

  const handleWelcomeDescriptionBlur = useCallback(async (newText) => {
    if (!currentSurveyId) return;
    try {
      const { updateSurvey } = await import('../api/surveys');
      await updateSurvey(currentSurveyId, { welcome_description: newText || "" });
      setSavedAt(new Date());
      
      // Broadcast
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'WELCOME_UPDATED',
          data: { field: 'welcomeDescription', value: newText || "" },
        });
      }
    } catch (error) {
      console.error('Lỗi khi lưu welcome description:', error);
    }
  }, [currentSurveyId]);

  // ✅ Handlers cho End text
  const handleEndTitleChange = useCallback((newText) => {
    setGeneralSettings((prev) => ({ ...prev, endTitle: newText }));
  }, []);

  const handleEndDescriptionChange = useCallback((newText) => {
    setGeneralSettings((prev) => ({ ...prev, endDescription: newText }));
  }, []);

  const handleEndTitleBlur = useCallback(async (newText) => {
    if (!currentSurveyId) return;
    try {
      const { updateSurvey } = await import('../api/surveys');
      await updateSurvey(currentSurveyId, { end_title: newText || "" });
      setSavedAt(new Date());
      
      // Broadcast
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'END_UPDATED',
          data: { field: 'endTitle', value: newText || "" },
        });
      }
    } catch (error) {
      console.error('Lỗi khi lưu end title:', error);
    }
  }, [currentSurveyId]);

  const handleEndDescriptionBlur = useCallback(async (newText) => {
    if (!currentSurveyId) return;
    try {
      const { updateSurvey } = await import('../api/surveys');
      await updateSurvey(currentSurveyId, { end_description: newText || "" });
      setSavedAt(new Date());
      
      // Broadcast
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'END_UPDATED',
          data: { field: 'endDescription', value: newText || "" },
        });
      }
    } catch (error) {
      console.error('Lỗi khi lưu end description:', error);
    }
  }, [currentSurveyId]);

  // ✅ Memoize centerWidth để tránh tính toán lại mỗi lần render
  const centerWidth = useMemo(() => {
    if (openPanel === "settings") return "900px";
    if (openPanel === "share" || openPanel === "logs") return "100%";
    return "750px";
  }, [openPanel]);

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
          // ✅ Trigger blur trên element đang focus để lưu dữ liệu trước khi bỏ chọn
          if (document.activeElement && document.activeElement.tagName !== 'BODY') {
            document.activeElement.blur();
          }
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

  // ✅ Helper function để lưu câu hỏi vào CSDL và đồng bộ với các tab
  const saveQuestionField = useCallback(async (questionId, fieldName, value, skipBroadcast = false) => {
    if (!questionId || !currentSurveyId) {
      return;
    }

    try {
      // Kiểm tra xem questionId có phải là ID thật từ database không
      // ID tạm thời: số âm hoặc số rất lớn (timestamp > 1000000000000)
      // ID thật: số nguyên dương nhỏ hơn 1000000000000
      const numId = Number(questionId);
      const isRealId = numId > 0 && numId < 1000000000000 && Number.isInteger(numId);
      
      if (!isRealId) {
        console.warn('Skipping update for temporary question ID:', questionId);
        return;
      }

      // Cập nhật state ngay lập tức (optimistic update)
      const updateData = { [fieldName]: value };
      await updateQuestion(questionId, updateData);

      // Gửi message qua BroadcastChannel để đồng bộ với các tab khác
      if (!skipBroadcast && broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'QUESTION_FIELD_UPDATED',
          data: {
            questionId: String(questionId),
            fieldName,
            value,
          },
        });
      }

      setSavedAt(new Date());
    } catch (error) {
      toast.error(`Không thể lưu ${fieldName}`);
    }
  }, [currentSurveyId]);

  // ✅ Helper function để lưu option vào CSDL và đồng bộ với các tab
  const saveOptionField = useCallback(async (optionId, fieldName, value, skipBroadcast = false) => {
    if (!optionId) {
      return;
    }

    // Chuyển optionId sang số nguyên
    const optionIdToUpdate = typeof optionId === 'string' ? parseInt(optionId, 10) : optionId;

    // Bỏ qua nếu là ID tạm (số âm) - đợi ID thật được cập nhật
    if (isNaN(optionIdToUpdate) || optionIdToUpdate < 0) {
      return;
    }

    if (optionIdToUpdate === 0) {
      return;
    }

    try {
      // Chuẩn bị dữ liệu cập nhật
      const updateData = { [fieldName]: value ?? "" };

      // Gọi API để cập nhật vào CSDL
      await updateOption(optionIdToUpdate, updateData);

      // Gửi message qua BroadcastChannel để đồng bộ với các tab khác
      if (!skipBroadcast && broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'OPTION_FIELD_UPDATED',
          data: {
            optionId: String(optionIdToUpdate),
            fieldName,
            value: value ?? "",
          },
        });
      }

      setSavedAt(new Date());
    } catch (error) {
      toast.error(`Không thể lưu ${fieldName}`);
    }
  }, []);

  // ✅ Memoize handlers để tránh re-render không cần thiết
  // Thay đổi văn bản câu hỏi (onChange - chỉ cập nhật UI)
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

  // ✅ Lưu văn bản câu hỏi khi onBlur
  const handleQuestionTextBlur = useCallback((id, newText) => {
    if (!id || !newText) return;
    saveQuestionField(id, 'question_text', newText);
  }, [saveQuestionField]);

  // ✅ Thay đổi helpText câu hỏi (onChange - chỉ cập nhật UI)
  const handleHelpTextChange = useCallback((id, newHelpText) => {
    setQuestionGroups((prev) =>
      prev.map((group) => ({
        ...group,
        questions: group.questions.map((item) =>
          item.id === id ? { ...item, helpText: newHelpText } : item
        ),
      }))
    );
  }, []);

  // ✅ Lưu helpText câu hỏi khi onBlur
  const handleHelpTextBlur = useCallback((id, newHelpText) => {
    if (!id) return;
    saveQuestionField(id, 'help_text', newHelpText || '');
  }, [saveQuestionField]);

  // Thay đổi văn bản option (onChange - chỉ cập nhật UI)
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

  // ✅ Lưu văn bản option khi onBlur
  const handleOptionBlur = useCallback((optionId, newText) => {
    if (!optionId) {
      return;
    }
    // Cho phép lưu cả text rỗng (newText có thể là "" hoặc undefined/null)
    // Chuyển undefined/null thành chuỗi rỗng
    const textToSave = newText ?? "";
    saveOptionField(optionId, 'option_text', textToSave);
  }, [saveOptionField]);

  // Thay đổi ảnh cho từng option (lưu ngay khi thay đổi)
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

    // Lưu vào CSDL ngay khi thay đổi ảnh
    if (optionId && imageDataUrl !== undefined) {
      saveOptionField(optionId, 'image', imageDataUrl);
    }
  }, [saveOptionField]);

  // ✅ Thêm option mới với optimistic update
  const handleAddOption = async (questionId, isSubquestion = false) => {
    // Tìm question để lấy thông tin
    const question = allQuestions.find((q) => q.id === questionId);
    if (!question) {
      toast.error("Không tìm thấy câu hỏi");
      return;
    }

    // Tính position mới (số options hiện tại + 1)
    const currentOptions = question.options || [];
    const newPosition = currentOptions.length + 1;

    // Tạo ID tạm để optimistic update (dùng số âm để phân biệt với ID thật)
    const tempId = -(Date.now());

    // 1. CẬP NHẬT UI NGAY LẬP TỨC (Optimistic Update) - Dùng startTransition để không block UI
    startTransition(() => {
      setQuestionGroups((prev) =>
        prev.map((group) => ({
          ...group,
          questions: group.questions.map((q) => {
            if (q.id === questionId) {
              return {
                ...q,
                options: [
                  ...q.options,
                  {
                    id: tempId,
                    text: "",
                    isSubquestion: isSubquestion,
                    image: null,
                    _pending: true, // Đánh dấu đang pending
                  }
                ],
              };
            }
            return q;
          }),
        }))
      );
    });

    // 2. LƯU VÀO CSDL NGẦM (Background)
    setPendingOperations(prev => prev + 1);
    try {
      const optionData = {
        question_id: String(questionId),
        option_text: "",
        is_subquestion: isSubquestion,
        position: newPosition,
      };

      const savedOption = await addOption(optionData);
      const realId = parseInt(savedOption.id);

      // 3. THAY THẾ ID TẠM BẰNG ID THẬT
      startTransition(() => {
        setQuestionGroups((prev) =>
          prev.map((group) => ({
            ...group,
            questions: group.questions.map((q) => {
              if (q.id === questionId) {
                return {
                  ...q,
                  options: q.options.map((opt) =>
                    opt.id === tempId
                      ? {
                        id: realId,
                        text: savedOption.option_text || "",
                        isSubquestion: savedOption.is_subquestion || false,
                        image: savedOption.image || null,
                      }
                      : opt
                  ),
                };
              }
              return q;
            }),
          }))
        );
      });

      setSavedAt(new Date());
      
      // Broadcast để đồng bộ với các tab khác
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'OPTION_ADDED',
          data: {
            questionId,
            option: {
              id: realId,
              text: savedOption.option_text || "",
              isSubquestion: savedOption.is_subquestion || false,
              image: savedOption.image || null,
            },
          },
        });
      }
    } catch (error) {
      toast.error("Không thể thêm option mới");

      // Rollback: Xóa option tạm
      startTransition(() => {
        setQuestionGroups((prev) =>
          prev.map((group) => ({
            ...group,
            questions: group.questions.map((q) => {
              if (q.id === questionId) {
                return {
                  ...q,
                  options: q.options.filter((opt) => opt.id !== tempId),
                };
              }
              return q;
            }),
          }))
        );
      });
    } finally {
      setPendingOperations(prev => prev - 1);
    }
  };

  // ✅ Xóa option và xóa trong CSDL
  const handleRemoveOption = async (questionId, optionId) => {
    // Lưu snapshot để rollback nếu lỗi
    const question = allQuestions.find((q) => q.id === questionId);
    const optionToDelete = question?.options?.find((opt) => opt.id === optionId);

    if (!optionToDelete) {
      toast.error("Không tìm thấy option cần xóa");
      return;
    }

    // Kiểm tra xem option có ID từ CSDL không
    // ID từ CSDL: số nguyên (integer) hoặc string có thể parse thành số nguyên
    // ID tạm thời: số thập phân (Date.now() + Math.random() tạo ra số thập phân)
    let isFromDB = false;
    let optionIdToDelete = null;

    if (optionId !== null && optionId !== undefined) {
      if (typeof optionId === 'number') {
        // Nếu là số nguyên thì là ID từ CSDL (ID từ CSDL luôn là số nguyên)
        if (Number.isInteger(optionId) && optionId > 0) {
          isFromDB = true;
          optionIdToDelete = optionId;
        }
        // Nếu là số thập phân thì là ID tạm thời, không xóa trong CSDL
      } else if (typeof optionId === 'string') {
        // Nếu string có thể parse thành số nguyên thì là ID từ CSDL
        const parsed = parseInt(optionId, 10);
        if (!isNaN(parsed) && String(parsed) === optionId && parsed > 0) {
          isFromDB = true;
          optionIdToDelete = parsed;
        }
      }
    }

    // Cập nhật UI ngay lập tức (optimistic update)
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

    // Xóa trong CSDL nếu option đã được lưu
    if (isFromDB && optionIdToDelete) {
      try {
        await deleteOption(optionIdToDelete);
        setSavedAt(new Date());

        // ✅ Gửi message qua BroadcastChannel để đồng bộ với các tab khác
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            type: 'OPTION_DELETED',
            data: {
              questionId: String(questionId),
              optionId: String(optionIdToDelete),
            },
          });
        }
      } catch {
        toast.error("Không thể xóa option");

        // Rollback: khôi phục option
        setQuestionGroups((prev) =>
          prev.map((group) => ({
            ...group,
            questions: group.questions.map((q) => {
              if (q.id === questionId) {
                const options = [...q.options];
                // Tìm vị trí để chèn lại (giữ nguyên thứ tự)
                const originalIndex = question.options.findIndex(
                  (opt) => opt.id === optionId
                );
                if (originalIndex >= 0) {
                  options.splice(originalIndex, 0, optionToDelete);
                } else {
                  options.push(optionToDelete);
                }
                return { ...q, options };
              }
              return q;
            }),
          }))
        );
      }
    } else {
      // Option tạm thời, chỉ xóa khỏi UI (không cần xóa trong CSDL)
      setSavedAt(new Date());
    }
  };

  // ✅ Di chuyển option lên/xuống và cập nhật position trong CSDL
  const handleMoveOption = async (questionId, fromIndex, toIndex) => {
    // Tìm question và lưu snapshot
    const question = allQuestions.find((q) => q.id === questionId);
    if (!question || !question.options) {
      return;
    }

    // Lưu snapshot để rollback nếu lỗi
    const originalOptions = [...question.options];

    // Cập nhật UI ngay lập tức (optimistic update)
    let movedOptions = [];
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
              movedOptions = newOptions;
              return { ...q, options: newOptions };
            }
            movedOptions = newOptions;
          }
          return q;
        }),
      }))
    );

    // Cập nhật position trong CSDL cho tất cả options
    if (movedOptions.length > 0) {
      try {
        // Cập nhật position cho tất cả options theo thứ tự mới
        const updatePromises = movedOptions.map((opt, index) => {
          // Chỉ cập nhật nếu option đã có ID từ CSDL (ID là số nguyên dương, không phải ID tạm âm)
          const optId = typeof opt.id === 'string' ? parseInt(opt.id, 10) : opt.id;
          if (optId && typeof optId === 'number' && optId > 0 && Number.isInteger(optId)) {
            return updateOption(optId, { position: index + 1 });
          }
          return Promise.resolve();
        });

        await Promise.all(updatePromises);
        setSavedAt(new Date());
        
        // ✅ Broadcast để đồng bộ thứ tự option với các tab khác
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            type: 'OPTIONS_REORDERED',
            data: {
              questionId: String(questionId),
              options: movedOptions.map((opt) => ({
                id: opt.id,
                text: opt.text,
                isSubquestion: opt.isSubquestion || false,
                image: opt.image || null,
              })),
            },
          });
        }
      } catch {
        toast.error("Không thể cập nhật thứ tự option");

        // Rollback: khôi phục thứ tự ban đầu
        setQuestionGroups((prev) =>
          prev.map((group) => ({
            ...group,
            questions: group.questions.map((q) => {
              if (q.id === questionId) {
                return { ...q, options: originalOptions };
              }
              return q;
            }),
          }))
        );
      }
    }
  };

  const handleOpenPanel = (panel) => {
    if (panel === "settings") {
      if (rightPanel) setPrevRightPanel(rightPanel);
      setRightPanel(null);
      setSettingsTab("general");
    }

    if (panel === "share" || panel === "logs") {
      if (rightPanel) setPrevRightPanel(rightPanel);
      setRightPanel(null);
    }

    if ((openPanel === "settings" || openPanel === "share" || openPanel === "logs") && 
        panel !== "settings" && panel !== "share" && panel !== "logs") {
      if (prevRightPanel) {
        setRightPanel(prevRightPanel);
        setPrevRightPanel(null);
      }
    }

    setOpenPanel(panel);
  };

  const handleSetSection = (sectionId) => {
    // ✅ Trigger blur trên element đang focus để lưu dữ liệu trước khi thay đổi section
    if (document.activeElement && document.activeElement.tagName !== 'BODY') {
      document.activeElement.blur();
    }
    
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
          questionCode: "", // Backend sẽ tự tạo
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
  const moveQuestionItem = async (groupId, index, direction) => {
    const group = questionGroups.find((g) => g.id === groupId);
    if (!group) return;

    const newQuestions = [...group.questions];
    const [removed] = newQuestions.splice(index, 1);
    
    let newIndex = index;
    if (direction === "up" && index > 0) {
      newIndex = index - 1;
      newQuestions.splice(newIndex, 0, removed);
    } else if (direction === "down" && index < group.questions.length - 1) {
      newIndex = index + 1;
      newQuestions.splice(newIndex, 0, removed);
    } else {
      return; // Không thể di chuyển
    }

    // 1. Optimistic update - cập nhật UI ngay lập tức
    setQuestionGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return { ...g, questions: newQuestions };
      })
    );
    setActiveSection(`question-${removed.id}`);

    // 2. Lưu vào CSDL - cập nhật position cho tất cả câu hỏi bị ảnh hưởng
    try {
      const updatePromises = newQuestions
        .filter((q) => {
          const numId = Number(q.id);
          return numId > 0 && numId < 1000000000000 && Number.isInteger(numId);
        }) // Chỉ update ID thật
        .map((q, idx) => updateQuestion(q.id, { position: idx + 1 }));
      await Promise.all(updatePromises);
    } catch (error) {
      // Rollback nếu lỗi
      setQuestionGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g;
          return { ...g, questions: group.questions };
        })
      );
      toast.error("Không thể di chuyển câu hỏi: " + (error.message || "Lỗi không xác định"));
      console.error("Error moving question:", error);
    }
  };


  // ✅ Helper function để convert frontend question sang backend format
  const convertQuestionToBackend = useCallback((frontendQuestion, questionSettingsData, surveyIdParam, groupIdParam = null) => {
    // ✅ Đảm bảo question_text không rỗng (backend yêu cầu String!)
    const questionText = frontendQuestion.text?.trim() || "Câu hỏi mới";

    // ✅ Convert Vietnamese type to English for database
    const questionType = toEnglishType(frontendQuestion.type || "Danh sách (nút chọn)");

    return {
      survey_id: String(surveyIdParam), // Đảm bảo là string
      group_id: groupIdParam ? String(groupIdParam) : null, // ✅ Thêm group_id
      question_code: questionSettingsData?.questionCode && questionSettingsData.questionCode.trim() !== "" 
        ? questionSettingsData.questionCode 
        : undefined, // Không gửi nếu rỗng, để backend tự tạo
      question_text: questionText, // Backend yêu cầu String! (không null)
      image: questionSettingsData?.image || null,
      question_type: questionType, // ✅ Use English type
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
        // ✅ Xác định groupId để lưu vào CSDL
        let targetGroupId = groupId;
        if (!targetGroupId && questionGroups.length > 0) {
          // Nếu không có groupId, lấy group cuối cùng
          targetGroupId = questionGroups[questionGroups.length - 1].id;
        }

        // Tạo default questionSettings
        const defaultQuestionSettings = {
          questionCode: "", // Backend sẽ tự tạo
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

        // Convert sang backend format với groupId
        const backendQuestionData = convertQuestionToBackend(newItem, questionSettingsData, surveyIdToUse, targetGroupId);

        // ✅ Gọi API để lưu lên CSDL
        const savedQuestion = await addQuestion(backendQuestionData);
        const savedQuestionId = parseInt(savedQuestion.id);

        // ✅ Lưu tất cả options mặc định vào CSDL (SONG SONG để nhanh hơn)
        const defaultOptions = newItem.options || [];
        const optionPromises = defaultOptions.map((option, i) => {
          const optionData = {
            question_id: String(savedQuestionId),
            option_text: option.text || "",
            is_subquestion: option.isSubquestion || false,
            position: i + 1,
          };
          return addOption(optionData).catch(() => null);
        });

        const savedOptionsResults = await Promise.all(optionPromises);
        const savedOptions = savedOptionsResults
          .filter(result => result !== null)
          .map((savedOption) => ({
            id: parseInt(savedOption.id),
            text: savedOption.option_text || "",
            isSubquestion: savedOption.is_subquestion || false,
            image: savedOption.image || null,
          }));

        // Cập nhật ID từ CSDL về frontend và cập nhật options đã lưu
        setQuestionGroups((prev) =>
          prev.map((group) => ({
            ...group,
            questions: group.questions.map((q) => {
              if (q.id === newId) {
                return {
                  ...q,
                  id: savedQuestionId,
                  options: savedOptions.length > 0 ? savedOptions : q.options,
                };
              }
              return q;
            }),
          }))
        );

        // Cập nhật questionSettings với ID mới từ CSDL và question_code từ backend
        setQuestionSettings((prev) => {
          const newSettings = { ...prev };
          const oldSettings = newSettings[newId] || questionSettingsData;
          if (newSettings[newId]) {
            delete newSettings[newId];
          }
          newSettings[savedQuestionId] = { 
            ...oldSettings,
            questionCode: savedQuestion.question_code || oldSettings.questionCode, // Cập nhật từ backend
          };
          return newSettings;
        });

        // Cập nhật selectedAnswers với ID mới nếu có
        if (questionType === "Giới tính" || questionType === "Có/Không") {
          const noAnswerOption = savedOptions.find(
            (opt) => opt.text === "Không có câu trả lời"
          );
          if (noAnswerOption) {
            setSelectedAnswers((prev) => {
              const newAnswers = { ...prev };
              if (newAnswers[newId]) {
                delete newAnswers[newId];
              }
              newAnswers[savedQuestionId] = noAnswerOption.id;
              return newAnswers;
            });
          }
        }

        // Cập nhật activeSection với ID mới
        setActiveSection(`question-${savedQuestionId}`);
        setActiveQuestionId(String(savedQuestionId));

        // ✅ Broadcast để đồng bộ với các tab khác
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            type: 'QUESTION_ADDED',
            data: { questionId: savedQuestionId },
          });
        }

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
  const addQuestionGroup = async () => {
    if (!currentSurveyId) {
      toast.error('Không thể tạo nhóm: Survey chưa được lưu');
      return;
    }

    // Tạo ID tạm để optimistic update
    const tempGroupId = -(Date.now());

    // 1. CẬP NHẬT UI NGAY LẬP TỨC (Optimistic Update)
    const tempGroup = {
      id: tempGroupId,
      title: "Tiêu đề nhóm",
      questions: [],
    };

    setQuestionGroups((prev) => [...prev, tempGroup]);

    // 2. GỌI API ĐỂ TẠO GROUP TRONG CSDL
    setPendingOperations(prev => prev + 1);
    try {
      const newGroup = await createQuestionGroup({
        survey_id: String(currentSurveyId),
        title: "Tiêu đề nhóm",
        position: questionGroups.length + 1,
      });

      const realGroupId = parseInt(newGroup.id);

      // 3. THAY THẾ GROUP TẠM BẰNG GROUP THẬT
      startTransition(() => {
        setQuestionGroups((prev) => {
          return prev.map((g) => {
            if (g.id !== tempGroupId) return g;
            
            return {
              id: realGroupId,
              title: newGroup.title,
              questions: [],
            };
          });
        });
      });

      setSavedAt(new Date());

      // Broadcast để đồng bộ với các tab khác
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'GROUP_ADDED',
          data: { groupId: realGroupId },
        });
      }
    } catch (error) {
      // Rollback: Xóa group tạm
      startTransition(() => {
        setQuestionGroups((prev) => prev.filter((g) => g.id !== tempGroupId));
      });

      toast.error('Không thể tạo nhóm câu hỏi: ' + error.message);
    } finally {
      setPendingOperations(prev => prev - 1);
    }
  };

  // ===================== Duplicate & Delete =====================
  const duplicateQuestionItem = async (groupId, index) => {
    // Tìm câu hỏi gốc
    const group = questionGroups.find((g) => g.id === groupId);
    if (!group) {
      toast.error("Không tìm thấy nhóm câu hỏi");
      return;
    }

    const src = group.questions[index];
    if (!src) {
      toast.error("Không tìm thấy câu hỏi");
      return;
    }

    // Tạo ID tạm để optimistic update
    const tempId = -(Date.now());

    // 1. CẬP NHẬT UI NGAY LẬP TỨC (Optimistic Update)
    const clone = {
      ...src,
      id: tempId,
      text: src.text || "",
      helpText: src.helpText || "",
      options: src.options || [],
      _pending: true, // Đánh dấu đang pending
    };

    startTransition(() => {
      setQuestionGroups((prev) => {
        return prev.map((g) => {
          if (g.id !== groupId) return g;
          const newQuestions = [...g.questions];
          newQuestions.splice(index + 1, 0, clone);
          return { ...g, questions: newQuestions };
        });
      });
    });

    // Copy questionSettings từ câu hỏi gốc
    const srcSettings = questionSettings[src.id];
    if (srcSettings) {
      setQuestionSettings((prevSettings) => ({
        ...prevSettings,
        [tempId]: {
          ...srcSettings,
          questionCode: "", // Backend sẽ tự tạo
        },
      }));
    }

    // Set active cho câu hỏi mới
    setActiveSection(`question-${tempId}`);
    setActiveQuestionId(String(tempId));

    // 2. GỌI API ĐỂ DUPLICATE TRONG CSDL
    setPendingOperations(prev => prev + 1);
    try {
      const duplicatedQuestion = await duplicateQuestion(src.id);
      const realId = parseInt(duplicatedQuestion.id);

      // Convert options từ backend format sang frontend format
      const convertedOptions = (duplicatedQuestion.options || []).map((backendOption) => {
        const optionId = backendOption.id ? parseInt(backendOption.id, 10) : null;
        return {
          id: (!isNaN(optionId) && optionId > 0) ? optionId : Date.now() + Math.random(),
          text: backendOption.option_text || "",
          isSubquestion: backendOption.is_subquestion || false,
          image: backendOption.image || null,
        };
      });

      // 3. THAY THẾ ID TẠM BẰNG ID THẬT
      startTransition(() => {
        setQuestionGroups((prev) => {
          return prev.map((g) => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              questions: g.questions.map((q) => {
                if (q.id !== tempId) return q;
                return {
                  id: realId,
                  text: duplicatedQuestion.question_text || "",
                  helpText: duplicatedQuestion.help_text || "",
                  type: duplicatedQuestion.question_type || "Danh sách (nút chọn)",
                  options: convertedOptions,
                  maxLength: duplicatedQuestion.max_length || undefined,
                };
              }),
            };
          });
        });
      });

      // Cập nhật questionSettings với ID thật
      setQuestionSettings((prevSettings) => {
        const newSettings = { ...prevSettings };
        const tempSettings = newSettings[tempId];
        if (tempSettings) {
          delete newSettings[tempId];
        }

        newSettings[realId] = {
          questionCode: duplicatedQuestion.question_code || "", // Backend đã tạo
          type: duplicatedQuestion.question_type || "Danh sách (nút chọn)",
          required: duplicatedQuestion.required || "soft",
          image: duplicatedQuestion.image || null,
          conditions: duplicatedQuestion.conditions || [],
          defaultScenario: duplicatedQuestion.default_scenario || 1,
          maxLength: duplicatedQuestion.max_length || undefined,
          numericOnly: duplicatedQuestion.numeric_only || false,
          maxQuestions: duplicatedQuestion.max_questions || undefined,
          allowedFileTypes: duplicatedQuestion.allowed_file_types || undefined,
          maxFileSizeKB: duplicatedQuestion.max_file_size_kb || undefined,
          points: duplicatedQuestion.points || 0,
        };

        return newSettings;
      });

      // Cập nhật activeSection với ID thật
      setActiveSection(`question-${realId}`);
      setActiveQuestionId(String(realId));

      // Đặt mặc định chọn "Không có câu trả lời" cho loại Giới tính và Có/Không
      if (duplicatedQuestion.question_type === "Giới tính" || duplicatedQuestion.question_type === "Có/Không") {
        const noAnswerOption = convertedOptions.find(
          (opt) => opt.text === "Không có câu trả lời"
        );
        if (noAnswerOption) {
          setSelectedAnswers((prev) => ({
            ...prev,
            [realId]: noAnswerOption.id,
          }));
        }
      }

      setSavedAt(new Date());

      // Broadcast để đồng bộ với các tab khác
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'QUESTION_ADDED',
          data: { questionId: realId },
        });
      }
    } catch (error) {
      // Rollback: Xóa câu hỏi tạm
      startTransition(() => {
        setQuestionGroups((prev) => {
          return prev.map((g) => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              questions: g.questions.filter((q) => q.id !== tempId),
            };
          });
        });
      });

      // Xóa questionSettings tạm
      setQuestionSettings((prevSettings) => {
        const newSettings = { ...prevSettings };
        delete newSettings[tempId];
        return newSettings;
      });
    } finally {
      setPendingOperations(prev => prev - 1);
    }
  };

  const duplicateGroup = async (groupId = null) => {
    // Tìm group cần duplicate
    const sourceGroup = groupId
      ? questionGroups.find((g) => g.id === groupId)
      : questionGroups[0];

    if (!sourceGroup) {
      toast.error("Không tìm thấy nhóm câu hỏi");
      return;
    }

    // Kiểm tra xem group có ID từ backend không (số dương)
    const hasBackendId = sourceGroup.id && typeof sourceGroup.id === 'number' && sourceGroup.id > 0;

    if (!hasBackendId) {
      toast.error("Nhóm câu hỏi chưa được lưu vào CSDL");
      return;
    }

    // Tạo ID tạm cho group mới
    const tempGroupId = -(Date.now());

    // Tạo ID tạm cho các câu hỏi mới
    const tempQuestions = sourceGroup.questions.map((question, index) => ({
      ...question,
      id: -(Date.now() + index + 1), // ID tạm âm
      text: question.text || "",
      helpText: question.helpText || "",
      options: question.options || [],
      _pending: true,
    }));

    // 1. CẬP NHẬT UI NGAY LẬP TỨC (Optimistic Update)
    // ✅ Tạo group mới
    const tempGroup = {
      id: tempGroupId,
      title: sourceGroup.title,
      questions: tempQuestions,
      _pending: true,
    };

    startTransition(() => {
      setQuestionGroups((prev) => [...prev, tempGroup]);
    });

    // Copy questionSettings cho các câu hỏi tạm
    tempQuestions.forEach((question) => {
      const srcQuestion = sourceGroup.questions.find((q) => q.type === question.type);
      const srcSettings = srcQuestion ? questionSettings[srcQuestion.id] : null;
      if (srcSettings) {
        setQuestionSettings((prevSettings) => ({
          ...prevSettings,
          [question.id]: {
            ...srcSettings,
            questionCode: "", // Backend sẽ tự tạo
          },
        }));
      }
    });

    // 2. GỌI API ĐỂ DUPLICATE GROUP (bao gồm tất cả questions)
    setPendingOperations(prev => prev + 1);
    try {
      // Gọi API duplicate group
      const duplicatedGroup = await duplicateQuestionGroup(sourceGroup.id);
      const realGroupId = parseInt(duplicatedGroup.id);

      // Convert questions từ backend format sang frontend format
      const newQuestions = (duplicatedGroup.questions || []).map((backendQuestion) => {
        const convertedOptions = (backendQuestion.options || []).map((backendOption) => {
          const optionId = backendOption.id ? parseInt(backendOption.id, 10) : null;
          return {
            id: (!isNaN(optionId) && optionId > 0) ? optionId : Date.now() + Math.random(),
            text: backendOption.option_text || "",
            isSubquestion: backendOption.is_subquestion || false,
            image: backendOption.image || null,
          };
        });

        return {
          id: parseInt(backendQuestion.id),
          text: backendQuestion.question_text || "",
          helpText: backendQuestion.help_text || "",
          type: backendQuestion.question_type || "Danh sách (nút chọn)",
          options: convertedOptions,
          maxLength: backendQuestion.max_length || undefined,
        };
      });

      // 3. THAY THẾ GROUP TẠM BẰNG GROUP THẬT
      startTransition(() => {
        setQuestionGroups((prev) => {
          return prev.map((g) => {
            if (g.id !== tempGroupId) return g;
            
            return {
              id: realGroupId,
              title: duplicatedGroup.title,
              questions: newQuestions,
            };
          });
        });
      });

      // Cập nhật questionSettings với ID thật
      const tempQuestionIds = tempQuestions.map((q) => q.id);
      setQuestionSettings((prevSettings) => {
        const newSettings = { ...prevSettings };

        // Xóa settings tạm
        tempQuestionIds.forEach((tempId) => {
          delete newSettings[tempId];
        });

        // Thêm settings thật
        (duplicatedGroup.questions || []).forEach((backendQuestion) => {
          const realId = parseInt(backendQuestion.id);
          newSettings[realId] = {
            questionCode: backendQuestion.question_code || "", // Backend đã tạo
            type: backendQuestion.question_type || "Danh sách (nút chọn)",
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
        });

        return newSettings;
      });

      // Cập nhật selectedAnswers cho Giới tính và Có/Không
      (duplicatedGroup.questions || []).forEach((backendQuestion, index) => {
        if (backendQuestion.question_type === "Giới tính" || backendQuestion.question_type === "Có/Không") {
          const convertedOptions = newQuestions[index].options;
          const noAnswerOption = convertedOptions.find(
            (opt) => opt.text === "Không có câu trả lời"
          );
          if (noAnswerOption) {
            setSelectedAnswers((prev) => ({
              ...prev,
              [newQuestions[index].id]: noAnswerOption.id,
            }));
          }
        }
      });

      setSavedAt(new Date());

      // Broadcast để đồng bộ với các tab khác
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'GROUP_ADDED',
          data: { groupId: realGroupId },
        });
      }
    } catch (error) {
      // Rollback: Xóa group tạm
      startTransition(() => {
        setQuestionGroups((prev) => prev.filter((g) => g.id !== tempGroupId));
      });

      // Xóa questionSettings tạm
      const tempQuestionIds = tempQuestions.map((q) => q.id);
      setQuestionSettings((prevSettings) => {
        const newSettings = { ...prevSettings };
        tempQuestionIds.forEach((tempId) => {
          delete newSettings[tempId];
        });
        return newSettings;
      });
    } finally {
      setPendingOperations(prev => prev - 1);
    }
  };

  const deleteGroup = (groupId) => {
    setDeleteModal({
      isOpen: true,
      action: async () => {
        // Tìm group cần xóa
        const groupToDelete = questionGroups.find((g) => g.id === groupId);
        if (!groupToDelete) {
          toast.error("Không tìm thấy nhóm câu hỏi cần xóa");
          return;
        }

        const questionIdsToDelete = groupToDelete.questions.map((q) => String(q.id));
        const shouldResetActive = activeQuestionId && questionIdsToDelete.includes(activeQuestionId);
        const questionIdsSet = new Set(questionIdsToDelete);

        // Đóng modal ngay để UI responsive hơn
        setDeleteModal((prev) => ({ ...prev, isOpen: false }));

        // Lưu snapshot state để rollback nếu lỗi
        const stateSnapshot = {
          questionGroups: [...questionGroups],
          questionSettings: { ...questionSettings },
          selectedAnswers: { ...selectedAnswers },
          activeSection,
          activeQuestionId,
          rightPanel,
        };

        // OPTIMISTIC UPDATE: Update UI ngay lập tức
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

        // Gọi API xóa group (backend sẽ tự động xóa tất cả questions trong group)
        deleteQuestionGroup(groupId)
          .then(() => {
            // Gửi message qua BroadcastChannel để đồng bộ với các tab khác
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
            toast.error("Không thể xóa nhóm câu hỏi");
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

  // ✅ Hàm tính lại điểm cho tất cả câu hỏi
  const recalculatePoints = useCallback(async (currentGroups = questionGroups) => {
    if (generalSettings.type !== "quiz") return;

    const allQs = currentGroups.flatMap((g) => g.questions);
    const totalQuestions = allQs.length;
    if (totalQuestions === 0) return;

    // Chia đều 10 điểm
    const basePoints = Math.floor(10 / totalQuestions);
    let remainder = 10 % totalQuestions;

    // Tạo map điểm mới
    const newPointsMap = {};
    allQs.forEach((q) => {
      let points = basePoints;
      if (remainder > 0) {
        points += 1;
        remainder--;
      }
      newPointsMap[q.id] = points;
    });

    // Cập nhật local state
    setQuestionGroups((prev) =>
      prev.map((g) => ({
        ...g,
        questions: g.questions.map((q) => {
          if (newPointsMap[q.id] !== undefined && q.points !== newPointsMap[q.id]) {
            return { ...q, points: newPointsMap[q.id] };
          }
          return q;
        }),
      }))
    );

    // Cập nhật backend (chạy ngầm)
    try {
      const updatePromises = allQs
        .filter((q) => {
          // Chỉ update câu hỏi có ID thật từ database
          const numId = Number(q.id);
          return numId > 0 && numId < 1000000000000 && Number.isInteger(numId);
        })
        .map((q) => {
          const newPoints = newPointsMap[q.id];
          if (newPoints !== undefined && q.points !== newPoints) {
            return updateQuestion(q.id, { points: newPoints });
          }
          return Promise.resolve();
        });
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error recalculating points:", error);
    }
  }, [generalSettings.type, questionGroups]);

  // Gọi recalculatePoints chỉ khi type thay đổi (không phải khi thêm/xóa câu hỏi)
  useEffect(() => {
    if (generalSettings.type === "quiz" && allQuestions.length > 0) {
      // Delay để đảm bảo tất cả câu hỏi đã có ID thật
      const timer = setTimeout(() => {
        // Kiểm tra lần cuối trước khi recalculate
        const hasValidIds = allQuestions.every((q) => {
          const numId = Number(q.id);
          return numId > 0 && numId < 1000000000000 && Number.isInteger(numId);
        });
        
        if (hasValidIds) {
          recalculatePoints();
        }
      }, 500); // Tăng delay lên 500ms để chắc chắn
      
      return () => clearTimeout(timer);
    }
  }, [generalSettings.type]); // CHỈ depend on type, KHÔNG depend on length


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
                {openPanel === "structure" ? "Kết cấu" : openPanel === "share" ? "Chia sẻ" : openPanel === "logs" ? "Log hoạt động" : "Cài đặt"}
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
            ) : openPanel === "settings" ? (
              <SettingsPanel tab={settingsTab} onSelect={setSettingsTab} />
            ) : openPanel === "share" ? (
              <ShareSidePanel />
            ) : null}
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
      <div className={`min-h-screen font-sans overflow-visible pt-[60px] ${openPanel === 'share' || openPanel === 'logs' ? 'bg-white' : 'bg-gray-100'}`}>
        <HeaderBar
          title={generalSettings?.title || "Survey mới"}
          savedAt={savedAt}
          isSaving={pendingOperations > 0}
          onActivate={() => toast.success("Đã kích hoạt")}
          onPreview={() => {
            if (surveyId) {
              // Mở trang preview trong tab mới với data survey
              const previewUrl = `/surveys/${surveyId}/preview`;
              const previewWindow = window.open(previewUrl, '_blank');
              
              // Truyền data qua sessionStorage vì window.open không hỗ trợ state
              sessionStorage.setItem(`survey-preview-${surveyId}`, JSON.stringify({
                title: generalSettings?.title || "Untitled survey",
                questions: allQuestions,
              }));
            } else {
              toast.error("Vui lòng lưu khảo sát trước khi xem trước");
            }
          }}
          onShare={() => setOpenPanel(openPanel === "share" ? null : "share")}
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

                  // Xử lý thay đổi type NGOÀI setQuestionGroups để tránh race condition
                  const currentQuestion = questionGroups
                    .flatMap(g => g.questions)
                    .find(q => String(q.id) === String(activeQuestionId));

                  const questionNewType = finalSettings.type || currentQuestion?.type;
                  const questionOldType = currentQuestion?.type;
                  const isTypeChanged = questionNewType !== questionOldType;

                  // Nếu thay đổi loại câu hỏi, xử lý async TRƯỚC khi update state
                  if (isTypeChanged && currentQuestion) {
                    setPendingOperations(prev => prev + 1);
                    (async () => {
                      try {
                        // 1. Xóa tất cả options cũ SONG SONG
                        const oldOptions = currentQuestion.options || [];
                        const optionsToDelete = oldOptions.filter(opt => opt.id && typeof opt.id === 'number' && opt.id > 0);

                        if (optionsToDelete.length > 0) {
                          const deletePromises = optionsToDelete.map(opt =>
                            deleteOption(opt.id).catch(() => null)
                          );
                          await Promise.all(deletePromises);
                        }

                        // 2. Tạo options mới trong CSDL SONG SONG
                        const defaultOptionsTemplate = createDefaultOptions(questionNewType);
                        const createPromises = defaultOptionsTemplate.map((optTemplate, i) => {
                          const optionData = {
                            question_id: String(activeQuestionId),
                            option_text: optTemplate.text || "",
                            is_subquestion: optTemplate.isSubquestion || false,
                            position: i + 1,
                          };
                          return addOption(optionData).catch(() => null);
                        });

                        const savedOptionsResults = await Promise.all(createPromises);
                        const newOptions = savedOptionsResults
                          .filter(result => result !== null)
                          .map((savedOption) => ({
                            id: parseInt(savedOption.id),
                            text: savedOption.option_text || "",
                            isSubquestion: savedOption.is_subquestion || false,
                            image: savedOption.image || null,
                          }));

                        // 3. Cập nhật question type trong CSDL
                        // ✅ Convert Vietnamese type to English before saving
                        await updateQuestion(activeQuestionId, {
                          question_type: toEnglishType(questionNewType),
                        });

                        // 4. Cập nhật UI với options mới có ID thật
                        setQuestionGroups((prev) =>
                          prev.map((g) => ({
                            ...g,
                            questions: g.questions.map((question) =>
                              String(question.id) === String(activeQuestionId)
                                ? { ...question, options: newOptions, type: questionNewType }
                                : question
                            ),
                          }))
                        );

                        // 5. Đặt mặc định chọn "Không có câu trả lời" cho loại Giới tính và Có/Không
                        if (questionNewType === "Giới tính" || questionNewType === "Có/Không") {
                          const noAnswerOption = newOptions.find(
                            (opt) => opt.text === "Không có câu trả lời"
                          );
                          if (noAnswerOption) {
                            setSelectedAnswers((prev) => ({
                              ...prev,
                              [activeQuestionId]: noAnswerOption.id,
                            }));
                          }
                        }

                        setSavedAt(new Date());
                        
                        // Broadcast để đồng bộ với các tab khác
                        if (broadcastChannelRef.current) {
                          broadcastChannelRef.current.postMessage({
                            type: 'QUESTION_TYPE_CHANGED',
                            data: {
                              questionId: activeQuestionId,
                              newType: questionNewType,
                              newOptions: newOptions,
                            },
                          });
                        }
                      } catch (error) {
                        toast.error('Không thể thay đổi loại câu hỏi');
                      } finally {
                        setPendingOperations(prev => prev - 1);
                      }
                    })();
                  }

                  // Cập nhật settings ngay lập tức
                  setQuestionGroups((prevGroups) =>
                    prevGroups.map((group) => ({
                      ...group,
                      questions: group.questions.map((q) => {
                        if (String(q.id) !== String(activeQuestionId)) return q;

                        let updated = { ...q, ...finalSettings };

                        // Nếu thay đổi loại câu hỏi, tạm thời hiển thị options template
                        if (isTypeChanged) {
                          const defaultOptions = createDefaultOptions(questionNewType);
                          updated = {
                            ...updated,
                            options: defaultOptions.map((opt, i) => ({
                              ...opt,
                              id: -(Date.now() + i), // ID tạm âm
                              _pending: true,
                            })),
                          };
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

                  // ✅ Lưu settings vào CSDL (bao gồm conditions, required, image, etc.)
                  if (!isTypeChanged && activeQuestionId && currentSurveyId) {
                    // Chỉ lưu khi KHÔNG thay đổi type (vì type đã được lưu ở trên)
                    (async () => {
                      try {
                        const updateData = {};
                        
                        // Lưu các field settings
                        if (finalSettings.required !== undefined) {
                          updateData.required = finalSettings.required;
                        }
                        if (finalSettings.image !== undefined) {
                          updateData.image = finalSettings.image;
                        }
                        if (finalSettings.conditions !== undefined) {
                          updateData.conditions = finalSettings.conditions;
                        }
                        if (finalSettings.defaultScenario !== undefined) {
                          updateData.default_scenario = finalSettings.defaultScenario;
                        }
                        if (finalSettings.maxLength !== undefined) {
                          updateData.max_length = finalSettings.maxLength;
                        }
                        if (finalSettings.numericOnly !== undefined) {
                          updateData.numeric_only = finalSettings.numericOnly;
                        }
                        if (finalSettings.maxQuestions !== undefined) {
                          updateData.max_questions = finalSettings.maxQuestions;
                        }
                        if (finalSettings.allowedFileTypes !== undefined) {
                          updateData.allowed_file_types = finalSettings.allowedFileTypes;
                        }
                        if (finalSettings.maxFileSizeKB !== undefined) {
                          updateData.max_file_size_kb = finalSettings.maxFileSizeKB;
                        }
                        if (finalSettings.points !== undefined) {
                          updateData.points = finalSettings.points;
                        }

                        // Chỉ gọi API nếu có thay đổi
                        if (Object.keys(updateData).length > 0) {
                          await updateQuestion(activeQuestionId, updateData);
                          
                          // Broadcast để đồng bộ với các tab khác
                          if (broadcastChannelRef.current) {
                            // Broadcast từng field thay đổi
                            Object.entries(updateData).forEach(([fieldName, value]) => {
                              broadcastChannelRef.current.postMessage({
                                type: 'QUESTION_FIELD_UPDATED',
                                data: {
                                  questionId: activeQuestionId,
                                  fieldName,
                                  value,
                                },
                              });
                            });
                          }
                        }
                      } catch (error) {
                        console.error('Error saving question settings:', error);
                        toast.error('Không thể lưu cài đặt câu hỏi');
                      }
                    })();
                  }
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
                  {openPanel === "logs" ? (
                    <LogPanel surveyId={surveyId} />
                  ) : openPanel === "share" ? (
                    <SharePanel 
                      surveyId={surveyId}
                      surveyUrl={`${window.location.origin}/survey/${surveyId}`}
                    />
                  ) : openPanel === "settings" ? (
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
                          welcomeTitle={generalSettings.welcomeTitle}
                          welcomeDescription={generalSettings.welcomeDescription}
                          onWelcomeTitleChange={handleWelcomeTitleChange}
                          onWelcomeDescriptionChange={handleWelcomeDescriptionChange}
                          onWelcomeTitleBlur={handleWelcomeTitleBlur}
                          onWelcomeDescriptionBlur={handleWelcomeDescriptionBlur}
                        />
                      </div>

                      {questionGroups.map((group, groupIndex) => {
                        // ✅ Tính global start index (tổng số câu hỏi của tất cả groups trước đó)
                        const globalStartIndex = questionGroups
                          .slice(0, groupIndex)
                          .reduce((sum, g) => sum + g.questions.filter((q) => shouldShowQuestion(q.id)).length, 0);

                        return (
                          <React.Fragment key={group.id}>
                            <QuestionSection
                              groupId={group.id}
                              groupTitle={group.title}
                              questionItems={group.questions
                                .filter((q) => shouldShowQuestion(q.id))
                                .map((q) => ({
                                  ...q,
                                  // Merge questionSettings vào question object
                                  required: questionSettings[q.id]?.required || q.required || "soft",
                                  maxLength: questionSettings[q.id]?.maxLength || q.maxLength,
                                  numericOnly: questionSettings[q.id]?.numericOnly || q.numericOnly || false,
                                }))
                              }
                              globalStartIndex={globalStartIndex}
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
                              onTextBlur={handleQuestionTextBlur}
                              onHelpTextChange={handleHelpTextChange}
                              onHelpTextBlur={handleHelpTextBlur}
                              onGroupTitleChange={async (newTitle) => {
                                // Cập nhật state local ngay lập tức
                                setQuestionGroups((prev) =>
                                  prev.map((g) =>
                                    g.id === group.id
                                      ? { ...g, title: newTitle }
                                      : g
                                  )
                                );
                                
                                // Kiểm tra xem group ID có hợp lệ không (phải là ID thật từ database)
                                const numId = Number(group.id);
                                if (!numId || numId <= 0 || numId > 1000000000000 || !Number.isInteger(numId)) {
                                  console.warn('Bỏ qua cập nhật group với ID không hợp lệ:', group.id);
                                  return;
                                }
                                
                                // Gọi API cập nhật group title
                                try {
                                  await updateQuestionGroup(group.id, { title: newTitle });
                                  setSavedAt(new Date());
                                  
                                  // Broadcast để đồng bộ với các tab khác
                                  if (broadcastChannelRef.current) {
                                    broadcastChannelRef.current.postMessage({
                                      type: 'GROUP_TITLE_UPDATED',
                                      data: { groupId: group.id, title: newTitle },
                                    });
                                  }
                                } catch (error) {
                                  console.error('Error updating group title:', error);
                                  toast.error('Không thể lưu tiêu đề nhóm');
                                }
                              }}
                              onAnswerSelect={handleAnswerSelect}
                              selectedAnswers={selectedAnswers}
                              getQuestionConditionInfo={getQuestionConditionInfo}
                              onOptionChange={handleOptionChange}
                              onOptionBlur={handleOptionBlur}
                              onAddOption={handleAddOption}
                              onRemoveOption={handleRemoveOption}
                              onMoveOption={handleMoveOption}
                              onOptionImageChange={handleOptionImageChange}
                              surveyType={generalSettings.type}
                              onCorrectAnswerChange={async (questionId, optionId, textAnswer) => {
                                // 1. Update local state
                                setQuestionGroups((prev) =>
                                  prev.map((g) => ({
                                    ...g,
                                    questions: g.questions.map((q) => {
                                      if (String(q.id) !== String(questionId)) return q;
                                      
                                      // Nếu là câu hỏi văn bản (textAnswer được truyền vào)
                                      if (textAnswer !== undefined) {
                                        return {
                                          ...q,
                                          options: q.options.map((opt, idx) => ({
                                            ...opt,
                                            is_correct: idx === 0, // Option đầu tiên là đáp án đúng
                                            option_text: idx === 0 ? textAnswer : opt.option_text,
                                          })),
                                        };
                                      }
                                      
                                      // Nếu là câu hỏi trắc nghiệm
                                      return {
                                        ...q,
                                        options: q.options.map((opt) => ({
                                          ...opt,
                                          is_correct: String(opt.id) === String(optionId),
                                        })),
                                      };
                                    }),
                                  }))
                                );

                                // 2. Call API to update options
                                try {
                                  const group = questionGroups.find((g) => g.questions.some((q) => String(q.id) === String(questionId)));
                                  const question = group?.questions.find((q) => String(q.id) === String(questionId));
                                  
                                  if (question) {
                                    // Nếu là câu hỏi văn bản
                                    if (textAnswer !== undefined) {
                                      // Tìm hoặc tạo option đầu tiên để lưu đáp án
                                      let firstOption = question.options[0];
                                      
                                      if (firstOption) {
                                        // Cập nhật option đầu tiên với đáp án đúng
                                        await updateOption(firstOption.id, {
                                          option_text: textAnswer,
                                          is_correct: true,
                                        });
                                      } else {
                                        // Tạo option mới nếu chưa có
                                        await addOption({
                                          question_id: questionId,
                                          option_text: textAnswer,
                                          is_correct: true,
                                          position: 1,
                                        });
                                      }
                                      
                                      // Đặt các option khác thành không đúng
                                      const otherOptions = question.options.slice(1);
                                      await Promise.all(
                                        otherOptions.map((opt) =>
                                          updateOption(opt.id, { is_correct: false })
                                        )
                                      );
                                    } else {
                                      // Nếu là câu hỏi trắc nghiệm
                                      const updatePromises = question.options.map((opt) => {
                                        const isCorrect = String(opt.id) === String(optionId);
                                        // Only update if changed (optimization)
                                        if (opt.is_correct !== isCorrect) {
                                          return updateOption(opt.id, { is_correct: isCorrect });
                                        }
                                        return Promise.resolve();
                                      });
                                      await Promise.all(updatePromises);
                                    }
                                  }
                                } catch (error) {
                                  console.error("Error updating correct answer:", error);
                                  toast.error("Không thể lưu đáp án đúng");
                                }
                              }}
                              />
                            <AddSection
                              onAddClick={() => {
                                handleToggleModal();
                                window.__currentGroupId = group.id;
                              }}
                              isModalOpen={isModalOpen}
                            />
                          </React.Fragment>
                        );
                      })}

                      <div
                        id="end"
                        className="scroll-mt-[84px] relative z-10 overflow-visible mb-5"
                      >
                        <EndSection
                          isActive={activeSection === "end"}
                          onClick={() => handleSetSection("end")}
                          endTitle={generalSettings.endTitle}
                          endDescription={generalSettings.endDescription}
                          onEndTitleChange={handleEndTitleChange}
                          onEndDescriptionChange={handleEndDescriptionChange}
                          onEndTitleBlur={handleEndTitleBlur}
                          onEndDescriptionBlur={handleEndDescriptionBlur}
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
        hasGroups={questionGroups.length > 0}
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
