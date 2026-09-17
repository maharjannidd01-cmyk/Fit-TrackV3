# FitTrack Pro v11 — Phase 7 Notes

## Phase focus
Wearable & Health Hub + shell/layout stabilization.

## What changed
- Reworked the application chrome so the normal header is in layout flow instead of overlaying the scroll surface.
- Active workout keeps the header hidden and uses the session/rest chrome with explicit content offsets.
- Standardized vertical rhythm for Home and Dashboard score-card/section/card relationships.
- Added a clearly visible **Wearable & Health** entry on Home, Dashboard and Settings.
- Added a dedicated connection-method hub.
- Added Direct Bluetooth (Web Bluetooth) connection with reconnect support for previously authorized devices when the browser exposes `navigator.bluetooth.getDevices()`.
- Added an Android Health Connect bridge contract via `postMessage` so an Android companion/TWA can pass standardized health records into the PWA.
- Added an explicit NoiseFit upstream route in the UI rather than implying an undocumented proprietary Noise BLE protocol.
- Expanded wearable state with connection method, source, last sync and capabilities.
- Reduced persistence pressure from live HR notifications: live HR updates do not rewrite the profile to localStorage on every notification.
- Kept sample/preview values isolated from the production PWA.
- Added a standalone preview HTML demonstrating the new spacing and wearable options.
- Upgraded the service-worker cache namespace to v11.

## Wearable connection UX
The user can now reach wearable controls in three places:
1. Home → Wearable & Health → Connection options.
2. Dashboard → Wearable & Health → Choose connection method.
3. Settings → Wearable Connection → Options.

### Direct Bluetooth
The production PWA can request a nearby BLE device in supported browsers. The connection requests standard Device Information, Battery Service and Heart Rate Service UUIDs. Only values actually exposed by the device are displayed.

### Android Health Connect
A pure browser PWA does not get the Android Health Connect SDK permission flow. v11 adds the UI and a bridge message contract so the future Android companion/TWA can request Health Connect permissions and send approved records to FitTrack.

## Data contract for the Android bridge
```js
window.postMessage({
  type: 'FITTRACK_HEALTH_CONNECT_SYNC',
  payload: {
    heartRate: 128,
    steps: 8642,
    battery: 78,
    heartRateSamples: [{ ts: Date.now(), bpm: 128 }]
  }
}, '*');
```
The bridge should be restricted to the FitTrack origin in a production Android wrapper and should only send data for permissions granted by the user.
