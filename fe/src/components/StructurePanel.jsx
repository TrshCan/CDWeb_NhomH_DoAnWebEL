import React, { useEffect, useState, useRef, useCallback } from "react";

export default function StructurePanel({
  questionGroups = [],
  activeSection,
  onSelect,
  onDuplicate,
  onDelete,
}) {

  // Bỏ-qua-đóng-menu 1 lần khi đổi activeSection do bấm ⋯
  const ignoreNextActiveChange = useRef(false);
  
  // State để quản lý collapsed cho từng group
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // ===================== MENU STATE =====================
  const [menu, setMenu] = useState({
    open: false,
    top: 0,
    left: 0,
    index: null,
  });

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    if (!menu.open) return;
    
    const onClickOutside = (e) => {
      const menuEl = document.getElementById("sp-menu-fixed");
      // Kiểm tra nếu click vào menu thì không đóng
      if (menuEl?.contains(e.target)) return;
      
      // Đóng menu khi click bất kỳ đâu khác
      // (nút 3 chấm sử dụng stopPropagation nên event này không nhận được click từ nút đó)
      setMenu((m) => ({ ...m, open: false }));
    };
    
    // Đăng ký event listener ở bubble phase (mặc định)
    // Nút 3 chấm dùng stopPropagation nên click từ nút đó không đến đây
    document.addEventListener("click", onClickOutside);
    
    return () => {
      document.removeEventListener("click", onClickOutside);
    };
  }, [menu.open]);

  // ===================== SPRING EFFECT =====================
  // Vị trí lệch hiện tại (px) cho transform
  const [kickY, setKickY] = useState(0);

  // Biến mô phỏng vật lý
  const yRef = useRef(0); // vị trí
  const vRef = useRef(0); // vận tốc
  const lastTsRef = useRef(0); // timestamp frame trước
  const lastScrollY = useRef(
    typeof window !== "undefined" ? window.scrollY : 0
  );
  const rafRef = useRef(null); // id rAF

  // Vòng lặp lò xo (hồi về 0 với giảm chấn)
  const startSpringLoop = useCallback(() => {
    if (rafRef.current) return;

    const step = (ts) => {
      const prevTs = lastTsRef.current || ts;
      const dt = Math.min(0.032, (ts - prevTs) / 1000); // tối đa 32ms/frame
      lastTsRef.current = ts;

      // Tham số lò xo (giữ nguyên tham số hiện có)
      const K = 360; // cứng lò xo (lớn -> hồi mạnh)
      const C = 1 * Math.sqrt(K); // hệ số cản (nhỏ -> nảy lâu hơn)

      let y = yRef.current;
      let v = vRef.current;

      // a = -k*y - c*v
      const a = -K * y - C * v;

      v = v + a * dt;
      y = y + v * dt;

      vRef.current = v;
      yRef.current = y;
      setKickY(y);

      // Dừng khi rất gần 0
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

  // Lắng nghe cuộn khi menu mở để bơm xung lực
  useEffect(() => {
    if (!menu.open) return;

    const onScroll = () => {
      const yNow = window.scrollY;
      const dy = yNow - (lastScrollY.current ?? yNow); // >0: cuộn xuống, <0: cuộn lên
      lastScrollY.current = yNow;
      if (dy === 0) return;

      // Xung lực theo tốc độ cuộn (GIỮ NGUYÊN giá trị bạn đang dùng)
      const impulse = -Math.sign(dy) * Math.min(30, Math.abs(dy) * 90);

      vRef.current += impulse;
      startSpringLoop();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [menu.open, startSpringLoop]);

  // Reset animation khi đổi mục + auto-close menu (trừ khi bỏ-qua-1-lần)
  useEffect(() => {
    if (ignoreNextActiveChange.current) {
      ignoreNextActiveChange.current = false;
      return;
    }
    setMenu((m) => (m.open ? { ...m, open: false } : m));

    // Reset spring
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    vRef.current = 0;
    yRef.current = 0;
    setKickY(0);
  }, [activeSection]);

  // Cleanup khi unmount (an toàn cho rAF)
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ===================== UI HELPERS =====================
  const Row = ({ title, active, onClick, icon, className = "" }) => (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left rounded-md px-3 py-2 mb-1 transition-colors select-none flex items-center gap-2 text-sm",
        active ? "bg-violet-600 text-white" : "text-gray-800 hover:bg-gray-100",
        className,
      ].join(" ")}
    >
      {icon}
      <span className="truncate">{title}</span>
    </button>
  );

  // Mở/toggle menu singleton tại toạ độ của nút ⋯
  const openMenuAt = (btnEl, menuData) => {
    if (!btnEl) return;
    const r = btnEl.getBoundingClientRect();

    const MENU_W = 224;
    let left = r.right + 38; // mở bên phải nút ⋯
    const top = r.top - 15; // toạ độ theo viewport

    // Nếu tràn mép phải thì lật sang trái
    if (left + MENU_W > window.innerWidth) {
      left = r.left - MENU_W - 8;
    }

    setMenu((prev) => {
      // Nhấn lại cùng 1 câu: toggle tắt
      if (prev.open && prev.index?.groupId === menuData.groupId && prev.index?.questionIndex === menuData.questionIndex) {
        return { ...prev, open: false };
      }
      // Đang mở câu khác: chuyển sang mở câu mới ngay
      return { open: true, top, left, index: menuData };
    });
  };

  return (
    <div className="w-full text-sm">
      {/* Chào mừng */}
      <Row
        title="Chào mừng"
        active={activeSection === "welcome"}
        onClick={() => {
          onSelect?.("welcome");
          setMenu((m) => (m.open ? { ...m, open: false } : m));
        }}
        icon={
          <span className="inline-block w-4 h-4 rounded-full border border-gray-400" />
        }
      />

      {/* Nhóm câu hỏi */}
      {questionGroups.map((group, groupIdx) => {
        const groupCollapsed = collapsedGroups[group.id] || false;
        return (
          <div key={group.id} className="px-1 py-2">
            <div className="flex items-center gap-2 text-gray-700 px-2 mb-1">
              {/* caret thu/mở */}
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setCollapsedGroups((prev) => ({
                    ...prev,
                    [group.id]: !prev[group.id],
                  }));
                }}
                aria-label="Thu gọn/Mở rộng"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={[
                    "w-4 h-4 transition-transform",
                    groupCollapsed ? " -rotate-90" : " rotate-0",
                  ].join("")}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 9l6 6 6-6"
                  />
                </svg>
              </button>

              {/* icon clipboard */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-gray-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 16h8M8 12h8M8 8h8M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                />
              </svg>

              <div className="font-medium truncate">
                {group.title || `Nhóm ${groupIdx + 1}`}
              </div>
            </div>

            {!groupCollapsed && (
              <div className="mt-1 text-sm">
                {group.questions.map((q, idx) => {
                  const qid = q?.id ?? idx + 1;
                  const key = "question-" + qid;
                  const isActive = activeSection === key;

                  return (
                    <div
                      key={key}
                      className={[
                        "relative flex items-center justify-between rounded-md px-3 py-2 mb-1 transition-colors select-none text-sm",
                        isActive
                          ? "bg-violet-600 text-white"
                          : "text-gray-800 hover:bg-gray-100",
                      ].join(" ")}
                      onClick={() => {
                        onSelect?.(key);
                        setMenu((m) => (m.open ? { ...m, open: false } : m));
                      }}
                    >
                      {/* Trái: icon + tiêu đề */}
                      <div className="flex items-center gap-2 truncate">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 6h16M4 12h10M4 18h16"
                          />
                        </svg>
                        <span className="truncate">
                          {q?.title || q?.text || "Câu hỏi của bạn là gì?"}
                        </span>
                      </div>

                      {/* Phải: nút 3 chấm — chọn dòng + mở menu singleton */}
                      <button
                        type="button"
                        aria-label="Mở menu"
                        className={[
                          "p-1 rounded-md transition-colors",
                          isActive
                            ? "hover:bg-violet-700"
                            : "hover:bg-gray-200 text-gray-600",
                        ].join(" ")}
                        onClick={(e) => {
                          e.stopPropagation();
                          ignoreNextActiveChange.current = true; // bỏ qua 1 lần auto-close
                          onSelect?.(key); // đổi activeSection
                          // Lưu groupId và questionIndex vào menu state
                          openMenuAt(e.currentTarget, { groupId: group.id, questionIndex: idx });
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6h.01M12 12h.01M12 18h.01"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Kết thúc */}
      <Row
        title="Kết thúc"
        active={activeSection === "end"}
        onClick={() => {
          onSelect?.("end");
          setMenu((m) => (m.open ? { ...m, open: false } : m));
        }}
        icon={
          <span className="inline-block w-4 h-4 rounded-full border border-gray-400" />
        }
      />

      {/* ======= MENU SINGLETON (fixed) ======= */}
      {menu.open && (
        <div
          id="sp-menu-fixed"
          className="fixed w-45 bg-white rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.1)] border border-gray-50 z-50"
          style={{
            top: menu.top,
            left: menu.left,
            transform: `translateY(${kickY}px)`,
            willChange: "transform",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ul className="py-4">
            <li>
              <button
                className="w-full text-left px-4 py-2 text-[11px] font-semibold hover:text-violet-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenu((m) => ({ ...m, open: false }));
                  if (menu.index?.groupId !== undefined && menu.index?.questionIndex !== undefined) {
                    onDuplicate?.(menu.index.groupId, menu.index.questionIndex);
                  }
                }}
              >
                NHÂN BẢN CÂU HỎI
              </button>
            </li>
            <li>
              <button
                className="w-full text-left px-4 py-2 text-[11px] text-red-700 hover:opacity-70"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenu((m) => ({ ...m, open: false }));
                  if (menu.index?.groupId !== undefined && menu.index?.questionIndex !== undefined) {
                    onDelete?.(menu.index.groupId, menu.index.questionIndex);
                  }
                }}
              >
                XOÁ CÂU HỎI
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
