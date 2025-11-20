import React from "react";

export default function SidebarRail({ active, onOpen }) {
  const Btn = ({ label, isActive, onClick, children }) => (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={[
        "w-10 h-10 flex items-center justify-center transition-all duration-200 rounded-md",
        isActive
          ? "bg-gray-100 text-violet-600 shadow-sm"
          : "bg-gray-900 text-white hover:bg-gray-800",
      ].join(" ")}
    >
      {children}
    </button>
  );

  const isPanelOpen = active === "structure" || active === "settings";

  return (
    <div
      className={[
        "fixed left-0 top-[60px] h-[calc(100vh-60px)] w-14 flex flex-col items-center justify-start pt-4 gap-4 bg-white z-40",
        isPanelOpen ? "border-r-0" : "border-r border-gray-200",
      ].join(" ")}
    >
      {/* Kết cấu */}
      <Btn
        label="Kết cấu"
        isActive={active === "structure"}
        onClick={() => onOpen(active === "structure" ? null : "structure")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h12M4 18h16"
          />
        </svg>
      </Btn>

      {/* Cài đặt */}
      <Btn
        label="Cài đặt"
        isActive={active === "settings"}
        onClick={() => onOpen(active === "settings" ? null : "settings")}
      >
        <svg
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          aria-labelledby="settingsIconTitle"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
          fill="none"
          color="currentColor"
        >
          <title id="settingsIconTitle">Settings</title>
          <path d="M5.03506429,12.7050339 C5.01187484,12.4731696 5,12.2379716 5,12 C5,11.7620284 5.01187484,11.5268304 5.03506429,11.2949661 L3.20577137,9.23205081 L5.20577137,5.76794919 L7.9069713,6.32070904 C8.28729123,6.0461342 8.69629298,5.80882212 9.12862533,5.61412402 L10,3 L14,3 L14.8713747,5.61412402 C15.303707,5.80882212 15.7127088,6.0461342 16.0930287,6.32070904 L18.7942286,5.76794919 L20.7942286,9.23205081 L18.9649357,11.2949661 C18.9881252,11.5268304 19,11.7620284 19,12 C19,12.2379716 18.9881252,12.4731696 18.9649357,12.7050339 L20.7942286,14.7679492 L18.7942286,18.2320508 L16.0930287,17.679291 C15.7127088,17.9538658 15.303707,18.1911779 14.8713747,18.385876 L14,21 L10,21 L9.12862533,18.385876 C8.69629298,18.1911779 8.28729123,17.9538658 7.9069713,17.679291 L5.20577137,18.2320508 L3.20577137,14.7679492 L5.03506429,12.7050339 Z" />
          <circle cx="12" cy="12" r="1" />
        </svg>
      </Btn>

      {/* Chia sẻ */}
      <Btn
        label="Chia sẻ"
        isActive={active === "share"}
        onClick={() => onOpen(active === "share" ? null : "share")}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </Btn>
    </div>
  );
}
