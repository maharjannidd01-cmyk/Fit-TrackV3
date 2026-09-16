# FitTrack Pro 2.0 — Next Phase Implementation Prompt

Act as a senior fitness-product designer, PWA architect, frontend engineer and QA engineer. Starting from the audited FitTrack Pro v5 source, implement the next product phase without breaking existing data or core workflows.

Goals:
- Make Home a clear daily command center.
- Make Workout mode faster for gym use and more progression-oriented.
- Upgrade Stats into actionable progress analytics rather than only historical numbers.
- Add explicit user goals while preserving current profile fields.
- Improve nutrition/hydration/weight visibility.
- Preserve offline-first behavior and existing localStorage compatibility.
- Avoid fabricated wearable/Health Connect data.

Implement:
1. Goal system: target weight, weekly workout target, daily water target, goal start weight, goal progress cards.
2. Home: today's readiness/progress snapshot, goal progress, quick-log actions, recent workout summary.
3. Workout: progression context (previous load), session volume, live completion percentage, clearer gym controls.
4. Stats: 7/30-day training volume, workout consistency, protein consistency, weight trend, goal progress, estimated-vs-measured calorie labeling.
5. Nutrition: clearer macro progress and daily target context.
6. Data safety: migrate old profile data, preserve unknown fields, validate restored data, do not erase unrelated data.
7. Accessibility and responsive polish.
8. QA: syntax, manifest, service worker, event handlers, migration and data export.

Do not add external APIs or claim wearable integration unless actually implemented.
