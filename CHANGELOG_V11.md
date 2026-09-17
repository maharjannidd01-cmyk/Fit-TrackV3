# FitTrack Pro v11 Changelog

## Phase 7 — Wearable & Health Hub + Layout Stabilization

### UX / layout
- Removed the normal header from overlay positioning.
- Made the header a real shell row above the scroll surface.
- Added explicit active-session content offsets.
- Standardized Home and Dashboard spacing.
- Increased visual separation around the training score card and section groups.

### Wearable
- Added Wearable & Health card on Home.
- Added Wearable & Health block on Dashboard.
- Added Wearable Connection section in Settings.
- Added connection-method hub.
- Added Direct Bluetooth connection + reconnect path.
- Added Health Connect bridge contract.
- Added NoiseFit setup explanation.
- Added capability/status presentation.

### Architecture
- Upgraded storage schema to v11.
- Added v10 storage migration.
- Added explicit wearable `method`, `source`, `lastSyncAt` and capabilities fields.
- Reduced localStorage writes on live HR notifications.
- Service worker upgraded to v11.
- Standalone preview refreshed.
