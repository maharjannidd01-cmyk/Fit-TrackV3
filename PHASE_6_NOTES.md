# FitTrack Pro v10 — Phase 6 Notes

## Structural Stability + UX Spacing Update

- Rebuilt the main shell so the scroll viewport begins below the fixed header rather than scrolling behind it.
- During an active workout, the regular header is hidden and the session/rest chrome owns the top area.
- Reworked dynamic top insets through `syncBars()` and CSS variables instead of padding hacks.
- Increased and normalized the home-card rhythm: Hero → Goal → Quick Actions now use a deliberate 16px separation.
- Standardized dashboard scorecard → section → card spacing at an 18px rhythm.
- Added a CSS reset layer at the end of the stylesheet to neutralize earlier conflicting layout overrides.
- v9 data is migrated into the versioned v10 storage key; v9 session drafts remain resumable.
- Completing a set now starts rest and focuses the next unfinished set when available.
- Program start-date input is parsed as a local calendar date.
- Workout summary PNG now shows captured HR average/max when available and otherwise explicitly reports that no samples were captured.
- Service worker v10 uses network-first fetching for HTML/CSS/JS/JSON while retaining cached offline fallback.

## Audit

See `AUDIT_REPORT.md` for static and runtime regression checks.
