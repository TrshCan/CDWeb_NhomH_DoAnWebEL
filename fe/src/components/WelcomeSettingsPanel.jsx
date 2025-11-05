import React from "react";

function SegSwitch({ value, onChange }) {
  const on = value === true;
  return (
    <div className="flex w-40 h-10 rounded-sm overflow-hidden border border-gray-300">
      <button
        type="button"
        className={`flex-1 text-sm font-semibold ${on ? "bg-gray-200" : "bg-transparent"} `}
        onClick={() => onChange(true)}
      >
        Bật
      </button>
      <button
        type="button"
        className={`flex-1 text-sm font-semibold ${!on ? "bg-gray-500 text-white" : "bg-gray-500/60 text-white/80"} `}
        onClick={() => onChange(false)}
      >
        Tắt
      </button>
    </div>
  );
}

export default function WelcomeSettingsPanel({
  value = { showWelcome: true, showXQuestions: true },
  onChange,
  onClose,
}) {
  const { showWelcome, showXQuestions } = value;
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="h-12 bg-gray-200 flex items-center justify-between px-4">
          <span className="font-semibold text-gray-800">Cài đặt màn hình chào mừng</span>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            onClick={onClose}
            aria-label="Đóng"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
        <div>
          <div className="text-sm font-medium mb-2">Show welcome screen</div>
          <SegSwitch
            value={showWelcome}
            onChange={(v) => onChange?.({ ...value, showWelcome: v })}
          />
        </div>

        <div>
          <div className="text-sm font-medium mb-2">
            Show “There are X questions in this survey.”
          </div>
          <SegSwitch
            value={showXQuestions}
            onChange={(v) => onChange?.({ ...value, showXQuestions: v })}
          />
        </div>
      </div>
    </div>
  );
}
