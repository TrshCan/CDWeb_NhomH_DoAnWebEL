import React, { useState, useMemo } from "react";
import {
  MinusIcon,
  ListIcon,
  SortIcon,
  CalendarIcon,
  TextIcon,
  NumberIcon,
  SearchIcon,
  GridIcon,
} from "../icons";

const BlackIcon = ({ IconComponent }) => {
  const Icon = IconComponent;
  return (
    <div className="h-6 w-6 text-black [&_svg]:text-black">
      <Icon />
    </div>
  );
};

const allModalOptions = [
  {
    title: "Chọn một đáp án",
    icon: <BlackIcon IconComponent={MinusIcon} />,
    options: [
      "Danh sách (nút chọn)",
      "Danh sách có nhận xét (Radio)",
      "Chọn hình ảnh từ danh sách (Radio)",
      "Lựa chọn 5 điểm",
    ],
  },
  {
    title: "Nhiều lựa chọn",
    icon: <BlackIcon IconComponent={ListIcon} />,
    options: [
      "Nhiều lựa chọn",
      "Chọn nhiều hình ảnh",
      "Nhiều văn bản ngắn",
    ],
  },
  {
    title: "Xếp hạng & Đánh giá",
    icon: <BlackIcon IconComponent={SortIcon} />,
    options: ["Có/Không", "Giới tính"],
  },
  {
    title: "Ngày & dữ liệu",
    icon: <BlackIcon IconComponent={CalendarIcon} />,
    options: ["Ngày giờ", "Tải lên tệp"],
  },
  {
    title: "Văn bản",
    icon: <BlackIcon IconComponent={TextIcon} />,
    options: ["Văn bản ngắn", "Văn bản dài"],
  },
  {
    title: "Số",
    icon: <BlackIcon IconComponent={NumberIcon} />,
    options: ["Đầu vào dạng số"],
  },
  {
    title: "Mảng",
    icon: <BlackIcon IconComponent={GridIcon} />,
    options: ["Ma trận (chọn điểm)"],
  },
];

export default function QuestionTypeModal({
  isOpen,
  onClose,
  onSelectQuestionType,
  onAddGroup,
  hasGroups = true,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  React.useEffect(() => {
    if (!isOpen) setSearchQuery("");
  }, [isOpen]);

  const modalOptions = useMemo(() => {
    if (!searchQuery.trim()) return allModalOptions;
    const query = searchQuery.toLowerCase();
    return allModalOptions
      .map((cat) => ({
        ...cat,
        options: cat.options.filter(
          (opt) =>
            opt.toLowerCase().includes(query) ||
            cat.title.toLowerCase().includes(query)
        ),
      }))
      .filter((cat) => cat.options.length > 0);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelect = (optionType) => onSelectQuestionType(optionType);

  return (
    <div className="fixed inset-0 bg-black/5 z-50 transition-opacity" onClick={onClose}>
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                   bg-white rounded-sm shadow-2xl w-[1000px] h-[441px] p-0
                   border-2 border-violet-600 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Phần 1: Thanh tìm kiếm (1000 x 50) */}
        <div className="w-full h-[50px] relative flex items-center px-4 shrink-0 bg-gray-200">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm loại câu hỏi"
            className="w-full h-[40px] pl-10 pr-3 text-[16px] text-black
            outline-none border-none focus:outline-none focus:ring-0"
          />
        </div>

        {/* Phần 2: Nội dung bên dưới */}
        <div className="flex-1 overflow-y-auto flex">
          {/* Cột trái: Nút thêm nhóm câu hỏi */}
          <div className="w-[200px] shrink-0 p-6">
            <button
              onClick={() => {
                onAddGroup?.();
                onClose();
              }}
              className="flex items-center text-violet-600 hover:text-violet-800 transition-colors text-[13px] font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Thêm nhóm câu hỏi
            </button>
          </div>

          {/* Cột phải: Danh sách loại câu hỏi */}
          <div className="flex-1 p-6 pt-8 relative">
            {!hasGroups && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                <div className="text-center p-6 bg-white rounded-lg shadow-lg border-2 border-violet-200">
                  <p className="text-gray-700 font-medium mb-2">Chưa có nhóm câu hỏi</p>
                  <p className="text-gray-500 text-sm">Vui lòng tạo nhóm câu hỏi trước khi thêm câu hỏi</p>
                </div>
              </div>
            )}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${!hasGroups ? 'opacity-30 pointer-events-none' : ''}`}>
              {modalOptions.map((cat) => (
                <div key={cat.title} className={cat.title === "Mảng" ? "mb-8" : ""}>
                  <div className="flex items-center mb-3">
                    {cat.icon}
                    <h3 className="font-bold text-black ml-2 text-[14px]">
                      {cat.title}
                    </h3>
                  </div>
                  <ul>
                    {cat.options.map((opt) => (
                      <li key={opt}>
                        <button
                          onClick={() => handleSelect(opt)}
                          className="block text-violet-600 hover:underline py-1 text-left text-[13px]"
                          disabled={!hasGroups}
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
      </div>
    </div>
  );
}
