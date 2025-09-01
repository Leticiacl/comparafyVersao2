// src/utils/date.ts
export function toISO(d?: Date | null): string {
    if (!d || isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  
  export function isoToDisplay(iso?: string): string {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }
  
  /** Converte "qualquer coisa razoável" para 'yyyy-mm-dd' (dd/mm/yyyy, yyyy-mm-dd, timestamp, Date, etc.). */
  export function anyToISODate(val: unknown): string {
    if (val instanceof Date) return toISO(val);
    if (typeof val === "number") {
      const ms = val > 1e12 ? val : val * 1000; // aceita seg ou ms
      return toISO(new Date(ms));
    }
    if (typeof val === "string") {
      // dd/mm/yyyy
      const m1 = val.match(/([0-3]?\d)[/|-]([01]?\d)[/|-](\d{4})/);
      if (m1) {
        const [, dd, mm, yyyy] = m1;
        const iso = `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
        const d = new Date(`${iso}T00:00:00`);
        return isNaN(d.getTime()) ? "" : iso;
      }
      // yyyy-mm-dd (ou com /)
      const m2 = val.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (m2) {
        const [, yyyy, mm, dd] = m2;
        const iso = `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
        const d = new Date(`${iso}T00:00:00`);
        return isNaN(d.getTime()) ? "" : iso;
      }
      // fallback Date.parse
      return toISO(new Date(val));
    }
    return "";
  }
  