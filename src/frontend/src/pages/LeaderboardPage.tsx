import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Crown, Medal, Swords, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { Component, type ReactNode } from "react";
import type { AppNav } from "../App";
import { useGetLeaderboard } from "../hooks/useQueries";
import { formatPlayerId } from "../utils/playerId";

interface LeaderboardPageProps {
  navigate: (nav: AppNav) => void;
}

const rankColors: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-slate-300",
  3: "text-amber-600",
};

const rankBg: Record<number, string> = {
  1: "bg-yellow-400/10 border-yellow-400/30",
  2: "bg-slate-300/10 border-slate-300/30",
  3: "bg-amber-600/10 border-amber-600/30",
};

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown className="h-4 w-4 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-300" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
  return (
    <span className="text-xs font-mono text-muted-foreground w-4 text-center">
      #{rank}
    </span>
  );
};

class LeaderboardErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="font-heading font-bold text-lg text-foreground mb-2">
            Leaderboard Unavailable
          </h3>
          <p className="text-sm text-muted-foreground">
            Could not load leaderboard. Please try again later.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function LeaderboardContent({ navigate: _navigate }: LeaderboardPageProps) {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 mb-3">
          <Trophy className="h-7 w-7 text-primary" />
        </div>
        <h2 className="font-heading font-black text-2xl text-foreground">
          Leaderboard
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Top Free Fire Warriors
        </p>
      </div>

      {/* Top 3 podium */}
      {!isLoading && leaderboard && leaderboard.length >= 3 && (
        <div className="flex items-end justify-center gap-2 mb-6 px-2">
          {/* 2nd place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-slate-300/20 border-2 border-slate-300/50 flex items-center justify-center mx-auto mb-2">
              <span className="font-heading font-black text-base text-slate-300">
                {leaderboard[1]?.[1]?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="bg-slate-300/10 border border-slate-300/30 rounded-t-xl p-2 h-16 flex flex-col justify-end">
              <p className="text-xs font-mono font-bold text-slate-300 truncate">
                {leaderboard[1]?.[1] ?? "—"}
              </p>
              <p className="text-[10px] text-primary/80 font-mono">
                {leaderboard[1]?.[0] != null
                  ? formatPlayerId(leaderboard[1][0])
                  : "—"}
              </p>
            </div>
            <div className="bg-slate-300/20 text-slate-300 text-xs font-mono font-bold py-1 rounded-b-lg">
              #2
            </div>
          </motion.div>

          {/* 1st place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex-1 text-center"
          >
            <Crown className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
            <div className="w-14 h-14 rounded-full bg-yellow-400/20 border-2 border-yellow-400/60 flex items-center justify-center mx-auto mb-2 glow-orange">
              <span className="font-heading font-black text-lg text-yellow-400">
                {leaderboard[0]?.[1]?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-t-xl p-2 h-24 flex flex-col justify-end">
              <p className="text-xs font-mono font-bold text-yellow-400 truncate">
                {leaderboard[0]?.[1] ?? "—"}
              </p>
              <p className="text-[10px] text-primary/80 font-mono">
                {leaderboard[0]?.[0] != null
                  ? formatPlayerId(leaderboard[0][0])
                  : "—"}
              </p>
            </div>
            <div className="bg-yellow-400/20 text-yellow-400 text-xs font-mono font-bold py-1 rounded-b-lg">
              #1
            </div>
          </motion.div>

          {/* 3rd place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex-1 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-amber-600/20 border-2 border-amber-600/50 flex items-center justify-center mx-auto mb-2">
              <span className="font-heading font-black text-base text-amber-600">
                {leaderboard[2]?.[1]?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="bg-amber-600/10 border border-amber-600/30 rounded-t-xl p-2 h-12 flex flex-col justify-end">
              <p className="text-xs font-mono font-bold text-amber-600 truncate">
                {leaderboard[2]?.[1] ?? "—"}
              </p>
              <p className="text-[10px] text-primary/80 font-mono">
                {leaderboard[2]?.[0] != null
                  ? formatPlayerId(leaderboard[2][0])
                  : "—"}
              </p>
            </div>
            <div className="bg-amber-600/20 text-amber-600 text-xs font-mono font-bold py-1 rounded-b-lg">
              #3
            </div>
          </motion.div>
        </div>
      )}

      {/* Full list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              className="h-16 w-full rounded-xl"
              data-ocid="leaderboard.loading_state"
            />
          ))}
        </div>
      ) : !leaderboard || leaderboard.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="leaderboard.empty_state"
        >
          <div className="text-4xl mb-3">🏆</div>
          <p className="font-heading font-bold">No players yet</p>
          <p className="text-sm mt-1">Be the first to play!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Column headers */}
          <div className="flex items-center gap-3 px-3 pb-1">
            <div className="w-8" />
            <div className="w-9" />
            <div className="flex-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Player
              </span>
            </div>
            <div className="flex gap-3 text-right">
              <div className="w-10 text-[10px] text-muted-foreground uppercase tracking-wide">
                Played
              </div>
              <div className="w-8 text-[10px] text-muted-foreground uppercase tracking-wide">
                Kills
              </div>
              <div className="w-8 text-[10px] text-muted-foreground uppercase tracking-wide">
                Wins
              </div>
            </div>
          </div>

          {leaderboard.map(
            ([playerId, username, matchesPlayed, totalKills, wins], idx) => {
              const rank = idx + 1;
              const isTop3 = rank <= 3;
              return (
                <motion.div
                  key={`${playerId}-${username}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border",
                    isTop3 ? rankBg[rank] : "bg-card border-border",
                  )}
                  data-ocid={`leaderboard.item.${rank}`}
                >
                  <div className="w-8 flex items-center justify-center">
                    <RankIcon rank={rank} />
                  </div>
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span
                      className={cn(
                        "font-heading font-black text-sm",
                        rankColors[rank] ?? "text-muted-foreground",
                      )}
                    >
                      {username[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-heading font-bold text-sm truncate",
                        rankColors[rank] ?? "text-foreground",
                      )}
                    >
                      {username}
                    </p>
                    <p className="text-[10px] font-mono text-primary/70">
                      {formatPlayerId(playerId)}
                    </p>
                  </div>
                  <div className="flex gap-3 text-right">
                    <div className="w-10">
                      <p className="font-mono font-bold text-sm text-foreground">
                        {matchesPlayed.toString()}
                      </p>
                    </div>
                    <div className="w-8">
                      <p className="font-mono font-bold text-sm text-red-400 flex items-center justify-end gap-0.5">
                        <Swords className="h-3 w-3" />
                        {totalKills.toString()}
                      </p>
                    </div>
                    <div className="w-8">
                      <p className="font-mono font-bold text-sm text-accent">
                        {wins.toString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}

export default function LeaderboardPage(props: LeaderboardPageProps) {
  return (
    <LeaderboardErrorBoundary>
      <LeaderboardContent {...props} />
    </LeaderboardErrorBoundary>
  );
}
