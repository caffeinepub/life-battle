import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Crown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AppNav } from "../../App";
import { MatchStatus, MatchSubType, MatchType } from "../../backend.d";
import {
  useGetMatches,
  useSetMatchResult,
  useUpdateMatch,
} from "../../hooks/useQueries";
import { getSubTypeLabel } from "../../utils/format";

interface AdminEditMatchPageProps {
  matchId: number;
  navigate: (nav: AppNav) => void;
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

export default function AdminEditMatchPage({
  matchId,
  navigate,
}: AdminEditMatchPageProps) {
  const { data: matches } = useGetMatches();
  const match = matches?.find((m) => m.id === matchId);

  const [title, setTitle] = useState(match?.title ?? "");
  const [matchType, setMatchType] = useState<MatchType>(
    match?.matchType ?? MatchType.free,
  );
  const [matchSubType, setMatchSubType] = useState<MatchSubType>(
    match?.matchSubType ?? MatchSubType.survival,
  );
  const [mapName, setMapName] = useState(match?.mapName ?? "");
  const [totalPlayers, setTotalPlayers] = useState(
    match ? match.totalPlayers.toString() : "100",
  );
  const [entryFee, setEntryFee] = useState(
    match ? (Number(match.entryFee) / 100).toString() : "",
  );
  const [prizeAmount, setPrizeAmount] = useState(
    match ? (Number(match.prizeAmount) / 100).toString() : "",
  );
  const [scheduledAt, setScheduledAt] = useState(() => {
    if (!match) return "";
    const ms = Number(match.scheduledAt) / 1_000_000;
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 16);
  });
  const [roomId, setRoomId] = useState(match?.roomId ?? "");
  const [roomPassword, setRoomPassword] = useState(match?.roomPassword ?? "");
  const [status, setStatus] = useState<MatchStatus>(
    match?.status ?? MatchStatus.upcoming,
  );
  const [winnerName, setWinnerName] = useState(match?.winnerName ?? "");
  const [resultKills, setResultKills] = useState(
    match ? match.resultKills.toString() : "0",
  );

  const updateMatch = useUpdateMatch();
  const setMatchResult = useSetMatchResult();

  useEffect(() => {
    if (match) {
      setTitle(match.title);
      setMatchType(match.matchType);
      setMatchSubType(match.matchSubType);
      setMapName(match.mapName);
      setTotalPlayers(match.totalPlayers.toString());
      setEntryFee((Number(match.entryFee) / 100).toString());
      setPrizeAmount((Number(match.prizeAmount) / 100).toString());
      const ms = Number(match.scheduledAt) / 1_000_000;
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) {
        setScheduledAt(d.toISOString().slice(0, 16));
      }
      setRoomId(match.roomId);
      setRoomPassword(match.roomPassword);
      setStatus(match.status);
      setWinnerName(match.winnerName ?? "");
      setResultKills(match.resultKills.toString());
    }
  }, [match]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !scheduledAt || !mapName) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      const scheduledMs = new Date(scheduledAt).getTime();
      const scheduledNs = BigInt(scheduledMs) * 1_000_000n;
      const entryFeePaise = BigInt(
        Math.round(Number.parseFloat(entryFee || "0") * 100),
      );
      const prizePaise = BigInt(
        Math.round(Number.parseFloat(prizeAmount || "0") * 100),
      );
      const totalPlayersInt = BigInt(
        Math.max(1, Number.parseInt(totalPlayers || "100")),
      );

      await updateMatch.mutateAsync({
        matchId,
        title,
        matchType,
        matchSubType,
        mapName,
        totalPlayers: totalPlayersInt,
        entryFee: entryFeePaise,
        prizeAmount: prizePaise,
        scheduledAt: scheduledNs,
        roomId,
        roomPassword,
        status,
      });
      toast.success("Match updated! 🎮");
      navigate({ page: "admin-dashboard" });
    } catch {
      toast.error("Failed to update match");
    }
  };

  const handleSetResult = async () => {
    if (!winnerName.trim()) {
      toast.error("Enter winner name");
      return;
    }
    try {
      await setMatchResult.mutateAsync({
        matchId,
        winnerName: winnerName.trim(),
        resultKills: BigInt(Math.max(0, Number.parseInt(resultKills || "0"))),
      });
      toast.success("Match result set! 🏆");
      navigate({ page: "admin-dashboard" });
    } catch {
      toast.error("Failed to set match result");
    }
  };

  if (!match) {
    return (
      <div className="p-4 text-center py-16">
        <p className="text-muted-foreground">Match not found</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      <div>
        <h2 className="font-heading font-black text-xl text-foreground">
          Edit Match
        </h2>
        <p className="text-xs text-muted-foreground font-mono">
          ID: #{matchId}
        </p>
      </div>

      <form
        onSubmit={handleUpdate}
        className="space-y-4"
        data-ocid="admin.edit.panel"
      >
        <div>
          <Label
            htmlFor="title"
            className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
          >
            Title *
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-card border-border"
            required
            data-ocid="admin.edit.title.input"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
              Type *
            </Label>
            <Select
              value={matchType}
              onValueChange={(v) => setMatchType(v as MatchType)}
            >
              <SelectTrigger
                className="bg-card border-border"
                data-ocid="admin.edit.type.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MatchType.free}>Free</SelectItem>
                <SelectItem value={MatchType.paid}>Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
              Sub-Type *
            </Label>
            <Select
              value={matchSubType}
              onValueChange={(v) => setMatchSubType(v as MatchSubType)}
            >
              <SelectTrigger
                className="bg-card border-border"
                data-ocid="admin.edit.subtype.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUB_TYPES.map((st) => (
                  <SelectItem key={st} value={st}>
                    {getSubTypeLabel(st)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label
              htmlFor="mapName"
              className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
            >
              Map Name *
            </Label>
            <Input
              id="mapName"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              placeholder="e.g. Bermuda"
              className="bg-card border-border font-mono"
              required
              data-ocid="admin.edit.map.input"
            />
          </div>
          <div>
            <Label
              htmlFor="totalPlayers"
              className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
            >
              Total Players
            </Label>
            <Input
              id="totalPlayers"
              type="number"
              min="1"
              value={totalPlayers}
              onChange={(e) => setTotalPlayers(e.target.value)}
              className="bg-card border-border font-mono"
              data-ocid="admin.edit.total_players.input"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
            Status *
          </Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as MatchStatus)}
          >
            <SelectTrigger
              className="bg-card border-border"
              data-ocid="admin.edit.status.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MatchStatus.upcoming}>Upcoming</SelectItem>
              <SelectItem value={MatchStatus.ongoing}>Ongoing</SelectItem>
              <SelectItem value={MatchStatus.completed}>Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label
              htmlFor="entry"
              className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
            >
              Entry (₹)
            </Label>
            <Input
              id="entry"
              type="number"
              min="0"
              step="0.01"
              value={entryFee}
              onChange={(e) => setEntryFee(e.target.value)}
              className="bg-card border-border font-mono"
              data-ocid="admin.edit.entry_fee.input"
            />
          </div>
          <div>
            <Label
              htmlFor="prize"
              className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
            >
              Prize (₹)
            </Label>
            <Input
              id="prize"
              type="number"
              min="0"
              step="0.01"
              value={prizeAmount}
              onChange={(e) => setPrizeAmount(e.target.value)}
              className="bg-card border-border font-mono"
              data-ocid="admin.edit.prize.input"
            />
          </div>
        </div>

        <div>
          <Label
            htmlFor="schedule"
            className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
          >
            Date & Time *
          </Label>
          <Input
            id="schedule"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="bg-card border-border font-mono"
            data-ocid="admin.edit.schedule.input"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label
              htmlFor="room"
              className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
            >
              Room ID
            </Label>
            <Input
              id="room"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="bg-card border-border font-mono"
              data-ocid="admin.edit.room_id.input"
            />
          </div>
          <div>
            <Label
              htmlFor="roomPwd"
              className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
            >
              Room Password
            </Label>
            <Input
              id="roomPwd"
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
              className="bg-card border-border font-mono"
              data-ocid="admin.edit.room_password.input"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-border"
            onClick={() => navigate({ page: "admin-dashboard" })}
            data-ocid="admin.edit.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateMatch.isPending}
            className="flex-1 bg-primary text-primary-foreground font-heading font-bold glow-orange"
            data-ocid="admin.edit.save_button"
          >
            {updateMatch.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>

      {/* Set match result */}
      <Separator />
      <div className="space-y-3" data-ocid="admin.result.panel">
        <div>
          <h3 className="font-heading font-bold text-base text-foreground">
            Set Match Result
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Announce winner and kill score
          </p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
            Winner Name
          </Label>
          <Input
            value={winnerName}
            onChange={(e) => setWinnerName(e.target.value)}
            placeholder="Enter winner's in-game name"
            className="bg-card border-border font-mono"
            data-ocid="admin.result.winner.input"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
            Kill Points / Score
          </Label>
          <Input
            type="number"
            min="0"
            value={resultKills}
            onChange={(e) => setResultKills(e.target.value)}
            placeholder="0"
            className="bg-card border-border font-mono"
            data-ocid="admin.result.kills.input"
          />
        </div>
        <Button
          onClick={handleSetResult}
          disabled={setMatchResult.isPending || !winnerName.trim()}
          className="w-full bg-accent text-accent-foreground font-heading font-bold"
          data-ocid="admin.result.submit_button"
        >
          {setMatchResult.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Setting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Set as Winner
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
