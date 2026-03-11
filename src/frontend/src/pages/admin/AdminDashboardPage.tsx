import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Crown,
  Edit,
  Loader2,
  Plus,
  Swords,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppNav } from "../../App";
import {
  MatchStatus,
  Variant_pending_approved_rejected,
} from "../../backend.d";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useApproveDepositRequest,
  useApproveWithdrawRequest,
  useDeleteMatch,
  useGetAdminDashboard,
  useGetDepositRequests,
  useGetMatches,
  useGetWithdrawRequests,
  useIsCallerAdmin,
  useRejectDepositRequest,
  useRejectWithdrawRequest,
} from "../../hooks/useQueries";
import { formatAmount, formatDate, getStatusLabel } from "../../utils/format";

interface AdminDashboardPageProps {
  navigate: (nav: AppNav) => void;
}

function RequestStatusBadge({
  status,
}: {
  status: Variant_pending_approved_rejected;
}) {
  if (status === Variant_pending_approved_rejected.approved)
    return (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
        Approved
      </Badge>
    );
  if (status === Variant_pending_approved_rejected.rejected)
    return (
      <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">
        Rejected
      </Badge>
    );
  return (
    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">
      Pending
    </Badge>
  );
}

function RejectInput({
  onReject,
  isPending,
  ocid,
}: {
  onReject: (note: string) => void;
  isPending: boolean;
  ocid: string;
}) {
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
        onClick={() => setOpen(true)}
        data-ocid={ocid}
      >
        <XCircle className="h-3 w-3 mr-1" />
        Reject
      </Button>
    );
  }

  return (
    <div className="flex gap-1 items-center flex-1">
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Rejection reason"
        className="h-7 text-xs bg-card border-border"
      />
      <Button
        size="sm"
        className="h-7 text-xs bg-destructive text-destructive-foreground"
        onClick={() => onReject(note)}
        disabled={isPending}
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "OK"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs"
        onClick={() => setOpen(false)}
      >
        ✕
      </Button>
    </div>
  );
}

export default function AdminDashboardPage({
  navigate,
}: AdminDashboardPageProps) {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: dashboard, isLoading: dashLoading } = useGetAdminDashboard();
  const { data: matches, isLoading: matchesLoading } = useGetMatches();
  const { data: depositRequests, isLoading: drLoading } =
    useGetDepositRequests();
  const { data: withdrawRequests, isLoading: wrLoading } =
    useGetWithdrawRequests();

  const deleteMatch = useDeleteMatch();
  const approveDeposit = useApproveDepositRequest();
  const rejectDeposit = useRejectDepositRequest();
  const approveWithdraw = useApproveWithdrawRequest();
  const rejectWithdraw = useRejectWithdrawRequest();

  if (!identity || identity.getPrincipal().isAnonymous()) {
    return (
      <div className="p-4 text-center py-16" data-ocid="admin.error_state">
        <p className="font-heading font-bold text-destructive">
          Please login first
        </p>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div className="p-4 space-y-4" data-ocid="admin.loading_state">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4 text-center py-16" data-ocid="admin.error_state">
        <div className="text-4xl mb-4">🔒</div>
        <p className="font-heading font-black text-xl text-destructive">
          Access Denied
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          You don't have admin privileges.
        </p>
      </div>
    );
  }

  const [totalPlayers, totalMatches, totalRevenue] = dashboard ?? [0n, 0n, 0n];

  const handleDelete = async (matchId: number) => {
    try {
      await deleteMatch.mutateAsync(matchId);
      toast.success("Match deleted");
    } catch {
      toast.error("Failed to delete match");
    }
  };

  const statsCards = [
    {
      label: "Total Players",
      value: totalPlayers?.toString() ?? "0",
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Total Matches",
      value: totalMatches?.toString() ?? "0",
      icon: Swords,
      color: "text-accent",
    },
    {
      label: "Revenue",
      value: formatAmount(totalRevenue ?? 0n),
      icon: TrendingUp,
      color: "text-green-400",
    },
  ];

  const pendingDeposits = (depositRequests ?? []).filter(
    (r) => r.status === Variant_pending_approved_rejected.pending,
  );
  const pendingWithdraws = (withdrawRequests ?? []).filter(
    (r) => r.status === Variant_pending_approved_rejected.pending,
  );

  return (
    <div className="p-4 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {statsCards.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-border bg-card p-3 text-center"
            data-ocid={`admin.stats.item.${i + 1}`}
          >
            {dashLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <>
                <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
                <p className={`font-heading font-black text-lg ${color}`}>
                  {value}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {label}
                </p>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Create match CTA */}
      <Button
        onClick={() => navigate({ page: "admin-create" })}
        className="w-full h-12 bg-primary text-primary-foreground font-heading font-bold glow-orange"
        data-ocid="admin.create.primary_button"
      >
        <Plus className="h-5 w-5 mr-2" />
        Create New Match
      </Button>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={() => navigate({ page: "admin-players" })}
          className="border-border text-foreground font-heading"
          data-ocid="admin.players.button"
        >
          <Users className="h-4 w-4 mr-1" />
          Players
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate({ page: "admin-create" })}
          className="border-border text-foreground font-heading"
          data-ocid="admin.matches.button"
        >
          <Swords className="h-4 w-4 mr-1" />
          Matches
        </Button>
      </div>

      {/* Tabs: Matches / Deposits / Withdrawals */}
      <Tabs defaultValue="matches" data-ocid="admin.tabs.section">
        <TabsList className="w-full bg-card border border-border">
          <TabsTrigger
            value="matches"
            className="flex-1 font-heading font-bold text-xs"
            data-ocid="admin.matches.tab"
          >
            Matches ({(matches ?? []).length})
          </TabsTrigger>
          <TabsTrigger
            value="deposits"
            className="flex-1 font-heading font-bold text-xs"
            data-ocid="admin.deposits.tab"
          >
            Deposits
            {pendingDeposits.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground rounded-full text-[9px] px-1">
                {pendingDeposits.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="withdrawals"
            className="flex-1 font-heading font-bold text-xs"
            data-ocid="admin.withdrawals.tab"
          >
            Withdrawals
            {pendingWithdraws.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground rounded-full text-[9px] px-1">
                {pendingWithdraws.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Matches Tab ── */}
        <TabsContent value="matches" className="mt-3">
          {matchesLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : !matches || matches.length === 0 ? (
            <div
              className="text-center py-8 text-muted-foreground"
              data-ocid="admin.matches.empty_state"
            >
              <p className="font-heading font-bold">No matches yet</p>
              <p className="text-sm mt-1">Create your first match!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {matches.map((match, idx) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  className="rounded-xl border border-border bg-card p-3"
                  data-ocid={`admin.match.item.${idx + 1}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm text-foreground truncate">
                        {match.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={cn(
                            "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full",
                            match.status === MatchStatus.ongoing &&
                              "badge-live",
                            match.status === MatchStatus.upcoming &&
                              "badge-upcoming",
                            match.status === MatchStatus.completed &&
                              "badge-completed",
                          )}
                        >
                          {getStatusLabel(match.status)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() =>
                          navigate({ page: "admin-edit", matchId: match.id })
                        }
                        data-ocid={`admin.match.edit_button.${idx + 1}`}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            data-ocid={`admin.match.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-ocid="admin.delete.dialog">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Match?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{match.title}". This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-ocid="admin.delete.cancel_button">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(match.id)}
                              className="bg-destructive text-destructive-foreground"
                              data-ocid="admin.delete.confirm_button"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span>⏰ {formatDate(match.scheduledAt)}</span>
                    <span>💰 {formatAmount(match.prizeAmount)}</span>
                    <span>👥 {match.playerIds.length}</span>
                  </div>
                  {match.status === MatchStatus.upcoming &&
                    match.playerIds.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full h-7 text-xs border-primary/30 text-primary"
                        onClick={() =>
                          navigate({ page: "admin-edit", matchId: match.id })
                        }
                        data-ocid={`admin.match.result_button.${idx + 1}`}
                      >
                        <Crown className="h-3 w-3 mr-1" />
                        Set Result
                      </Button>
                    )}
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Deposits Tab ── */}
        <TabsContent value="deposits" className="mt-3">
          {drLoading ? (
            <div className="space-y-2" data-ocid="admin.deposits.loading_state">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : !depositRequests || depositRequests.length === 0 ? (
            <div
              className="text-center py-8 text-muted-foreground"
              data-ocid="admin.deposits.empty_state"
            >
              <Wallet className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="font-heading font-bold">No deposit requests</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...depositRequests]
                .sort((a, b) => Number(b.timestamp - a.timestamp))
                .map((req, idx) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="rounded-xl border border-border bg-card p-3 space-y-2"
                    data-ocid={`admin.deposit.item.${idx + 1}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-mono font-bold text-sm text-foreground">
                            ₹{String(req.amount)}
                          </p>
                          <RequestStatusBadge status={req.status} />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          Player #{req.playerId} · TXN: {req.transactionId}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {formatDate(req.timestamp)}
                        </p>
                        {req.adminNote && (
                          <p className="text-[10px] text-destructive mt-0.5">
                            Note: {req.adminNote}
                          </p>
                        )}
                      </div>
                    </div>

                    {req.status ===
                      Variant_pending_approved_rejected.pending && (
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                          onClick={async () => {
                            try {
                              await approveDeposit.mutateAsync(req.id);
                              toast.success("Deposit approved");
                            } catch {
                              toast.error("Failed to approve");
                            }
                          }}
                          disabled={approveDeposit.isPending}
                          data-ocid={`admin.deposit.confirm_button.${idx + 1}`}
                        >
                          {approveDeposit.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <RejectInput
                          onReject={async (note) => {
                            try {
                              await rejectDeposit.mutateAsync({
                                id: req.id,
                                note,
                              });
                              toast.success("Deposit rejected");
                            } catch {
                              toast.error("Failed to reject");
                            }
                          }}
                          isPending={rejectDeposit.isPending}
                          ocid={`admin.deposit.delete_button.${idx + 1}`}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
            </div>
          )}
        </TabsContent>

        {/* ── Withdrawals Tab ── */}
        <TabsContent value="withdrawals" className="mt-3">
          {wrLoading ? (
            <div
              className="space-y-2"
              data-ocid="admin.withdrawals.loading_state"
            >
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : !withdrawRequests || withdrawRequests.length === 0 ? (
            <div
              className="text-center py-8 text-muted-foreground"
              data-ocid="admin.withdrawals.empty_state"
            >
              <Wallet className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="font-heading font-bold">No withdrawal requests</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...withdrawRequests]
                .sort((a, b) => Number(b.timestamp - a.timestamp))
                .map((req, idx) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="rounded-xl border border-border bg-card p-3 space-y-2"
                    data-ocid={`admin.withdraw.item.${idx + 1}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-mono font-bold text-sm text-foreground">
                            ₹{String(req.amount)}
                          </p>
                          <RequestStatusBadge status={req.status} />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          Player #{req.playerId} · UPI: {req.upiId}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {formatDate(req.timestamp)}
                        </p>
                        {req.adminNote && (
                          <p className="text-[10px] text-destructive mt-0.5">
                            Note: {req.adminNote}
                          </p>
                        )}
                      </div>
                    </div>

                    {req.status ===
                      Variant_pending_approved_rejected.pending && (
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                          onClick={async () => {
                            try {
                              await approveWithdraw.mutateAsync(req.id);
                              toast.success("Withdrawal approved");
                            } catch {
                              toast.error("Failed to approve");
                            }
                          }}
                          disabled={approveWithdraw.isPending}
                          data-ocid={`admin.withdraw.confirm_button.${idx + 1}`}
                        >
                          {approveWithdraw.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <RejectInput
                          onReject={async (note) => {
                            try {
                              await rejectWithdraw.mutateAsync({
                                id: req.id,
                                note,
                              });
                              toast.success("Withdrawal rejected");
                            } catch {
                              toast.error("Failed to reject");
                            }
                          }}
                          isPending={rejectWithdraw.isPending}
                          ocid={`admin.withdraw.delete_button.${idx + 1}`}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
