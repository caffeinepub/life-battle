import { cn } from "@/lib/utils";
import { Bell, Home, ShieldCheck, Swords, User, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import type { AppNav, PlayerPage } from "../App";
import { getUnseenCount } from "../pages/AnnouncementsPage";

interface BottomNavProps {
  current: PlayerPage;
  navigate: (nav: AppNav) => void;
  isAdmin?: boolean;
  onAdminClick?: () => void;
}

const navItems = [
  { id: "home" as PlayerPage, icon: Home, label: "Home" },
  { id: "free-matches" as PlayerPage, icon: Swords, label: "Matches" },
  { id: "announcements" as PlayerPage, icon: Bell, label: "Alerts" },
  { id: "wallet" as PlayerPage, icon: Wallet, label: "Wallet" },
  { id: "profile" as PlayerPage, icon: User, label: "Profile" },
];

export default function BottomNav({
  current,
  navigate,
  isAdmin,
  onAdminClick,
}: BottomNavProps) {
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    setUnseenCount(getUnseenCount());
    // Poll for new announcements every 30s
    const interval = setInterval(() => {
      setUnseenCount(getUnseenCount());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-card/95 backdrop-blur-md border-t border-border pb-safe">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {navItems.map((item) => {
          const isActive =
            current === item.id ||
            (item.id === "free-matches" &&
              (current === "free-matches" || current === "paid-matches"));
          const showBadge =
            item.id === "announcements" && unseenCount > 0 && !isActive;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => {
                if (item.id === "announcements") setUnseenCount(0);
                navigate({ page: item.id });
              }}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              data-ocid={
                item.id === "announcements"
                  ? "nav.announcements.link"
                  : `nav.${item.id === "free-matches" ? "matches" : item.id}.link`
              }
            >
              <div className="relative">
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-all",
                    isActive && "drop-shadow-[0_0_6px_oklch(0.7_0.19_42)]",
                  )}
                />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
                    {unseenCount > 9 ? "9+" : unseenCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-body font-medium",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
              {isActive && <div className="w-1 h-1 rounded-full bg-primary" />}
            </button>
          );
        })}
        {/* Always show Admin button — login page handles authentication */}
        <button
          type="button"
          onClick={onAdminClick}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
            isAdmin
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
          data-ocid="nav.admin.link"
        >
          <ShieldCheck
            className={cn(
              "h-5 w-5 transition-all",
              isAdmin && "drop-shadow-[0_0_6px_oklch(0.7_0.19_42)]",
            )}
          />
          <span className="text-[10px] font-body font-medium">Admin</span>
          {isAdmin && <div className="w-1 h-1 rounded-full bg-primary" />}
        </button>
      </div>
    </nav>
  );
}
