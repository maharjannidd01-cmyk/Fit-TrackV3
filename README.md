# FitTrack Pro v9

Gym Mode 2.0 + structural rebuild of the Phase 4 PWA.

Open `index.html` through a secure/static web origin for full PWA behavior. `FitTrack-Pro-v9-Preview.html` is a standalone visual preview and does not modify real app data.

## Core files
- `index.html` — semantic PWA shell
- `styles.css` — consolidated visual/layout system
- `app.js` — application state, pages, workout, food, plans, history, export, timer and wearable logic
- `sw.js` — v9 service worker
- `manifest.json` — PWA metadata

## Storage
Primary state key: `fittrack_pro_v9`.
Previous `ft4` data is still read and migrated forward on first load.

## Important
Estimated calories are labeled as estimates. Wearable values are only displayed when they are actually received from the device/browser integration layer.
