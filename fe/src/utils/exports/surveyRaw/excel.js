import * as XLSX from "xlsx";
import { sanitizeFileName } from "./csv";

export function exportSurveyRawExcel({ rows, title, filteredRawData, getKhoaLabel }) {
  const data = rows;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("No data to export");
  }

  const wb = XLSX.utils.book_new();

  // Summary sheet with English labels
  const facultyCounts = (filteredRawData || []).reduce((acc, item) => {
    const k = getKhoaLabel ? getKhoaLabel(item.khoa || "Other") : (item.khoa || "Other");
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const currentYear = new Date().getFullYear();
  const yearCounts = {
    "First Year": 0,
    "Second Year": 0,
    "Third Year": 0,
    "Other": 0,
  };
  (filteredRawData || []).forEach((item) => {
    const codeStr = String(item.studentId || "");
    const firstTwo = codeStr.substring(0, 2);
    const yy = parseInt(firstTwo, 10);
    if (!isNaN(yy) && firstTwo.length === 2) {
      const enrollYear = 2000 + yy;
      const diff = currentYear - enrollYear;
      if (diff === 0) yearCounts["First Year"]++;
      else if (diff === 1) yearCounts["Second Year"]++;
      else if (diff === 2) yearCounts["Third Year"]++;
      else yearCounts["Other"]++;
    } else yearCounts["Other"]++;
  });

  const exportDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const summaryRows = [
    ["SURVEY DATA REPORT"],
    [],
    ["Survey Title", title],
    ["Export Date", exportDate],
    ["Total Responses", (filteredRawData || []).length],
    [],
    ["DISTRIBUTION BY FACULTY"],
    ["Faculty", "Count"],
    ...Object.keys(facultyCounts).sort().map((k) => [k, facultyCounts[k]]),
    [],
    ["DISTRIBUTION BY YEAR"],
    ["Year Group", "Count"],
    ...Object.entries(yearCounts).map(([k, v]) => [k, v]),
  ];
  
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  
  // Style the summary sheet
  wsSummary["!cols"] = [{ wch: 25 }, { wch: 20 }];
  
  // Merge cells for title
  if (!wsSummary["!merges"]) wsSummary["!merges"] = [];
  wsSummary["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });
  
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // Data sheet with English headers
  const englishData = data.map(row => ({
    "Response ID": row["ID Phản hồi"] || row["Response ID"] || "",
    "Student ID": row["Mã SV"] || row["Student ID"] || "",
    "Student Name": row["Tên Sinh viên"] || row["Student Name"] || "",
    "Faculty": row["Khoa"] || row["Faculty"] || "",
    "Completed Date": row["Ngày Hoàn thành"] || row["Completed Date"] || ""
  }));
  
  const ws = XLSX.utils.json_to_sheet(englishData);
  
  // Set column widths
  const colWidths = [
    { wch: 15 },  // Response ID
    { wch: 18 },  // Student ID
    { wch: 35 },  // Student Name
    { wch: 25 },  // Faculty
    { wch: 22 },  // Completed Date
  ];
  ws["!cols"] = colWidths;
  
  // Add autofilter
  const headerCount = Object.keys(englishData[0]).length;
  const range = XLSX.utils.decode_range(ws["!ref"]);
  ws["!autofilter"] = {
    ref: XLSX.utils.encode_range({ 
      s: { r: range.s.r, c: range.s.c }, 
      e: { r: range.e.r, c: range.s.c + headerCount - 1 } 
    }),
  };
  
  XLSX.utils.book_append_sheet(wb, ws, "Data");

  const fileName = `${sanitizeFileName(title)}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
