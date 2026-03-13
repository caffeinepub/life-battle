import { cn } from "@/lib/utils";
import { Home, PlusCircle, Swords, User } from "lucide-react";
import type { AppNav, PlayerPage } from "../App";

interface BottomNavProps {
  current: PlayerPage;
  navigate: (nav: AppNav) => void;
  isAdmin?: boolean;
  onAdminClick?: () => void;
}

const navItems = [
  { id: "home" as PlayerPage, icon: Home, label: "Home" },
  { id: "free-matches" as PlayerPage, icon: Swords, label: "Tournaments" },
  { id: "create-match" as const, icon: PlusCircle, label: "Create Match" },
  { id: "profile" as PlayerPage, icon: User, label: "Profile" },
];

export default function BottomNav({
  current,
  navigate,
  onAdminClick,
}: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-3 mb-3 rounded-2xl bg-card/90 backdrop-blur-md border border-border shadow-lg shadow-black/40">
        <div className="flex items-center justify-around px-2 pt-2 pb-2">
          {navItems.map((item) => {
            const isCreateMatch = item.id === "create-match";
            const isActive =
              !isCreateMatch &&
              (current === item.id ||
                (item.id === "free-matches" &&
                  (current === "free-matches" || current === "paid-matches")));

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  if (isCreateMatch) {
                    onAdminClick?.();
                  } else {
                    navigate({ page: item.id as PlayerPage });
                  }
                }}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all native-tap",
                  isCreateMatch
                    ? "text-primary"
                    : isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                )}
                data-ocid={
                  isCreateMatch
                    ? "nav.create.button"
                    : `nav.${item.id === "free-matches" ? "matches" : item.id}.link`
                }
              >
                <div
                  className={cn(
                    "relative flex items-center justify-center w-12 h-8 rounded-2xl transition-all",
                    isCreateMatch
                      ? "bg-primary/15 border border-primary/30"
                      : isActive
                        ? "bg-primary/15"
                        : "",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-all",
                      (isActive || isCreateMatch) &&
                        "drop-shadow-[0_0_6px_oklch(0.7_0.19_42)]",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[9px] font-semibold transition-all leading-none",
                    isCreateMatch
                      ? "text-primary"
                      : isActive
                        ? "text-primary"
                        : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
