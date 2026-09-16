# FitTrack Pro v5 — Audited UI/UX Redesign

This package is an audited and improved version of the uploaded FitTrack Pro PWA.

## Included
- `index.html` — mobile-first premium athletic UI.
- `app.js` — workout, nutrition, hydration, plans, history, dashboard, exports and settings logic, with audited fixes.
- `sw.js` — updated offline service worker/cache.
- `manifest.json` — PWA install manifest.
- `icon.svg`, `icon-192.png`, `icon-512.png` — application icons.
- `REDESIGN_PROMPT.md` — prompt used to drive the analysis/redesign/audit.
- `AUDIT_REPORT.md` — implementation and QA audit.

## Major fixes
- Added missing PWA manifest and icons.
- Fixed service-worker asset caching.
- Fixed timezone-safe local date handling.
- Fixed live-workout exercise index collisions after exercise removal.
- Added backup/restore for full app data.
- Made full data reset actually clear all application data.
- Hardened CSV export escaping.
- Added volume to exported data.
- Added dashboard history access.
- Moved settings into the app header.
- Removed the viewport restriction that prevented user zoom.
- Clearly labels workout calorie burn as estimated.

## Existing functionality preserved
Workout plans, weekly scheduling, live workout sessions, set tracking, rest timer, exercise management, nutrition logging, meal builder, hydration, body weight, dashboard, history, PRs, workout summaries, exports and v3 migration remain part of the application.

## Important limitation
This remains a local-first static PWA. There is no real wearable/Health Connect/Apple Health, cloud sync, authentication, push notification or Bluetooth gym-equipment integration in this package. Heart-rate fields shown in the workout summary remain placeholders and are not presented as measured data.

## Deployment
Serve the directory over HTTPS (or localhost for development). Open `index.html` through the hosted origin rather than relying on `file://` if you want service-worker/PWA installation behavior.
