# FitTrack Pro v10 — Phase 6 Changelog

## User-reported visual issues resolved

- Fixed content/header overlap by changing the main scroll region from a flex child with padding hacks to an explicit viewport-bounded scrolling region.
- Header occupies its own 64px viewport band.
- Active workout uses the session/rest bars as the top chrome and hides the regular header to eliminate stacked overlays.
- Home hero → goal → quick-actions now uses 16px vertical card spacing.
- Dashboard scorecard → section → card now uses an 18px section rhythm.
- Removed the old `padding-top` based dynamic bar positioning from `syncBars()`.
- Updated the rest/session top offsets to CSS variables.

## Functional robustness

- v10 state key with migration from v9 and older `ft4` storage.
- v10 session draft with v9 draft fallback.
- Next unfinished set receives focus after completion.
- Program-start date parsed in local time.
- Shareable summary PNG uses actual HR average/max when captured.
- Service worker v10 refreshes application code/assets from network when online and falls back to cache when offline.
