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
    throw new Error("Không có dữ liệu để xuất");
  }

  const headers = Object.keys(data[0]);
  let csvContent = headers.join(",") + "\n";

  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header] ?? "";
      const str = String(value);
      return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    });
    csvContent += values.join(",") + "\n";
  });

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
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
