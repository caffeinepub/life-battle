import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import { motion } from "motion/react";
import type { AppNav } from "../App";
import { TxType } from "../backend.d";
import {
  useGetPlayerDetails,
  useGetWalletTransactions,
} from "../hooks/useQueries";
import { formatAmount, formatDate } from "../utils/format";

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

  const isLoading = playerLoading || txLoading;

  const credits = (transactions ?? []).filter(
    (t) => t.txType === TxType.credit,
  );
  const debits = (transactions ?? []).filter((t) => t.txType === TxType.debit);
  const totalCredit = credits.reduce((acc, t) => acc + t.amount, 0n);
  const totalDebit = debits.reduce((acc, t) => acc + t.amount, 0n);

  return (
    <div className="p-4 space-y-4">
      {/* Balance card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-card to-secondary/20 border border-primary/30 p-6 glow-orange"
        data-ocid="wallet.card"
      >
        <div className="relative z-10">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-mono">
            Available Balance
          </p>
          {playerLoading ? (
            <Skeleton className="h-10 w-32" />
          ) : (
            <p className="font-heading font-black text-4xl text-foreground">
              {formatAmount(player?.walletBalance ?? 0n)}
            </p>
          )}
          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">
                Total Won
              </p>
              <p className="font-mono font-bold text-green-400 text-sm">
                {formatAmount(totalCredit)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">
                Total Spent
              </p>
              <p className="font-mono font-bold text-destructive text-sm">
                {formatAmount(totalDebit)}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-primary/15 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-secondary/20 blur-2xl" />
      </motion.div>

      {/* Note about adding money */}
      <div className="rounded-xl border border-border bg-card p-3 flex items-start gap-2">
        <Wallet className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-body text-muted-foreground">
            Wallet is managed by the platform. Entry fees are auto-deducted and
            prizes are credited automatically after match results.
          </p>
        </div>
      </div>

      {/* Transaction history */}
      <div>
        <h3 className="font-heading font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">
          Transaction History
        </h3>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-16 w-full rounded-xl"
                data-ocid="wallet.loading_state"
              />
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
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
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border bg-card",
                    isCredit ? "border-green-500/20" : "border-destructive/20",
                  )}
                  data-ocid={`wallet.item.${idx + 1}`}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      isCredit ? "bg-green-500/10" : "bg-destructive/10",
                    )}
                  >
                    {isCredit ? (
                      <ArrowUpCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium text-sm text-foreground truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
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
      </div>
    </div>
  );
}
