import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  ChevronRight,
  Copy,
  Edit,
  History,
  Loader2,
  Mail,
  MessageCircle,
  Share2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { AppNav } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetPlayerDetails, useSaveCallerProfile } from "../hooks/useQueries";
import { formatAmount } from "../utils/format";

interface ProfilePageProps {
  navigate: (nav: AppNav) => void;
  playerId?: number;
}

type KycStatus = "none" | "pending" | "verified" | "rejected";

const AVATAR_COLORS = [
  "#f97316",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ef4444",
  "#eab308",
  "#06b6d4",
  "#ec4899",
];

function getKycStatus(playerId: number | undefined): KycStatus {
  if (playerId === undefined) return "none";
  return (
    (localStorage.getItem(`kyc_status_${playerId}`) as KycStatus) ?? "none"
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage({ navigate, playerId }: ProfilePageProps) {
  const { identity, clear } = useInternetIdentity();
  const { data: player, isLoading } = useGetPlayerDetails(playerId);
  const saveProfile = useSaveCallerProfile();

  const principal = identity?.getPrincipal().toString();

  // Edit profile state
  const [editOpen, setEditOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editColor, setEditColor] = useState("");

  // KYC state
  const [kycStatus, setKycStatus] = useState<KycStatus>(() =>
    getKycStatus(playerId),
  );
  const [kycOpen, setKycOpen] = useState(false);
  const [kycIdFile, setKycIdFile] = useState<File | null>(null);
  const [kycSelfieFile, setKycSelfieFile] = useState<File | null>(null);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const idFileRef = useRef<HTMLInputElement>(null);
  const selfieFileRef = useRef<HTMLInputElement>(null);

  const openEdit = () => {
    setEditUsername(player?.username ?? "");
    setEditBio(
      playerId !== undefined
        ? (localStorage.getItem(`bio_${playerId}`) ?? "")
        : "",
    );
    setEditColor(
      playerId !== undefined
        ? (localStorage.getItem(`avatarColor_${playerId}`) ?? AVATAR_COLORS[0])
        : AVATAR_COLORS[0],
    );
    setEditOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editUsername.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    try {
      await saveProfile.mutateAsync({
        username: editUsername.trim(),
        playerId,
      });
      if (playerId !== undefined) {
        localStorage.setItem(`bio_${playerId}`, editBio);
        localStorage.setItem(`avatarColor_${playerId}`, editColor);
      }
      toast.success("Profile updated!");
      setEditOpen(false);
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleKycSubmit = async () => {
    if (!kycIdFile || !kycSelfieFile) {
      toast.error("Please upload both ID proof and selfie");
      return;
    }
    setKycSubmitting(true);
    try {
      const [idB64, selfieB64] = await Promise.all([
        fileToBase64(kycIdFile),
        fileToBase64(kycSelfieFile),
      ]);
      if (playerId !== undefined) {
        localStorage.setItem(
          `kyc_data_${playerId}`,
          JSON.stringify({
            idProof: idB64,
            selfie: selfieB64,
            submittedAt: Date.now(),
          }),
        );
        localStorage.setItem(`kyc_status_${playerId}`, "pending");
      }
      setKycStatus("pending");
      setKycOpen(false);
      toast.success("KYC submitted for review!");
    } catch {
      toast.error("Failed to submit KYC");
    } finally {
      setKycSubmitting(false);
    }
  };

  const copyReferral = () => {
    if (player?.referralCode) {
      navigator.clipboard.writeText(player.referralCode);
      toast.success("Referral code copied! 🎉");
    }
  };

  const shareReferral = async () => {
    if (!player?.referralCode) return;
    const text = `Join Life Battle Free Fire tournaments! Use my referral code: ${player.referralCode}`;
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Share text copied!");
    }
  };

  const avatarColor =
    playerId !== undefined
      ? (localStorage.getItem(`avatarColor_${playerId}`) ?? AVATAR_COLORS[0])
      : AVATAR_COLORS[0];

  const bio =
    playerId !== undefined
      ? (localStorage.getItem(`bio_${playerId}`) ?? "")
      : "";

  const initials = player?.username
    ? player.username.slice(0, 2).toUpperCase()
    : "??";

  const statsCards = [
    {
      label: "Matches Played",
      value: player?.matchesPlayed?.toString() ?? "0",
      color: "text-foreground",
      icon: "🎮",
    },
    {
      label: "Total Wins",
      value: player?.wins?.toString() ?? "0",
      color: "text-primary",
      icon: "🏆",
    },
    {
      label: "Total Kills",
      value: player?.totalKills?.toString() ?? "0",
      color: "text-accent",
      icon: "⚡",
    },
    {
      label: "Total Earnings",
      value: formatAmount(player?.totalEarnings ?? 0n),
      color: "text-green-400",
      icon: "💰",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-4 space-y-4" data-ocid="profile.loading_state">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden"
        data-ocid="profile.card"
      >
        <div className="relative z-10 flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center flex-shrink-0"
            style={{
              background: `${avatarColor}22`,
              borderColor: `${avatarColor}88`,
              boxShadow: `0 0 16px ${avatarColor}44`,
            }}
          >
            <span
              className="font-heading font-black text-2xl"
              style={{ color: avatarColor }}
            >
              {initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading font-black text-xl text-foreground truncate">
                {player?.username ?? "Unknown"}
              </h2>
              {kycStatus === "verified" && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
            {bio && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {bio}
              </p>
            )}
            <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
              {principal ? `${principal.slice(0, 20)}...` : "—"}
            </p>
            {player?.referredBy && (
              <p className="text-xs text-primary mt-1">
                Referred by: {player.referredBy}
              </p>
            )}
          </div>
        </div>

        {/* Edit button */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 border-primary/30 text-primary hover:bg-primary/10 w-full font-heading font-bold text-xs"
              onClick={openEdit}
              data-ocid="profile.edit.open_modal_button"
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Edit Profile
            </Button>
          </DialogTrigger>
          <DialogContent
            className="bg-card border-border max-w-sm"
            data-ocid="profile.edit.dialog"
          >
            <DialogHeader>
              <DialogTitle className="font-heading font-black gradient-text">
                Edit Profile
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Username
                </Label>
                <Input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="Your username"
                  className="bg-background border-border font-body"
                  data-ocid="profile.edit.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Bio
                </Label>
                <Textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell other players about yourself..."
                  className="bg-background border-border font-body resize-none"
                  rows={3}
                  data-ocid="profile.edit.textarea"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Avatar Color
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className="w-8 h-8 rounded-lg transition-all"
                      style={{
                        background: c,
                        border:
                          editColor === c
                            ? "2px solid white"
                            : "2px solid transparent",
                        boxShadow: editColor === c ? `0 0 10px ${c}` : "none",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setEditOpen(false)}
                data-ocid="profile.edit.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={saveProfile.isPending}
                className="bg-primary text-primary-foreground font-heading font-bold"
                data-ocid="profile.edit.save_button"
              >
                {saveProfile.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-primary/10 blur-xl" />
      </motion.div>

      {/* Stats grid */}
      <div>
        <h3 className="font-heading font-black text-sm text-muted-foreground uppercase tracking-widest mb-3">
          Player Statistics
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {statsCards.map(({ label, value, color, icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-4 relative overflow-hidden"
              data-ocid={`profile.stats.item.${i + 1}`}
            >
              <div className="text-2xl mb-1">{icon}</div>
              <p className={`font-heading font-black text-2xl ${color}`}>
                {value}
              </p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
                {label}
              </p>
              <div className="absolute -right-2 -bottom-2 w-12 h-12 rounded-full bg-primary/5 blur-lg" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Referral section */}
      {player?.referralCode && (
        <div
          className="rounded-xl border border-border bg-card p-4"
          data-ocid="profile.referral.panel"
        >
          <h3 className="font-heading font-bold text-sm text-foreground mb-3">
            Your Referral Code
          </h3>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
            <span className="font-mono font-bold text-primary flex-1">
              {player.referralCode}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={copyReferral}
              data-ocid="profile.referral.button"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={shareReferral}
              data-ocid="profile.share.button"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Share your code and earn bonus when friends sign up!
          </p>
        </div>
      )}

      {/* KYC Verification */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border bg-card p-4"
        data-ocid="profile.kyc.card"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="font-heading font-black text-sm text-foreground">
              KYC Verification
            </h3>
          </div>
          {kycStatus === "verified" && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </Badge>
          )}
          {kycStatus === "pending" && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">
              Under Review
            </Badge>
          )}
          {kycStatus === "none" && (
            <Badge className="bg-muted/50 text-muted-foreground border-border text-[10px]">
              Not Submitted
            </Badge>
          )}
          {kycStatus === "rejected" && (
            <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">
              Rejected
            </Badge>
          )}
        </div>

        {kycStatus === "none" && (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              Verify your identity to unlock withdrawals and earn a verified
              badge.
            </p>
            <Dialog open={kycOpen} onOpenChange={setKycOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="w-full bg-primary text-primary-foreground font-heading font-bold"
                  data-ocid="profile.kyc.open_modal_button"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Submit KYC
                </Button>
              </DialogTrigger>
              <DialogContent
                className="bg-card border-border max-w-sm"
                data-ocid="profile.kyc.dialog"
              >
                <DialogHeader>
                  <DialogTitle className="font-heading font-black gradient-text">
                    KYC Verification
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Upload your documents to verify your identity. Files are
                    stored securely on your device.
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      ID Proof
                    </Label>
                    <button
                      type="button"
                      onClick={() => idFileRef.current?.click()}
                      className="w-full p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors text-center"
                      data-ocid="profile.kyc.upload_button"
                    >
                      <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {kycIdFile
                          ? kycIdFile.name
                          : "Click to upload Aadhaar / PAN card"}
                      </p>
                    </button>
                    <input
                      ref={idFileRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) =>
                        setKycIdFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Selfie Photo
                    </Label>
                    <button
                      type="button"
                      onClick={() => selfieFileRef.current?.click()}
                      className="w-full p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors text-center"
                      data-ocid="profile.kyc.dropzone"
                    >
                      <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {kycSelfieFile
                          ? kycSelfieFile.name
                          : "Click to upload selfie"}
                      </p>
                    </button>
                    <input
                      ref={selfieFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setKycSelfieFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setKycOpen(false)}
                    data-ocid="profile.kyc.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleKycSubmit}
                    disabled={kycSubmitting || !kycIdFile || !kycSelfieFile}
                    className="bg-primary text-primary-foreground font-heading font-bold"
                    data-ocid="profile.kyc.submit_button"
                  >
                    {kycSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Submit KYC"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}

        {kycStatus === "pending" && (
          <p className="text-xs text-yellow-400">
            Your documents are under review. We'll notify you once verified
            (usually within 24 hours).
          </p>
        )}

        {kycStatus === "verified" && (
          <p className="text-xs text-green-400">
            ✅ Your identity has been verified. Enjoy full access to all
            platform features!
          </p>
        )}

        {kycStatus === "rejected" && (
          <>
            <p className="text-xs text-destructive mb-3">
              Your KYC was rejected. Please re-submit with clearer documents.
            </p>
            <Dialog open={kycOpen} onOpenChange={setKycOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-primary/30 text-primary font-heading font-bold"
                  data-ocid="profile.kyc.open_modal_button"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Re-submit KYC
                </Button>
              </DialogTrigger>
              <DialogContent
                className="bg-card border-border max-w-sm"
                data-ocid="profile.kyc.dialog"
              >
                <DialogHeader>
                  <DialogTitle className="font-heading font-black gradient-text">
                    Re-submit KYC
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      ID Proof
                    </Label>
                    <button
                      type="button"
                      onClick={() => idFileRef.current?.click()}
                      className="w-full p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors text-center"
                      data-ocid="profile.kyc.upload_button"
                    >
                      <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {kycIdFile ? kycIdFile.name : "Upload ID document"}
                      </p>
                    </button>
                    <input
                      ref={idFileRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) =>
                        setKycIdFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Selfie Photo
                    </Label>
                    <button
                      type="button"
                      onClick={() => selfieFileRef.current?.click()}
                      className="w-full p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors text-center"
                      data-ocid="profile.kyc.dropzone"
                    >
                      <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {kycSelfieFile ? kycSelfieFile.name : "Upload selfie"}
                      </p>
                    </button>
                    <input
                      ref={selfieFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setKycSelfieFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setKycOpen(false)}
                    data-ocid="profile.kyc.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleKycSubmit}
                    disabled={kycSubmitting || !kycIdFile || !kycSelfieFile}
                    className="bg-primary text-primary-foreground font-heading font-bold"
                    data-ocid="profile.kyc.submit_button"
                  >
                    {kycSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Submit"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </motion.div>

      {/* Quick links */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => navigate({ page: "history" })}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all group"
          data-ocid="profile.history.button"
        >
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <History className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-body font-medium text-sm text-foreground">
              Match History
            </p>
            <p className="text-xs text-muted-foreground">
              View all your past matches
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      </div>

      {/* Customer Support */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-xl border border-border bg-card p-4"
        data-ocid="profile.support.card"
      >
        <h3 className="font-heading font-black text-sm text-foreground mb-3">
          Customer Support
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Need help? Reach out to us directly.
        </p>
        <div className="space-y-2">
          <a
            href="https://wa.me/917601094637"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 hover:border-green-500/40 hover:bg-green-500/15 transition-all group"
            data-ocid="profile.support.whatsapp.button"
          >
            <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="font-body font-semibold text-sm text-green-400">
                WhatsApp Support
              </p>
              <p className="text-xs text-muted-foreground">+91 76010 94637</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-green-400 transition-colors" />
          </a>
          <a
            href="mailto:Lifebattle12@gmail.com"
            className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:border-primary/40 hover:bg-primary/15 transition-all group"
            data-ocid="profile.support.email.button"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-body font-semibold text-sm text-primary">
                Email Support
              </p>
              <p className="text-xs text-muted-foreground">
                Lifebattle12@gmail.com
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>
        </div>
      </motion.div>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
        onClick={clear}
        data-ocid="profile.logout.button"
      >
        Logout
      </Button>
    </div>
  );
}
