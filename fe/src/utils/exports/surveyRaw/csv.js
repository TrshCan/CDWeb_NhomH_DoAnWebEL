// CSV export utilities for Survey Raw Data
export function sanitizeFileName(name) {
  return String(name)
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_")
    .substring(0, 100);
}

export function exportSurveyRawCSV({ rows, title }) {
  const data = rows;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("No data to export");
  }

  // Convert to English headers
  const englishHeaders = ["Response ID", "Student ID", "Student Name", "Faculty", "Completed Date"];
  const vietnameseHeaders = ["ID Phản hồi", "Mã SV", "Tên Sinh viên", "Khoa", "Ngày Hoàn thành"];
  
  // Create CSV with English headers
  let csvContent = englishHeaders.join(",") + "\n";

  data.forEach((row) => {
    const values = vietnameseHeaders.map((header, index) => {
      const value = row[header] || row[englishHeaders[index]] || "";
      const str = String(value);
      return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    });
    csvContent += values.join(",") + "\n";
  });

  // Add metadata header
  const exportDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const metadata = `Survey Data Report\n` +
                   `Survey: ${title}\n` +
                   `Exported: ${exportDate}\n` +
                   `Total Responses: ${data.length}\n\n`;

  const fullContent = metadata + csvContent;

  const blob = new Blob(["\uFEFF" + fullContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  const fileName = `${sanitizeFileName(title)}_${Date.now()}.csv`;
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
