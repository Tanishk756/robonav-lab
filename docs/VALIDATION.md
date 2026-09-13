# Validation record — 2026-09-13

## Result

13 automated tests passed, 0 failed. Eight default-speed benchmark combinations reached the goal. Four scenarios also passed at both 0.4 and 3.0 m/s, in addition to the default 1.6 m/s.

Environment: Node.js 24.19.0, Linux. Application runtime dependencies: none.

## Evidence

Command: `node --test tests/core.test.cjs tests/ui.test.cjs`

The complete captured output is in `test-output.txt`.

Engine checks cover a known optimal route, unreachable and occupied endpoints, forbidden corner cutting, agreement between planners across presets, exact LiDAR wall distance, straight/curved drive integration, mission completion, speed extremes, runtime obstacle replanning, and malformed map rejection.

UI adapter checks cover application initialization, run/pause/reset, simulated animation-frame updates, obstacle insertion, comparisons, export event wiring, help dialog, map editing, preset/planner/speed controls, and invalid imports. They run against a minimal DOM test double with no-op canvas methods. They verify application code paths, not rendering, actual download bytes, layout, or browser compatibility.

Command: `node benchmark.cjs`

Actual output is in `../sample-results.csv`. Both planners report equal optimal grid costs in each environment:

| Scenario | Optimal path (m) | A* expanded cells | Dijkstra expanded cells | Mission result |
|---|---:|---:|---:|---|
| Open floor | 32.041631 | 122 | 646 | Both arrived |
| Warehouse | 36.727922 | 265 | 544 | Both arrived |
| Alternating corridors | 57.455844 | 362 | 504 | Both arrived |
| Seeded clutter | 32.627417 | 124 | 584 | Both arrived |

For the default warehouse/A* run at 1.6 m/s: simulation travel time 37.866667 s, distance driven 36.343108 m, tracking RMSE 0.026894 m. Driven distance can be shorter than the grid polyline because waypoint tolerance permits slight corner rounding and arrival tolerance stops within 0.12 m of the goal centre.

Do not interpret sub-millisecond planner times as universal performance guarantees. Re-run on the target computer and retain the exported map, runtime, and settings with results.

## Not verified

The provided cloud browser rejected access to local server/local-file pages under its access policy. Visual browser QA and actual file-download/import dialogs were therefore not completed. No Windows hardware session or physical robot was available. No claim of cross-browser certification or hardware readiness is made.

## Quick browser acceptance check

Open the extracted `index.html`, confirm the map appears, run/pause/reset a mission, insert an obstacle, compare planners, export/re-import a map, download a CSV and PNG, and resize the browser. The application performs no network requests. Save map changes before closing.
