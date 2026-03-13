import { Bell, Pin } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { AppNav } from "../App";

export type Announcement = {
  id: string;
  title: string;
  message: string;
  createdAt: number;
  isPinned: boolean;
};

export function getAnnouncements(): Announcement[] {
  try {
    return JSON.parse(localStorage.getItem("lb_announcements") ?? "[]");
  } catch {
    return [];
  }
}

export function saveAnnouncements(items: Announcement[]) {
  localStorage.setItem("lb_announcements", JSON.stringify(items));
}

export function getUnseenCount(): number {
  const lastSeen = Number(
    localStorage.getItem("lb_announcements_last_seen") ?? "0",
  );
  const announcements = getAnnouncements();
  return announcements.filter((a) => a.createdAt > lastSeen).length;
}

interface AnnouncementsPageProps {
  navigate: (nav: AppNav) => void;
  onViewed?: () => void;
}

export default function AnnouncementsPage({
  navigate: _navigate,
  onViewed,
}: AnnouncementsPageProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const loadAnnouncements = () => {
      const items = getAnnouncements();
      const sorted = [...items].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.createdAt - a.createdAt;
      });
      setAnnouncements(sorted);
    };

    loadAnnouncements();
    localStorage.setItem("lb_announcements_last_seen", String(Date.now()));
    onViewed?.();

    // Refresh when tab regains focus (e.g. admin posted from same device)
    window.addEventListener("focus", loadAnnouncements);
    return () => window.removeEventListener("focus", loadAnnouncements);
  }, [onViewed]);

  return (
    <div className="p-4 space-y-4" data-ocid="announcements.page">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading font-black text-xl text-foreground">
            Announcements
          </h1>
          <p className="text-xs text-muted-foreground font-body">
            Latest updates from Life Battle
          </p>
        </div>
      </div>

      {/* List */}
      {announcements.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-muted-foreground"
          data-ocid="announcements.empty_state"
        >
          <div className="w-16 h-16 rounded-full bg-muted/30 border border-border flex items-center justify-center mb-4">
            <Bell className="h-7 w-7 opacity-40" />
          </div>
          <p className="font-heading font-bold text-base">
            No announcements yet
          </p>
          <p className="text-sm mt-1 text-center max-w-[220px]">
            Check back later for updates from the admin team.
          </p>
        </motion.div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {announcements.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className={`rounded-xl border p-4 relative overflow-hidden ${
                  item.isPinned
                    ? "border-yellow-500/50 bg-yellow-500/5"
                    : "border-primary/30 bg-card"
                }`}
                style={{
                  boxShadow: item.isPinned
                    ? "0 0 16px rgba(234,179,8,0.08)"
                    : "0 0 16px rgba(var(--primary-raw),0.06)",
                }}
                data-ocid={`announcements.item.${idx + 1}`}
              >
                {/* Pinned indicator */}
                {item.isPinned && (
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <Pin className="h-3.5 w-3.5 text-yellow-400" />
                    <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wide">
                      Pinned
                    </span>
                  </div>
                )}

                <h3
                  className={`font-heading font-black text-base mb-1 pr-16 ${
                    item.isPinned ? "text-yellow-300" : "text-foreground"
                  }`}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed mb-3">
                  {item.message}
                </p>

                {/* Date/time footer */}
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                  <span>
                    {new Date(item.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="opacity-40">·</span>
                  <span>
                    {new Date(item.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
