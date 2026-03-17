import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Shield, Trophy, Users, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth";
import { createPlayerProfile } from "../hooks/useFirebaseProfile";
import { auth } from "../lib/firebase";

interface LoginPageProps {
  onLoginSuccess: () => void;
  isRegistration?: boolean;
}

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/user-not-found":
      return "No account found with this email";
    case "auth/wrong-password":
      return "Incorrect password";
    case "auth/invalid-email":
      return "Invalid email address";
    case "auth/email-already-in-use":
      return "Email already registered. Please sign in instead.";
    case "auth/weak-password":
      return "Password must be at least 6 characters";
    case "auth/invalid-credential":
      return "Invalid email or password. Please try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Authentication failed. Please try again.";
  }
}

export default function LoginPage({ isRegistration }: LoginPageProps) {
  const firebaseAuth = useFirebaseAuth();
  const [mode, setMode] = useState<"login" | "signup">(
    isRegistration ? "signup" : "login",
  );

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup fields
  const [username, setUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword) {
      setError("Please enter your email and password");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await firebaseAuth.signIn(loginEmail.trim(), loginPassword);
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err?.code ?? ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }
    if (!signupEmail.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!signupPassword) {
      setError("Please enter a password");
      return;
    }
    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (signupPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await firebaseAuth.signUp(signupEmail.trim(), signupPassword);
      const currentUser = auth.currentUser;
      if (currentUser) {
        await createPlayerProfile(
          currentUser.uid,
          username.trim(),
          signupEmail.trim(),
        );
      }
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err?.code ?? ""));
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
    <div className="min-h-screen overflow-y-auto">
      <div className="flex flex-col items-center justify-start p-4 pb-8 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="text-center mb-6">
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
          <div className="grid grid-cols-2 gap-2 mb-6">
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

          {/* Mode tabs */}
          <div className="flex rounded-xl bg-card border border-border p-1 mb-4">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-heading font-bold transition-all ${
                mode === "login"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid="login.tab"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-heading font-bold transition-all ${
                mode === "signup"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid="signup.tab"
            >
              Create Account
            </button>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30"
              data-ocid="login.error_state"
            >
              <p className="text-xs text-destructive font-body">{error}</p>
            </motion.div>
          )}

          {/* Login form */}
          {mode === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4 rounded-xl bg-card border border-border space-y-3"
            >
              <div>
                <Label
                  htmlFor="login-email"
                  className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
                >
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="your@email.com"
                  className="bg-background border-border font-mono"
                  data-ocid="login.input"
                />
              </div>
              <div>
                <Label
                  htmlFor="login-password"
                  className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="Your password"
                    className="bg-background border-border font-mono pr-10"
                    data-ocid="login.password.input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                onClick={handleLogin}
                disabled={isSubmitting}
                className="w-full h-11 font-heading font-bold bg-primary text-primary-foreground glow-orange"
                data-ocid="login.primary_button"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing In...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Sign In
                  </span>
                )}
              </Button>
            </motion.div>
          )}

          {/* Signup form */}
          {mode === "signup" && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4 rounded-xl bg-card border border-border space-y-3"
            >
              <div>
                <Label
                  htmlFor="signup-username"
                  className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
                >
                  Username *
                </Label>
                <Input
                  id="signup-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your gaming tag"
                  className="bg-background border-border font-mono"
                  data-ocid="signup.username.input"
                />
              </div>
              <div>
                <Label
                  htmlFor="signup-email"
                  className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
                >
                  Email *
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-background border-border font-mono"
                  data-ocid="signup.email.input"
                />
              </div>
              <div>
                <Label
                  htmlFor="signup-password"
                  className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
                >
                  Password *
                </Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showSignupPassword ? "text" : "password"}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="bg-background border-border font-mono pr-10"
                    data-ocid="signup.password.input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showSignupPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <Label
                  htmlFor="confirm-password"
                  className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block"
                >
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="bg-background border-border font-mono pr-10"
                    data-ocid="signup.confirm_password.input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {signupPassword &&
                  confirmPassword &&
                  signupPassword !== confirmPassword && (
                    <p
                      className="text-xs text-destructive mt-1"
                      data-ocid="signup.password.error_state"
                    >
                      Passwords do not match
                    </p>
                  )}
              </div>
              <Button
                onClick={handleSignup}
                disabled={isSubmitting}
                className="w-full h-11 font-heading font-bold bg-primary text-primary-foreground glow-orange"
                data-ocid="signup.submit_button"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  "🚀 Enter Battle"
                )}
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
