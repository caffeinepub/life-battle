# Life Battle Tournament

## Current State
- manifest.json exists with display: standalone, correct start_url, icons, theme/background color
- manifest is linked in index.html head
- No service worker exists (sw.js missing)
- No service worker registration in main.tsx or index.html
- App layout is already mobile-optimized with top bar and bottom nav

## Requested Changes (Diff)

### Add
- Service worker (`public/sw.js`) with:
  - App shell caching strategy (cache-first for assets, network-first for API)
  - Offline fallback to cached index.html
  - Cache versioning for easy updates
- Service worker registration script in index.html (before closing body tag)
- `<meta name="theme-color">` already present; ensure it matches manifest (#0000FF)

### Modify
- index.html: update theme-color meta to `#0000FF` to match manifest; add SW registration inline script
- Ensure all `<a>` tags and navigation use in-app routing (React Router) rather than full-page href to prevent external browser opening
- Add `target="_self"` and remove any `target="_blank"` on internal navigation links
- Mobile viewport meta: add `user-scalable=no, viewport-fit=cover` for full-screen native feel

### Remove
- Nothing to remove

## Implementation Plan
1. Create `src/frontend/public/sw.js` with install/activate/fetch event handlers using cache-first for static assets and network-first for API calls, offline fallback
2. Update `src/frontend/index.html`: fix theme-color to #0000FF, viewport to include viewport-fit=cover and user-scalable=no, add SW registration inline script
3. Audit App.tsx / router for any external-opening links; ensure internal navigation stays in-app
