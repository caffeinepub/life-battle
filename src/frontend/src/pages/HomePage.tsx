import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Bell,
  ChevronRight,
  History,
  Lock,
  Swords,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
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
  const [showPromo, setShowPromo] = useState(true);

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
          <h2 className="font-heading font-black text-3xl text-foreground mb-0.5 tracking-tight">
            {player?.username ?? "Player"}
          </h2>
          {player?.id && (
            <span className="inline-block text-[10px] font-mono text-primary bg-primary/15 border border-primary/30 px-2 py-0.5 rounded-full mb-3">
              ID: LB{player.id}
            </span>
          )}
          <div className="flex items-center gap-4 mt-2">
            <div className="text-center">
              <p className="font-heading font-bold text-xl text-primary">
                {player?.wins?.toString() ?? "0"}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Wins
              </p>
            </div>
            <div className="w-px h-9 bg-border" />
            <div className="text-center">
              <p className="font-heading font-bold text-xl text-accent">
                {formatAmount(player?.walletBalance ?? 0n)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Balance
              </p>
            </div>
            <div className="w-px h-9 bg-border" />
            <div className="text-center">
              <p className="font-heading font-bold text-xl text-foreground">
                {player?.matchesPlayed?.toString() ?? "0"}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Matches
              </p>
            </div>
          </div>
        </div>
        {/* Decorative orbs */}
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-accent/10 blur-2xl" />
      </motion.div>

      {/* Promo Banner */}
      <AnimatePresence>
        {showPromo && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-2xl border border-yellow-500/40 bg-gradient-to-r from-yellow-500/15 via-orange-500/10 to-yellow-500/15 p-4"
            data-ocid="home.promo.banner"
            style={{ boxShadow: "0 0 18px 2px rgba(234,179,8,0.13)" }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span className="text-xl flex-shrink-0">🏆</span>
                <div>
                  <p className="font-heading font-black text-sm text-yellow-300 leading-tight">
                    Weekend Battle Tournament
                  </p>
                  <p className="text-[11px] text-yellow-200/70 mt-0.5">
                    Join Now &amp; Win Big! Top prizes await the best players.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPromo(false)}
                className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 hover:bg-yellow-500/40 flex items-center justify-center text-yellow-300 transition-colors"
                data-ocid="home.promo.close_button"
                aria-label="Dismiss promotion"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {/* Glow orbs */}
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-yellow-400/10 blur-2xl pointer-events-none" />
            <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-orange-400/10 blur-2xl pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ongoing matches alert */}
      {ongoingMatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl bg-green-500/10 border border-green-500/30 p-3 flex items-center justify-between cursor-pointer"
          onClick={() => navigate({ page: "free-matches" })}
          data-ocid="home.live.card"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 font-heading font-bold text-sm">
              {ongoingMatches.length} Match
              {ongoingMatches.length > 1 ? "es" : ""} LIVE NOW
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
            <div className="w-11 h-11 rounded-2xl bg-green-500/20 flex items-center justify-center mb-3">
              <Zap className="h-6 w-6 text-green-400" />
            </div>
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
          <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-green-400/10 blur-xl" />
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
            <div className="w-11 h-11 rounded-2xl bg-primary/20 flex items-center justify-center mb-3">
              <Lock className="h-6 w-6 text-primary" />
            </div>
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
          <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-primary/10 blur-xl" />
        </motion.button>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="font-heading font-bold text-xs text-muted-foreground uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
        <div className="space-y-2">
          {[
            {
              icon: Trophy,
              label: "Leaderboard",
              sub: "See top players",
              page: "leaderboard" as const,
              color: "text-accent",
              bg: "bg-accent/10",
            },
            {
              icon: History,
              label: "Match History",
              sub: "Your past matches",
              page: "history" as const,
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              icon: Bell,
              label: "Announcements",
              sub: "Latest news & alerts",
              page: "announcements" as const,
              color: "text-blue-400",
              bg: "bg-blue-400/10",
            },
            {
              icon: Swords,
              label: "All Tournaments",
              sub: "Browse all matches",
              page: "free-matches" as const,
              color: "text-green-400",
              bg: "bg-green-400/10",
            },
          ].map(({ icon: Icon, label, sub, page, color, bg }) => (
            <button
              type="button"
              key={label}
              onClick={() => navigate({ page })}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all group active:scale-[0.98]"
              data-ocid={`home.${page}.button`}
            >
              <div
                className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                  bg,
                )}
              >
                <Icon className={cn("h-5 w-5", color)} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-body font-semibold text-sm text-foreground">
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
