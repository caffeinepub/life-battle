import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerProfile } from "./hooks/useQueries";

import AdminLoginPage from "./pages/AdminLoginPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
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
import SplashScreen from "./components/SplashScreen";

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

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [nav, setNav] = useState<AppNav>({ page: "home" });
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const queryClient = useQueryClient();

  const isLoggedIn = !!identity && !identity.getPrincipal().isAnonymous();

  // Only fetch profile when actually logged in
  const { data: profile, isLoading: profileLoading } = useGetCallerProfile();

  const navigate = (navState: AppNav) => setNav(navState);

  // Always show splash on first load
  if (!splashDone) {
    return <SplashScreen onComplete={() => setSplashDone(true)} />;
  }

  // Show spinner only during Internet Identity initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
      <div className="min-h-screen bg-background hero-pattern">
        <LoginPage onLoginSuccess={() => {}} />
        <Toaster richColors theme="dark" />
      </div>
    );
  }

  // Logged in but profile still loading
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
      <div className="min-h-screen bg-background hero-pattern">
        <LoginPage onLoginSuccess={() => {}} isRegistration />
        <Toaster richColors theme="dark" />
      </div>
    );
  }

  const playerId = profile.playerId;

  // Admin login page — full-screen, no chrome
  if (nav.page === "admin-login") {
    return (
      <div className="min-h-screen bg-background">
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
      <div className="min-h-screen bg-background">
        <div className="max-w-[430px] mx-auto min-h-screen flex flex-col relative">
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
          <main className="flex-1 overflow-y-auto pb-6">
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
  ];
  const showBottomNav = bottomNavPages.includes(nav.page as PlayerPage);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[430px] mx-auto min-h-screen flex flex-col relative">
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
          className={`flex-1 overflow-y-auto ${showBottomNav ? "pb-20" : "pb-6"}`}
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
            <AnnouncementsPage navigate={navigate} />
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
        </main>

        {showBottomNav && (
          <BottomNav
            current={nav.page as PlayerPage}
            navigate={navigate}
            isAdmin={false}
            onAdminClick={() => {
              navigate({ page: "admin-login" });
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
