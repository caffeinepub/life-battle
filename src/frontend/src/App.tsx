import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FirebaseAuthProvider, useFirebaseAuth } from "./hooks/useFirebaseAuth";
import { useFirebaseProfile } from "./hooks/useFirebaseProfile";

import AnnouncementsPage, { getAnnouncements } from "./pages/AnnouncementsPage";
import HomePage from "./pages/HomePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import LoginPage from "./pages/LoginPage";
import MatchDetailPage from "./pages/MatchDetailPage";
import MatchHistoryPage from "./pages/MatchHistoryPage";
import MatchListPage from "./pages/MatchListPage";
import ProfilePage from "./pages/ProfilePage";
import WalletPage from "./pages/WalletPage";

import AppHeader from "./components/AppHeader";
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

export type AppPage = PlayerPage;

export type AppNav = {
  page: AppPage;
  matchId?: number;
};

// Pages that are top-level tabs — back button on these should stay in app
const TAB_PAGES: AppPage[] = [
  "home",
  "free-matches",
  "paid-matches",
  "announcements",
  "leaderboard",
  "profile",
  "wallet",
];

const pageVariants = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -18 },
};

const PULL_THRESHOLD = 80;

function AppInner() {
  const { user, isLoading: authLoading, signOut } = useFirebaseAuth();
  const { profile, isLoading: profileLoading } = useFirebaseProfile(user?.uid);
  const queryClient = useQueryClient();

  const [nav, setNav] = useState<AppNav>({ page: "home" });
  const navStackRef = useRef<AppNav[]>([{ page: "home" }]);
  const isPopstateRef = useRef(false);

  // Pull-to-refresh state
  const mainRef = useRef<HTMLElement>(null);
  const touchStartYRef = useRef(0);
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [announcementCount, setAnnouncementCount] = useState(() => {
    const lastSeen = Number.parseInt(
      localStorage.getItem("lb_announcements_last_seen") ?? "0",
      10,
    );
    return getAnnouncements().filter((a) => a.createdAt > lastSeen).length;
  });

  // Seed one history entry so popstate can fire
  useEffect(() => {
    window.history.replaceState({ lb: true }, "");
  }, []);

  // Handle Android/browser back button
  useEffect(() => {
    const onPopstate = () => {
      const stack = navStackRef.current;
      if (stack.length <= 1) {
        return;
      }
      isPopstateRef.current = true;
      const newStack = stack.slice(0, -1);
      navStackRef.current = newStack;
      setNav(newStack[newStack.length - 1]);
      window.history.pushState({ lb: true }, "");
    };
    window.addEventListener("popstate", onPopstate);
    return () => window.removeEventListener("popstate", onPopstate);
  }, []);

  // After login, go to home
  const prevUserRef = useRef<string | null>(null);
  useEffect(() => {
    if (user?.uid && prevUserRef.current === null) {
      setNav({ page: "home" });
      navStackRef.current = [{ page: "home" }];
    }
    prevUserRef.current = user?.uid ?? null;
  }, [user?.uid]);

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

  const handleAnnouncementsViewed = useCallback(
    () => setAnnouncementCount(0),
    [],
  );

  const navigate = useCallback((navState: AppNav) => {
    if (isPopstateRef.current) {
      isPopstateRef.current = false;
      return;
    }
    const isTabPage = TAB_PAGES.includes(navState.page);
    if (isTabPage) {
      navStackRef.current = [navState];
      window.history.replaceState({ lb: true }, "");
    } else {
      navStackRef.current = [...navStackRef.current, navState];
      window.history.pushState({ lb: true }, "");
    }
    setNav(navState);
  }, []);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  // Touch handlers for pull-to-refresh
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLElement>) => {
    if (mainRef.current && mainRef.current.scrollTop === 0) {
      touchStartYRef.current = e.touches[0].clientY;
    } else {
      touchStartYRef.current = -1;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      if (touchStartYRef.current < 0 || isRefreshing) return;
      const dy = e.touches[0].clientY - touchStartYRef.current;
      if (dy <= 0) return;
      const progress = Math.min(dy / PULL_THRESHOLD, 1.2);
      setPullProgress(progress);
    },
    [isRefreshing],
  );

  const handleTouchEnd = useCallback(() => {
    if (touchStartYRef.current < 0) return;
    touchStartYRef.current = -1;
    if (pullProgress >= 1) {
      setIsRefreshing(true);
      setPullProgress(0);
      handleRefresh();
      setTimeout(() => setIsRefreshing(false), 800);
    } else {
      setPullProgress(0);
    }
  }, [pullProgress, handleRefresh]);

  // Auth initializing
  if (authLoading) {
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
  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-background hero-pattern">
        <LoginPage onLoginSuccess={() => {}} />
        <Toaster richColors theme="dark" />
      </div>
    );
  }

  // Profile still loading
  if (profileLoading) {
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

  // Logged in but no profile yet → registration
  if (!profile) {
    return (
      <div className="min-h-[100dvh] bg-background hero-pattern">
        <LoginPage onLoginSuccess={() => {}} isRegistration />
        <Toaster richColors theme="dark" />
      </div>
    );
  }

  const playerId = profile.playerId;

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

  const canGoBack =
    navStackRef.current.length > 1 && !TAB_PAGES.includes(nav.page);

  // Pull indicator position and appearance
  const indicatorTop = 56 + 8 + pullProgress * 48;
  const isReady = pullProgress >= 1;
  const circumference = 2 * Math.PI * 10;
  const dashOffset = circumference * (1 - Math.min(pullProgress, 1));

  return (
    <div className="bg-background overflow-hidden" style={{ height: "100dvh" }}>
      <div
        className="max-w-[430px] mx-auto flex flex-col relative"
        style={{ height: "100dvh" }}
      >
        <AppHeader
          title={getPageTitle(nav.page)}
          onBack={
            canGoBack
              ? () => {
                  const stack = navStackRef.current;
                  if (stack.length <= 1) return;
                  const newStack = stack.slice(0, -1);
                  navStackRef.current = newStack;
                  setNav(newStack[newStack.length - 1]);
                  window.history.go(-1);
                }
              : undefined
          }
          onRefresh={handleRefresh}
        />

        {/* Pull-to-refresh indicator */}
        {(pullProgress > 0 || isRefreshing) && (
          <div
            className="absolute left-1/2 z-40 pointer-events-none"
            style={{
              top: `${indicatorTop}px`,
              transform: "translateX(-50%)",
              transition: pullProgress === 0 ? "top 0.3s ease" : "none",
            }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: "oklch(0.18 0.02 260)",
                border: `2px solid ${
                  isReady || isRefreshing
                    ? "oklch(0.72 0.2 38)"
                    : "oklch(0.35 0.04 260)"
                }`,
              }}
            >
              {isRefreshing ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  aria-hidden="true"
                >
                  <circle
                    cx="9"
                    cy="9"
                    r="6"
                    fill="none"
                    stroke="oklch(0.72 0.2 38)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference * 0.7} ${circumference * 0.3}`}
                    style={{
                      transformOrigin: "9px 9px",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  aria-hidden="true"
                >
                  <circle
                    cx="9"
                    cy="9"
                    r="6"
                    fill="none"
                    stroke={
                      isReady ? "oklch(0.72 0.2 38)" : "oklch(0.5 0.06 260)"
                    }
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={dashOffset}
                    style={{
                      transformOrigin: "9px 9px",
                      transform: "rotate(-90deg)",
                    }}
                  />
                </svg>
              )}
            </div>
          </div>
        )}

        <main
          ref={mainRef}
          className="flex-1 overflow-y-scroll scrollbar-hide"
          style={{
            paddingTop: "56px",
            paddingBottom: showBottomNav ? "90px" : "24px",
            overscrollBehavior: "none",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
                <ProfilePage
                  navigate={navigate}
                  playerId={playerId}
                  onSignOut={signOut}
                />
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
            announcementCount={announcementCount}
          />
        )}
      </div>
      <Toaster richColors theme="dark" />
    </div>
  );
}

export default function App() {
  return (
    <FirebaseAuthProvider>
      <AppInner />
    </FirebaseAuthProvider>
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
  };
  return titles[page] ?? "Life Battle";
}
