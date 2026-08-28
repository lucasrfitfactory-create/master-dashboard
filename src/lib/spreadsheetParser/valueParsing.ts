// Safe parsing utilities for values coming out of Google Sheets cells.
// These must never throw on malformed/error input.

export type ParseResult<T> = { value: T | null; warning?: string };

const FORMULA_ERRORS = ["#VALUE!", "#DIV/0!", "#REF!", "#N/A", "#NAME?", "#NULL!", "#NUM!"];

export function isFormulaError(raw: string): boolean {
  return FORMULA_ERRORS.some((e) => raw.trim().toUpperCase() === e);
}

export function isBlank(raw: unknown): boolean {
  if (raw === null || raw === undefined) return true;
  if (typeof raw === "string" && raw.trim() === "") return true;
  return false;
}

// Parses currency strings like "$52,785.61", "-$7,909.39", "($1,200.00)" (accounting negative).
export function parseCurrency(raw: unknown): ParseResult<number> {
  if (isBlank(raw)) return { value: null };
  const str = String(raw).trim();
  if (isFormulaError(str)) return { value: null, warning: `Formula error: ${str}` };
  if (str.toUpperCase() === "N/A") return { value: null };

  let s = str.replace(/[$,\s]/g, "");
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  }
  const num = Number(s);
  if (!Number.isFinite(num)) return { value: null, warning: `Could not parse currency value: "${raw}"` };
  return { value: negative ? -Math.abs(num) : num };
}
