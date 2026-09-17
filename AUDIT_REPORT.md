# FitTrack Pro v10 — Full PWA Audit & Structural Rebuild Report

## Scope
Audited the Phase 4 package as the source of truth and rebuilt the application shell, persistence layer, timer UX, dashboard layout, session data capture, and offline cache strategy without intentionally removing existing workout, food, plan, history, export, backup/restore, or wearable capabilities.

## Issues found and resolved

1. **Layout/spacer fragmentation** — the prior app used multiple late CSS override blocks plus extensive inline spacing rules. v10 adds a consolidated stylesheet and a predictable section/block gap system. Dashboard scorecards, metric blocks, charts and subsequent sections now share a consistent vertical rhythm.
2. **Score-card separation** — the dashboard did not have a dedicated score-card layout contract. v9 introduces a single `.scorecard` component with controlled margin, bar, metadata and note spacing.
3. **Missing documented runtime features** — the Phase 4 handoff described recovery/RPE-style intelligence that was not present in the inspected runtime. v10 does not claim unimplemented recovery behavior; it adds the missing workout RPE/session-note capture and labels the new Training Score as a product metric rather than medical readiness.
4. **Storage writes every second** — session drafts were being written on every timer tick. v9 throttles draft persistence and force-saves on meaningful interactions/visibility changes.
5. **Stale day after midnight** — the active day was initialized once. v9 refreshes today's date when navigation/visibility resumes.
6. **Hard-coded 8-glass UI** — home hydration controls referenced 8 instead of the configured water target in several places. v10 uses the profile target where the controls are rendered.
7. **Heart-rate summary was placeholder-only** — v10 records sampled HR values during active sessions and computes average/max HR for the completion summary when samples exist.
8. **Timer scale consistency** — the large rest ring is now 320px-viewbox based with responsive CSS sizing and a clamped font; the countdown cannot visually outgrow the ring on small screens. The compact timer is also enlarged.
9. **PWA cache freshness** — v10 moves the service worker cache to a new version and includes the new external stylesheet, preventing the new structure from being trapped behind an old asset cache.
10. **Persistence structure** — v10 uses a versioned primary storage key while still loading the previous `ft4` dataset for continuity.
11. **Error resilience** — global `error` and `unhandledrejection` hooks were added for diagnostics instead of silently failing all the way through the UI.
12. **Workout flow efficiency** — completing a set now automatically focuses the next available set field after starting the appropriate rest timer.

## Regression checks

- `node --check app.js` — PASS
- `node --check sw.js` — PASS
- `manifest.json` JSON parse — PASS
- HTML duplicate-ID scan — PASS
- Referenced static-shell function names — PASS
- CSS brace balance — PASS

## Important limitations

- The app remains a client-side/offline-first PWA; no server sync was introduced in this rebuild.
- Estimated calorie burn remains explicitly estimated.
- Noise ColorFit Pro 5 Max integration remains dependent on whatever standard BLE characteristics the browser/device exposes. Proprietary Noise activity/sleep synchronization is not fabricated.
- Full Android Health Connect integration still needs a native/TWA bridge or companion architecture; it is not represented as already-working in the browser-only build.

13. **Fixed header overlap** — the scroll viewport now starts below the header/session/rest chrome, so content cannot physically scroll underneath the upper bar.
14. **Home card rhythm** — hero/goal/quick-action cards use a deliberate 16px separation instead of inherited margin combinations.
15. **Set focus flow** — after completing a set, the next unfinished set input receives focus where practical.
16. **Version migration** — v10 reads v10, v9, and `ft4` data sources and writes forward to the v10 schema.
17. **Summary image accuracy** — captured heart-rate values are shown in the shareable PNG; absent samples remain explicitly absent.
18. **Local-date parsing** — program start dates entered via the date picker are parsed as local calendar dates to avoid timezone drift.
19. **Offline cache freshness** — app code/assets use network-first with cache fallback so deployed updates are not permanently shadowed by a stale cache while offline behavior remains available.

## Screenshot-specific root cause

The reported overlap was caused by the relationship between three independent layers: `#app-header` was fixed at the top of the viewport, `#scroll` was the scrolling surface, and `syncBars()` changed only `padding-top`. Padding reserves space at the top of the scroll content, but it does not stop the scroll surface itself from moving content behind a fixed header. Once the user scrolled, cards could therefore visually pass underneath the header/backdrop.

The v10 correction moves the scroll surface itself into the free viewport (`top: var(--scroll-top)` and `bottom: calc(var(--nav) + var(--safe))`). This makes the header/session/rest region a real non-scrolling chrome band rather than an overlay that the content scrolls behind.

## Visual acceptance targets

- Header never covers the first visible row of page content during normal scrolling.
- Home hero → goal card gap: 16px.
- Goal card → quick-action grid gap: 16px.
- Dashboard scorecard → first section gap: 18px.
- Dashboard section heading → section content gap: 8px.
- Active workout: standard header is hidden; session/rest chrome owns the top area without stacking over the workout content.
- Bottom navigation remains outside the scroll surface.
- Safe-area insets remain respected.
