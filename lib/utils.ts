export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDate(value: Date | string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
    ...options
  }).format(new Date(value));
}

export function isOverdue(value: Date | string, now = new Date()): boolean {
  const due = new Date(value);
  due.setHours(23, 59, 59, 999);
  return due < now;
}

export function calculateProgress(done: number, measurable: number): number | null {
  if (measurable <= 0) return null;
  return Math.round((done / measurable) * 100);
}
