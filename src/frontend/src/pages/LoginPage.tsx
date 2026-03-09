import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Trophy, Users, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRegisterPlayer, useSaveCallerProfile } from "../hooks/useQueries";

interface LoginPageProps {
  onLoginSuccess: () => void;
  isRegistration?: boolean;
}

export default function LoginPage({ isRegistration }: LoginPageProps) {
  const { login, isLoggingIn, isLoginError } = useInternetIdentity();
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerPlayer = useRegisterPlayer();
  const saveProfile = useSaveCallerProfile();

  const handleRegister = async () => {
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }
    setIsSubmitting(true);
    try {
      const playerId = await registerPlayer.mutateAsync({
        username: username.trim(),
      });
      await saveProfile.mutateAsync({ username: username.trim(), playerId });
      toast.success("Welcome to Life Battle! 🔥");
    } catch {
      toast.error("Registration failed. Please try again.");
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
                    htmlFor="referral"
                    className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
                  >
                    Referral Code (optional)
                  </Label>
                  <Input
                    id="referral"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Enter referral code"
                    className="bg-background border-border font-mono"
                    data-ocid="register.referral.input"
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
