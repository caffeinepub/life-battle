import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Calendar, Trophy } from "lucide-react";
import { motion } from "motion/react";
import type { AppNav } from "../App";
import { MatchStatus } from "../backend.d";
import { useGetPlayerDetails, useGetPlayerMatches } from "../hooks/useQueries";
import { formatAmount, formatDate } from "../utils/format";

interface MatchHistoryPageProps {
  navigate: (nav: AppNav) => void;
  playerId?: number;
}

export default function MatchHistoryPage({
  navigate: _navigate,
  playerId,
}: MatchHistoryPageProps) {
  const { data: matches, isLoading } = useGetPlayerMatches(playerId);
  const { data: player } = useGetPlayerDetails(playerId);

  const pastMatches = (matches ?? []).filter(
    (m) => m.status === MatchStatus.completed,
  );
  const activeMatches = (matches ?? []).filter(
    (m) => m.status !== MatchStatus.completed,
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-black text-xl text-foreground">
          Match History
        </h2>
        <span className="text-xs font-mono text-muted-foreground bg-card border border-border px-2 py-1 rounded-full">
          {(matches ?? []).length} total
        </span>
      </div>

      {/* Active/upcoming matches */}
      {activeMatches.length > 0 && (
        <div>
          <h3 className="font-heading font-bold text-sm text-muted-foreground uppercase tracking-wider mb-2">
            Active Matches
          </h3>
          <div className="space-y-2">
            {activeMatches.map((match, i) => {
              const isLive = match.status === MatchStatus.ongoing;
              return (
                <div
                  key={match.id}
                  className={cn(
                    "p-3 rounded-xl border bg-card",
                    isLive && "border-green-500/30",
                  )}
                  data-ocid={`history.active.item.${i + 1}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-heading font-bold text-sm text-foreground">
                        {match.title}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {formatDate(match.scheduledAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-mono font-bold px-2 py-0.5 rounded-full",
                        isLive ? "badge-live" : "badge-upcoming",
                      )}
                    >
                      {isLive ? "LIVE" : "UPCOMING"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past matches */}
      <div>
        <h3 className="font-heading font-bold text-sm text-muted-foreground uppercase tracking-wider mb-2">
          Completed Matches
        </h3>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-20 w-full rounded-xl"
                data-ocid="history.loading_state"
              />
            ))}
          </div>
        ) : pastMatches.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="history.empty_state"
          >
            <div className="text-4xl mb-3">🎮</div>
            <p className="font-heading font-bold">No completed matches yet</p>
            <p className="text-sm mt-1">Join a match to start your history!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pastMatches.map((match, idx) => {
              const isWinner = player && match.winnerName === player?.username;
              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "p-4 rounded-xl border bg-card",
                    isWinner
                      ? "border-primary/40 bg-primary/5"
                      : "border-border",
                  )}
                  data-ocid={`history.item.${idx + 1}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm text-foreground truncate">
                        {match.title}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span className="font-mono">
                          {formatDate(match.scheduledAt)}
                        </span>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "ml-2 px-2 py-0.5 rounded-full text-xs font-mono font-bold border flex-shrink-0",
                        isWinner
                          ? "bg-primary/20 border-primary/40 text-primary"
                          : "bg-muted border-border text-muted-foreground",
                      )}
                    >
                      {isWinner ? "🏆 WON" : "LOST"}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Entry:{" "}
                      {match.entryFee === 0n
                        ? "FREE"
                        : formatAmount(match.entryFee)}
                    </span>
                    {isWinner && (
                      <span className="flex items-center gap-1 text-primary font-mono font-bold">
                        <Trophy className="h-3 w-3" />+
                        {formatAmount(match.prizeAmount)}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
