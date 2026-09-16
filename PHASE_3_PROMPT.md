# FitTrack Pro Phase 3 — Advanced Fitness Intelligence

Continue from FitTrack Pro v6 without replacing working functionality. First audit the v6 source, then implement an Advanced Fitness Intelligence layer.

Goals:
- Preserve localStorage compatibility and existing workout/food/history/plan flows.
- Add progressive-overload intelligence, estimated 1RM analytics, muscle-group volume, PR detection, nutrition adherence, and recovery check-ins.
- Improve workout completion data by capturing optional RPE after a session.
- Clearly distinguish estimates from measured wearable data; do not fabricate Health Connect, heart-rate, sleep, or wearable readings.
- Keep the app offline-first, dependency-light, mobile-first, accessible, and responsive.

Required implementation:
1. Add reusable analytics helpers for session volume, muscle-group volume, estimated 1RM, exercise history, PRs, weekly progression, nutrition adherence, and recovery.
2. Upgrade Stats with:
   - strength/1RM leaderboard
   - muscle-group volume distribution
   - weekly volume trend
   - nutrition adherence
   - recovery overview
   - actionable progression suggestions based only on recorded data
3. Add optional post-workout RPE (1–10) and session note; persist it in the session record.
4. Add daily recovery check-in: sleep hours, energy 1–5, soreness 1–5, and note. Persist inside the daily log.
5. Add a compact recovery card to Home and detailed recovery analytics to Stats.
6. Add progressive-overload suggestions using conservative rules:
   - if the latest completed sets meet/exceed target reps and are not high-RPE, suggest a small load increase;
   - otherwise suggest repeating the load/reps.
   - Never present medical advice or certainty.
7. Improve exercise analytics using Epley estimated 1RM only for resistance sets with valid weight/reps.
8. Maintain truthful labels: estimated 1RM, estimated calories, logged recovery.
9. Audit and fix regressions, syntax errors, missing references, and broken UI handlers.
10. Produce a phase prompt, implementation notes, audit notes, and a packaged ZIP.
