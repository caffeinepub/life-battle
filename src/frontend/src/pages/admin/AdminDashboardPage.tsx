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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Crown,
  Edit,
  Plus,
  Swords,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { AppNav } from "../../App";
import { MatchStatus } from "../../backend.d";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useDeleteMatch,
  useGetAdminDashboard,
  useGetMatches,
  useIsCallerAdmin,
} from "../../hooks/useQueries";
import { formatAmount, formatDate, getStatusLabel } from "../../utils/format";

interface AdminDashboardPageProps {
  navigate: (nav: AppNav) => void;
}

export default function AdminDashboardPage({
  navigate,
}: AdminDashboardPageProps) {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: dashboard, isLoading: dashLoading } = useGetAdminDashboard();
  const { data: matches, isLoading: matchesLoading } = useGetMatches();
  const deleteMatch = useDeleteMatch();

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

      {/* Match list */}
      <div>
        <h3 className="font-heading font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">
          All Matches ({(matches ?? []).length})
        </h3>

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
                          match.status === MatchStatus.live && "badge-live",
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
      </div>
    </div>
  );
}
