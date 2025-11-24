import { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import { validateFile } from "../helpers/fileValidation";

export const useFileUpload = (question, selectedAnswer, onAnswerSelect) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [fileUploadError, setFileUploadError] = useState("");
  const lastToastIdRef = useRef(null);

  // Xử lý khi chọn file
  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file với số lượng file hiện tại
    const validation = validateFile(file, uploadedFiles.length, question);
    if (!validation.valid) {
      setFileUploadError(validation.error);
      // Dismiss toast cũ nếu có
      if (lastToastIdRef.current) {
        toast.dismiss(lastToastIdRef.current);
      }
      const id = toast.error(validation.error, {
        style: { background: "#dc2626", color: "#fff" },
        id: "file-upload-error",
      });
      lastToastIdRef.current = id;
      return;
    }

    // Clear error nếu file hợp lệ
    setFileUploadError("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = {
        id: Date.now() + Math.random(), // Tạo ID duy nhất cho file
        name: file.name,
        size: file.size,
        type: file.type,
        data: event.target.result, // Base64 string
      };
      
      // Thêm file vào array
      const newFiles = [...uploadedFiles, fileData];
      setUploadedFiles(newFiles);
      
      // Lưu array file data vào selectedAnswer
      onAnswerSelect?.(question.id, JSON.stringify(newFiles), question.type);
    };
    reader.onerror = () => {
      const errorMsg = "Lỗi khi đọc tệp. Vui lòng thử lại.";
      setFileUploadError(errorMsg);
      // Dismiss toast cũ nếu có
      if (lastToastIdRef.current) {
        toast.dismiss(lastToastIdRef.current);
      }
      const id = toast.error(errorMsg, {
        style: { background: "#dc2626", color: "#fff" },
        id: "file-read-error",
      });
      lastToastIdRef.current = id;
    };
    reader.readAsDataURL(file);
  };

  // Xóa file
  const handleRemoveFile = (fileId) => {
    const newFiles = uploadedFiles.filter(f => f.id !== fileId);
    setUploadedFiles(newFiles);
    setFileUploadError("");
    
    // Lưu array mới vào selectedAnswer
    if (newFiles.length > 0) {
      onAnswerSelect?.(question.id, JSON.stringify(newFiles), question.type);
    } else {
      onAnswerSelect?.(question.id, "", question.type);
    }
  };

  // Xử lý khi click vào vùng upload
  const handleFileUploadClick = (e) => {
    e.stopPropagation();
    const input = document.createElement("input");
    input.type = "file";
    // Chỉ cho phép các loại file được phép từ settings
    const allowedFileTypes = question?.allowedFileTypes || "png, gif, doc, odt, jpg, jpeg, pdf";
    const acceptExtensions = allowedFileTypes.split(",").map(ext => `.${ext.trim()}`).join(",");
    input.accept = acceptExtensions;
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      handleFileSelect(file);
    };
    input.click();
  };

  // Xử lý drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragging(true);
  };

  // Xử lý drag leave
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragging(false);
  };

  // Xử lý drop file
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragging(false);
    
    const files = Array.from(e.dataTransfer?.files || []);
    // Chỉ xử lý file đầu tiên nếu drop nhiều file
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Sync uploadedFiles với selectedAnswer
  useEffect(() => {
    if (question.type === "Tải lên tệp") {
      if (selectedAnswer) {
        try {
          const parsed = JSON.parse(selectedAnswer);
          // Kiểm tra xem là array hay object đơn
          if (Array.isArray(parsed)) {
            setUploadedFiles(parsed);
          } else {
            // Nếu là object đơn (format cũ), chuyển thành array
            setUploadedFiles([parsed]);
          }
          setFileUploadError("");
        } catch {
          // Nếu không phải JSON, reset
          setUploadedFiles([]);
          setFileUploadError("");
        }
      } else {
        setUploadedFiles([]);
        setFileUploadError("");
      }
    }
  }, [selectedAnswer, question.type]);

  // Clear error khi maxQuestions thay đổi
  useEffect(() => {
    if (question.type === "Tải lên tệp") {
      if (fileUploadError && fileUploadError.includes("giới hạn số lượng")) {
        setFileUploadError("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.maxQuestions, question.type]);

  return {
    uploadedFiles,
    isFileDragging,
    fileUploadError,
    handleFileSelect,
    handleRemoveFile,
    handleFileUploadClick,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};
