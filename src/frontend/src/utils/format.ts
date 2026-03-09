import { MatchStatus } from "../backend.d";

/**
 * Format bigint amount (in paise/cents) to ₹ display
 * e.g. 10000n → ₹100.00
 */
export function formatAmount(amount: bigint): string {
  const num = Number(amount) / 100;
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Format Time (nanoseconds bigint) to readable date string
 */
export function formatDate(time: bigint): string {
  const ms = Number(time) / 1_000_000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusLabel(status: MatchStatus): string {
  switch (status) {
    case MatchStatus.live:
      return "🔴 LIVE";
    case MatchStatus.upcoming:
      return "⏳ UPCOMING";
    case MatchStatus.completed:
      return "✅ COMPLETED";
    default:
      return status;
  }
}

export function shortDate(time: bigint): string {
  const ms = Number(time) / 1_000_000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
