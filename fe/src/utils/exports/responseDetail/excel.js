import * as XLSX from "xlsx";
import { sanitizeFileName } from "./csv";

export function exportResponseDetailExcel({ responseData }) {
  if (!responseData) throw new Error("No data to export");

  const { surveyTitle = "Survey", responseId } = responseData;
  const p = responseData.participant || {};
  const s = responseData.stats || {};
  const questions = Array.isArray(responseData.questions) ? responseData.questions : [];

  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summary = [
    ["Response Report"],
    ["Survey", surveyTitle],
    ["Response ID", responseId],
    ["Export Date", new Date().toLocaleString("en-US")],
    [],
    ["Participant Information"],
    ["Name", p.name || ""],
    ["Student ID", p.studentId || ""],
    ["Faculty", p.faculty || ""],
    ["Class", p.class || ""],
    ["Completed At", p.completedAt || ""],
    [],
    ["Statistics"],
    ["Completion Time", s.completionTime || ""],
    ["Answered/Total Questions", `${s.answeredQuestions || 0}/${s.totalQuestions || 0}`],
    ["Score", s.totalScore || 0],
    ["Max Score", s.maxScore || 0],
    ["Percentage", s.scorePercentage != null ? `${s.scorePercentage}%` : ""],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // Questions sheet
  const rows = questions.map((q, idx) => {
    let answer = "";
    if (q.type === "text") {
      answer = q.answerText || "";
    } else if (Array.isArray(q.options)) {
      answer = q.options.filter(o => o.selected).map(o => o.text).join("; ");
    }
    return {
      "#": idx + 1,
      "Question": q.question,
      "Type": q.type,
      "Answer": answer,
      "Score": q.score || 0,
      "Max Score": q.points || 0,
    };
  });
  const wsQ = XLSX.utils.json_to_sheet(rows);
  wsQ["!cols"] = [
    { wch: 4 },
    { wch: 60 },
    { wch: 16 },
    { wch: 50 },
    { wch: 10 },
    { wch: 12 },
  ];
  if (wsQ["!ref"]) {
    const headerCount = Object.keys(rows[0] || { a: 1 }).length;
    const range = XLSX.utils.decode_range(wsQ["!ref"]);
    wsQ["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: range.s.r, c: range.s.c }, e: { r: range.e.r, c: range.s.c + headerCount - 1 } }) };
  }
  XLSX.utils.book_append_sheet(wb, wsQ, "Answers");

  const fileName = `${sanitizeFileName(surveyTitle)}_response_${sanitizeFileName(responseId)}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
