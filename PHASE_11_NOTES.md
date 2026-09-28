# FitTrack Pro v17 — Phase 11: Nutrition 2.0

## Delivered
- Added a standalone nutrition calculation module (`js/nutrition/engine.js`) for per-100g calculations, macro totals, and macro progress percentages.
- Added daily protein/carbohydrate/fat target progress cards and user-editable target values.
- Added saved meal presets: save today's food combination, one-tap add a saved meal, and delete a preset.
- Presets and macro targets persist in the existing profile/local-first data structure and are normalized on load with limits and numeric bounds.
- Preserved existing food logging, food search, quantity adjustment, Cook Your Meal builder, and historical food logs.
- Added a sample-data standalone preview file.
- Updated app version marker and service worker cache/precache.

## Known limitations / next increment
- Existing food catalog is a bundled starter catalog, not a professionally verified nutrient database. Values should be treated as estimates and labeled as such in future database expansion.
- The existing meal builder remains available; recipe yield/weight and serving-unit modeling can be expanded next.
- Saved meal presets currently capture today's logged foods, not a separate recipe editor with ingredient-to-yield normalization.
- Nutrition data remains local-first; cloud sync is not present.
