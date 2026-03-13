import { cn } from "@/lib/utils";
import {
  Bell,
  Home,
  ShieldCheck,
  Swords,
  Trophy,
  User,
  Wallet,
} from "lucide-react";
import type { AppNav, PlayerPage } from "../App";

interface BottomNavProps {
  current: PlayerPage;
  navigate: (nav: AppNav) => void;
  isAdmin?: boolean;
  onAdminClick?: () => void;
  announcementCount?: number;
}

export default function BottomNav({
  current,
  navigate,
  isAdmin,
  onAdminClick,
  announcementCount = 0,
}: BottomNavProps) {
  const navItems = [
    { id: "home" as PlayerPage, icon: Home, label: "Home" },
    { id: "free-matches" as PlayerPage, icon: Swords, label: "Matches" },
    { id: "wallet" as PlayerPage, icon: Wallet, label: "Wallet" },
    { id: "leaderboard" as PlayerPage, icon: Trophy, label: "Ranks" },
    {
      id: "announcements" as PlayerPage,
      icon: Bell,
      label: "Alerts",
      badge: announcementCount,
    },
    { id: "profile" as PlayerPage, icon: User, label: "Profile" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-2 mb-2 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-lg shadow-black/40">
        <div className="flex items-center justify-around px-1 pt-2 pb-2">
          {navItems.map((item) => {
            const isActive =
              current === item.id ||
              (item.id === "free-matches" &&
                (current === "free-matches" || current === "paid-matches"));

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => navigate({ page: item.id })}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all native-tap",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                data-ocid={`nav.${item.id.replace("-", "_")}.link`}
              >
                <div
                  className={cn(
                    "relative flex items-center justify-center w-10 h-7 rounded-xl transition-all",
                    isActive ? "bg-primary/15" : "",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-all",
                      isActive && "drop-shadow-[0_0_6px_oklch(0.7_0.19_42)]",
                    )}
                  />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "text-[9px] font-semibold transition-all leading-none",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Admin button — always yellow-tinted to stand out */}
          <button
            type="button"
            onClick={onAdminClick}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all native-tap",
              isAdmin
                ? "text-yellow-400"
                : "text-yellow-500/70 hover:text-yellow-400",
            )}
            data-ocid="nav.admin.button"
          >
            <div
              className={cn(
                "relative flex items-center justify-center w-10 h-7 rounded-xl transition-all",
                isAdmin ? "bg-yellow-400/15" : "bg-yellow-500/10",
              )}
            >
              <ShieldCheck
                className={cn(
                  "h-5 w-5 transition-all",
                  isAdmin
                    ? "drop-shadow-[0_0_6px_oklch(0.8_0.18_85)]"
                    : "drop-shadow-[0_0_4px_oklch(0.75_0.16_85)]",
                )}
              />
            </div>
            <span
              className={cn(
                "text-[9px] font-semibold transition-all leading-none",
                isAdmin ? "text-yellow-400" : "text-yellow-500/70",
              )}
            >
              Admin
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
