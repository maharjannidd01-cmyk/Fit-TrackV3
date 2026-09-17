# FitTrack Pro v11 — Wearable Connection Guide

## Recommended UI path
Open **Settings → Wearable Connection → Options**, or use the **Wearable & Health** card on Home.

## Method 1 — Direct Bluetooth (experimental)
Use this when the browser exposes Web Bluetooth and the page is served from a secure origin (HTTPS; localhost is allowed for local development).

1. Turn on Bluetooth on the phone/computer.
2. Keep the wearable nearby and awake.
3. Open FitTrack Pro.
4. Tap **Connect via Bluetooth**.
5. Select the wearable in the browser permission chooser.
6. FitTrack attempts standard Battery / Device Information / Heart Rate services.

The browser API is experimental/limited-availability and requires explicit user permission.

## Method 2 — Android Health Connect
For broad health/activity data, the intended production path is:

**NoiseFit → Android Health Connect → FitTrack Android companion/TWA → FitTrack PWA**

The pure web page cannot directly use the Android Health Connect SDK. The v11 PWA exposes a bridge message contract for the future Android companion.

## Method 3 — NoiseFit companion route
Keep the ColorFit Pro 5 Max paired and synchronized with NoiseFit. FitTrack should consume standardized data through Health Connect instead of assuming access to an undocumented proprietary Noise BLE protocol.
