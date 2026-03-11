import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Calendar, Copy, MapPin, Trophy, Users, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppNav } from "../App";
import { MatchStatus } from "../backend.d";
import {
  useGetMatchRoomDetails,
  useGetMatches,
  useGetPlayerDetails,
  useJoinMatch,
} from "../hooks/useQueries";
import {
  formatAmount,
  formatDate,
  getStatusLabel,
  getSubTypeLabel,
} from "../utils/format";

interface MatchDetailPageProps {
  matchId: number;
  navigate: (nav: AppNav) => void;
  playerId?: number;
}

export default function MatchDetailPage({
  matchId,
  navigate: _navigate,
  playerId,
}: MatchDetailPageProps) {
  const [isJoining, setIsJoining] = useState(false);

  const { data: matches, isLoading } = useGetMatches();
  const { data: playerDetails } = useGetPlayerDetails(playerId);
  const joinMatch = useJoinMatch();
  const { data: roomDetails } = useGetMatchRoomDetails(matchId);

  const match = matches?.find((m) => m.id === matchId);

  const hasJoined =
    match && playerDetails ? match.playerIds.includes(playerDetails.id) : false;

  const handleJoin = async () => {
    if (!match) return;
    setIsJoining(true);
    try {
      await joinMatch.mutateAsync(match.id);
      toast.success("🎮 Joined match successfully!");
    } catch {
      toast.error("Failed to join. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4" data-ocid="match_detail.loading_state">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!match) {
    return (
      <div
        className="p-4 text-center py-16"
        data-ocid="match_detail.error_state"
      >
        <p className="text-muted-foreground">Match not found</p>
      </div>
    );
  }

  const isFree = match.entryFee === 0n;
  const isOngoing = match.status === MatchStatus.ongoing;
  const isCompleted = match.status === MatchStatus.completed;
  const isUpcoming = match.status === MatchStatus.upcoming;

  return (
    <div className="p-4 space-y-4" data-ocid="match_detail.panel">
      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border p-5",
          isOngoing &&
            "border-green-500/40 bg-gradient-to-br from-green-500/10 to-card",
          isUpcoming &&
            "border-primary/30 bg-gradient-to-br from-primary/10 to-card",
          isCompleted && "border-border bg-card",
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <span
            className={cn(
              "text-xs font-mono font-bold px-2 py-0.5 rounded-full",
              isOngoing && "badge-live",
              isUpcoming && "badge-upcoming",
              isCompleted && "badge-completed",
            )}
          >
            {getStatusLabel(match.status)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full border border-primary/40 bg-primary/10 text-primary">
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

        <h2 className="font-heading font-black text-2xl text-foreground mb-1">
          {match.title}
        </h2>
        <p className="text-xs text-muted-foreground font-mono mb-4">
          FREE FIRE TOURNAMENT
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background/50 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
              Entry Fee
            </p>
            <p className="font-heading font-bold text-lg text-foreground">
              {isFree ? (
                <span className="text-green-400">FREE</span>
              ) : (
                <span className="text-primary">
                  {formatAmount(match.entryFee)}
                </span>
              )}
            </p>
          </div>
          <div className="bg-background/50 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
              Prize Pool
            </p>
            <p className="font-heading font-bold text-lg text-accent flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              {formatAmount(match.prizeAmount)}
            </p>
          </div>
          <div className="bg-background/50 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
              Players
            </p>
            <p className="font-heading font-bold text-lg text-foreground flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              {match.playerIds.length} / {match.totalPlayers.toString()}
            </p>
          </div>
          <div className="bg-background/50 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
              Map
            </p>
            <p className="font-heading font-bold text-sm text-foreground flex items-center gap-1 truncate">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {match.mapName || "TBD"}
            </p>
          </div>
        </div>

        {isOngoing && (
          <div className="mt-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 font-mono text-xs font-bold">
              MATCH IS ONGOING!
            </span>
          </div>
        )}
      </motion.div>

      {/* Schedule */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground text-xs uppercase tracking-wide">
            Scheduled At
          </span>
        </div>
        <p className="font-mono font-bold text-foreground mt-1">
          {formatDate(match.scheduledAt)}
        </p>
      </div>

      {/* Room credentials — only when ongoing AND player joined */}
      {isOngoing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-green-500/40 bg-green-500/10 p-4 space-y-3"
          data-ocid="match_detail.room.panel"
        >
          <h3 className="font-heading font-bold text-sm text-green-400 uppercase tracking-wide">
            🎮 Room Credentials
          </h3>
          {roomDetails ? (
            <>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                  Room ID
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground">
                    {roomDetails[0]}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(roomDetails[0], "Room ID")}
                    data-ocid="match_detail.room_id.button"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {roomDetails[1] && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                    Room Password
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground">
                      {roomDetails[1]}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() =>
                        copyToClipboard(roomDetails[1], "Room Password")
                      }
                      data-ocid="match_detail.room_password.button"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Join this match to see room details
            </p>
          )}
        </motion.div>
      )}

      {/* Winner announcement */}
      {isCompleted && match.winnerName && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/40 bg-primary/10 p-4 text-center glow-orange"
          data-ocid="match_detail.winner.panel"
        >
          <div className="text-3xl mb-2">🏆</div>
          <h3 className="font-heading font-black text-lg text-primary">
            Winner!
          </h3>
          <p className="text-sm text-foreground font-mono mt-1 font-bold">
            {match.winnerName}
          </p>
          {match.resultKills > 0n && (
            <p className="text-xs text-muted-foreground mt-1">
              {match.resultKills.toString()} kills
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Prize: {formatAmount(match.prizeAmount)}
          </p>
        </motion.div>
      )}

      {/* Join button */}
      {isUpcoming && (
        <Button
          onClick={handleJoin}
          disabled={isJoining || hasJoined}
          className={cn(
            "w-full h-12 font-heading font-bold text-base",
            hasJoined
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-primary text-primary-foreground glow-orange",
          )}
          data-ocid="match_detail.join.primary_button"
        >
          {isJoining ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Joining...
            </span>
          ) : hasJoined ? (
            "✓ Already Joined"
          ) : (
            <span className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {isFree
                ? "Join Free Match"
                : `Join for ${formatAmount(match.entryFee)}`}
            </span>
          )}
        </Button>
      )}
    </div>
  );
}
