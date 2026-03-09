import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Copy, History, Share2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { AppNav } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetPlayerDetails } from "../hooks/useQueries";
import { formatAmount } from "../utils/format";

interface ProfilePageProps {
  navigate: (nav: AppNav) => void;
  playerId?: number;
}

export default function ProfilePage({ navigate, playerId }: ProfilePageProps) {
  const { identity, clear } = useInternetIdentity();
  const { data: player, isLoading } = useGetPlayerDetails(playerId);

  const principal = identity?.getPrincipal().toString();

  const copyReferral = () => {
    if (player?.referralCode) {
      navigator.clipboard.writeText(player.referralCode);
      toast.success("Referral code copied! 🎉");
    }
  };

  const shareReferral = async () => {
    if (!player?.referralCode) return;
    const text = `Join Life Battle Free Fire tournaments! Use my referral code: ${player.referralCode}`;
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Share text copied!");
    }
  };

  const initials = player?.username
    ? player.username.slice(0, 2).toUpperCase()
    : "??";

  const stats = [
    {
      label: "Matches Played",
      value: player?.matchesPlayed?.toString() ?? "0",
      color: "text-foreground",
    },
    {
      label: "Total Wins",
      value: player?.wins?.toString() ?? "0",
      color: "text-primary",
    },
    {
      label: "Total Earnings",
      value: formatAmount(player?.totalEarnings ?? 0n),
      color: "text-accent",
    },
    {
      label: "Wallet Balance",
      value: formatAmount(player?.walletBalance ?? 0n),
      color: "text-green-400",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-4 space-y-4" data-ocid="profile.loading_state">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden"
        data-ocid="profile.card"
      >
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center flex-shrink-0 glow-orange">
            <span className="font-heading font-black text-2xl gradient-text">
              {initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading font-black text-xl text-foreground truncate">
              {player?.username ?? "Unknown"}
            </h2>
            <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
              {principal ? `${principal.slice(0, 20)}...` : "—"}
            </p>
            {player?.referredBy && (
              <p className="text-xs text-primary mt-1">
                Referred by: {player.referredBy}
              </p>
            )}
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-primary/10 blur-xl" />
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className={`font-heading font-black text-2xl ${color}`}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
              {label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Referral section */}
      {player?.referralCode && (
        <div
          className="rounded-xl border border-border bg-card p-4"
          data-ocid="profile.referral.panel"
        >
          <h3 className="font-heading font-bold text-sm text-foreground mb-3">
            Your Referral Code
          </h3>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
            <span className="font-mono font-bold text-primary flex-1">
              {player.referralCode}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={copyReferral}
              data-ocid="profile.referral.button"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={shareReferral}
              data-ocid="profile.share.button"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Share your code and earn bonus when friends sign up!
          </p>
        </div>
      )}

      {/* Quick links */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => navigate({ page: "history" })}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all group"
          data-ocid="profile.history.button"
        >
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <History className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-body font-medium text-sm text-foreground">
              Match History
            </p>
            <p className="text-xs text-muted-foreground">
              View all your past matches
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      </div>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
        onClick={clear}
        data-ocid="profile.logout.button"
      >
        Logout
      </Button>
    </div>
  );
}
