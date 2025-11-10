import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { sanitizeFileName } from "./csv";

export function exportSurveyOverviewPDF({ title, filteredData }) {
  const rows = Array.isArray(filteredData) ? filteredData : [];
  const data = rows.map((item) => [
    item.studentId,
    item.studentName,
    item.khoa,
    item.completedDate,
  ]);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Header bar
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(`Báo cáo Tổng quan Khảo sát`, 14, 12);
  doc.setFontSize(10);
  doc.text(`${title}`, 14, 18);
  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: 26,
    head: [["Mã SV", "Tên Sinh viên", "Khoa", "Ngày Hoàn thành"]],
    body: data,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 60 }, 2: { cellWidth: 40 }, 3: { cellWidth: 40 } },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 26, left: 14, right: 14, bottom: 20 },
    didDrawPage: (dataHook) => {
      const pageCount = doc.internal.getNumberOfPages();
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(
        `Trang ${dataHook.pageNumber} / ${pageCount} — Xuất: ${new Date().toLocaleString('vi-VN')}`,
        pageWidth - 14,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      );
    },
  });

  const fileName = `${sanitizeFileName(title)}_overview_${Date.now()}.pdf`;
  doc.save(fileName);
}
