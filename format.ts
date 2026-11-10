export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function fmtTRY(n: number, force2 = false): string {
  const hasFraction = Math.abs(n % 1) > 0.001;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: force2 || hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function fmtNumber(n: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(n);
}

const DAY_LONG = new Intl.DateTimeFormat("tr-TR", { weekday: "long" });
const DAY_SHORT = new Intl.DateTimeFormat("tr-TR", { weekday: "short" });
const DATE_LONG = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  weekday: "long",
});
const MONTH_LONG = new Intl.DateTimeFormat("tr-TR", {
  month: "long",
  year: "numeric",
});
const TIME_FMT = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** "15 Ocak Çarşamba" */
export function fullDateTR(iso: string): string {
  return DATE_LONG.format(parseISO(iso));
}

/** "Perşembe" */
export function dayNameTR(iso: string): string {
  return DAY_LONG.format(parseISO(iso));
}

/** "Per" */
export function dayShortTR(iso: string): string {
  return DAY_SHORT.format(parseISO(iso));
}

/** "Ocak 2026" — YYYY-MM veya YYYY-MM-DD kabul eder */
export function monthLabelTR(m: string): string {
  return MONTH_LONG.format(parseISO(m.length === 7 ? `${m}-01` : m));
}

export function timeTR(dateVal: string | Date): string {
  return TIME_FMT.format(
    typeof dateVal === "string" ? new Date(dateVal) : dateVal,
  );
}

export function greetingTR(h = new Date().getHours()): string {
  if (h >= 5 && h < 12) return "Günaydın";
  if (h >= 12 && h < 18) return "İyi günler";
  if (h >= 18 && h < 22) return "İyi akşamlar";
  return "İyi geceler";
}

export function addMonths(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, (m - 1) + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function buzz(ms = 12) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(ms);
    }
  } catch {
    /* yoksay */
  }
}
