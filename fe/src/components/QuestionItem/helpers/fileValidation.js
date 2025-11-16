// Validation file upload
export const validateFile = (file, currentFileCount, question) => {
  if (!file) {
    return { valid: false, error: "Vui lòng chọn một tệp" };
  }

  // Lấy settings từ question object
  const maxFileCount = question?.maxQuestions || 1;
  const allowedFileTypes = question?.allowedFileTypes || "png, gif, doc, odt, jpg, jpeg, pdf";
  const maxFileSizeKB = question?.maxFileSizeKB || 10241;

  // Kiểm tra số lượng file
  if (currentFileCount >= maxFileCount) {
    return {
      valid: false,
      error: `Đã đạt giới hạn số lượng tệp cho phép (${maxFileCount} tệp). Vui lòng xóa một tệp trước khi thêm mới.`,
    };
  }

  // Kiểm tra extension
  const allowedExtensions = allowedFileTypes.split(",").map(ext => ext.trim().toLowerCase());
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  
  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `Loại tệp không được phép. Chỉ chấp nhận: ${allowedExtensions.join(", ").toUpperCase()}`,
    };
  }

  // Kiểm tra kích thước
  const maxSizeBytes = maxFileSizeKB * 1024;
  const fileSizeKB = file.size / 1024;

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Kích thước tệp quá lớn. Kích thước tối đa: ${maxFileSizeKB} KB (Hiện tại: ${fileSizeKB.toFixed(2)} KB)`,
    };
  }

  return { valid: true, error: "" };
};
