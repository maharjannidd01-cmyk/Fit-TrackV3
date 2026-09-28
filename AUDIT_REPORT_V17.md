# v17 Focused Release Audit

- Source baseline: v16 Phase 10 Exercise Intelligence.
- JavaScript syntax checks: app.js, nutrition engine, and service worker passed.
- Migration compatibility: existing food log records retain their current shape; new profile fields have defaults and bounded normalization.
- Persistence: saved meals and macro targets use the existing profile save/load pathway.
- XSS consideration: preset names are escaped with existing `h()` helper before insertion into HTML.
- Offline: new nutrition engine included in service-worker precache.
- Browser/device testing: static checks only in this release environment; validate on target browsers/devices before production deployment.
