import * as XLSX from "xlsx";
import { sanitizeFileName } from "./csv";

export function exportSurveyOverviewExcel({ title, filteredData }) {
  const rows = Array.isArray(filteredData) ? filteredData : [];
  // Build export table from filteredData (overview exports a respondent list summary)
  const data = rows.map((item) => ({
    "Mã SV": item.studentId,
    "Tên Sinh viên": item.studentName,
    "Khoa": item.khoa,
    "Ngày Hoàn thành": item.completedDate,
  }));

  const wb = XLSX.utils.book_new();

  // Summary sheet
  const total = rows.length;
  const facultyCounts = rows.reduce((acc, item) => {
    const k = item.khoa || "Khác";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const yearCounts = {
    "Sinh viên Năm nhất": 0,
    "Sinh viên Năm hai": 0,
    "Sinh viên Năm ba": 0,
    "Khác": 0,
  };
  const currentYear = new Date().getFullYear();
  rows.forEach((item) => {
    const codeStr = String(item?.studentId || "");
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
    ["Báo cáo Tổng quan Khảo sát"],
    ["Khảo sát", title],
    ["Ngày xuất", new Date().toLocaleString("vi-VN")],
    ["Tổng số phản hồi", total],
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
  ws["!cols"] = [
    { wch: 15 },
    { wch: 30 },
    { wch: 20 },
    { wch: 22 },
  ];
  if (ws["!ref"]) {
    const headerCount = Object.keys(data[0] || { a: 1 }).length;
    const range = XLSX.utils.decode_range(ws["!ref"]);
    ws["!autofilter"] = {
      ref: XLSX.utils.encode_range({ s: { r: range.s.r, c: range.s.c }, e: { r: range.e.r, c: range.s.c + headerCount - 1 } }),
    };
  }
  XLSX.utils.book_append_sheet(wb, ws, "Danh sách");

  const fileName = `${sanitizeFileName(title)}_overview_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
