const INTERNAL_KEYS = new Set(["id", "name", "status", "adsets", "ads"]);

const labelFor = (key) => key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function isEmpty(value) {
  return value == null || value === "" || (Array.isArray(value) && !value.length) || (!Array.isArray(value) && typeof value === "object" && !Object.keys(value).length);
}

function formatValue(key, value, item) {
  if (/date$/i.test(key) && /^\d{4}-\d{2}-\d{2}$/.test(value)) return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
  if (/budget/i.test(key)) return new Intl.NumberFormat("en-IN", { style: "currency", currency: item.currency || "INR", maximumFractionDigits: 0 }).format(Number(value));
  if (Array.isArray(value)) return value.every((entry) => typeof entry !== "object") ? value.join(", ") : `${value.length} ${value.length === 1 ? labelFor(key).slice(0, -1).toLowerCase() : labelFor(key).toLowerCase()}`;
  if (typeof value === "object") return `${Object.keys(value).length} fields`;
  return String(value);
}

export function formatNodeData(item) {
  return Object.entries(item)
    .filter(([key, value]) => !INTERNAL_KEYS.has(key) && !isEmpty(value))
    .map(([key, value]) => ({ label: labelFor(key), value: formatValue(key, value, item) }));
}
