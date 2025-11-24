// CSV export for Response Detail
export function sanitizeFileName(name) {
  return String(name)
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_")
    .substring(0, 100);
}

export function exportResponseDetailCSV({ responseData }) {
  if (!responseData) throw new Error("No data to export");

  const escape = (str) => {
    const s = String(str ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const { surveyTitle = "Survey", responseId } = responseData;
  const p = responseData.participant || {};
  const s = responseData.stats || {};
  const questions = Array.isArray(responseData.questions) ? responseData.questions : [];

  let csv = "";
  csv += `Title,${escape(surveyTitle)}\n`;
  csv += `Response ID,${escape(responseId)}\n\n`;

  csv += `Participant Information\n`;
  csv += `Name,Student ID,Faculty,Class,Completed At\n`;
  csv += `${escape(p.name||"")},${escape(p.studentId||"")},${escape(p.faculty||"")},${escape(p.class||"")},${escape(p.completedAt||"")}\n\n`;

  csv += `Statistics\n`;
  csv += `Completion Time,Answered/Total Questions,Score,Max Score,Percentage\n`;
  const answered = `${s.answeredQuestions||0}/${s.totalQuestions||0}`;
  csv += `${escape(s.completionTime||"")},${answered},${s.totalScore||0},${s.maxScore||0},${s.scorePercentage!=null?s.scorePercentage+"%":""}\n\n`;

  csv += `Question Details\n`;
  csv += `#,Question,Type,Answer,Score,Max Score\n`;
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
