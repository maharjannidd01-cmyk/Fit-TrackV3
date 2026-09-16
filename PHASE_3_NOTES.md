# FitTrack Pro Phase 3 Notes

Implemented Advanced Fitness Intelligence on top of v6.

## Added
- Estimated 1RM analytics using Epley formula for logged resistance sets.
- Muscle-group volume for the latest 30 days.
- Weekly volume series.
- Conservative progressive-overload suggestions based on target reps and optional RPE.
- Optional post-workout RPE (1–10) and session note.
- Daily recovery check-in: sleep, energy, soreness, note.
- Recovery score shown as a transparent derived score, not medical readiness.
- 14-day nutrition adherence metrics.
- Expanded Performance dashboard.
- Home recovery card.

## Truthfulness
- 1RM is explicitly estimated.
- Calories remain estimated.
- Heart-rate/wearable data are not fabricated or simulated.
- Recovery score is a product heuristic from user-entered data, not a medical assessment.

## Compatibility
All new fields are optional and stored alongside the existing localStorage schema.
