// CSV export for Survey Overview
export function sanitizeFileName(name) {
  return String(name)
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_")
    .substring(0, 100);
}

export function exportSurveyOverviewCSV({ overviewData }) {
  if (!overviewData || !overviewData.questions || overviewData.questions.length === 0) {
    throw new Error("Không có dữ liệu tổng quan để xuất");
  }

  const { title = "Khảo sát", totalResponses = 0, questions = [] } = overviewData;

  const escape = (str) => {
    const s = String(str ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  let csvContent = "";
  csvContent += `Tiêu đề,${escape(title)}\n`;
  csvContent += `Tổng số phản hồi,${totalResponses}\n\n`;

  questions.forEach((q, idx) => {
    const total = (q.answer_stats || []).reduce((sum, s) => sum + (s.count || 0), 0) || 1;
    csvContent += `Câu hỏi ${idx + 1},${escape(q.question_text)}\n`;
    csvContent += `Lựa chọn,Số lượng,Phần trăm\n`;
    (q.answer_stats || []).forEach((s) => {
      const pct = Math.round(((s.count || 0) / total) * 100);
      csvContent += `${escape(s.option_text || "(Không có)")},${s.count || 0},${pct}%\n`;
    });
    csvContent += "\n";
  });

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  const fileName = `${sanitizeFileName(title)}_overview_${Date.now()}.csv`;
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
