// Chuyển đổi từ YYYY-MM-DD sang MM/DD/YYYY
export const formatDateForDisplay = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

// Chuyển đổi từ MM/DD/YYYY sang YYYY-MM-DD
export const formatDateForStorage = (dateString) => {
  if (!dateString || dateString.length !== 10) return "";
  const parts = dateString.split("/");
  if (parts.length !== 3) return "";
  const month = parts[0];
  const day = parts[1];
  const year = parts[2];

  // Validate
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);
  const yearNum = parseInt(year, 10);

  if (monthNum < 1 || monthNum > 12) return "";
  if (dayNum < 1 || dayNum > 31) return "";
  if (yearNum < 1900 || yearNum > 2100) return "";

  // Check valid date
  const date = new Date(yearNum, monthNum - 1, dayNum);
  if (
    date.getFullYear() !== yearNum ||
    date.getMonth() !== monthNum - 1 ||
    date.getDate() !== dayNum
  ) {
    return "";
  }

  return `${year}-${month}-${day}`;
};
