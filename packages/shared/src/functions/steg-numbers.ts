/** Parse a STEG numeric field (plain string, French comma, or with spaces). */
export function parseStegNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const text = String(value).trim().replace(/\s/g, '');
  if (text === '' || text === '-') {
    return 0;
  }
  const normalized = text.includes(',') ? text.replace(',', '.') : text;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Format a DT amount for UI labels (millimes precision, no float noise). */
export function formatMtDtAmount(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
