import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { sanitizeFileName } from "./csv";

export function exportSurveyOverviewPDF({ overviewData }) {
  if (!overviewData || !overviewData.questions || overviewData.questions.length === 0) {
    throw new Error("Không có dữ liệu tổng quan để xuất");
  }

  const { title = "Khảo sát", totalResponses = 0, questions = [] } = overviewData;
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

  // Summary box
  autoTable(doc, {
    startY: 26,
    theme: 'plain',
    body: [
      [{ content: `Tổng số phản hồi: ${totalResponses}`, styles: { fontStyle: 'bold' } }],
      [{ content: `Ngày xuất: ${new Date().toLocaleString('vi-VN')}` }],
    ],
    styles: { fontSize: 10, cellPadding: 2 },
    margin: { top: 26, left: 14, right: 14 },
  });

  let currentY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 6 : 32;

  // Per-question tables
  questions.forEach((q, idx) => {
    const stats = q.answer_stats || [];
    const total = stats.reduce((sum, s) => sum + (s.count || 0), 0) || 1;
    const rows = stats.map((s) => [
      s.option_text || '(Không có)',
      s.count || 0,
      `${Math.round(((s.count || 0) / total) * 100)}%`,
    ]);

    // Section title
    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81);
    doc.text(`Câu hỏi ${idx + 1}: ${q.question_text}`, 14, currentY);
    doc.setTextColor(0, 0, 0);

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Lựa chọn", "Số lượng", "Phần trăm"]],
      body: rows.length ? rows : [["(Chưa có dữ liệu)", 0, "0%"]],
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 25 }, 2: { cellWidth: 25 } },
      margin: { left: 14, right: 14, bottom: 20 },
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

    currentY = doc.lastAutoTable.finalY + 8;
    // Add a new page if near bottom
    if (currentY > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      currentY = 26;
    }
  });

  const fileName = `${sanitizeFileName(title)}_overview_${Date.now()}.pdf`;
  doc.save(fileName);
}
