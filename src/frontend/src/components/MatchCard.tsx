import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, Trophy, Users, Zap } from "lucide-react";
import { type Match, MatchStatus, MatchType } from "../backend.d";
import { formatAmount, formatDate, getStatusLabel } from "../utils/format";

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
        "relative rounded-xl border bg-card p-4 card-hover cursor-pointer",
        match.status === MatchStatus.live && "border-green-500/30",
        match.status === MatchStatus.upcoming && "border-border",
        match.status === MatchStatus.completed && "border-border opacity-80",
      )}
      onClick={() => onView?.(match.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onView?.(match.id);
      }}
      data-ocid={`match.item.${index}`}
    >
      {/* Status + Type badges */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={cn(
            "text-xs font-mono font-semibold px-2 py-0.5 rounded-full",
            match.status === MatchStatus.live && "badge-live",
            match.status === MatchStatus.upcoming && "badge-upcoming",
            match.status === MatchStatus.completed && "badge-completed",
          )}
        >
          {statusLabel}
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

      {/* Title */}
      <h3 className="font-heading font-bold text-base text-foreground mb-1 line-clamp-1">
        {match.title}
      </h3>
      <p className="text-xs text-muted-foreground font-mono mb-3">FREE FIRE</p>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Entry
          </span>
          <span className="text-sm font-mono font-bold text-foreground">
            {isFree ? (
              <span className="text-green-400">FREE</span>
            ) : (
              <span className="text-primary">
                {formatAmount(match.entryFee)}
              </span>
            )}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Prize
          </span>
          <span className="text-sm font-mono font-bold text-accent flex items-center gap-0.5">
            <Trophy className="h-3 w-3" />
            {formatAmount(match.prizeAmount)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Players
          </span>
          <span className="text-sm font-mono font-bold text-foreground flex items-center gap-0.5">
            <Users className="h-3 w-3 text-muted-foreground" />
            {match.playerIds.length}
          </span>
        </div>
      </div>

      {/* Date */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
        <Calendar className="h-3 w-3" />
        <span className="font-mono">{formatDate(match.scheduledAt)}</span>
      </div>

      {/* Action buttons */}
      {match.status === MatchStatus.upcoming && onJoin && (
        <Button
          size="sm"
          className={cn(
            "w-full font-heading font-bold text-sm",
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
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              Joining...
            </span>
          ) : hasJoined ? (
            "✓ Joined"
          ) : (
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Join Match
            </span>
          )}
        </Button>
      )}

      {match.status === MatchStatus.live && (
        <div className="w-full text-center py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono font-bold animate-pulse">
          🔴 LIVE NOW
        </div>
      )}

      {match.status === MatchStatus.completed &&
        match.winnerId !== undefined && (
          <div className="w-full text-center py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-mono">
            🏆 Winner announced
          </div>
        )}
    </div>
  );
}
