# Life Battle Tournament

## Current State
- App has a top AppHeader (sticky, 56px) with LB logo, title, back button, logout icon
- BottomNav has 5 items: Home, Tournaments (free-matches), Wallet, Profile, Admin button
- Admin mode uses same AppHeader but with Admin label and Exit Admin button
- Page transitions: none (instant swaps)
- manifest.json already has display: standalone
- Pages: home, free-matches, paid-matches, match-detail, leaderboard, announcements, profile, history, wallet
- Layout: max-w-[430px] centered

## Requested Changes (Diff)

### Add
- Smooth CSS slide/fade page transitions between all player pages (Android-style)
- "Create Match" tab in BottomNav (navigates to admin-login if not admin, or create page if admin)
- Active tab pill/indicator style improvements for native app feel
- Safe area insets for notched Android phones (env(safe-area-inset-*))

### Modify
- BottomNav: change from 5 tabs (Home, Tournaments, Wallet, Profile, Admin) to 4 tabs: Home, Tournaments, Create Match, Profile — Admin button moves to be a floating/hidden element or tap-hold on logo
- AppHeader: make it fixed (not just sticky), add subtle glass blur effect, show logo image/icon prominently
- All tournament/match cards: increase card size, add more visual weight (larger text, bigger images/icons, more padding)
- App layout: ensure 100dvh full screen with no overflow, safe area padding at top/bottom
- MatchListPage and HomePage cards: larger, bolder esports-style card layouts

### Remove
- Website-style navigation menus and sidebars (already removed, ensure no leftover)
- Admin button from bottom nav visible area (move to long-press on logo or hidden page)

## Implementation Plan
1. Update BottomNav to 4 tabs: Home, Tournaments, Create Match, Profile; keep Admin accessible via Create Match tab (if admin) or via profile long-press or as 5th hidden tab accessible from Profile page
2. Update App.tsx: add page transition wrapper using CSS classes (slide-in/out animations), wire Create Match tab
3. Update AppHeader: make fixed positioning, add backdrop-blur glass effect
4. Enhance card sizes in MatchCard component and HomePage quick action cards
5. Add CSS transition animations to index.css for Android-style page transitions
6. Ensure safe-area-inset padding in layout
7. manifest.json already correct — verify standalone mode
