import { format } from "date-fns";
import { id } from "date-fns/locale";

/**
 * Format number as Indonesian Rupiah.
 * Example: 1500000 → "Rp 1.500.000"
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Legacy alias for backward compatibility.
 * Prefer formatIDR() for new code.
 */
export function formatRupiah(amount: number): string {
  return formatIDR(amount);
}

/**
 * Format a date string or Date object to Indonesian short date.
 * Example: "16 Mei 2026"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMMM yyyy", { locale: id });
}

/**
 * Format a date string or Date object to Indonesian short date (compact).
 * Example: "16 Mei 2026"
 */
export function formatShortDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMM yyyy", { locale: id });
}

/**
 * Format a date string or Date object to Indonesian datetime.
 * Example: "16 Mei 2026 14:30"
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMM yyyy HH:mm", { locale: id });
}

/**
 * Format phone number for display.
 * +6281234567890 → "0812-3456-7890"
 */
export function formatPhone(phone: string): string {
  let normalized = phone;
  if (normalized.startsWith("+62")) {
    normalized = "0" + normalized.slice(3);
  }
  // Insert dashes for readability: 0812-3456-7890
  if (normalized.length >= 7) {
    return normalized.slice(0, 4) + "-" + normalized.slice(4, 8) + "-" + normalized.slice(8);
  }
  if (normalized.length >= 4) {
    return normalized.slice(0, 4) + "-" + normalized.slice(4);
  }
  return normalized;
}

/**
 * Mask an account number, showing only last 4 digits.
 * Example: "1234567890" → "****7890"
 */
export function maskAccountNumber(number: string): string {
  if (number.length <= 4) return number;
  return "****" + number.slice(-4);
}

/**
 * Format phone for storage (ensure +62 prefix).
 * 081234567890 → "+6281234567890"
 */
export function formatPhoneStorage(phone: string): string {
  if (phone.startsWith("0")) {
    return "+62" + phone.slice(1);
  }
  return phone;
}
