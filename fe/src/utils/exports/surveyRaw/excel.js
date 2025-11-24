import * as XLSX from "xlsx";
import { sanitizeFileName } from "./csv";

export async function exportSurveyRawExcel({ rows, title, filteredRawData, getKhoaLabel }) {
  const data = rows;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("No data to export");
  }

  const wb = XLSX.utils.book_new();

  // Calculate statistics
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

  // ==================== SUMMARY SHEET ====================
  const summaryRows = [
    [], // Row for logo space
    [],
    ["SURVEY DATA REPORT"],
    [],
    ["Survey Information"],
    ["Survey Title:", title],
    ["Export Date:", exportDate],
    ["Total Responses:", (filteredRawData || []).length],
    ["Status:", "Completed"],
    [],
    [],
    ["RESPONSE DISTRIBUTION BY FACULTY"],
    ["Faculty", "Count", "Percentage"],
    ...Object.keys(facultyCounts).sort().map((k) => [
      k, 
      facultyCounts[k],
      `${((facultyCounts[k] / (filteredRawData || []).length) * 100).toFixed(1)}%`
    ]),
    [],
    ["Total", (filteredRawData || []).length, "100%"],
    [],
    [],
    ["RESPONSE DISTRIBUTION BY YEAR"],
    ["Year Group", "Count", "Percentage"],
    ...Object.entries(yearCounts).map(([k, v]) => [
      k, 
      v,
      `${((v / (filteredRawData || []).length) * 100).toFixed(1)}%`
    ]),
    [],
    ["Total", (filteredRawData || []).length, "100%"],
  ];
  
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  
  // Set column widths for summary
  wsSummary["!cols"] = [
    { wch: 25 },
    { wch: 30 },
    { wch: 15 }
  ];
  
  // Set row heights
  wsSummary["!rows"] = [
    { hpt: 60 }, // Logo row
    { hpt: 10 },
    { hpt: 25 }, // Title row
  ];
  
  // Merge cells
  if (!wsSummary["!merges"]) wsSummary["!merges"] = [];
  wsSummary["!merges"].push(
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Logo row
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } }, // Title
    { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } }, // Survey Information header
    { s: { r: 11, c: 0 }, e: { r: 11, c: 2 } }, // Faculty header
    { s: { r: 11 + Object.keys(facultyCounts).length + 4, c: 0 }, e: { r: 11 + Object.keys(facultyCounts).length + 4, c: 2 } } // Year header
  );

  // Apply styles to summary sheet
  const summaryStyles = {
    // Title style
    "A3": { 
      font: { bold: true, sz: 18, color: { rgb: "3B82F6" } },
      alignment: { horizontal: "center", vertical: "center" }
    },
    // Section headers
    "A5": { 
      font: { bold: true, sz: 12, color: { rgb: "1F2937" } },
      fill: { fgColor: { rgb: "F3F4F6" } },
      alignment: { vertical: "center" }
    },
    "A12": { 
      font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "3B82F6" } },
      alignment: { horizontal: "center", vertical: "center" }
    },
  };

  // Apply styles
  Object.keys(summaryStyles).forEach(cell => {
    if (!wsSummary[cell]) wsSummary[cell] = { t: "s", v: "" };
    wsSummary[cell].s = summaryStyles[cell];
  });
  
  XLSX.utils.book_append_sheet(wb, wsSummary, "📊 Summary");

  // ==================== DATA SHEET ====================
  const englishData = data.map((row, index) => ({
    "No.": index + 1,
    "Response ID": row["ID Phản hồi"] || row["Response ID"] || "",
    "Student ID": row["Mã SV"] || row["Student ID"] || "",
    "Student Name": row["Tên Sinh viên"] || row["Student Name"] || "",
    "Faculty": row["Khoa"] || row["Faculty"] || "",
    "Completed Date": row["Ngày Hoàn thành"] || row["Completed Date"] || ""
  }));
  
  // Create data sheet with header row
  const dataRows = [
    [], // Space for title
    ["SURVEY RESPONSES - DETAILED DATA"],
    [],
    Object.keys(englishData[0]), // Headers
    ...englishData.map(row => Object.values(row)) // Data rows
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(dataRows);
  
  // Set column widths
  ws["!cols"] = [
    { wch: 6 },   // No.
    { wch: 15 },  // Response ID
    { wch: 18 },  // Student ID
    { wch: 35 },  // Student Name
    { wch: 25 },  // Faculty
    { wch: 22 },  // Completed Date
  ];
  
  // Set row heights
  ws["!rows"] = [
    { hpt: 30 },
    { hpt: 25 },
    { hpt: 10 },
    { hpt: 20 }, // Header row
  ];
  
  // Merge title row
  if (!ws["!merges"]) ws["!merges"] = [];
  ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 5 } });
  
  // Add autofilter to data (starting from row 3, which is the header)
  const dataRange = XLSX.utils.decode_range(ws["!ref"]);
  ws["!autofilter"] = {
    ref: XLSX.utils.encode_range({ 
      s: { r: 3, c: 0 }, 
      e: { r: dataRange.e.r, c: 5 } 
    }),
  };

  // Apply styles to data sheet
  const headerRow = 3; // 0-indexed
  for (let col = 0; col <= 5; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
    if (!ws[cellAddress]) ws[cellAddress] = { t: "s", v: "" };
    ws[cellAddress].s = {
      font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "3B82F6" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
  }

  // Style title
  const titleCell = "A2";
  if (!ws[titleCell]) ws[titleCell] = { t: "s", v: "" };
  ws[titleCell].s = {
    font: { bold: true, sz: 14, color: { rgb: "1F2937" } },
    alignment: { horizontal: "center", vertical: "center" }
  };

  // Add alternating row colors to data
  for (let row = 4; row < dataRows.length; row++) {
    const fillColor = row % 2 === 0 ? "FFFFFF" : "F9FAFB";
    for (let col = 0; col <= 5; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        fill: { fgColor: { rgb: fillColor } },
        alignment: { 
          horizontal: col === 0 || col === 1 || col === 2 || col === 5 ? "center" : "left",
          vertical: "center" 
        },
        border: {
          top: { style: "thin", color: { rgb: "E5E7EB" } },
          bottom: { style: "thin", color: { rgb: "E5E7EB" } },
          left: { style: "thin", color: { rgb: "E5E7EB" } },
          right: { style: "thin", color: { rgb: "E5E7EB" } }
        }
      };
    }
  }
  
  XLSX.utils.book_append_sheet(wb, ws, "📋 Data");

  // ==================== EXPORT ====================
  const fileName = `${sanitizeFileName(title)}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName, { 
    bookType: 'xlsx',
    bookSST: false,
    type: 'binary'
  });
}
