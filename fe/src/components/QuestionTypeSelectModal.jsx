import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  MinusIcon,
  ListIcon,
  SortIcon,
  CalendarIcon,
  TextIcon,
  NumberIcon,
  SearchIcon,
} from "../icons";

const allModalOptions = [
  {
    title: "Chọn một đáp án",
    icon: <MinusIcon />,
    options: [
      "Danh sách (nút chọn)",
      "Danh sách có nhận xét (Radio)",
      "Chọn hình ảnh từ danh sách (Radio)",
      "Lựa chọn 5 điểm",
      "Danh sách thả xuống",
      "Nút lựa chọn đơn",
    ],
  },
  {
    title: "Nhiều lựa chọn",
    icon: <ListIcon />,
    options: [
      "Nhiều lựa chọn",
      "Nhiều lựa chọn với ý kiến",
      "Nút lựa chọn nhiều",
    ],
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

export default function QuestionTypeSelectModal({
  isOpen,
  onClose,
  onSelectQuestionType,
  triggerElement,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const modalRef = useRef(null);

  // ===================== SPRING EFFECT =====================
  const [kickY, setKickY] = useState(0);
  const yRef = useRef(0);
  const vRef = useRef(0);
  const lastTsRef = useRef(0);
  const lastScrollY = useRef(
    typeof window !== "undefined" ? window.scrollY : 0
  );
  const rafRef = useRef(null);

  // Vòng lặp lò xo
  const startSpringLoop = useCallback(() => {
    if (rafRef.current) return;

    const step = (ts) => {
      const prevTs = lastTsRef.current || ts;
      const dt = Math.min(0.032, (ts - prevTs) / 1000);
      lastTsRef.current = ts;

      const K = 360;
      const C = 1 * Math.sqrt(K);

      let y = yRef.current;
      let v = vRef.current;

      const a = -K * y - C * v;

      v = v + a * dt;
      y = y + v * dt;

      vRef.current = v;
      yRef.current = y;
      setKickY(y);

      if (Math.abs(v) < 3 && Math.abs(y) < 1) {
        vRef.current = 0;
        yRef.current = 0;
        setKickY(0);
        rafRef.current = null;
        return;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  }, []);

  // Lắng nghe window scroll để tạo hiệu ứng lò xo
  useEffect(() => {
    if (!isOpen) return;

    const onScroll = () => {
      const yNow = window.scrollY;
      const dy = yNow - (lastScrollY.current ?? yNow);
      lastScrollY.current = yNow;
      if (dy === 0) return;

      const impulse = -Math.sign(dy) * Math.min(30, Math.abs(dy) * 90);
      vRef.current += impulse;
      startSpringLoop();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [isOpen, startSpringLoop]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Reset search và scroll khi đóng modal
  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      // Reset spring
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      vRef.current = 0;
      yRef.current = 0;
      setKickY(0);
      lastScrollY.current = typeof window !== "undefined" ? window.scrollY : 0;
    }
  }, [isOpen]);

  // Tính toán vị trí modal dựa trên trigger element
  const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!isOpen || !triggerElement) return;

    const updatePosition = () => {
      if (triggerElement) {
        const rect = triggerElement.getBoundingClientRect();

        // Tính theo viewport thay vì scrollY để modal cố định vị trí trên màn hình
        setModalPosition({
          top: rect.bottom + 4, // 4px gap dưới button
          right: 0,
        });
      }
    };

    updatePosition();
    // Cập nhật khi scroll hoặc resize
    const handleUpdate = () => {
      updatePosition();
    };
    window.addEventListener("scroll", handleUpdate, { passive: true });
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isOpen, triggerElement]);

  // Lọc options dựa trên search query
  const modalOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return allModalOptions;
    }

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

  const handleSelect = (optionType) => {
    onSelectQuestionType(optionType);
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        ref={modalRef}
        className="fixed bg-white rounded-sm w-[400px] h-[440px] flex flex-col border-2 border-violet-600"
        onClick={(e) => e.stopPropagation()}
        style={{
          top: `${modalPosition.top}px`,
          right: `${modalPosition.right}px`,
          transform: `translateY(${kickY}px)`,
          willChange: "transform",
        }}
      >
        {/* Search Header */}
        <div className="px-2 pt-2 pb-2 border-b border-gray-200 flex-shrink bg-gray-200">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm loại câu hỏi"
              className="w-full h-7 text-md pr-8 pl-3 rounded focus:outline-none"
            />
            {/* Icon nằm sát bên phải chữ placeholder */}
            <div className="absolute right-3 inset-y-0 flex items-center pointer-events-none text-gray-700">
              <SearchIcon />
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-6">
            {modalOptions.map((cat) => (
              <div key={cat.title}>
                <div className="flex items-center mb-2">
                  {cat.icon}
                  <h3 className="font-bold text-gray-700 ml-2 text-sm">
                    {cat.title}
                  </h3>
                </div>
                <ul className="space-y-1">
                  {cat.options.map((opt) => (
                    <li key={opt}>
                      <button
                        onClick={() => handleSelect(opt)}
                        className="block text-violet-600 hover:underline py-1 text-left text-sm w-full"
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
  );
}

