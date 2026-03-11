import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChevronRight, History, Lock, Swords, Trophy, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { AppNav } from "../App";
import { MatchStatus, MatchType } from "../backend.d";
import { useGetMatches, useGetPlayerDetails } from "../hooks/useQueries";
import { formatAmount } from "../utils/format";

interface HomePageProps {
  navigate: (nav: AppNav) => void;
  playerId?: number;
}

export default function HomePage({ navigate, playerId }: HomePageProps) {
  const { data: matches, isLoading } = useGetMatches();
  const { data: player } = useGetPlayerDetails(playerId);

  const freeUpcoming =
    matches?.filter(
      (m) =>
        m.matchType === MatchType.free && m.status === MatchStatus.upcoming,
    ).length ?? 0;
  const paidUpcoming =
    matches?.filter(
      (m) =>
        m.matchType === MatchType.paid && m.status === MatchStatus.upcoming,
    ).length ?? 0;
  const ongoingMatches =
    matches?.filter((m) => m.status === MatchStatus.ongoing) ?? [];

  return (
    <div className="p-4 space-y-5">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-card border border-border p-5 hero-pattern"
      >
        <div className="relative z-10">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-1">
            Welcome back
          </p>
          <h2 className="font-heading font-black text-2xl text-foreground mb-1">
            {player?.username ?? "Player"}
          </h2>
          <div className="flex items-center gap-4 mt-3">
            <div className="text-center">
              <p className="font-heading font-bold text-lg text-primary">
                {player?.wins?.toString() ?? "0"}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Wins
              </p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="font-heading font-bold text-lg text-accent">
                {formatAmount(player?.walletBalance ?? 0n)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Balance
              </p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="font-heading font-bold text-lg text-foreground">
                {player?.matchesPlayed?.toString() ?? "0"}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Matches
              </p>
            </div>
          </div>
        </div>
        {/* Decorative */}
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
      </motion.div>

      {/* Ongoing matches alert */}
      {ongoingMatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl bg-green-500/10 border border-green-500/30 p-3 flex items-center justify-between cursor-pointer"
          onClick={() => navigate({ page: "free-matches" })}
          data-ocid="home.live.card"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 font-heading font-bold text-sm">
              {ongoingMatches.length} Match
              {ongoingMatches.length > 1 ? "es" : ""} ONGOING NOW
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-green-400" />
        </motion.div>
      )}

      {/* Main action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate({ page: "free-matches" })}
          className={cn(
            "relative overflow-hidden rounded-2xl p-5 text-left border card-hover",
            "bg-gradient-to-br from-green-500/20 to-green-600/5 border-green-500/30",
          )}
          data-ocid="home.free_matches.button"
        >
          <div className="relative z-10">
            <Zap className="h-8 w-8 text-green-400 mb-3" />
            <h3 className="font-heading font-black text-lg text-foreground leading-tight">
              Free
              <br />
              Matches
            </h3>
            {isLoading ? (
              <Skeleton className="h-4 w-16 mt-2" />
            ) : (
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30">
                <span className="text-xs font-mono text-green-400">
                  {freeUpcoming} open
                </span>
              </div>
            )}
          </div>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-green-400/10 blur-xl" />
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => navigate({ page: "paid-matches" })}
          className={cn(
            "relative overflow-hidden rounded-2xl p-5 text-left border card-hover",
            "bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30",
          )}
          data-ocid="home.paid_matches.button"
        >
          <div className="relative z-10">
            <Lock className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-heading font-black text-lg text-foreground leading-tight">
              Paid
              <br />
              Matches
            </h3>
            {isLoading ? (
              <Skeleton className="h-4 w-16 mt-2" />
            ) : (
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30">
                <span className="text-xs font-mono text-primary">
                  {paidUpcoming} open
                </span>
              </div>
            )}
          </div>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-primary/10 blur-xl" />
        </motion.button>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="font-heading font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
        <div className="space-y-2">
          {[
            {
              icon: Trophy,
              label: "View Leaderboard",
              sub: "See top players",
              page: "leaderboard" as const,
            },
            {
              icon: History,
              label: "Match History",
              sub: "Your past matches",
              page: "history" as const,
            },
            {
              icon: Swords,
              label: "All Matches",
              sub: "Browse tournaments",
              page: "free-matches" as const,
            },
          ].map(({ icon: Icon, label, sub, page }) => (
            <button
              type="button"
              key={label}
              onClick={() => navigate({ page })}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all group"
              data-ocid={`home.${page}.button`}
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-body font-medium text-sm text-foreground">
                  {label}
                </p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center pt-2 pb-1">
        <p className="text-[10px] text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
