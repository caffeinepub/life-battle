import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  onRefresh?: () => void;
}

export default function AppHeader({ title, onBack }: AppHeaderProps) {
  return (
    <header
      className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 flex items-center justify-between px-3 bg-card/90 backdrop-blur-md border-b border-border"
      style={{ height: "56px" }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
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
            className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 glow-orange"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.2 38), oklch(0.52 0.24 22))",
            }}
          >
            <span className="text-sm font-black text-white tracking-tighter">
              LB
            </span>
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <h1
            className="font-heading font-black text-base text-foreground truncate leading-none tracking-tight"
            style={{ maxWidth: onBack ? "220px" : "180px" }}
          >
            {onBack ? title : "LIFE BATTLE"}
          </h1>
          {!onBack && (
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
              Tournament
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0" />
    </header>
  );
}
