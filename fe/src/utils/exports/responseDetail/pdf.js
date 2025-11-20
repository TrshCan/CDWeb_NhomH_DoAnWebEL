import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { sanitizeFileName } from "./csv";

export function exportResponseDetailPDF({ responseData }) {
  if (!responseData) throw new Error("No data to export");

  const { surveyTitle = "Survey", responseId } = responseData;
  const p = responseData.participant || {};
  const s = responseData.stats || {};
  const questions = Array.isArray(responseData.questions) ? responseData.questions : [];

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(`Response Report`, 14, 12);
  doc.setFontSize(10);
  doc.text(`${surveyTitle} — #${responseId}`, 14, 18);
  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: 26,
    theme: 'plain',
    body: [
      [{ content: `Name: ${p.name || ''} | Student ID: ${p.studentId || ''} | Faculty: ${p.faculty || ''}` }],
      [{ content: `Class: ${p.class || ''} | Completed at: ${p.completedAt || ''}` }],
      [{ content: `Time: ${s.completionTime || ''} | Answered: ${(s.answeredQuestions||0)}/${(s.totalQuestions||0)} | Score: ${(s.totalScore||0)}/${(s.maxScore||0)} (${s.scorePercentage!=null ? s.scorePercentage+'%' : ''})` }],
      [{ content: `Export date: ${new Date().toLocaleString('en-US')}` }],
    ],
    styles: { fontSize: 10, cellPadding: 2 },
    margin: { top: 26, left: 14, right: 14 },
  });

  let currentY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 6 : 32;

  questions.forEach((q, idx) => {
    let answer = '';
    if (q.type === 'text') {
      answer = q.answerText || '';
    } else if (Array.isArray(q.options)) {
      answer = q.options.filter(o => o.selected).map(o => o.text).join('; ');
    }

    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81);
    doc.text(`Question ${idx + 1}: ${q.question}`, 14, currentY);
    doc.setTextColor(0, 0, 0);

    const rows = [
      ["Answer", answer || '(No response)'],
      ["Score", `${q.score || 0} / ${q.points || 0}`],
    ];

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Field", "Value"]],
      body: rows,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 220 } },
      margin: { left: 14, right: 14, bottom: 20 },
      didDrawPage: (dataHook) => {
        const pageCount = doc.internal.getNumberOfPages();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(
          `Page ${dataHook.pageNumber} / ${pageCount} — Exported: ${new Date().toLocaleString('en-US')}`,
          pageWidth - 14,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'right' }
        );
      },
    });

    currentY = doc.lastAutoTable.finalY + 8;
    if (currentY > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      currentY = 26;
    }
  });

  const fileName = `${sanitizeFileName(surveyTitle)}_response_${sanitizeFileName(responseId)}_${Date.now()}.pdf`;
  doc.save(fileName);
}
