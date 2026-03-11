import { cn } from "@/lib/utils";
import { Home, ShieldCheck, Swords, Trophy, User, Wallet } from "lucide-react";
import type { AppNav, PlayerPage } from "../App";

interface BottomNavProps {
  current: PlayerPage;
  navigate: (nav: AppNav) => void;
  isAdmin?: boolean;
  onAdminClick?: () => void;
}

const navItems = [
  { id: "home" as PlayerPage, icon: Home, label: "Home" },
  { id: "free-matches" as PlayerPage, icon: Swords, label: "Matches" },
  { id: "leaderboard" as PlayerPage, icon: Trophy, label: "Ranks" },
  { id: "wallet" as PlayerPage, icon: Wallet, label: "Wallet" },
  { id: "profile" as PlayerPage, icon: User, label: "Profile" },
];

export default function BottomNav({
  current,
  navigate,
  isAdmin,
  onAdminClick,
}: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-card/95 backdrop-blur-md border-t border-border pb-safe">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
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
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              data-ocid={`nav.${item.id === "free-matches" ? "matches" : item.id}.link`}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-all",
                  isActive && "drop-shadow-[0_0_6px_oklch(0.7_0.19_42)]",
                )}
              />
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
