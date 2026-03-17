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
  { type: MatchSubType.survival, color: "from-orange-600/80 to-orange-900/60" },
  { type: MatchSubType.lonewolf1v1, color: "from-blue-600/80 to-blue-900/60" },
  {
    type: MatchSubType.lonewolf2v2,
    color: "from-green-600/80 to-green-900/60",
  },
  { type: MatchSubType.cs4v4, color: "from-red-600/80 to-red-900/60" },
  { type: MatchSubType.cs1v1, color: "from-purple-600/80 to-purple-900/60" },
  { type: MatchSubType.cs2v2, color: "from-gray-500/80 to-gray-800/60" },
  { type: MatchSubType.lossToWin, color: "from-pink-600/80 to-pink-900/60" },
  { type: MatchSubType.perKill, color: "from-yellow-600/80 to-yellow-900/60" },
];

const STATUS_TABS = [
  { value: MatchStatus.upcoming, label: "Upcoming" },
  { value: MatchStatus.ongoing, label: "Ongoing" },
  { value: MatchStatus.completed, label: "Results" },
];

const CARD_ART = "/assets/generated/ff-card-art.dim_300x300.jpg";

export default function MatchListPage({
  type,
  navigate,
  playerId,
}: MatchListPageProps) {
  const [selectedSubType, setSelectedSubType] = useState<MatchSubType | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<MatchStatus>(
    MatchStatus.upcoming,
  );
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const { data: matches, isLoading } = useGetMatches();
  const { data: playerDetails } = useGetPlayerDetails(playerId);
  const joinMatch = useJoinMatch();

  const matchType = type === "free" ? MatchType.free : MatchType.paid;

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

  // ── Category grid view ──
  if (!selectedSubType) {
    return (
      <div className="p-4 space-y-4">
        <div>
          <h2 className="font-heading font-black text-xl text-foreground">
            {type === "free" ? "Free Matches" : "Paid Matches"}
          </h2>
          <p className="text-xs text-muted-foreground">Select match type</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {SUB_TYPES.map(({ type: st, color }, idx) => {
            const allOfType = (matches ?? []).filter(
              (m) => m.matchType === matchType && m.matchSubType === st,
            );
            const liveCount = allOfType.filter(
              (m) => m.status === MatchStatus.ongoing,
            ).length;
            const upcomingCount = allOfType.filter(
              (m) => m.status === MatchStatus.upcoming,
            ).length;
            const count = liveCount + upcomingCount;
            const isLive = liveCount > 0;

            return (
              <motion.button
                key={st}
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedSubType(st)}
                className="relative rounded-xl overflow-hidden aspect-square native-tap focus:outline-none"
                data-ocid={`matches.${st}.tab`}
              >
                {/* Background art */}
                <img
                  src={CARD_ART}
                  alt={getSubTypeLabel(st)}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Color overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${color} mix-blend-multiply`}
                />
                {/* Dark bottom gradient for label */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                {/* Player count badge */}
                <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/60 rounded-full px-1.5 py-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isLive ? "bg-green-400" : "bg-red-500"
                    }`}
                  />
                  <span className="text-white text-[10px] font-bold font-mono">
                    {count}
                  </span>
                </div>

                {/* Label */}
                <div className="absolute bottom-0 inset-x-0 p-1.5">
                  <p className="text-white font-heading font-black text-[10px] leading-tight text-center uppercase">
                    {getSubTypeLabel(st)}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Match list for selected sub-type ──
  const filtered = (matches ?? [])
    .filter((m) => m.matchType === matchType)
    .filter((m) => m.matchSubType === selectedSubType)
    .filter((m) => m.status === statusFilter);

  return (
    <div className="p-4 space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSelectedSubType(null)}
          className="text-muted-foreground hover:text-foreground transition-colors font-mono text-sm"
          data-ocid="matches.back.button"
        >
          ← Back
        </button>
        <div>
          <h2 className="font-heading font-black text-xl text-foreground">
            {getSubTypeLabel(selectedSubType)}
          </h2>
          <p className="text-xs text-muted-foreground">
            {filtered.length} match{filtered.length !== 1 ? "es" : ""} found
          </p>
        </div>
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
