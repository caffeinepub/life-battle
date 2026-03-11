import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  RefreshCw,
  Swords,
  Target,
  Trophy,
  Wallet,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { AppNav } from "../App";
import { TxType, Variant_pending_approved_rejected } from "../backend.d";
import {
  useGetPlayerDepositRequests,
  useGetPlayerDetails,
  useGetPlayerWithdrawRequests,
  useGetWalletTransactions,
  useSubmitDepositRequest,
  useSubmitWithdrawRequest,
} from "../hooks/useQueries";
import { formatAmount, formatDate } from "../utils/format";

const DEPOSIT_AMOUNTS = [10, 50, 100, 200, 500];
const UPI_ID = "6280048307@fam";
const QR_IMAGE = "/assets/uploads/file_00000000efd071fa89ce6e365bcb68fe-1.png";
const TIMER_SECONDS = 3 * 60; // 3 minutes

function StatusBadge({
  status,
}: { status: Variant_pending_approved_rejected }) {
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

function CountdownTimer({
  onExpire,
}: {
  onExpire: () => void;
}) {
  const [seconds, setSeconds] = useState(TIMER_SECONDS);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpireRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const pct = (seconds / TIMER_SECONDS) * 100;
  const isUrgent = seconds <= 30;

  return (
    <div
      className={cn("flex items-center gap-2", isUrgent && "text-destructive")}
    >
      <Clock className="h-4 w-4" />
      <span className="font-mono font-bold text-sm">
        {mm}:{ss}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isUrgent ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground">QR valid for</span>
    </div>
  );
}

type DepositStep = "amount" | "qr" | "success";
type WithdrawStep = "form" | "success";

interface WalletPageProps {
  navigate: (nav: AppNav) => void;
  playerId?: number;
}

export default function WalletPage({
  navigate: _navigate,
  playerId,
}: WalletPageProps) {
  const { data: player, isLoading: playerLoading } =
    useGetPlayerDetails(playerId);
  const { data: transactions, isLoading: txLoading } =
    useGetWalletTransactions(playerId);
  const { data: depositRequests, isLoading: drLoading } =
    useGetPlayerDepositRequests();
  const { data: withdrawRequests, isLoading: wrLoading } =
    useGetPlayerWithdrawRequests();

  const submitDeposit = useSubmitDepositRequest();
  const submitWithdraw = useSubmitWithdrawRequest();

  // Deposit state
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositStep, setDepositStep] = useState<DepositStep>("amount");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [qrExpired, setQrExpired] = useState(false);

  // Withdraw state
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState<WithdrawStep>("form");
  const [withdrawUpi, setWithdrawUpi] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const isLoading = playerLoading || txLoading;

  const credits = (transactions ?? []).filter(
    (t) => t.txType === TxType.credit,
  );
  const debits = (transactions ?? []).filter((t) => t.txType === TxType.debit);
  const totalCredit = credits.reduce((acc, t) => acc + t.amount, 0n);
  const totalDebit = debits.reduce((acc, t) => acc + t.amount, 0n);

  const resetDeposit = useCallback(() => {
    setDepositStep("amount");
    setSelectedAmount(null);
    setTransactionId("");
    setQrExpired(false);
  }, []);

  const handleDepositClose = (open: boolean) => {
    if (!open) resetDeposit();
    setDepositOpen(open);
  };

  const handleWithdrawClose = (open: boolean) => {
    if (!open) {
      setWithdrawStep("form");
      setWithdrawUpi("");
      setWithdrawAmount("");
    }
    setWithdrawOpen(open);
  };

  const handleDepositSubmit = async () => {
    if (!transactionId.trim()) {
      toast.error("Please enter your UPI Transaction ID");
      return;
    }
    if (!selectedAmount) return;
    try {
      await submitDeposit.mutateAsync({
        amount: BigInt(selectedAmount),
        transactionId: transactionId.trim(),
      });
      setDepositStep("success");
    } catch {
      toast.error("Failed to submit deposit. Please try again.");
    }
  };

  const handleWithdrawSubmit = async () => {
    const amt = Number(withdrawAmount);
    if (!withdrawUpi.trim()) {
      toast.error("Please enter your UPI ID");
      return;
    }
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    const winBal = Number(player?.winningBalance ?? 0n);
    if (amt > winBal) {
      toast.error(`Amount exceeds winning balance (₹${winBal})`);
      return;
    }
    try {
      await submitWithdraw.mutateAsync({
        amount: BigInt(amt),
        upiId: withdrawUpi.trim(),
      });
      setWithdrawStep("success");
    } catch {
      toast.error("Failed to submit withdrawal. Please try again.");
    }
  };

  const copyUpi = () => {
    navigator.clipboard.writeText(UPI_ID).then(() => {
      toast.success("UPI ID copied!");
    });
  };

  return (
    <div className="p-4 space-y-5 pb-8">
      {/* ── Balance Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-accent/10 p-5 glow-orange"
        data-ocid="wallet.card"
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-accent/10 blur-2xl" />
        <div className="relative z-10 space-y-4">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-mono mb-1">
              Available Balance
            </p>
            {playerLoading ? (
              <Skeleton className="h-10 w-36" />
            ) : (
              <p className="font-heading font-black text-4xl text-foreground">
                ₹{String(player?.walletBalance ?? 0n)}
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1 rounded-xl bg-card/50 border border-border/60 p-3">
              <p className="text-[10px] text-muted-foreground uppercase mb-0.5">
                Winning Balance
              </p>
              <p className="font-mono font-bold text-green-400 text-base">
                ₹{String(player?.winningBalance ?? 0n)}
              </p>
            </div>
            <div className="flex-1 rounded-xl bg-card/50 border border-border/60 p-3">
              <p className="text-[10px] text-muted-foreground uppercase mb-0.5">
                Total Won
              </p>
              <p className="font-mono font-bold text-green-400 text-base">
                {formatAmount(totalCredit)}
              </p>
            </div>
            <div className="flex-1 rounded-xl bg-card/50 border border-border/60 p-3">
              <p className="text-[10px] text-muted-foreground uppercase mb-0.5">
                Total Spent
              </p>
              <p className="font-mono font-bold text-destructive text-base">
                {formatAmount(totalDebit)}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1 h-11 bg-primary text-primary-foreground font-heading font-bold glow-orange"
              onClick={() => setDepositOpen(true)}
              data-ocid="wallet.deposit.button"
            >
              <ArrowDownCircle className="h-4 w-4 mr-2" />
              Deposit
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-11 border-green-500/40 text-green-400 font-heading font-bold hover:bg-green-500/10"
              onClick={() => setWithdrawOpen(true)}
              data-ocid="wallet.withdraw.button"
            >
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Withdraw
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── Performance Stats ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-2"
        data-ocid="wallet.stats.section"
      >
        {[
          {
            label: "Kills",
            value: String(player?.totalKills ?? 0n),
            icon: Target,
            color: "text-destructive",
          },
          {
            label: "Matches",
            value: String(player?.matchesPlayed ?? 0n),
            icon: Swords,
            color: "text-primary",
          },
          {
            label: "Wins",
            value: String(player?.wins ?? 0n),
            icon: Trophy,
            color: "text-yellow-400",
          },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card p-3 text-center"
            data-ocid={`wallet.stats.item.${i + 1}`}
          >
            {playerLoading ? (
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
          </div>
        ))}
      </motion.div>

      {/* ── Platform Message ── */}
      <div className="rounded-xl border border-border bg-card/60 p-3 flex items-start gap-2">
        <Wallet className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground font-body">
          Wallet is managed by the platform. Entry fees are automatically
          deducted when joining paid matches and winnings are credited after
          match results.
        </p>
      </div>

      {/* ── Transaction History ── */}
      <section>
        <h3 className="font-heading font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">
          Transaction History
        </h3>
        {isLoading ? (
          <div className="space-y-2" data-ocid="wallet.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div
            className="text-center py-10 text-muted-foreground"
            data-ocid="wallet.empty_state"
          >
            <div className="text-4xl mb-3">💰</div>
            <p className="font-heading font-bold">No transactions yet</p>
            <p className="text-sm mt-1">Join matches to start earning!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...transactions].reverse().map((tx, idx) => {
              const isCredit = tx.txType === TxType.credit;
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border bg-card",
                    isCredit ? "border-green-500/20" : "border-destructive/20",
                  )}
                  data-ocid={`wallet.item.${idx + 1}`}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                      isCredit ? "bg-green-500/10" : "bg-destructive/10",
                    )}
                  >
                    {isCredit ? (
                      <ArrowUpCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium text-sm text-foreground truncate">
                      {tx.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {formatDate(tx.timestamp)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "font-mono font-bold text-sm flex-shrink-0",
                      isCredit ? "text-green-400" : "text-destructive",
                    )}
                  >
                    {isCredit ? "+" : "-"}
                    {formatAmount(tx.amount)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Deposit Request History ── */}
      <section>
        <h3 className="font-heading font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">
          Deposit Requests
        </h3>
        {drLoading ? (
          <Skeleton
            className="h-16 w-full rounded-xl"
            data-ocid="wallet.deposit.loading_state"
          />
        ) : !depositRequests || depositRequests.length === 0 ? (
          <div
            className="text-center py-6 text-muted-foreground text-sm rounded-xl border border-dashed border-border"
            data-ocid="wallet.deposit.empty_state"
          >
            No deposit requests yet
          </div>
        ) : (
          <div className="space-y-2">
            {[...depositRequests].reverse().map((req, idx) => (
              <div
                key={req.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
                data-ocid={`wallet.deposit.item.${idx + 1}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-mono font-bold text-sm text-foreground">
                      ₹{String(req.amount)}
                    </p>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    TXN: {req.transactionId} · {formatDate(req.timestamp)}
                  </p>
                  {req.adminNote && (
                    <p className="text-[10px] text-destructive mt-0.5">
                      Note: {req.adminNote}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Withdraw Request History ── */}
      <section>
        <h3 className="font-heading font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">
          Withdrawal Requests
        </h3>
        {wrLoading ? (
          <Skeleton
            className="h-16 w-full rounded-xl"
            data-ocid="wallet.withdraw.loading_state"
          />
        ) : !withdrawRequests || withdrawRequests.length === 0 ? (
          <div
            className="text-center py-6 text-muted-foreground text-sm rounded-xl border border-dashed border-border"
            data-ocid="wallet.withdraw.empty_state"
          >
            No withdrawal requests yet
          </div>
        ) : (
          <div className="space-y-2">
            {[...withdrawRequests].reverse().map((req, idx) => (
              <div
                key={req.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
                data-ocid={`wallet.withdraw.item.${idx + 1}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-mono font-bold text-sm text-foreground">
                      ₹{String(req.amount)}
                    </p>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    UPI: {req.upiId} · {formatDate(req.timestamp)}
                  </p>
                  {req.adminNote && (
                    <p className="text-[10px] text-destructive mt-0.5">
                      Note: {req.adminNote}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════ */}
      {/* DEPOSIT DIALOG */}
      {/* ══════════════════════════════════════════ */}
      <Dialog open={depositOpen} onOpenChange={handleDepositClose}>
        <DialogContent
          className="bg-card border-border max-w-sm mx-auto"
          data-ocid="wallet.deposit.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-foreground">
              Deposit Funds
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {/* Step 1: Select Amount */}
            {depositStep === "amount" && (
              <motion.div
                key="amount"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground">
                  Select deposit amount:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {DEPOSIT_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSelectedAmount(amt)}
                      className={cn(
                        "h-12 rounded-xl border font-mono font-bold text-sm transition-all",
                        selectedAmount === amt
                          ? "border-primary bg-primary/20 text-primary glow-orange"
                          : "border-border bg-card/50 text-foreground hover:border-primary/50",
                      )}
                      data-ocid={"wallet.deposit.amount.button"}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <Button
                  className="w-full h-11 bg-primary text-primary-foreground font-heading font-bold"
                  disabled={!selectedAmount}
                  onClick={() => {
                    setQrExpired(false);
                    setDepositStep("qr");
                  }}
                  data-ocid="wallet.deposit.next.button"
                >
                  Continue to Payment →
                </Button>
              </motion.div>
            )}

            {/* Step 2: QR Code + Timer */}
            {depositStep === "qr" && (
              <motion.div
                key="qr"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Timer */}
                {!qrExpired ? (
                  <CountdownTimer onExpire={() => setQrExpired(true)} />
                ) : (
                  <div
                    className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-center"
                    data-ocid="wallet.deposit.error_state"
                  >
                    <XCircle className="h-6 w-6 text-destructive mx-auto mb-1" />
                    <p className="text-sm font-heading font-bold text-destructive">
                      QR Expired
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      The payment window has expired. Please restart.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive/40 text-destructive"
                      onClick={() => {
                        setQrExpired(false);
                        setDepositStep("amount");
                        setSelectedAmount(null);
                        setTransactionId("");
                      }}
                      data-ocid="wallet.deposit.retry.button"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Restart
                    </Button>
                  </div>
                )}

                {!qrExpired && (
                  <>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-3">
                        Pay{" "}
                        <span className="text-primary font-bold">
                          ₹{selectedAmount}
                        </span>{" "}
                        by scanning this QR
                      </p>
                      {/* QR Code */}
                      <div className="inline-block p-2 bg-white rounded-xl border border-border">
                        <img
                          src={QR_IMAGE}
                          alt="UPI QR Code"
                          className="w-44 h-44 object-contain"
                        />
                      </div>
                      {/* UPI ID */}
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <span className="font-mono text-sm text-foreground font-bold">
                          {UPI_ID}
                        </span>
                        <button
                          type="button"
                          onClick={copyUpi}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          data-ocid="wallet.deposit.copy.button"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Complete payment and fill details below:
                      </p>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="txn-id"
                          className="text-xs font-body text-muted-foreground"
                        >
                          UPI Transaction ID *
                        </Label>
                        <Input
                          id="txn-id"
                          placeholder="e.g. 4123456789012345"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className="bg-card border-border font-mono text-sm"
                          data-ocid="wallet.deposit.txn.input"
                        />
                      </div>
                      <Button
                        className="w-full h-11 bg-primary text-primary-foreground font-heading font-bold"
                        onClick={handleDepositSubmit}
                        disabled={
                          submitDeposit.isPending || !transactionId.trim()
                        }
                        data-ocid="wallet.deposit.submit.button"
                      >
                        {submitDeposit.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Deposit Request"
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Step 3: Success */}
            {depositStep === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 space-y-3"
                data-ocid="wallet.deposit.success_state"
              >
                <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto" />
                <p className="font-heading font-black text-lg text-foreground">
                  Request Submitted!
                </p>
                <p className="text-sm text-muted-foreground">
                  Deposit request submitted! Admin will verify within 24 hours.
                </p>
                <Button
                  className="w-full h-11 bg-primary text-primary-foreground font-heading font-bold mt-2"
                  onClick={() => handleDepositClose(false)}
                  data-ocid="wallet.deposit.done.button"
                >
                  Done
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════ */}
      {/* WITHDRAW DIALOG */}
      {/* ══════════════════════════════════════════ */}
      <Dialog open={withdrawOpen} onOpenChange={handleWithdrawClose}>
        <DialogContent
          className="bg-card border-border max-w-sm mx-auto"
          data-ocid="wallet.withdraw.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-foreground">
              Withdraw Funds
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {withdrawStep === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase mb-0.5">
                    Winning Balance (available to withdraw)
                  </p>
                  <p className="font-mono font-black text-xl text-green-400">
                    ₹{String(player?.winningBalance ?? 0n)}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="upi-id"
                    className="text-xs font-body text-muted-foreground"
                  >
                    Your UPI ID *
                  </Label>
                  <Input
                    id="upi-id"
                    placeholder="yourname@upi"
                    value={withdrawUpi}
                    onChange={(e) => setWithdrawUpi(e.target.value)}
                    className="bg-card border-border font-mono text-sm"
                    data-ocid="wallet.withdraw.upi.input"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="withdraw-amount"
                    className="text-xs font-body text-muted-foreground"
                  >
                    Amount (₹) *
                  </Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="bg-card border-border font-mono text-sm"
                    data-ocid="wallet.withdraw.amount.input"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Max: ₹{String(player?.winningBalance ?? 0n)} (winning
                    balance only)
                  </p>
                </div>

                <Button
                  className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-heading font-bold"
                  onClick={handleWithdrawSubmit}
                  disabled={submitWithdraw.isPending}
                  data-ocid="wallet.withdraw.submit.button"
                >
                  {submitWithdraw.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Withdrawal Request"
                  )}
                </Button>
              </motion.div>
            )}

            {withdrawStep === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 space-y-3"
                data-ocid="wallet.withdraw.success_state"
              >
                <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto" />
                <p className="font-heading font-black text-lg text-foreground">
                  Request Submitted!
                </p>
                <p className="text-sm text-muted-foreground">
                  Withdrawal request submitted! Will be processed within 24
                  hours.
                </p>
                <Button
                  className="w-full h-11 bg-primary text-primary-foreground font-heading font-bold"
                  onClick={() => handleWithdrawClose(false)}
                  data-ocid="wallet.withdraw.done.button"
                >
                  Done
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}
