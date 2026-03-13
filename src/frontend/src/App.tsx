import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerProfile } from "./hooks/useQueries";

import AdminLoginPage from "./pages/AdminLoginPage";
import AnnouncementsPage, { getAnnouncements } from "./pages/AnnouncementsPage";
import HomePage from "./pages/HomePage";
import LeaderboardPage from "./pages/LeaderboardPage";
// Player pages
import LoginPage from "./pages/LoginPage";
import MatchDetailPage from "./pages/MatchDetailPage";
import MatchHistoryPage from "./pages/MatchHistoryPage";
import MatchListPage from "./pages/MatchListPage";
import ProfilePage from "./pages/ProfilePage";
import WalletPage from "./pages/WalletPage";

import AdminCreateMatchPage from "./pages/admin/AdminCreateMatchPage";
// Admin pages
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminEditMatchPage from "./pages/admin/AdminEditMatchPage";
import AdminPlayerManagementPage from "./pages/admin/AdminPlayerManagementPage";

import AppHeader from "./components/AppHeader";
// Layout
import BottomNav from "./components/BottomNav";

export type PlayerPage =
  | "home"
  | "free-matches"
  | "paid-matches"
  | "match-detail"
  | "leaderboard"
  | "announcements"
  | "profile"
  | "history"
  | "wallet";

export type AdminPage =
  | "admin-login"
  | "admin-dashboard"
  | "admin-create"
  | "admin-edit"
  | "admin-players";

export type AppPage = PlayerPage | AdminPage;

export type AppNav = {
  page: AppPage;
  matchId?: number;
};

const pageVariants = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -18 },
};

// Max time to wait for profile load before giving up (ms)
const PROFILE_LOAD_TIMEOUT = 8000;

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [nav, setNav] = useState<AppNav>({ page: "home" });
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [announcementCount, setAnnouncementCount] = useState(() => {
    const lastSeen = Number.parseInt(
      localStorage.getItem("lb_announcements_last_seen") ?? "0",
      10,
    );
    return getAnnouncements().filter((a) => a.createdAt > lastSeen).length;
  });
  const queryClient = useQueryClient();

  // Timeout fallback: if profile loading takes too long, treat as no profile
  const [profileTimedOut, setProfileTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLoggedIn = !!identity && !identity.getPrincipal().isAnonymous();

  // Only fetch profile when actually logged in
  const { data: profile, isLoading: profileLoading } = useGetCallerProfile();

  // Start timeout when logged in and loading begins
  useEffect(() => {
    if (isLoggedIn && profileLoading && !profileTimedOut) {
      timeoutRef.current = setTimeout(() => {
        setProfileTimedOut(true);
      }, PROFILE_LOAD_TIMEOUT);
    } else if (!profileLoading) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setProfileTimedOut(false);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoggedIn, profileLoading, profileTimedOut]);

  // Listen for storage changes (e.g. admin posts announcement on same device)
  useEffect(() => {
    const handler = () => {
      const lastSeen = Number.parseInt(
        localStorage.getItem("lb_announcements_last_seen") ?? "0",
        10,
      );
      setAnnouncementCount(
        getAnnouncements().filter((a) => a.createdAt > lastSeen).length,
      );
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Stable callback to reset announcement badge
  const handleAnnouncementsViewed = useCallback(
    () => setAnnouncementCount(0),
    [],
  );

  const navigate = (navState: AppNav) => setNav(navState);

  // Show spinner only during Internet Identity initialization
  if (isInitializing) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground font-body text-sm">
            Loading Life Battle...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in → login page
  if (!isLoggedIn) {
    return (
      <div className="min-h-[100dvh] bg-background hero-pattern">
        <LoginPage onLoginSuccess={() => {}} />
        <Toaster richColors theme="dark" />
      </div>
    );
  }

  // Logged in but profile still loading (with timeout fallback)
  if (profileLoading && !profileTimedOut) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground font-body text-sm">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  // Logged in but no profile → registration
  if (!profile) {
    return (
      <div className="min-h-[100dvh] bg-background hero-pattern">
        <LoginPage onLoginSuccess={() => {}} isRegistration />
        <Toaster richColors theme="dark" />
      </div>
    );
  }

  const playerId = profile.playerId;

  // Admin login page — full-screen, no chrome
  if (nav.page === "admin-login") {
    return (
      <div className="min-h-[100dvh] bg-background">
        <AdminLoginPage
          onAdminLoginSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["matches"] });
            queryClient.invalidateQueries({ queryKey: ["depositRequests"] });
            queryClient.invalidateQueries({ queryKey: ["withdrawRequests"] });
            queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
            setIsAdminMode(true);
            navigate({ page: "admin-dashboard" });
          }}
          onCancel={() => navigate({ page: "home" })}
        />
        <Toaster richColors theme="dark" />
      </div>
    );
  }

  // Admin mode — gated only by frontend credentials check
  if (isAdminMode) {
    return (
      <div className="min-h-[100dvh] bg-background overflow-hidden">
        <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col relative">
          <AppHeader
            title="Life Battle — Admin"
            isAdmin
            onBack={
              nav.page !== "admin-dashboard"
                ? () => navigate({ page: "admin-dashboard" })
                : undefined
            }
            onExitAdmin={() => {
              setIsAdminMode(false);
              navigate({ page: "home" });
              queryClient.invalidateQueries({ queryKey: ["matches"] });
            }}
          />
          <main
            className="flex-1 overflow-y-auto pb-6"
            style={{ paddingTop: "56px" }}
          >
            {nav.page === "admin-dashboard" && (
              <AdminDashboardPage navigate={navigate} />
            )}
            {nav.page === "admin-create" && (
              <AdminCreateMatchPage navigate={navigate} />
            )}
            {nav.page === "admin-edit" && nav.matchId !== undefined && (
              <AdminEditMatchPage matchId={nav.matchId} navigate={navigate} />
            )}
            {nav.page === "admin-players" && (
              <AdminPlayerManagementPage navigate={navigate} />
            )}
          </main>
        </div>
        <Toaster richColors theme="dark" />
      </div>
    );
  }

  // Player mode
  const bottomNavPages: PlayerPage[] = [
    "home",
    "free-matches",
    "paid-matches",
    "announcements",
    "profile",
    "wallet",
    "leaderboard",
    "history",
  ];
  const showBottomNav = bottomNavPages.includes(nav.page as PlayerPage);

  return (
    <div className="bg-background overflow-hidden" style={{ height: "100dvh" }}>
      <div
        className="max-w-[430px] mx-auto flex flex-col relative"
        style={{ height: "100dvh" }}
      >
        <AppHeader
          title={getPageTitle(nav.page)}
          onBack={
            nav.page !== "home" &&
            ![
              "free-matches",
              "paid-matches",
              "announcements",
              "leaderboard",
              "profile",
              "wallet",
            ].includes(nav.page)
              ? () => navigate({ page: "home" })
              : undefined
          }
        />
        <main
          className="flex-1 overflow-y-auto"
          style={{
            paddingTop: "56px",
            paddingBottom: showBottomNav ? "90px" : "24px",
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={nav.page}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {nav.page === "home" && (
                <HomePage navigate={navigate} playerId={playerId} />
              )}
              {(nav.page === "free-matches" || nav.page === "paid-matches") && (
                <MatchListPage
                  type={nav.page === "free-matches" ? "free" : "paid"}
                  navigate={navigate}
                  playerId={playerId}
                />
              )}
              {nav.page === "match-detail" && nav.matchId !== undefined && (
                <MatchDetailPage
                  matchId={nav.matchId}
                  navigate={navigate}
                  playerId={playerId}
                />
              )}
              {nav.page === "leaderboard" && (
                <LeaderboardPage navigate={navigate} />
              )}
              {nav.page === "announcements" && (
                <AnnouncementsPage
                  navigate={navigate}
                  onViewed={handleAnnouncementsViewed}
                />
              )}
              {nav.page === "profile" && (
                <ProfilePage navigate={navigate} playerId={playerId} />
              )}
              {nav.page === "history" && (
                <MatchHistoryPage navigate={navigate} playerId={playerId} />
              )}
              {nav.page === "wallet" && (
                <WalletPage navigate={navigate} playerId={playerId} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {showBottomNav && (
          <BottomNav
            current={nav.page as PlayerPage}
            navigate={navigate}
            isAdmin={isAdminMode}
            announcementCount={announcementCount}
            onAdminClick={() => {
              if (isAdminMode) {
                navigate({ page: "admin-dashboard" });
              } else {
                navigate({ page: "admin-login" });
              }
            }}
          />
        )}
      </div>
      <Toaster richColors theme="dark" />
    </div>
  );
}

function getPageTitle(page: AppPage): string {
  const titles: Record<AppPage, string> = {
    home: "Life Battle",
    "free-matches": "Free Matches",
    "paid-matches": "Paid Matches",
    "match-detail": "Match Details",
    leaderboard: "Leaderboard",
    announcements: "Announcements",
    profile: "My Profile",
    history: "Match History",
    wallet: "Wallet",
    "admin-login": "Admin Login",
    "admin-dashboard": "Admin Dashboard",
    "admin-create": "Create Match",
    "admin-edit": "Edit Match",
    "admin-players": "Player Management",
  };
  return titles[page] ?? "Life Battle";
}
