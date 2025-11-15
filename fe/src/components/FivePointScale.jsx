import React from "react";

export default function FivePointScale({
  questionId,
  selectedAnswer,
  onAnswerSelect,
  isActive,
}) {
  const points = [1, 2, 3, 4, 5];

  // Kiểm tra xem một điểm có được chọn không (hỗ trợ chọn nhiều)
  const isPointSelected = (point) => {
    if (Array.isArray(selectedAnswer)) {
      return selectedAnswer.map(String).includes(String(point));
    }
    return String(selectedAnswer) === String(point);
  };

  return (
    <div className="ml-[28px] mt-2">
      <div className="flex items-center" style={{ gap: "48px" }}>
        {points.map((point) => {
          const isSelected = isPointSelected(point);
          
          return (
            <div key={point} className="flex flex-col items-center" style={{ gap: "8px" }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isActive) {
                    onAnswerSelect?.(questionId, point, "Lựa chọn 5 điểm");
                  }
                }}
                disabled={isActive}
                className={`rounded-full border-2 transition-all ${
                  isActive
                    ? "border-gray-400 bg-white cursor-default"
                    : isSelected
                    ? "bg-white cursor-pointer"
                    : "border-gray-400 bg-white hover:border-green-300 cursor-pointer"
                }`}
                style={{
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderColor: isSelected && !isActive ? "#86efac" : undefined,
                }}
              >
                {isSelected && !isActive && (
                  <div
                    className="rounded-full"
                    style={{
                      width: "24px",
                      height: "24px",
                      backgroundColor: "#86efac",
                    }}
                  />
                )}
              </button>
              <span className="text-gray-700 font-medium text-sm">{point}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
