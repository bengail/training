# Extraction Report — Workouts mapped to `workout_library_enriched.json`

This report summarizes workouts found across the SWAP plans and shows how they map to the canonical templates in `workout_library_enriched.json`.

## Source files scanned
- `6-Week Half Marathon Plan (Improving Threshold Output).md` (EN + FR)
- `12-Week Marathon Training Plan.md` (EN + FR)
- `10-Week Winter Plan.md` (EN + FR)
- `SWAP 5k_10k Speed Plan.md` (EN + FR)
- `key_sessions.md`

## Grouping by goal / construction

- Endurance / Long Run
  - Found in plans as: "long run", "sortie longue", "long run with tempo", "long run with blocks"
  - Mapped template: `long_run`, `tempo_in_long`, `repeat_mile`
  - Construction: long Z2 blocks, optional tempo blocks (20–40 min), repeated 1-mile segments for specific practice.

- Threshold / Tempo
  - Found as: "threshold intervals", "seuil", "6 x 5 min", "10/8/6/4/2 ladder", "3 x 4 min @1h"
  - Mapped template: `threshold`, `threshold_ladder`, `tempo_in_long`
  - Construction: repeated 5–20 min blocks at ~1h effort, ladders and repeated durations.

- VO2 / Short Intervals
  - Found as: "6 x 1 min VO2", "16 x 1 min/1 min", "sets of 1-min", "3 x (4 x 1 min)"
  - Mapped template: `vo2_short`, `speed_ladder`, `track_mixed` (when track distances used)
  - Construction: 30–90s repeats, sets, or pyramids.

- Hill Work
  - Found as: "5 x 20s hills", "4 x 30s hills", "6 x 1 min hill intervals", "uphill TM sessions"
  - Mapped template: `hill_short`, `hill_long`, `uphill_tm_z2`
  - Construction: short power hills (20–45s) or longer 3–8 min uphill threshold repeats.

- Track / Speed Endurance
  - Found as: "800/400/200 sets", "10 x 800", "mile repeats", "repeat mile 1-mile blocks"
  - Mapped template: `track_mixed`, `repeat_distances`, `repeat_mile`
  - Construction: distance-based intervals with specific recovery.

- Cross-training / Uphill Treadmill
  - Found as: "x-train", "uphill TM 75–105 min", "bike sessions"
  - Mapped template: `xtrain`, `uphill_tm_z2`
  - Construction: long Z2 sessions for aerobic stimulus without impact; can include short hard blocks.

- Strength / Mountain Legs
  - Found as: "Mountain Legs", "strength routine", "core snack"
  - Mapped template: `strength`
  - Construction: short gym/bodyweight routines (2x10 squats, back extensions, step-ups).

## Gaps / Variants noticed
- Many plan entries use distance-based reps (e.g., 3 x 1 mile, 6 x 500 m) — covered by `repeat_distances` and `repeat_mile` templates, but mapping distance → ZWO needs explicit handling when exporting.
- Uphill treadmill params (grade, duration) appear frequently; `uphill_tm_z2` covers generic cases but plan-specific durations (75–105 min) are often longer than the example in the library.
- Some sets use nested set structures (sets of intervals with rest between sets). `vo2_short` used a `Set` structure in the library; ZWO export logic handles `Set` as IntervalsT currently.

## Recommendation / Next work items
- Finalize enrichment texts (purpose/effects) for any remaining small variants.
- Improve ZWO export for distance-based intervals (map `distance` to `OnDuration` via a pace estimate, or include a distance attribute in ZWO if supported). Current exporter warns on missing fields.
- Add batch export: create an `events_bulk_all_templates.json` generator that wraps selected templates into the `file_contents` payload suitable for `POST /events/bulk`.


Generated on: 2025-12-05

File: `workout_library_enriched.json` is the canonical merged/enriched library currently used by the viewer.
