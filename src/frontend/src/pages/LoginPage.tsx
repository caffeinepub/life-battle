import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  Chrome,
  ExternalLink,
  Shield,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRegisterPlayer } from "../hooks/useQueries";
import {
  isInWebView,
  openInChrome,
  openInSystemBrowser,
} from "../utils/webViewDetect";

interface LoginPageProps {
  onLoginSuccess: () => void;
  isRegistration?: boolean;
}

export default function LoginPage({ isRegistration }: LoginPageProps) {
  const { login, isLoggingIn, isLoginError } = useInternetIdentity();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerPlayer = useRegisterPlayer();
  const webView = isInWebView();

  const handleRegister = async () => {
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }
    setIsSubmitting(true);
    try {
      await registerPlayer.mutateAsync({
        username: username.trim(),
        email: email.trim(),
      });
      toast.success(
        "Welcome to Life Battle! 🔥 Your profile has been created.",
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg?.toLowerCase().includes("already registered")) {
        toast.error("You already have an account. Please reload the page.");
      } else if (errorMsg) {
        toast.error(errorMsg);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    { icon: Trophy, label: "Win Big Prizes" },
    { icon: Zap, label: "Live Matches" },
    { icon: Shield, label: "Secure Platform" },
    { icon: Users, label: "10K+ Players" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, type: "spring" }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/20 border border-primary/40 glow-orange mb-4"
          >
            <span className="font-heading font-black text-3xl gradient-text">
              LB
            </span>
          </motion.div>
          <h1 className="font-heading font-black text-3xl text-foreground mb-1">
            LIFE BATTLE
          </h1>
          <p className="text-muted-foreground text-sm font-body">
            Free Fire Tournament Platform
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-2 gap-2 mb-8">
          {features.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border"
            >
              <Icon className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-xs font-body text-muted-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* WebView Warning Banner */}
        {webView && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 p-4 rounded-xl border border-yellow-500/40 bg-yellow-500/10 space-y-3"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-300 font-heading font-bold text-sm">
                  Login requires Chrome browser
                </p>
                <p className="text-yellow-400/80 text-xs mt-1 font-body leading-relaxed">
                  Google blocks login inside in-app browsers (Error 403). Tap
                  below to open in Chrome and sign in securely.
                </p>
              </div>
            </div>
            <Button
              onClick={openInChrome}
              className="w-full h-10 font-heading font-bold text-sm bg-yellow-500 hover:bg-yellow-400 text-black border-0"
              data-ocid="login.open_chrome_button"
            >
              <Chrome className="h-4 w-4 mr-2" />
              Open in Chrome
            </Button>
            <Button
              onClick={openInSystemBrowser}
              variant="outline"
              className="w-full h-9 font-heading font-bold text-xs border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
              data-ocid="login.open_browser_button"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Default Browser
            </Button>
          </motion.div>
        )}

        {isRegistration ? (
          /* Registration form */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="p-4 rounded-xl bg-card border border-border">
              <h2 className="font-heading font-bold text-lg mb-4 text-center">
                Create Your Profile
              </h2>
              <div className="space-y-3">
                <div>
                  <Label
                    htmlFor="username"
                    className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
                  >
                    Username *
                  </Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your gaming tag"
                    className="bg-background border-border font-mono"
                    data-ocid="register.input"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="email"
                    className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
                  >
                    Email (optional)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="bg-background border-border font-mono"
                    data-ocid="register.email.input"
                  />
                </div>
                <Button
                  onClick={handleRegister}
                  disabled={isSubmitting}
                  className="w-full font-heading font-bold bg-primary text-primary-foreground glow-orange"
                  data-ocid="register.submit_button"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Creating Profile...
                    </span>
                  ) : (
                    "🚀 Enter Battle"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Login */
          <div className="space-y-3">
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-12 font-heading font-bold text-base bg-primary text-primary-foreground glow-orange"
              data-ocid="login.primary_button"
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Login / Sign Up
                </span>
              )}
            </Button>

            {webView && (
              <p className="text-center text-xs text-yellow-400/70 font-body">
                ⚠️ This may fail inside the in-app browser. Use Chrome above.
              </p>
            )}

            {isLoginError && (
              <p
                className="text-destructive text-xs text-center"
                data-ocid="login.error_state"
              >
                Login failed. Please try again.
              </p>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Secure login powered by Internet Identity
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
