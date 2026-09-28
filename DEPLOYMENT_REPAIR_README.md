# FitTrack Pro — GitHub Pages repair package

**Important:** Open the `Fit-TrackV3-main` folder and upload its *contents* to the root of your existing GitHub repository. Do not create a nested `Fit-TrackV3-main/Fit-TrackV3-main/` directory.

The repository root should look like:

```
index.html
app.js
styles.css
sw.js
manifest.json
js/
  core/runtime.js
  core/storage.js
  data/catalog.js
  exercises/library.js
  analytics/metrics.js
  workout/engine.js
  workout/intelligence.js
  nutrition/engine.js
  wearables/protocol.js
```

Commit all files and wait for GitHub Pages to finish deploying. Then open the site's GitHub Pages URL in Chrome. Do not clear site storage before exporting a backup.

See `AUDIT_FIX_V19.md` for confirmed defects and validation limitations.
