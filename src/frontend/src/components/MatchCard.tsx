import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, MapPin, Trophy, Users, Zap } from "lucide-react";
import { type Match, MatchStatus, MatchType } from "../backend.d";
import {
  formatAmount,
  formatDate,
  getStatusLabel,
  getSubTypeLabel,
} from "../utils/format";

interface MatchCardProps {
  match: Match;
  index: number;
  onJoin?: (matchId: number) => void;
  onView?: (matchId: number) => void;
  isJoining?: boolean;
  hasJoined?: boolean;
}

export default function MatchCard({
  match,
  index,
  onJoin,
  onView,
  isJoining,
  hasJoined,
}: MatchCardProps) {
  const statusLabel = getStatusLabel(match.status);
  const isFree = match.entryFee === 0n;

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-card overflow-hidden card-hover cursor-pointer",
        match.status === MatchStatus.ongoing && "border-green-500/40",
        match.status === MatchStatus.upcoming && "border-border",
        match.status === MatchStatus.completed && "border-border opacity-75",
      )}
      onClick={() => onView?.(match.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onView?.(match.id);
      }}
      data-ocid={`match.item.${index}`}
    >
      {/* Status accent bar */}
      <div
        className={cn(
          "h-1 w-full",
          match.status === MatchStatus.ongoing
            ? "bg-gradient-to-r from-green-500 to-green-400"
            : match.status === MatchStatus.upcoming
              ? "bg-gradient-to-r from-primary to-accent"
              : "bg-muted",
        )}
      />

      <div className="p-5">
        {/* Status + Type badges */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={cn(
              "text-xs font-mono font-semibold px-2.5 py-1 rounded-full",
              match.status === MatchStatus.ongoing && "badge-live",
              match.status === MatchStatus.upcoming && "badge-upcoming",
              match.status === MatchStatus.completed && "badge-completed",
            )}
          >
            {statusLabel}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary">
              {getSubTypeLabel(match.matchSubType)}
            </span>
            <span
              className={cn(
                "text-xs font-mono px-2 py-0.5 rounded-full border",
                isFree
                  ? "text-green-400 border-green-400/40 bg-green-400/10"
                  : "text-primary border-primary/40 bg-primary/10",
              )}
            >
              {isFree ? "FREE" : "PAID"}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-heading font-black text-xl text-foreground mb-1 line-clamp-1">
          {match.title}
        </h3>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-xs text-muted-foreground font-mono">FREE FIRE</p>
          {match.mapName && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="font-mono">{match.mapName}</span>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-xl bg-muted/40">
          <div className="flex flex-col gap-0.5 items-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Entry
            </span>
            <span className="text-sm font-mono font-bold">
              {isFree ? (
                <span className="text-green-400">FREE</span>
              ) : (
                <span className="text-primary">
                  {formatAmount(match.entryFee)}
                </span>
              )}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 items-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Prize
            </span>
            <span className="text-sm font-mono font-bold text-accent flex items-center gap-0.5">
              <Trophy className="h-3 w-3" />
              {formatAmount(match.prizeAmount)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 items-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Players
            </span>
            <span className="text-sm font-mono font-bold text-foreground flex items-center gap-0.5">
              <Users className="h-3 w-3 text-muted-foreground" />
              {match.playerIds.length}/{match.totalPlayers.toString()}
            </span>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
          <Calendar className="h-3.5 w-3.5" />
          <span className="font-mono">{formatDate(match.scheduledAt)}</span>
        </div>

        {/* Action buttons */}
        {match.status === MatchStatus.upcoming && onJoin && (
          <Button
            className={cn(
              "w-full h-11 font-heading font-bold text-base",
              hasJoined
                ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                : "bg-primary text-primary-foreground hover:bg-primary/90 glow-orange",
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (!hasJoined) onJoin(match.id);
            }}
            disabled={isJoining || hasJoined}
            data-ocid={`match.primary_button.${index}`}
          >
            {isJoining ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Joining...
              </span>
            ) : hasJoined ? (
              "✓ Joined"
            ) : (
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Join Match
              </span>
            )}
          </Button>
        )}

        {match.status === MatchStatus.ongoing && (
          <div className="w-full text-center py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-mono font-bold">
            🔴 MATCH IN PROGRESS
          </div>
        )}

        {match.status === MatchStatus.completed && match.winnerName && (
          <div className="w-full text-center py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-mono">
            🏆 {match.winnerName} won
          </div>
        )}
      </div>
    </div>
  );
}
