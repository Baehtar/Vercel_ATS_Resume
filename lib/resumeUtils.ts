// lib/resumeUtils.ts - Keyword and date helpers (ported from app.py helpers)

export function splitKeywords(value: string | null | undefined): string[] {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinKeywords(...groups: (string | string[] | null | undefined)[]): string {
  const merged: string[] = [];
  const seen = new Set<string>();
  for (const group of groups) {
    const items = typeof group === "string" ? splitKeywords(group) : group || [];
    for (const item of items) {
      const key = item.trim().toLowerCase();
      if (key && !seen.has(key)) {
        merged.push(item.trim());
        seen.add(key);
      }
    }
  }
  return merged.join(", ");
}

/** Parse a stored resume date into an <input type="date"> value (YYYY-MM-DD) or "". */
export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const v = String(value).trim();
  if (v.toLowerCase() === "present" || !v) return "";
  // Already ISO date
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  // YYYY-MM -> first of month
  if (/^\d{4}-\d{2}$/.test(v)) return `${v}-01`;
  // YYYY -> first of year
  if (/^\d{4}$/.test(v)) return `${v}-01-01`;
  // "Mon YYYY" or "Month YYYY"
  const parsed = Date.parse(v);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }
  return "";
}

export function fromDateInputValue(value: string | null | undefined): string {
  return value || "";
}

export function safeFileName(name: string | null | undefined): string {
  return (name || "resume").toLowerCase().replace(/\s+/g, "_") || "resume";
}
