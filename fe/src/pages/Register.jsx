import { useState, useEffect, useRef } from "react";

/**
 * SurveyBuilderUI
 * - React + TailwindCSS
 * - Mimics a simple survey builder layout with: Welcome screen, Question group, and End screen
 * - Keyboard: Enter triggers the primary action (Start or Finish) depending on the current step
 */
export default function SurveyBuilderUI() {
  const [language, setLanguage] = useState("Tiếng Việt - Tiếng Việt");
  const [step, setStep] = useState("idle"); // idle | started | finished

  // Content states (you can wire these to props/form later)
  const [welcomeTitle, setWelcomeTitle] = useState("Tiêu đề chào mừng");
  const [welcomeDesc, setWelcomeDesc] = useState("Mô tả chào mừng");
  const questionInputRef = useRef(null);

  const [questionTitle, setQuestionTitle] = useState("Câu hỏi của bạn ở đây");
  const [questionHelp, setQuestionHelp] = useState("Mô tả trợ giúp tùy chọn");

  const [endNote, setEndNote] = useState("Nhập thông báo kết thúc của bạn tại đây.");

  // Pressing Enter advances the flow based on step
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (step === "idle") handleStart();
        else if (step === "started") handleFinish();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [step]);

  const handleStart = () => {
    setStep("started");
    // focus first field in the question card on start
    setTimeout(() => questionInputRef.current?.focus(), 50);
  };

  const handleFinish = () => {
    setStep("finished");
  };

  return (
    <div className="min-h-screen w-full bg-neutral-50 p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Welcome Screen */}
        <Section title="Màn hình chào mừng">
          <div className="rounded-xl border border-violet-300/50 bg-violet-50 p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm text-violet-700">
              <GlobeIcon className="h-4 w-4" />
              <span>Thay đổi ngôn ngữ</span>
              <span className="font-medium">{language}</span>
              <LanguageDropdown language={language} setLanguage={setLanguage} />
            </div>

            <EditableHeading value={welcomeTitle} onChange={setWelcomeTitle} />
            <EditableSub value={welcomeDesc} onChange={setWelcomeDesc} />

            <p className="mt-1 text-sm text-neutral-600">Có 1 câu hỏi trong cuộc khảo sát này.</p>

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={handleStart}
                className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                Bắt đầu khảo sát
              </button>
              <span className="text-sm text-neutral-500">hoặc nhấn ↵</span>
            </div>
          </div>
        </Section>

        {/* Question Group */}
        <Section title="Nhóm câu hỏi đầu tiên của tôi" badge="1">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-violet-600">
              <span className="text-xs font-semibold">1→</span>
              <span className="text-xs">&nbsp;</span>
            </div>

            <input
              ref={questionInputRef}
              value={questionTitle}
              onChange={(e) => setQuestionTitle(e.target.value)}
              className="w-full border-0 bg-transparent text-xl font-semibold outline-none placeholder:text-neutral-400"
              placeholder="Câu hỏi của bạn ở đây"
            />
            <input
              value={questionHelp}
              onChange={(e) => setQuestionHelp(e.target.value)}
              className="mt-2 w-full border-0 bg-transparent text-sm text-neutral-500 outline-none placeholder:text-neutral-400"
              placeholder="Mô tả trợ giúp tùy chọn"
            />
          </div>

          {/* Add new block separator */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="h-px w-full bg-violet-200" />
            <button
              className="absolute -top-3 inline-flex h-7 w-7 items-center justify-center rounded-md border border-violet-300 bg-white text-violet-700 shadow-sm hover:bg-violet-50"
              title="Thêm một khối"
            >
              +
            </button>
          </div>
        </Section>

        {/* End Screen */}
        <Section title="Màn hình kết thúc">
          <div className="rounded-xl border bg-blue-50 p-6 shadow-sm">
            <textarea
              value={endNote}
              onChange={(e) => setEndNote(e.target.value)}
              className="w-full resize-y rounded-md border border-transparent bg-transparent p-2 text-[15px] text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-blue-300"
              placeholder="Nhập thông báo kết thúc của bạn tại đây."
              rows={2}
            />

            <div className="mt-4">
              <button
                onClick={handleFinish}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                Hoàn thành
              </button>
              {step === "finished" && (
                <span className="ml-3 text-sm text-emerald-700">Đã hoàn thành ✓</span>
              )}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, badge, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button className="group flex w-full items-center justify-between rounded-t-lg bg-transparent p-0 text-left">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <ChevronDown className="h-4 w-4" />
            <span>{title}</span>
            {badge && (
              <span className="ml-1 inline-flex items-center justify-center rounded bg-violet-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                {badge}
              </span>
            )}
          </div>
        </button>
      </div>
      {children}
    </div>
  );
}

function EditableHeading({ value, onChange }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border-0 bg-transparent text-3xl font-semibold leading-tight outline-none placeholder:text-neutral-400"
      placeholder="Tiêu đề chào mừng"
    />
  );
}

function EditableSub({ value, onChange }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-2 w-full border-0 bg-transparent text-[15px] text-neutral-700 outline-none placeholder:text-neutral-400"
      placeholder="Mô tả chào mừng"
    />
  );
}

function LanguageDropdown({ language, setLanguage }) {
  const [open, setOpen] = useState(false);
  const langs = [
    "Tiếng Việt - Tiếng Việt",
    "English - US",
    "日本語 - Japanese",
  ];
  return (
    <div className="relative inline-block">
      <button
        className="rounded-md border border-violet-200 bg-white px-2 py-1 text-xs text-violet-700 hover:bg-violet-50"
        onClick={() => setOpen((o) => !o)}
      >
        Thay đổi
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-56 overflow-hidden rounded-md border bg-white shadow-lg">
          {langs.map((l) => (
            <button
              key={l}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-violet-50 ${
                l === language ? "bg-violet-50 font-medium text-violet-700" : "text-neutral-700"
              }`}
              onClick={() => {
                setLanguage(l);
                setOpen(false);
              }}
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Simple icons (pure SVG) to avoid external libs */
function GlobeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}

function ChevronDown(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
