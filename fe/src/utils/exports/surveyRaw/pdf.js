import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { sanitizeFileName } from "./csv";

export function exportSurveyRawPDF({ rows, title, filteredRawData, getKhoaLabel }) {
  const data = rows;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("No data to export");
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Calculate statistics
  const facultyCounts = (filteredRawData || data).reduce((acc, item) => {
    const faculty = item["Khoa"] || item["Faculty"] || "Other";
    const k = getKhoaLabel ? getKhoaLabel(faculty) : faculty;
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const totalCount = (filteredRawData || data).length;
  const topFaculties = Object.entries(facultyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const exportDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // ==================== PAGE 1: COVER & SUMMARY ====================
  
  // Header gradient
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Accent bars
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageWidth, 3, 'F');
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 47, pageWidth, 3, 'F');

  // Logo placeholder (you can add image here)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 10, 30, 30, 3, 3, 'F');
  doc.setTextColor(59, 130, 246);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text("TDC", 29, 28, { align: 'center' });

  // Title section
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text("SURVEY DATA REPORT", 50, 22);
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`${title}`, 50, 32);
  
  doc.setFontSize(9);
  doc.text(`Generated: ${exportDate}`, 50, 40);

  // Statistics cards
  const cardY = 60;
  const cardWidth = (pageWidth - 42) / 3;
  const cardHeight = 35;
  const cardGap = 7;

  // Card 1: Total Responses
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, cardY, cardWidth, cardHeight, 3, 3, 'S');
  
  doc.setTextColor(59, 130, 246);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text("TOTAL RESPONSES", 14 + cardWidth / 2, cardY + 10, { align: 'center' });
  
  doc.setFontSize(28);
  doc.setFont(undefined, 'bold');
  doc.text(String(totalCount), 14 + cardWidth / 2, cardY + 25, { align: 'center' });

  // Card 2: Faculties
  const card2X = 14 + cardWidth + cardGap;
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(card2X, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(card2X, cardY, cardWidth, cardHeight, 3, 3, 'S');
  
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text("FACULTIES", card2X + cardWidth / 2, cardY + 10, { align: 'center' });
  
  doc.setFontSize(28);
  doc.setFont(undefined, 'bold');
  doc.text(String(Object.keys(facultyCounts).length), card2X + cardWidth / 2, cardY + 25, { align: 'center' });

  // Card 3: Completion Rate
  const card3X = card2X + cardWidth + cardGap;
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(card3X, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(card3X, cardY, cardWidth, cardHeight, 3, 3, 'S');
  
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text("COMPLETION RATE", card3X + cardWidth / 2, cardY + 10, { align: 'center' });
  
  doc.setFontSize(28);
  doc.setFont(undefined, 'bold');
  doc.text("100%", card3X + cardWidth / 2, cardY + 25, { align: 'center' });

  // Top Faculties Section
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text("Top Faculties by Response Count", 14, 110);

  // Top faculties table
  const topFacultiesData = topFaculties.map(([faculty, count], index) => [
    `${index + 1}`,
    faculty,
    String(count),
    `${((count / totalCount) * 100).toFixed(1)}%`
  ]);

  autoTable(doc, {
    startY: 115,
    head: [["Rank", "Faculty", "Responses", "Percentage"]],
    body: topFacultiesData,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 11,
      halign: 'center',
      cellPadding: 4
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
      lineColor: [226, 232, 240],
      lineWidth: 0.3
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 120 },
      2: { cellWidth: 40, halign: 'center' },
      3: { cellWidth: 40, halign: 'center', fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 }
  });

  // Add new page for detailed data
  doc.addPage();

  // ==================== PAGE 2+: DETAILED DATA ====================
  
  // Header for data pages
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text("Detailed Response Data", 14, 12);
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text(`Survey: ${title}`, 14, 19);

  // Prepare table data with row numbers
  const tableData = data.map((row, index) => [
    String(index + 1),
    row["ID Phản hồi"] || row["Response ID"] || "",
    row["Mã SV"] || row["Student ID"] || "",
    row["Tên Sinh viên"] || row["Student Name"] || "",
    row["Khoa"] || row["Faculty"] || "",
    row["Ngày Hoàn thành"] || row["Completed Date"] || "",
  ]);

  autoTable(doc, {
    startY: 30,
    head: [["No.", "Response ID", "Student ID", "Student Name", "Faculty", "Completed Date"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 10,
      halign: 'center',
      cellPadding: 3
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center', fontStyle: 'bold', fillColor: [249, 250, 251] },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 65 },
      4: { cellWidth: 40 },
      5: { cellWidth: 38, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { top: 30, left: 14, right: 14, bottom: 20 },
    didDrawPage: (dataHook) => {
      // Skip header on first page (already drawn)
      if (dataHook.pageNumber > 1) {
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 0, pageWidth, 25, 'F');
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, pageWidth, 2, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text("Detailed Response Data (continued)", 14, 12);
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`Survey: ${title}`, 14, 19);
      }

      const pageCount = doc.internal.getNumberOfPages();
      
      // Footer background
      doc.setFillColor(249, 250, 251);
      doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
      
      // Footer line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
      
      // Page number
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont(undefined, 'normal');
      doc.text(
        `Page ${dataHook.pageNumber} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
      
      // Branding
      doc.setFontSize(8);
      doc.text(
        "Generated by Survey System",
        pageWidth - 14,
        pageHeight - 6,
        { align: 'right' }
      );
      
      // Export date
      doc.text(
        exportDate,
        14,
        pageHeight - 6
      );
    },
  });

  const fileName = `${sanitizeFileName(title)}_${Date.now()}.pdf`;
  doc.save(fileName);
}
