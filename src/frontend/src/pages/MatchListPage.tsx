import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppNav } from "../App";
import { MatchStatus, MatchType } from "../backend.d";
import MatchCard from "../components/MatchCard";
import {
  useGetCallerProfile,
  useGetMatches,
  useGetPlayerDetails,
  useJoinMatch,
} from "../hooks/useQueries";

interface MatchListPageProps {
  type: "free" | "paid";
  navigate: (nav: AppNav) => void;
  playerId?: number;
}

export default function MatchListPage({
  type,
  navigate,
  playerId,
}: MatchListPageProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MatchStatus>("all");
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const { data: matches, isLoading } = useGetMatches();
  const { data: playerDetails } = useGetPlayerDetails(playerId);
  const joinMatch = useJoinMatch();

  const matchType = type === "free" ? MatchType.free : MatchType.paid;

  const filtered = (matches ?? [])
    .filter((m) => m.matchType === matchType)
    .filter((m) => statusFilter === "all" || m.status === statusFilter)
    .filter(
      (m) =>
        search === "" || m.title.toLowerCase().includes(search.toLowerCase()),
    );

  const handleJoin = async (matchId: number) => {
    setJoiningId(matchId);
    try {
      await joinMatch.mutateAsync(matchId);
      toast.success("🎮 Joined match successfully!");
    } catch {
      toast.error("Failed to join match. Check your wallet balance.");
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

  const statusOptions = [
    { value: "all" as const, label: "All" },
    { value: MatchStatus.upcoming, label: "Upcoming" },
    { value: MatchStatus.live, label: "Live" },
    { value: MatchStatus.completed, label: "Done" },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-black text-xl text-foreground">
            {type === "free" ? "Free Matches" : "Paid Matches"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {filtered.length} match{filtered.length !== 1 ? "es" : ""} available
          </p>
        </div>
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search matches..."
          className="pl-9 bg-card border-border font-mono text-sm"
          data-ocid="matches.search_input"
        />
      </div>

      {/* Status filters */}
      <div
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
        data-ocid="matches.filter.tab"
      >
        {statusOptions.map(({ value, label }) => (
          <button
            type="button"
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all ${
              statusFilter === value
                ? "bg-primary text-primary-foreground glow-orange"
                : "bg-card border border-border text-muted-foreground hover:border-primary/30"
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
          <p className="text-sm mt-1">Check back later for new tournaments</p>
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
