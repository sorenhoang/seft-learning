const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Format a YYYY-MM-DD date string deterministically.
 * Does NOT use toLocaleDateString to avoid server/client ICU mismatches.
 */
export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}
