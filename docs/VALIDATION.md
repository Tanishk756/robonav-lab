# Validation — RoboNav Lab v1.1

Date: 2026-09-13. Runtime: Node.js 24.19.0 on Linux.

## Automated results

**20 tests passed; zero failures.** Captured output: [test-output.txt](test-output.txt).

```sh
node --test tests/core.test.cjs tests/ui.test.cjs
node benchmark.cjs
```

The benchmark contains 16 combinations: four maps × two planners × two controllers, at 1.6 m/s, radius 0.24 m and margin 0.12 m. **All 16 reached the goal.** Actual measurements are in [sample-results.csv](../sample-results.csv).

The pursuit test separately covers four maps × two planners × three speed settings (0.4, 1.6 and 3.0 m/s). Every mission reached its goal; each committed step was checked against the configured circular clearance footprint.

## Warehouse example

Same A* path, 1.6 m/s cruise setting, 0.24 m radius, 0.12 m margin:

| Controller | Simulation time (s) | Driven distance (m) | Tracking RMSE (m) |
|---|---:|---:|---:|
| Waypoints | 37.866667 | 36.343108 | 0.026894 |
| Guarded pursuit | 29.516667 | 35.187207 | 0.074167 |

This shows a time/error trade-off in one idealised scenario. It is not evidence that pursuit is universally superior. Corner rounding and arrival tolerance can make driven distance shorter than the grid path length.

## Coverage

- Known optimal grid route, unreachable/occupied endpoints, corner-cut prohibition and planner cost agreement.
- LiDAR wall intersection and exact straight/curved differential-drive integration.
- Default waypoint missions and speed extrema.
- Footprint inflation rejects a narrow passage for a larger robot without changing physical occupancy.
- Graph transitions pass conservative segment-clearance checks.
- Pursuit completion matrix, dynamic insertion/replanning and deterministic complete-mission comparisons.
- Invalid robot configuration rejection.
- UI-adapter initialization, run/pause/reset, editing, configuration changes, comparisons, exports, malformed imports and legacy/current map imports.

## Validation limits

UI-adapter tests use a minimal DOM double and no-op canvas. They test code paths, not rendered layout, actual browser downloads or file pickers. Visual browser QA was blocked by the provided browser's local-file access policy. No claim of cross-browser certification, Windows execution testing, formal safety guarantees or hardware validation is made.

Custom maps and the full continuous configuration range are not exhaustively tested. Conservative guards can stop a mission that has a valid graph route. Sub-millisecond timing differences depend on runtime warm-up, CPU scheduling and timer resolution. Planner timing excludes inflation preprocessing.

## Browser acceptance checklist

Open index.html, verify branding and map, run both controllers, change footprint size, insert an obstacle, compare planners/controllers, export and re-import map/settings, download CSV/PNG, and resize the browser. All functions operate without an external API.
