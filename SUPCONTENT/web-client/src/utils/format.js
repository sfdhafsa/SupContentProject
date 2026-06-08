export function getYear(value) {
  if (!value) return "";

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value).length === 4 ? String(value) : getYear(new Date(value));
  }

  if (typeof value === "string") {
    const match = value.match(/\d{4}/);
    return match ? match[0] : "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return String(date.getFullYear());
}

export function firstPresent(...values) {
  return values.find((value) => value !== null && value !== undefined && value !== "");
}

export function formatDate(value, options, fallback = "") {
  if (!value) return fallback;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleDateString("en-US", options);
}

export function formatMonthYear(value, fallback = "") {
  return formatDate(value, { month: "long", year: "numeric" }, fallback);
}

export function formatShortDate(value, fallback = "") {
  return formatDate(value, { month: "short", day: "numeric", year: "numeric" }, fallback);
}

export function toDisplayNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
