// Mapping between Vietnamese display names and English database values
export const QUESTION_TYPE_MAP = {
  // Vietnamese to English
  "Danh sách (nút chọn)": "single_choice",
  "Nhiều lựa chọn": "multiple_choice",
  "Danh sách có nhận xét (Radio)": "single_choice_text",
  "Văn bản ngắn": "short_text",
  "Văn bản dài": "long_text",
  "Nhiều văn bản ngắn": "multiple_short_text",
  "Lựa chọn 5 điểm": "rating_5",
  "Giới tính": "gender",
  "Có/Không": "yes_no",
  "Tải lên tệp": "file_upload",
  "Ma trận (chọn điểm)": "matrix_rating",
  "Chọn nhiều hình ảnh": "multiple_image_choice",
  "Chọn hình ảnh từ danh sách (Radio)": "single_image_choice",
  "Ngày giờ": "datetime",
};

// English to Vietnamese (for display)
export const QUESTION_TYPE_REVERSE_MAP = {
  "single_choice": "Danh sách (nút chọn)",
  "multiple_choice": "Nhiều lựa chọn",
  "single_choice_text": "Danh sách có nhận xét (Radio)",
  "short_text": "Văn bản ngắn",
  "long_text": "Văn bản dài",
  "multiple_short_text": "Nhiều văn bản ngắn",
  "rating_5": "Lựa chọn 5 điểm",
  "gender": "Giới tính",
  "yes_no": "Có/Không",
  "file_upload": "Tải lên tệp",
  "matrix_rating": "Ma trận (chọn điểm)",
  "multiple_image_choice": "Chọn nhiều hình ảnh",
  "single_image_choice": "Chọn hình ảnh từ danh sách (Radio)",
  "datetime": "Ngày giờ",
};

// Convert Vietnamese type to English for saving to database
export const toEnglishType = (vietnameseType) => {
  return QUESTION_TYPE_MAP[vietnameseType] || vietnameseType;
};

// Convert English type to Vietnamese for display
export const toVietnameseType = (englishType) => {
  return QUESTION_TYPE_REVERSE_MAP[englishType] || englishType;
};
