import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { sanitizeFileName } from "./csv";

export function exportSurveyRawPDF({ rows, title }) {
  const data = rows;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Không có dữ liệu để xuất");
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Header bar
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(`Báo cáo dữ liệu khảo sát`, 14, 12);
  doc.setFontSize(10);
  doc.text(`${title}`, 14, 18);
  doc.setTextColor(0, 0, 0);

  const tableData = data.map((row) => [
    row["ID Phản hồi"],
    row["Mã SV"],
    row["Tên Sinh viên"],
    row["Khoa"],
    row["Ngày Hoàn thành"],
  ]);

  autoTable(doc, {
    startY: 26,
    head: [["ID Phản hồi", "Mã SV", "Tên Sinh viên", "Khoa", "Ngày Hoàn thành"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 35 }, 2: { cellWidth: 60 }, 3: { cellWidth: 40 }, 4: { cellWidth: 40 } },
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

  const fileName = `${sanitizeFileName(title)}_${Date.now()}.pdf`;
  doc.save(fileName);
}
