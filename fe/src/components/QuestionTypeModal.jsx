import React from "react";
import {
  MinusIcon,
  ListIcon,
  SortIcon,
  CalendarIcon,
  TextIcon,
  NumberIcon,
  SearchIcon,
} from "../icons";

export default function QuestionTypeModal({
  isOpen,
  onClose,
  onSelectQuestionType,
}) {
  if (!isOpen) return null;

  const modalOptions = [
    {
      title: "Chọn một đáp án",
      icon: <MinusIcon />,
      options: [
        "Danh sách (nút chọn)",
        "Lựa chọn 5 điểm",
        "Danh sách thả xuống",
      ],
    },
    {
      title: "Nhiều lựa chọn",
      icon: <ListIcon />,
      options: ["Nhiều lựa chọn", "Nút lựa chọn nhiều"],
    },
    {
      title: "Xếp hạng & Đánh giá",
      icon: <SortIcon />,
      options: ["Xếp hạng năng cao", "Có/Không"],
    },
    { title: "Ngày & dữ liệu", icon: <CalendarIcon />, options: ["Ngày giờ"] },
    {
      title: "Văn bản",
      icon: <TextIcon />,
      options: ["Văn bản ngắn", "Văn bản dài"],
    },
    { title: "Số", icon: <NumberIcon />, options: ["Đầu vào dạng số"] },
  ];

  const handleSelect = (optionType) => {
    onSelectQuestionType(optionType);
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-10" onClick={onClose}>
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[calc(100vh-5rem)] overflow-y-auto p-6 border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b pb-4 mb-6">
          <SearchIcon />
          <input
            type="text"
            placeholder="Tìm loại câu hỏi"
            className="w-full ml-3 focus:outline-none text-lg"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {modalOptions.map((cat) => (
            <div key={cat.title}>
              <div className="flex items-center mb-3">
                {cat.icon}
                <h3 className="font-bold text-gray-700 ml-2">{cat.title}</h3>
              </div>
              <ul>
                {cat.options.map((opt) => (
                  <li key={opt}>
                    <button
                      onClick={() => handleSelect(opt)}
                      className="block text-violet-600 hover:underline py-1 text-left"
                    >
                      {opt}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
