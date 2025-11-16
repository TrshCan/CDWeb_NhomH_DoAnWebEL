# QuestionItem Component - Cấu trúc đã chia nhỏ

File `QuestionItem.jsx` gốc đã được chia nhỏ thành các phần sau để dễ quản lý:

## Cấu trúc thư mục

```
QuestionItem/
├── index.jsx                          # Entry point - export component chính
├── QuestionItemMain.jsx               # Component chính (giữ nguyên logic gốc)
├── hooks/                             # Custom hooks
│   ├── useDateInput.js               # Logic xử lý date input
│   ├── useFileUpload.js              # Logic xử lý file upload  
│   ├── useTextInput.js               # Logic xử lý text input
│   └── useDragAndDrop.js             # Logic xử lý drag & drop options
├── ui/                                # UI Components
│   └── MoveButtons.jsx               # Nút di chuyển lên/xuống
└── helpers/                           # Utility functions
    ├── dateFormatters.js             # Hàm format date
    ├── fileValidation.js             # Hàm validate file
    └── questionTypeHelpers.js        # Helper functions kiểm tra loại câu hỏi
```

## Các phần đã tách ra

### 1. Helpers (helpers/)
- **dateFormatters.js**: Các hàm chuyển đổi định dạng ngày tháng
  - `formatDateForDisplay()`: YYYY-MM-DD → MM/DD/YYYY
  - `formatDateForStorage()`: MM/DD/YYYY → YYYY-MM-DD

- **fileValidation.js**: Logic validation file upload
  - `validateFile()`: Kiểm tra file type, size, số lượng

- **questionTypeHelpers.js**: Các hàm helper kiểm tra loại câu hỏi
  - `isOptionChecked()`: Kiểm tra option có được chọn không
  - `isRadioType()`, `isGenderType()`, `isYesNoType()`, etc.

### 2. Custom Hooks (hooks/)
- **useDateInput.js**: Quản lý state và logic cho date input
  - State: `dateInputValue`, `datePickerRef`
  - Handlers: `handleDateInputChange`, `openDatePicker`, `handleDatePickerChange`

- **useFileUpload.js**: Quản lý state và logic cho file upload
  - State: `uploadedFiles`, `isFileDragging`, `fileUploadError`
  - Handlers: `handleFileSelect`, `handleRemoveFile`, `handleFileUploadClick`, etc.

- **useTextInput.js**: Quản lý state và logic cho text input
  - State: `textInputValue`, `textInputError`, `multipleTextInputs`
  - Handlers: `handleTextInputChange`, `handleMultipleTextInputChange`

- **useDragAndDrop.js**: Quản lý state cho drag and drop
  - State: `draggedIndex`, `dragOverIndex`

### 3. UI Components (ui/)
- **MoveButtons.jsx**: Component nút di chuyển câu hỏi lên/xuống

## Cách sử dụng

File gốc `fe/src/components/QuestionItem.jsx` vẫn hoạt động bình thường.

Để sử dụng cấu trúc mới (đã được import trong QuestionItemMain.jsx):

```jsx
import QuestionItem from "./components/QuestionItem";
// hoặc
import QuestionItem from "./components/QuestionItem/QuestionItemMain";
```

## Lưu ý

- File `QuestionItemMain.jsx` hiện tại vẫn chứa toàn bộ logic gốc
- Các hooks và helpers đã được tạo sẵn và có thể sử dụng
- Để refactor hoàn toàn, cần thay thế các hàm trong QuestionItemMain.jsx bằng các hooks/helpers đã tạo
- **QUAN TRỌNG**: Mọi thay đổi đều giữ nguyên 100% chức năng và giao diện

## Bước tiếp theo (tùy chọn)

Nếu muốn refactor hoàn toàn QuestionItemMain.jsx:
1. Thay thế các hàm date bằng hooks useDateInput
2. Thay thế các hàm file upload bằng hooks useFileUpload  
3. Thay thế các hàm text input bằng hooks useTextInput
4. Tách các UI phức tạp thành components riêng trong ui/
5. Test kỹ để đảm bảo không có gì thay đổi

## Backup

File backup gốc: `fe/src/components/QuestionItem.jsx.backup`
