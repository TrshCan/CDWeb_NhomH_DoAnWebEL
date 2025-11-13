// CSV export for Response Detail
export function sanitizeFileName(name) {
  return String(name)
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_")
    .substring(0, 100);
}

export function exportResponseDetailCSV({ responseData }) {
  if (!responseData) throw new Error("Không có dữ liệu để xuất");

  const escape = (str) => {
    const s = String(str ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const { surveyTitle = "Khảo sát", responseId } = responseData;
  const p = responseData.participant || {};
  const s = responseData.stats || {};
  const questions = Array.isArray(responseData.questions) ? responseData.questions : [];

  let csv = "";
  csv += `Tiêu đề,${escape(surveyTitle)}\n`;
  csv += `Mã phản hồi,${escape(responseId)}\n\n`;

  csv += `Thông tin người tham gia\n`;
  csv += `Họ tên,MSSV,Khoa,Lớp,Hoàn thành lúc\n`;
  csv += `${escape(p.name||"")},${escape(p.studentId||"")},${escape(p.faculty||"")},${escape(p.class||"")},${escape(p.completedAt||"")}\n\n`;

  csv += `Thống kê\n`;
  csv += `Thời gian hoàn thành,Số câu đã trả lời/Tổng câu,Điểm,Tối đa,Phần trăm\n`;
  const answered = `${s.answeredQuestions||0}/${s.totalQuestions||0}`;
  csv += `${escape(s.completionTime||"")},${answered},${s.totalScore||0},${s.maxScore||0},${s.scorePercentage!=null?s.scorePercentage+"%":""}\n\n`;

  csv += `Chi tiết câu hỏi\n`;
  csv += `#,Câu hỏi,Loại,Câu trả lời,Điểm,Điểm tối đa\n`;
  questions.forEach((q, idx) => {
    let answer = "";
    if (q.type === "text") {
      answer = q.answerText || "";
    } else if (Array.isArray(q.options)) {
      const selected = q.options.filter(o => o.selected).map(o => o.text);
      answer = selected.join("; ");
    }
    csv += `${idx+1},${escape(q.question)},${escape(q.type)},${escape(answer)},${q.score||0},${q.points||0}\n`;
  });

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  const fileName = `${sanitizeFileName(surveyTitle)}_response_${sanitizeFileName(responseId)}_${Date.now()}.csv`;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
