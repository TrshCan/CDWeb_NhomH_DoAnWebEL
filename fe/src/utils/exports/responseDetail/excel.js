import * as XLSX from "xlsx";
import { sanitizeFileName } from "./csv";

export function exportResponseDetailExcel({ responseData }) {
  if (!responseData) throw new Error("Không có dữ liệu để xuất");

  const { surveyTitle = "Khảo sát", responseId } = responseData;
  const p = responseData.participant || {};
  const s = responseData.stats || {};
  const questions = Array.isArray(responseData.questions) ? responseData.questions : [];

  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summary = [
    ["Báo cáo Phản hồi"],
    ["Khảo sát", surveyTitle],
    ["Mã phản hồi", responseId],
    ["Ngày xuất", new Date().toLocaleString("vi-VN")],
    [],
    ["Thông tin người tham gia"],
    ["Họ tên", p.name || ""],
    ["MSSV", p.studentId || ""],
    ["Khoa", p.faculty || ""],
    ["Lớp", p.class || ""],
    ["Hoàn thành lúc", p.completedAt || ""],
    [],
    ["Thống kê"],
    ["Thời gian hoàn thành", s.completionTime || ""],
    ["Số câu đã trả lời/Tổng câu", `${s.answeredQuestions || 0}/${s.totalQuestions || 0}`],
    ["Điểm", s.totalScore || 0],
    ["Điểm tối đa", s.maxScore || 0],
    ["Phần trăm", s.scorePercentage != null ? `${s.scorePercentage}%` : ""],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Tổng quan");

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
      "Câu hỏi": q.question,
      "Loại": q.type,
      "Câu trả lời": answer,
      "Điểm": q.score || 0,
      "Điểm tối đa": q.points || 0,
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
  XLSX.utils.book_append_sheet(wb, wsQ, "Câu trả lời");

  const fileName = `${sanitizeFileName(surveyTitle)}_response_${sanitizeFileName(responseId)}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
