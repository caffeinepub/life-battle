import { MatchStatus, MatchSubType } from "../backend.d";

/**
 * Format bigint amount (in paise) to gold coin display
 * e.g. 10000n → 🪙100
 */
export function formatAmount(amount: bigint): string {
  const num = Number(amount) / 100;
  return `🪙${num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
    case MatchStatus.ongoing:
      return "🔴 ONGOING";
    case MatchStatus.upcoming:
      return "⏳ UPCOMING";
    case MatchStatus.completed:
      return "✅ COMPLETED";
    default:
      return status;
  }
}

export function getSubTypeLabel(subType: MatchSubType): string {
  switch (subType) {
    case MatchSubType.survival:
      return "SURVIVAL SOLO";
    case MatchSubType.perKill:
      return "PER KILL";
    case MatchSubType.lossToWin:
      return "LW LOSS FIRST";
    case MatchSubType.lonewolf1v1:
      return "LW 1 VS 1";
    case MatchSubType.lonewolf2v2:
      return "LW 2 VS 2";
    case MatchSubType.cs1v1:
      return "CS 1 VS 1";
    case MatchSubType.cs2v2:
      return "CS 2 VS 2";
    case MatchSubType.cs4v4:
      return "CS 4 VS 4";
    default:
      return subType;
  }
}

export function shortDate(time: bigint): string {
  const ms = Number(time) / 1_000_000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
