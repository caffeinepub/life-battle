# Life Battle — Announcement System

## Current State
The app has a full admin dashboard with match, deposit, withdrawal, and KYC tabs. Players have home, matches, leaderboard, wallet, and profile pages. There is no announcement system yet. The BottomNav shows 5 player nav items plus an Admin button.

## Requested Changes (Diff)

### Add
- `AnnouncementsPage` — player-facing page listing all announcements in dark esports card style
- Admin `Announcements` tab inside `AdminDashboardPage` — create/edit/delete/pin announcements
- Announcement localStorage store (`announcements` key) shared between admin and players
- Notification badge on BottomNav Announcements icon showing unread count
- `announcements` route in `PlayerPage` type and `App.tsx` routing
- Announcement icon in BottomNav (replacing or alongside existing items)

### Modify
- `App.tsx` — add `announcements` to `PlayerPage` type, add route rendering, update `getPageTitle`
- `BottomNav.tsx` — add Announcements nav item with notification badge for unread count
- `AdminDashboardPage.tsx` — add Announcements tab with create/edit/delete/pin UI

### Remove
- Nothing

## Implementation Plan
1. Define `Announcement` type: `{ id: string, title: string, message: string, createdAt: number, isPinned: boolean }`
2. Create localStorage helpers: `getAnnouncements()`, `saveAnnouncements()`, `getLastSeenTimestamp()`, `markAllSeen()`
3. Build `AnnouncementsPage` with dark esports card design — pinned items first, notification cleared on visit
4. Add `Announcements` tab to `AdminDashboardPage` — inline form for create, edit inline, delete with confirm, pin toggle
5. Update `App.tsx` to add `announcements` page type and routing
6. Update `BottomNav` to include Announcements icon with red badge showing unseen count
