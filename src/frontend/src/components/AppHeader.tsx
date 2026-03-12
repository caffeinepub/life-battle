import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, LogOut, Shield } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface AppHeaderProps {
  title: string;
  isAdmin?: boolean;
  onBack?: () => void;
  onExitAdmin?: () => void;
}

export default function AppHeader({
  title,
  isAdmin,
  onBack,
  onExitAdmin,
}: AppHeaderProps) {
  const { clear } = useInternetIdentity();

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-3 bg-card border-b border-border"
      style={{ height: "56px" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {onBack ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground native-tap"
            data-ocid="nav.button"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 glow-orange"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.2 38), oklch(0.58 0.22 25))",
            }}
          >
            <span className="text-xs font-black text-white tracking-tight">
              LB
            </span>
          </div>
        )}
        <h1
          className="font-heading font-bold text-sm text-foreground truncate"
          style={{ maxWidth: onBack ? "200px" : "160px" }}
        >
          {onBack ? title : "LIFE BATTLE"}
        </h1>
        {isAdmin && (
          <span className="px-1.5 py-0.5 rounded text-xs bg-primary/20 text-primary font-mono border border-primary/30 shrink-0">
            ADMIN
          </span>
        )}
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        {onExitAdmin ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onExitAdmin}
            className="text-xs text-muted-foreground hover:text-foreground gap-1 native-tap"
            data-ocid="nav.link"
          >
            <Shield className="h-3.5 w-3.5" />
            Exit Admin
          </Button>
        ) : !onBack ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground native-tap"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={clear}
              className="h-9 w-9 text-muted-foreground hover:text-destructive native-tap"
              title="Logout"
              data-ocid="nav.button"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </>
        ) : (
          !isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clear}
              className="h-9 w-9 text-muted-foreground hover:text-destructive native-tap"
              title="Logout"
              data-ocid="nav.button"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )
        )}
      </div>
    </header>
  );
}
