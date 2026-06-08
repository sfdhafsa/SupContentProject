export function getYear(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const match = value.match(/\d{4}/);
    return match ? match[0] : "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return String(date.getFullYear());
}

export function toDisplayNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
