import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Shield } from "lucide-react";
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
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-2">
        {onBack ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            data-ocid="nav.button"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center glow-orange">
              <span className="text-xs font-heading font-black text-primary-foreground">
                LB
              </span>
            </div>
          </div>
        )}
        <h1 className="font-heading font-bold text-base text-foreground truncate max-w-[180px]">
          {title}
        </h1>
        {isAdmin && (
          <span className="px-1.5 py-0.5 rounded text-xs bg-primary/20 text-primary font-mono border border-primary/30">
            ADMIN
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {onExitAdmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onExitAdmin}
            className="text-xs text-muted-foreground hover:text-foreground gap-1"
            data-ocid="nav.link"
          >
            <Shield className="h-3 w-3" />
            Exit Admin
          </Button>
        )}
        {!isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clear}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            title="Logout"
            data-ocid="nav.button"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
}
