# FitTrack Pro — UI/UX Redesign + Feature & Engineering Audit Prompt

Act as a senior PWA architect, frontend engineer, UI/UX designer, fitness-product designer, accessibility reviewer, and QA engineer.

You are given the existing FitTrack Pro PWA source. First reverse-engineer the application before changing it. Do not replace working functionality blindly.

## Phase 1 — Understand the existing application
1. Inventory every file, dependency, storage key, service-worker asset, page, modal, overlay, navigation route, and major function.
2. Map the data model for profile, exercises, plans, weekly schedule, daily logs, workout sessions, sets, nutrition, water, body weight, drafts, exports, and migration.
3. Map user journeys:
   - first launch
   - configure profile
   - choose/schedule a plan
   - start/resume/finish a workout
   - add/edit/remove exercises and sets
   - rest timer
   - nutrition logging/custom food/meal builder
   - body-weight and hydration logging
   - dashboard/history
   - plan/exercise management
   - export/backup
4. Identify which features are genuinely implemented versus placeholders or UI-only claims.

## Phase 2 — Full audit
Audit:
- JavaScript syntax/runtime risks
- broken references and missing files
- PWA manifest/installability/service worker/offline behavior
- localStorage persistence, migration, backup/restore, corruption handling
- date/time/timezone correctness
- workout state recovery and timer behavior
- set completion and progress calculations
- exercise add/remove/index integrity
- calorie/volume/PR calculations
- nutrition quantity and macro calculations
- export correctness and CSV escaping
- responsive layout and touch targets
- accessibility, keyboard navigation, focus states, semantic labels, contrast
- security risks from dynamic HTML/user-imported data
- performance and unnecessary re-rendering
- browser compatibility
- empty/error/loading states
- destructive actions and confirmations

Classify findings as Critical, High, Medium, Low, or Enhancement.

## Phase 3 — Redesign
Keep the existing product identity but evolve it into a premium, mobile-first fitness PWA:
- strong information hierarchy
- fast one-handed interactions
- clear primary actions
- clean cards and sections
- consistent spacing/type scale
- accessible controls
- responsive desktop/tablet support
- workout mode optimized for gym use
- data-dense but readable Stats
- clear nutrition and hydration progress
- polished empty/error/success states
- no unnecessary dependencies

Do not break the existing localStorage data model without migration.

## Phase 4 — Add useful features
Prioritize features that materially improve the existing product:
1. Reliable PWA manifest and install support.
2. Robust offline caching.
3. Full JSON backup and restore.
4. Safer, correctly escaped CSV export.
5. Accurate local-date handling without UTC date shifting.
6. Better workout session integrity when exercises are added/removed.
7. Session volume/progression visibility.
8. More useful dashboard weight/progress summaries.
9. Clear distinction between estimated calorie burn and measured wearable data.
10. Maintainable settings and destructive-data controls.

Do not fabricate wearable/heart-rate integration. If a feature is not connected to a real API/device, label it as unavailable/estimated.

## Phase 5 — Validate
After implementation:
- run JavaScript syntax checks
- verify all referenced local assets exist
- verify manifest references and service-worker cache assets
- inspect routes and major event handlers
- test persistence paths conceptually/static where browser automation is unavailable
- check for obvious undefined functions or broken selectors
- verify backup/restore structure
- verify date inputs/exports use local dates
- document remaining limitations honestly

## Output
Produce:
1. Reverse-engineered feature map.
2. Audit report with severity and fixes.
3. Redesign plan.
4. Implemented source changes.
5. Validation checklist.
6. Remaining limitations and recommended next phase.

Principle: preserve working behavior, fix real defects first, then improve UX and add features with minimal regression risk.
