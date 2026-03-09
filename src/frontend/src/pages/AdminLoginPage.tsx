import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff, KeyRound, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const ADMIN_USERNAME = "abhi@16";
const ADMIN_PASSWORD = "hagh9876";

interface AdminLoginPageProps {
  onAdminLoginSuccess: () => void;
  onCancel: () => void;
}

type Step = "credentials" | "token";

export default function AdminLoginPage({
  onAdminLoginSuccess,
  onCancel,
}: AdminLoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState("");
  const [step, setStep] = useState<Step>("credentials");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      setError("Invalid credentials. Please check your username and password.");
      return;
    }

    // Check if token already in sessionStorage
    const existingToken = sessionStorage.getItem("caffeineAdminToken");
    if (existingToken) {
      setIsLoading(true);
      // Small delay for UX feedback
      setTimeout(() => {
        setIsLoading(false);
        onAdminLoginSuccess();
      }, 500);
    } else {
      // Need to enter token
      setStep("token");
    }
  }

  function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token.trim()) {
      setError("Please enter your admin token.");
      return;
    }

    setIsLoading(true);
    sessionStorage.setItem("caffeineAdminToken", token.trim());
    setTimeout(() => {
      setIsLoading(false);
      onAdminLoginSuccess();
    }, 500);
  }

  return (
    <div className="min-h-screen bg-background hero-pattern flex flex-col">
      <div className="max-w-[430px] mx-auto w-full min-h-screen flex flex-col px-4 py-6">
        {/* Back button */}
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 self-start"
          data-ocid="admin_login.cancel_button"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-body">Back</span>
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center glow-orange">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <KeyRound className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
            Admin Access
          </h1>
          <p className="text-sm text-muted-foreground font-body mt-1 text-center">
            {step === "credentials"
              ? "Enter your admin credentials to continue"
              : "Paste your Caffeine admin token to unlock access"}
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: step === "token" ? 30 : 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1"
        >
          {step === "credentials" ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="admin-username"
                  className="font-body text-sm text-muted-foreground"
                >
                  Admin Username
                </Label>
                <Input
                  id="admin-username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  autoComplete="username"
                  className="bg-card border-border text-foreground placeholder:text-muted-foreground/50 h-12 font-body"
                  data-ocid="admin_login.username.input"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="admin-password"
                  className="font-body text-sm text-muted-foreground"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    autoComplete="current-password"
                    className="bg-card border-border text-foreground placeholder:text-muted-foreground/50 h-12 font-body pr-12"
                    data-ocid="admin_login.password.input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3"
                  data-ocid="admin_login.error_state"
                >
                  <p className="text-sm text-destructive font-body">{error}</p>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full h-12 font-body font-semibold text-base bg-primary hover:bg-primary/90 text-primary-foreground glow-orange mt-2"
                data-ocid="admin_login.submit_button"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  "Login as Admin"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleTokenSubmit} className="space-y-5">
              <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 mb-2">
                <p className="text-xs text-muted-foreground font-body leading-relaxed">
                  Credentials verified ✓. To activate admin mode, paste your{" "}
                  <span className="text-primary font-medium">
                    Caffeine admin token
                  </span>{" "}
                  from your Caffeine dashboard.
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="admin-token"
                  className="font-body text-sm text-muted-foreground"
                >
                  Caffeine Admin Token
                </Label>
                <Input
                  id="admin-token"
                  type="text"
                  placeholder="Paste token here..."
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    setError("");
                  }}
                  className="bg-card border-border text-foreground placeholder:text-muted-foreground/50 h-12 font-body font-mono text-sm"
                  data-ocid="admin_login.token.input"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3"
                  data-ocid="admin_login.error_state"
                >
                  <p className="text-sm text-destructive font-body">{error}</p>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !token.trim()}
                className="w-full h-12 font-body font-semibold text-base bg-primary hover:bg-primary/90 text-primary-foreground glow-orange"
                data-ocid="admin_login.submit_button"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    Activating...
                  </span>
                ) : (
                  "Activate Admin Mode"
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setError("");
                }}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
              >
                ← Back to credentials
              </button>
            </form>
          )}
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/50 font-body mt-8">
          Secured admin access · Life Battle
        </p>
      </div>
    </div>
  );
}
