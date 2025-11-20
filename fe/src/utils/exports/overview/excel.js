import * as XLSX from "xlsx";
import { sanitizeFileName } from "./csv";

// Export overview aggregated data: per-question options with counts and percentages
export function exportSurveyOverviewExcel({ overviewData }) {
  if (!overviewData || !overviewData.questions || overviewData.questions.length === 0) {
    throw new Error("Không có dữ liệu tổng quan để xuất");
  }

  const { title = "Khảo sát", totalResponses = 0, questions = [] } = overviewData;
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryRows = [
    ["Báo cáo Tổng quan Khảo sát"],
    ["Khảo sát", title],
    ["Ngày xuất", new Date().toLocaleString("vi-VN")],
    ["Tổng số phản hồi", totalResponses],
    ["Số lượng câu hỏi", questions.length],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Tổng quan");

  // Flatten per-question stats for a single filterable sheet
  const dataRows = [];
  questions.forEach((q, idx) => {
    const total = (q.answer_stats || []).reduce((sum, s) => sum + (s.count || 0), 0) || 1;
    (q.answer_stats || []).forEach((s) => {
      const pct = Math.round(((s.count || 0) / total) * 100);
      dataRows.push({
        "#": idx + 1,
        "Câu hỏi": q.question_text,
        "Loại": q.question_type,
        "Lựa chọn": s.option_text || "(Không có)",
        "Số lượng": s.count || 0,
        "Phần trăm": `${pct}%`,
      });
    });
  });

  const wsData = XLSX.utils.json_to_sheet(dataRows);
  wsData["!cols"] = [
    { wch: 4 },
    { wch: 60 },
    { wch: 16 },
    { wch: 36 },
    { wch: 12 },
    { wch: 12 },
  ];
  if (wsData["!ref"]) {
    const headerCount = Object.keys(dataRows[0] || { a: 1 }).length;
    const range = XLSX.utils.decode_range(wsData["!ref"]);
    wsData["!autofilter"] = {
      ref: XLSX.utils.encode_range({ s: { r: range.s.r, c: range.s.c }, e: { r: range.e.r, c: range.s.c + headerCount - 1 } }),
    };
  }
  XLSX.utils.book_append_sheet(wb, wsData, "Câu hỏi");

  const fileName = `${sanitizeFileName(title)}_overview_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
