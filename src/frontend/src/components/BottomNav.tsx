import { cn } from "@/lib/utils";
import { Home, ShieldCheck, Swords, User, Wallet } from "lucide-react";
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
  { id: "free-matches" as PlayerPage, icon: Swords, label: "Tournaments" },
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
    const interval = setInterval(() => {
      setUnseenCount(getUnseenCount());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-card border-t border-border pb-safe">
      <div className="flex items-center justify-around px-1 pt-1.5 pb-1">
        {navItems.map((item) => {
          const isActive =
            current === item.id ||
            (item.id === "free-matches" &&
              (current === "free-matches" || current === "paid-matches"));
          const showBadge = item.id === "home" && unseenCount > 0;

          return (
            <button
              type="button"
              key={item.id}
              onClick={() => {
                if (item.id === "home") setUnseenCount(0);
                navigate({ page: item.id });
              }}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors native-tap",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              data-ocid={`nav.${item.id === "free-matches" ? "matches" : item.id}.link`}
            >
              <div
                className={cn(
                  "relative flex items-center justify-center w-10 h-7 rounded-2xl transition-all",
                  isActive && "nav-active-pill",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-all",
                    isActive && "drop-shadow-[0_0_6px_oklch(0.7_0.19_42)]",
                  )}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border border-card" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] transition-all",
                  isActive
                    ? "text-primary font-bold"
                    : "text-muted-foreground font-medium",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Admin button — always visible */}
        <button
          type="button"
          onClick={onAdminClick}
          className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors native-tap",
            isAdmin
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
          data-ocid="nav.admin.link"
        >
          <div
            className={cn(
              "flex items-center justify-center w-10 h-7 rounded-2xl transition-all",
              isAdmin && "nav-active-pill",
            )}
          >
            <ShieldCheck
              className={cn(
                "h-5 w-5 transition-all",
                isAdmin && "drop-shadow-[0_0_6px_oklch(0.7_0.19_42)]",
              )}
            />
          </div>
          <span
            className={cn(
              "text-[10px] transition-all",
              isAdmin
                ? "text-primary font-bold"
                : "text-muted-foreground font-medium",
            )}
          >
            Admin
          </span>
        </button>
      </div>
    </nav>
  );
}
