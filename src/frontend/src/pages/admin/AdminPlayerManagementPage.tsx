import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Minus, Plus, Search } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppNav } from "../../App";
import {
  useAdjustWallet,
  useGetLeaderboard,
  useGetPlayerDetails,
} from "../../hooks/useQueries";
import { formatAmount } from "../../utils/format";

interface AdminPlayerManagementPageProps {
  navigate: (nav: AppNav) => void;
}

export default function AdminPlayerManagementPage({
  navigate: _navigate,
}: AdminPlayerManagementPageProps) {
  const [search, setSearch] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDesc, setAdjustDesc] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "deduct">("add");
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);

  const { data: leaderboard, isLoading } = useGetLeaderboard();
  const { data: selectedPlayer } = useGetPlayerDetails(
    selectedPlayerId ?? undefined,
  );
  const adjustWallet = useAdjustWallet();

  const filteredPlayers = (leaderboard ?? []).filter(
    ([username]) =>
      search === "" || username.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdjust = async () => {
    if (!selectedPlayerId || !adjustAmount) {
      toast.error("Fill in all fields");
      return;
    }
    try {
      const amountPaise = BigInt(
        Math.round(Number.parseFloat(adjustAmount) * 100),
      );
      const finalAmount = adjustType === "deduct" ? -amountPaise : amountPaise;
      await adjustWallet.mutateAsync({
        playerId: selectedPlayerId,
        amount: finalAmount,
        description:
          adjustDesc ||
          (adjustType === "add" ? "Admin credit" : "Admin deduct"),
      });
      toast.success("Wallet adjusted!");
      setWalletDialogOpen(false);
      setAdjustAmount("");
      setAdjustDesc("");
    } catch {
      toast.error("Failed to adjust wallet");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="font-heading font-black text-xl text-foreground">
          Player Management
        </h2>
        <p className="text-xs text-muted-foreground">
          Manage player wallets and stats
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search players..."
          className="pl-9 bg-card border-border"
          data-ocid="admin.players.search_input"
        />
      </div>

      {/* Player list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-16 w-full rounded-xl"
              data-ocid="admin.players.loading_state"
            />
          ))}
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="admin.players.empty_state"
        >
          <p className="font-heading font-bold">No players found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPlayers.map(([username, earnings], idx) => (
            <motion.div
              key={username}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.04 }}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
              data-ocid={`admin.player.item.${idx + 1}`}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="font-heading font-black text-sm text-muted-foreground">
                  {username[0]?.toUpperCase() ?? "?"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-sm text-foreground truncate">
                  {username}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  Earnings: {earnings != null ? formatAmount(earnings) : "₹0"}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-primary/30 text-primary text-xs"
                onClick={() => {
                  // Find player ID from leaderboard index (approximate)
                  setSelectedPlayerId(idx + 1);
                  setWalletDialogOpen(true);
                }}
                data-ocid={`admin.player.edit_button.${idx + 1}`}
              >
                Wallet
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Wallet adjust dialog */}
      <Dialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen}>
        <DialogContent data-ocid="admin.wallet.dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Adjust Player Wallet
            </DialogTitle>
            <DialogDescription>
              Add or deduct funds from player wallet. Current balance:{" "}
              {formatAmount(selectedPlayer?.walletBalance ?? 0n)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Player ID input */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
                Player ID
              </Label>
              <Input
                type="number"
                value={selectedPlayerId?.toString() ?? ""}
                onChange={(e) =>
                  setSelectedPlayerId(Number.parseInt(e.target.value) || null)
                }
                className="bg-background border-border font-mono"
                data-ocid="admin.wallet.player_id.input"
              />
            </div>

            {/* Add / Deduct toggle */}
            <div className="flex rounded-xl overflow-hidden border border-border">
              <button
                className={`flex-1 py-2 text-sm font-heading font-bold flex items-center justify-center gap-1 transition-colors ${
                  adjustType === "add"
                    ? "bg-green-500/20 text-green-400"
                    : "text-muted-foreground"
                }`}
                onClick={() => setAdjustType("add")}
                type="button"
                data-ocid="admin.wallet.add.toggle"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
              <button
                className={`flex-1 py-2 text-sm font-heading font-bold flex items-center justify-center gap-1 transition-colors ${
                  adjustType === "deduct"
                    ? "bg-destructive/20 text-destructive"
                    : "text-muted-foreground"
                }`}
                onClick={() => setAdjustType("deduct")}
                type="button"
                data-ocid="admin.wallet.deduct.toggle"
              >
                <Minus className="h-3.5 w-3.5" />
                Deduct
              </button>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
                Amount (₹) *
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="Enter amount"
                className="bg-background border-border font-mono"
                data-ocid="admin.wallet.amount.input"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
                Description
              </Label>
              <Input
                value={adjustDesc}
                onChange={(e) => setAdjustDesc(e.target.value)}
                placeholder="Reason (optional)"
                className="bg-background border-border"
                data-ocid="admin.wallet.desc.input"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWalletDialogOpen(false)}
              data-ocid="admin.wallet.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdjust}
              disabled={adjustWallet.isPending}
              className={
                adjustType === "add"
                  ? "bg-green-600 text-white"
                  : "bg-destructive text-destructive-foreground"
              }
              data-ocid="admin.wallet.confirm_button"
            >
              {adjustWallet.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : adjustType === "add" ? (
                "Add Funds"
              ) : (
                "Deduct Funds"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
