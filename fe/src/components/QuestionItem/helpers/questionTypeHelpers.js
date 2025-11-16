// ✅ Helper: kiểm tra xem option có đang được chọn không
export const isOptionChecked = (selectedAnswer, optionId) => {
  if (Array.isArray(selectedAnswer)) {
    return selectedAnswer.map(String).includes(String(optionId));
  }
  return String(selectedAnswer) === String(optionId);
};

// ✅ Helper: kiểm tra xem có phải loại radio button không
export const isRadioType = (questionType) => {
  return (
    questionType === "Danh sách (nút chọn)" ||
    questionType === "Danh sách có nhận xét (Radio)" ||
    questionType === "Chọn hình ảnh từ danh sách (Radio)"
  );
};

// ✅ Helper: kiểm tra xem có phải loại image option không
export const isImageOptionType = (questionType) => {
  return (
    questionType === "Chọn hình ảnh từ danh sách (Radio)" ||
    questionType === "Chọn nhiều hình ảnh"
  );
};

// ✅ Helper: kiểm tra xem có phải loại 5 điểm không
export const isFivePointScale = (questionType) => {
  return questionType === "Lựa chọn 5 điểm";
};

// ✅ Helper: kiểm tra xem có phải loại Giới tính không
export const isGenderType = (questionType) => {
  return questionType === "Giới tính";
};

// ✅ Helper: kiểm tra xem có phải loại Có/Không không
export const isYesNoType = (questionType) => {
  return questionType === "Có/Không";
};

// ✅ Helper: kiểm tra xem có phải loại Ngày giờ không
export const isDateTimeType = (questionType) => {
  return questionType === "Ngày giờ";
};

// ✅ Helper: kiểm tra xem có phải loại Tải lên tệp không
export const isFileUploadType = (questionType) => {
  return questionType === "Tải lên tệp";
};

// ✅ Helper: kiểm tra xem có phải loại Văn bản ngắn không
export const isShortTextType = (questionType) => {
  return questionType === "Văn bản ngắn";
};

// ✅ Helper: kiểm tra xem có phải loại Văn bản dài không
export const isLongTextType = (questionType) => {
  return questionType === "Văn bản dài";
};

// ✅ Helper: kiểm tra xem có phải loại Nhiều văn bản ngắn không
export const isMultipleShortTextType = (questionType) => {
  return questionType === "Nhiều văn bản ngắn";
};
