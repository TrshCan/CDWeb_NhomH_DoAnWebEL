import * as XLSX from "xlsx";
import { sanitizeFileName } from "./csv";

export function exportSurveyRawExcel({ rows, title, filteredRawData, getKhoaLabel }) {
  const data = rows;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Không có dữ liệu để xuất");
  }

  const wb = XLSX.utils.book_new();

  // Summary sheet
  const facultyCounts = (filteredRawData || []).reduce((acc, item) => {
    const k = getKhoaLabel ? getKhoaLabel(item.khoa || "Khác") : (item.khoa || "Khác");
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const currentYear = new Date().getFullYear();
  const yearCounts = {
    "Sinh viên Năm nhất": 0,
    "Sinh viên Năm hai": 0,
    "Sinh viên Năm ba": 0,
    "Khác": 0,
  };
  (filteredRawData || []).forEach((item) => {
    const codeStr = String(item.studentId || "");
    const firstTwo = codeStr.substring(0, 2);
    const yy = parseInt(firstTwo, 10);
    if (!isNaN(yy) && firstTwo.length === 2) {
      const enrollYear = 2000 + yy;
      const diff = currentYear - enrollYear;
      if (diff === 0) yearCounts["Sinh viên Năm nhất"]++;
      else if (diff === 1) yearCounts["Sinh viên Năm hai"]++;
      else if (diff === 2) yearCounts["Sinh viên Năm ba"]++;
      else yearCounts["Khác"]++;
    } else yearCounts["Khác"]++;
  });

  const summaryRows = [
    ["Báo cáo dữ liệu khảo sát"],
    ["Khảo sát", title],
    ["Ngày xuất", new Date().toLocaleString("vi-VN")],
    ["Tổng số phản hồi", (filteredRawData || []).length],
    [],
    ["Phân bố theo Khoa"],
    ["Khoa", "Số lượng"],
    ...Object.keys(facultyCounts).sort().map((k) => [k, facultyCounts[k]]),
    [],
    ["Phân bố theo Niên khóa"],
    ["Nhóm", "Số lượng"],
    ...Object.entries(yearCounts).map(([k, v]) => [k, v]),
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Tổng quan");

  // Data sheet with widths + autofilter
  const ws = XLSX.utils.json_to_sheet(data);
  const colWidths = [
    { wch: 15 },
    { wch: 15 },
    { wch: 30 },
    { wch: 20 },
    { wch: 22 },
  ];
  ws["!cols"] = colWidths;
  const headerCount = Object.keys(data[0]).length;
  const range = XLSX.utils.decode_range(ws["!ref"]);
  ws["!autofilter"] = {
    ref: XLSX.utils.encode_range({ s: { r: range.s.r, c: range.s.c }, e: { r: range.e.r, c: range.s.c + headerCount - 1 } }),
  };
  XLSX.utils.book_append_sheet(wb, ws, "Dữ liệu");

  const fileName = `${sanitizeFileName(title)}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
