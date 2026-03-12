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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Bell,
  CheckCircle2,
  Crown,
  Edit,
  Loader2,
  Megaphone,
  Pin,
  Plus,
  Save,
  ShieldCheck,
  Swords,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  X,
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
import {
  useApproveDepositRequest,
  useApproveWithdrawRequest,
  useDeleteMatch,
  useGetAdminDashboard,
  useGetDepositRequests,
  useGetMatches,
  useGetWithdrawRequests,
  useRejectDepositRequest,
  useRejectWithdrawRequest,
} from "../../hooks/useQueries";
import { formatAmount, formatDate, getStatusLabel } from "../../utils/format";
import {
  type Announcement,
  getAnnouncements,
  saveAnnouncements,
} from "../AnnouncementsPage";

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

type KycEntry = {
  playerId: string;
  status: string;
  submittedAt: number;
};

function getKycEntries(): KycEntry[] {
  const entries: KycEntry[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("kyc_data_")) {
      const playerId = key.replace("kyc_data_", "");
      const status = localStorage.getItem(`kyc_status_${playerId}`) ?? "none";
      try {
        const data = JSON.parse(localStorage.getItem(key) ?? "{}");
        entries.push({ playerId, status, submittedAt: data.submittedAt ?? 0 });
      } catch {
        entries.push({ playerId, status, submittedAt: 0 });
      }
    }
  }
  return entries.sort((a, b) => b.submittedAt - a.submittedAt);
}

function KycTab() {
  const [entries, setEntries] = useState<KycEntry[]>(() => getKycEntries());

  const refresh = () => setEntries(getKycEntries());

  const approve = (playerId: string) => {
    localStorage.setItem(`kyc_status_${playerId}`, "verified");
    toast.success(`KYC approved for player #${playerId}`);
    refresh();
  };

  const reject = (playerId: string) => {
    localStorage.setItem(`kyc_status_${playerId}`, "rejected");
    toast.error(`KYC rejected for player #${playerId}`);
    refresh();
  };

  const pending = entries.filter((e) => e.status === "pending");
  const others = entries.filter((e) => e.status !== "pending");
  const all = [...pending, ...others];

  if (all.length === 0) {
    return (
      <div
        className="text-center py-8 text-muted-foreground"
        data-ocid="admin.kyc.empty_state"
      >
        <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="font-heading font-bold">No KYC submissions yet</p>
        <p className="text-xs mt-1">Players who submit KYC will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {all.map((entry, idx) => (
        <motion.div
          key={entry.playerId}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.04 }}
          className="rounded-xl border border-border bg-card p-3 space-y-2"
          data-ocid={`admin.kyc.item.${idx + 1}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-heading font-bold text-sm text-foreground">
                Player #{entry.playerId}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">
                Submitted:{" "}
                {entry.submittedAt
                  ? new Date(entry.submittedAt).toLocaleString()
                  : "Unknown"}
              </p>
            </div>
            {entry.status === "pending" && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">
                Pending
              </Badge>
            )}
            {entry.status === "verified" && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                Verified
              </Badge>
            )}
            {entry.status === "rejected" && (
              <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">
                Rejected
              </Badge>
            )}
          </div>
          {entry.status === "pending" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white flex-1"
                onClick={() => approve(entry.playerId)}
                data-ocid={`admin.kyc.confirm_button.${idx + 1}`}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-destructive/40 text-destructive hover:bg-destructive/10 flex-1"
                onClick={() => reject(entry.playerId)}
                data-ocid={`admin.kyc.delete_button.${idx + 1}`}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ── Announcements Admin Tab ──
function AnnouncementsAdminTab() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const items = getAnnouncements();
    return [...items].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt - a.createdAt;
    });
  });

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const refresh = () => {
    const items = getAnnouncements();
    const sorted = [...items].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt - a.createdAt;
    });
    setAnnouncements(sorted);
  };

  const handleCreate = () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setSubmitting(true);
    const newItem: Announcement = {
      id: String(Date.now()),
      title: title.trim(),
      message: message.trim(),
      createdAt: Date.now(),
      isPinned: false,
    };
    const existing = getAnnouncements();
    saveAnnouncements([newItem, ...existing]);
    setTitle("");
    setMessage("");
    setSubmitting(false);
    refresh();
    toast.success("Announcement posted!");
  };

  const handleDelete = (id: string) => {
    const updated = getAnnouncements().filter((a) => a.id !== id);
    saveAnnouncements(updated);
    refresh();
    toast.success("Announcement deleted");
  };

  const handleTogglePin = (id: string) => {
    const updated = getAnnouncements().map((a) =>
      a.id === id ? { ...a, isPinned: !a.isPinned } : a,
    );
    saveAnnouncements(updated);
    refresh();
  };

  const startEdit = (item: Announcement) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditMessage(item.message);
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim() || !editMessage.trim()) {
      toast.error("Title and message are required");
      return;
    }
    const updated = getAnnouncements().map((a) =>
      a.id === editingId
        ? { ...a, title: editTitle.trim(), message: editMessage.trim() }
        : a,
    );
    saveAnnouncements(updated);
    setEditingId(null);
    refresh();
    toast.success("Announcement updated");
  };

  return (
    <div className="space-y-4">
      {/* Create form */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Megaphone className="h-4 w-4 text-primary" />
          <h3 className="font-heading font-bold text-sm text-foreground">
            Post New Announcement
          </h3>
        </div>
        <Input
          placeholder="Announcement Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-card border-border text-sm"
          data-ocid="admin.announcement.title.input"
        />
        <Textarea
          placeholder="Announcement Message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="bg-card border-border text-sm resize-none"
          data-ocid="admin.announcement.message.textarea"
        />
        <Button
          onClick={handleCreate}
          disabled={submitting || !title.trim() || !message.trim()}
          className="w-full bg-primary text-primary-foreground font-heading font-bold"
          data-ocid="admin.announcement.submit_button"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Bell className="h-4 w-4 mr-2" />
          )}
          Post Announcement
        </Button>
      </div>

      {/* Announcements list */}
      {announcements.length === 0 ? (
        <div
          className="text-center py-10 text-muted-foreground"
          data-ocid="admin.announcements.empty_state"
        >
          <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="font-heading font-bold">No announcements yet</p>
          <p className="text-xs mt-1">Post your first announcement above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {announcements.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={cn(
                "rounded-xl border p-3 space-y-2",
                item.isPinned
                  ? "border-yellow-500/40 bg-yellow-500/5"
                  : "border-border bg-card",
              )}
              data-ocid={`admin.announcement.item.${idx + 1}`}
            >
              {editingId === item.id ? (
                // Inline edit form
                <div className="space-y-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-background border-border text-sm h-8"
                    placeholder="Title"
                  />
                  <Textarea
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    rows={2}
                    className="bg-background border-border text-sm resize-none"
                    placeholder="Message"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white flex-1"
                      onClick={handleSaveEdit}
                      data-ocid={`admin.announcement.save_button.${idx + 1}`}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setEditingId(null)}
                      data-ocid={`admin.announcement.cancel_button.${idx + 1}`}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // Display mode
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className={cn(
                            "font-heading font-bold text-sm truncate",
                            item.isPinned
                              ? "text-yellow-300"
                              : "text-foreground",
                          )}
                        >
                          {item.title}
                        </p>
                        {item.isPinned && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[9px] px-1.5">
                            <Pin className="h-2.5 w-2.5 mr-0.5" />
                            Pinned
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {item.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">
                        {new Date(item.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {/* Pin toggle */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          "h-7 w-7",
                          item.isPinned
                            ? "text-yellow-400 hover:text-yellow-300"
                            : "text-muted-foreground hover:text-yellow-400",
                        )}
                        onClick={() => handleTogglePin(item.id)}
                        title={item.isPinned ? "Unpin" : "Pin"}
                        data-ocid={`admin.announcement.toggle.${idx + 1}`}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </Button>
                      {/* Edit */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => startEdit(item)}
                        data-ocid={`admin.announcement.edit_button.${idx + 1}`}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      {/* Delete */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            data-ocid={`admin.announcement.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-ocid="admin.announcement.delete.dialog">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Announcement?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{item.title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-ocid="admin.announcement.delete.cancel_button">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
                              className="bg-destructive text-destructive-foreground"
                              data-ocid="admin.announcement.delete.confirm_button"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage({
  navigate,
}: AdminDashboardPageProps) {
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

  // Count pending KYC
  const pendingKycCount = (() => {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key?.startsWith("kyc_status_") &&
        localStorage.getItem(key) === "pending"
      ) {
        count++;
      }
    }
    return count;
  })();

  // Count announcements
  const announcementCount = getAnnouncements().length;

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

      {/* Tabs */}
      <Tabs defaultValue="matches" data-ocid="admin.tabs.section">
        <TabsList className="w-full bg-card border border-border flex flex-wrap gap-0.5 h-auto p-1">
          <TabsTrigger
            value="matches"
            className="flex-1 font-heading font-bold text-xs min-w-0"
            data-ocid="admin.matches.tab"
          >
            Matches ({(matches ?? []).length})
          </TabsTrigger>
          <TabsTrigger
            value="deposits"
            className="flex-1 font-heading font-bold text-xs min-w-0"
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
            className="flex-1 font-heading font-bold text-xs min-w-0"
            data-ocid="admin.withdrawals.tab"
          >
            Withdraw
            {pendingWithdraws.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground rounded-full text-[9px] px-1">
                {pendingWithdraws.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="kyc"
            className="flex-1 font-heading font-bold text-xs min-w-0"
            data-ocid="admin.kyc.tab"
          >
            KYC
            {pendingKycCount > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground rounded-full text-[9px] px-1">
                {pendingKycCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="announcements"
            className="flex-1 font-heading font-bold text-xs min-w-0"
            data-ocid="admin.announcements.tab"
          >
            Alerts
            {announcementCount > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground rounded-full text-[9px] px-1">
                {announcementCount}
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

        {/* ── KYC Tab ── */}
        <TabsContent value="kyc" className="mt-3">
          <KycTab />
        </TabsContent>

        {/* ── Announcements Tab ── */}
        <TabsContent value="announcements" className="mt-3">
          <AnnouncementsAdminTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
