import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppNav } from "../App";
import { MatchStatus, MatchSubType, MatchType } from "../backend.d";
import MatchCard from "../components/MatchCard";
import {
  useGetMatches,
  useGetPlayerDetails,
  useJoinMatch,
} from "../hooks/useQueries";
import { getSubTypeLabel } from "../utils/format";

interface MatchListPageProps {
  type: "free" | "paid";
  navigate: (nav: AppNav) => void;
  playerId?: number;
}

const SUB_TYPES = [
  MatchSubType.survival,
  MatchSubType.perKill,
  MatchSubType.lossToWin,
  MatchSubType.lonewolf1v1,
  MatchSubType.lonewolf2v2,
  MatchSubType.cs1v1,
  MatchSubType.cs2v2,
  MatchSubType.cs4v4,
];

const STATUS_TABS = [
  { value: MatchStatus.upcoming, label: "Upcoming" },
  { value: MatchStatus.ongoing, label: "Ongoing" },
  { value: MatchStatus.completed, label: "Results" },
];

export default function MatchListPage({
  type,
  navigate,
  playerId,
}: MatchListPageProps) {
  const [selectedSubType, setSelectedSubType] = useState<MatchSubType>(
    MatchSubType.survival,
  );
  const [statusFilter, setStatusFilter] = useState<MatchStatus>(
    MatchStatus.upcoming,
  );
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const { data: matches, isLoading } = useGetMatches();
  const { data: playerDetails } = useGetPlayerDetails(playerId);
  const joinMatch = useJoinMatch();

  const matchType = type === "free" ? MatchType.free : MatchType.paid;

  const filtered = (matches ?? [])
    .filter((m) => m.matchType === matchType)
    .filter((m) => m.matchSubType === selectedSubType)
    .filter((m) => m.status === statusFilter);

  const handleJoin = async (matchId: number) => {
    setJoiningId(matchId);
    try {
      await joinMatch.mutateAsync(matchId);
      toast.success("🎮 Joined match successfully!");
    } catch {
      toast.error("Failed to join match.");
    } finally {
      setJoiningId(null);
    }
  };

  const joinedMatchIds = new Set(
    (playerDetails
      ? matches
          ?.filter((m) => m.playerIds.includes(playerDetails.id))
          .map((m) => m.id)
      : []) ?? [],
  );

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h2 className="font-heading font-black text-xl text-foreground">
          {type === "free" ? "Free Matches" : "Paid Matches"}
        </h2>
        <p className="text-xs text-muted-foreground">
          {filtered.length} match{filtered.length !== 1 ? "es" : ""} found
        </p>
      </div>

      {/* Sub-type tabs (horizontal scroll) */}
      <div
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
        data-ocid="matches.subtype.tab"
      >
        {SUB_TYPES.map((st) => (
          <button
            type="button"
            key={st}
            onClick={() => setSelectedSubType(st)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all ${
              selectedSubType === st
                ? "bg-primary text-primary-foreground glow-orange"
                : "bg-card border border-border text-muted-foreground hover:border-primary/30"
            }`}
            data-ocid={`matches.${st}.tab`}
          >
            {getSubTypeLabel(st)}
          </button>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-2" data-ocid="matches.status.tab">
        {STATUS_TABS.map(({ value, label }) => (
          <button
            type="button"
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`flex-1 py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
              statusFilter === value
                ? value === MatchStatus.ongoing
                  ? "bg-green-500/20 text-green-400 border border-green-500/40"
                  : value === MatchStatus.completed
                    ? "bg-accent/20 text-accent border border-accent/40"
                    : "bg-primary/20 text-primary border border-primary/40"
                : "bg-card border border-border text-muted-foreground hover:border-primary/20"
            }`}
            data-ocid={`matches.${value}.tab`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Match list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-48 w-full rounded-xl"
              data-ocid="matches.loading_state"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="matches.empty_state"
        >
          <div className="text-4xl mb-3">🎮</div>
          <p className="font-heading font-bold text-base">No matches found</p>
          <p className="text-sm mt-1">
            No {statusFilter} {getSubTypeLabel(selectedSubType)} matches
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((match, idx) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
            >
              <MatchCard
                match={match}
                index={idx + 1}
                onJoin={handleJoin}
                onView={(id) => navigate({ page: "match-detail", matchId: id })}
                isJoining={joiningId === match.id}
                hasJoined={joinedMatchIds.has(match.id)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
