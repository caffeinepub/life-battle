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
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppNav } from "../../App";
import { MatchType } from "../../backend.d";
import { useCreateMatch } from "../../hooks/useQueries";

interface AdminCreateMatchPageProps {
  navigate: (nav: AppNav) => void;
}

export default function AdminCreateMatchPage({
  navigate,
}: AdminCreateMatchPageProps) {
  const [title, setTitle] = useState("");
  const [matchType, setMatchType] = useState<MatchType>(MatchType.free);
  const [entryFee, setEntryFee] = useState("");
  const [prizeAmount, setPrizeAmount] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");

  const createMatch = useCreateMatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !scheduledAt || !roomId) {
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

      // Combine roomId with password if provided
      const roomData = roomPassword ? `${roomId}|${roomPassword}` : roomId;

      await createMatch.mutateAsync({
        title,
        matchType,
        entryFee: entryFeePaise,
        prizeAmount: prizePaise,
        scheduledAt: scheduledNs,
        roomId: roomData,
      });

      toast.success("Match created successfully! 🎮");
      navigate({ page: "admin-dashboard" });
    } catch {
      toast.error("Failed to create match");
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="font-heading font-black text-xl text-foreground">
          Create Match
        </h2>
        <p className="text-xs text-muted-foreground">
          New Free Fire tournament
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        data-ocid="admin.create.panel"
      >
        <div>
          <Label
            htmlFor="title"
            className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
          >
            Match Title *
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Free Fire Squad Battle #1"
            className="bg-card border-border font-body"
            required
            data-ocid="admin.create.title.input"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
            Match Type *
          </Label>
          <Select
            value={matchType}
            onValueChange={(v) => setMatchType(v as MatchType)}
          >
            <SelectTrigger
              className="bg-card border-border"
              data-ocid="admin.create.type.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MatchType.free}>Free Match</SelectItem>
              <SelectItem value={MatchType.paid}>Paid Match</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label
              htmlFor="entry"
              className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
            >
              Entry Fee (₹) {matchType === MatchType.free && "(0 for free)"}
            </Label>
            <Input
              id="entry"
              type="number"
              min="0"
              step="0.01"
              value={entryFee}
              onChange={(e) => setEntryFee(e.target.value)}
              placeholder="0"
              className="bg-card border-border font-mono"
              disabled={matchType === MatchType.free}
              data-ocid="admin.create.entry_fee.input"
            />
          </div>
          <div>
            <Label
              htmlFor="prize"
              className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
            >
              Prize Pool (₹) *
            </Label>
            <Input
              id="prize"
              type="number"
              min="0"
              step="0.01"
              value={prizeAmount}
              onChange={(e) => setPrizeAmount(e.target.value)}
              placeholder="500"
              className="bg-card border-border font-mono"
              required
              data-ocid="admin.create.prize.input"
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
            required
            data-ocid="admin.create.schedule.input"
          />
        </div>

        <div>
          <Label
            htmlFor="roomId"
            className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
          >
            Room ID *
          </Label>
          <Input
            id="roomId"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID"
            className="bg-card border-border font-mono"
            required
            data-ocid="admin.create.room_id.input"
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
            placeholder="Enter Room Password (optional)"
            className="bg-card border-border font-mono"
            data-ocid="admin.create.room_password.input"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-border"
            onClick={() => navigate({ page: "admin-dashboard" })}
            data-ocid="admin.create.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMatch.isPending}
            className="flex-1 bg-primary text-primary-foreground font-heading font-bold glow-orange"
            data-ocid="admin.create.submit_button"
          >
            {createMatch.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </span>
            ) : (
              "Create Match"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
