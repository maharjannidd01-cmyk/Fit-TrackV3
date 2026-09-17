# FitTrack Pro v11 — Whole PWA Audit Report

## Scope
Audit of the v10 PWA source followed by Phase 7 stabilization and wearable UX implementation.

## Findings and fixes

| Area | Finding | Action |
|---|---|---|
| App shell | Header used fixed overlay positioning while scroll surface was separately offset; this made overlap regressions possible. | Normal header moved into the app layout flow. Session/rest chrome remains overlayed only during active workouts. |
| Dashboard spacing | Score card and subsequent sections could visually merge when multiple override layers interacted. | Explicit score-card bottom rhythm and dashboard block rhythm added. |
| CSS architecture | Several historic CSS layers remained in the same stylesheet. | v11 adds a single authoritative end-layer for shell and wearable behavior, preventing further local hacks. |
| Wearable discoverability | BLE functions existed but no obvious UI path exposed them to users. | Wearable cards added to Home, Dashboard and Settings plus a connection-method hub. |
| Wearable integration accuracy | Generic BLE support could be confused with full Noise activity/sleep access. | UI distinguishes Direct BLE, NoiseFit upstream, and Android Health Connect bridge. |
| HR persistence | Every HR notification could trigger localStorage writes through shared state helpers. | Live HR updates use a non-persistent state path; session samples are draft-saved at the existing interval. |
| Reconnection | Previous device metadata existed, but there was no explicit reconnect UX. | Added “Reconnect saved wearable” when supported. |
| Data integrity | Missing wearable metrics could be interpreted as estimates. | UI keeps missing values as “—” and documents the policy. |
| Offline/PWA update | Service worker cache name was v10. | Cache namespace updated to v11 with old FitTrack caches retired during activation. |
| Backward compatibility | Prior versions used ft4, v9 and v10 storage keys. | v11 reads v11 → v10 → v9 → ft4 and migrates forward on save. |

## Static regression checks
- `node --check app.js` — PASS
- `node --check sw.js` — PASS
- `manifest.json` JSON parse — PASS
- CSS brace balance — PASS
- Static duplicate-ID check — PASS
- ZIP integrity — PASS

## Browser-level note
A Chromium headless run was attempted in the container, but the bundled Chromium process did not complete within the environment timeout. Therefore no live-browser screenshot test is claimed as successful for this audit.

## Known integration limits
- Web Bluetooth is experimental/limited availability and requires a secure context plus explicit user permission.
- Direct BLE only reads standardized services that the wearable exposes to the browser; a successful Bluetooth pairing does not imply full activity/sleep/SpO₂ access.
- Android Health Connect integration requires an Android application/TWA bridge using the Health Connect SDK and user-granted permissions. v11 provides the PWA-side contract but does not ship the Android binary.
