# Validation - RoboNav Lab v1.2

Date: 2026-10-13. Runtime: Node.js 24.19.0 on Windows.

## Automated results

30 tests passed; zero failures. Captured output: [test-output.txt](test-output.txt).

```
node --check core.js
node --check app.js
node --test tests/core.test.cjs tests/ui.test.cjs
node benchmark.cjs
```

The benchmark runs eight maps x five planners x two controllers at 1.6 m/s, radius 0.24 m, margin 0.12 m, soft band 1.5 m, weight 2 and decay 2. All 80 missions reached the goal. [sample-results.csv](../sample-results.csv) and [planner-results.csv](planner-results.csv) contain identical current measurements; timing depends on hardware and scheduling.

## Coverage

- A*/Dijkstra optimal weighted cost agreement across eight maps; wider-route preference and zero-weight equivalence.
- All five planners: valid endpoints, no corner cutting, sampled edge clearance, reported length/cost consistency, unreachable goals and explicit unknown-planner rejection.
- BFS fewest steps across the compared routes; approximate planners have no claimed optimality guarantee.
- Every new map/planner/controller combination completes with each committed pose checked against the circular clearance footprint.
- Original four-map pursuit matrix covers A*/Dijkstra at 0.4, 1.6 and 3 m/s. The entire parameter range is not exhaustively tested.
- Physical occupancy/LiDAR preservation, decaying proximity costs, edited-map rebuilding, tangency regression, configuration validation and legacy/current imports.
- Real HTML option lists match engine catalogs. The DOM test double now rejects nonexistent select values, modeling native browser behavior.
- UI adapter: editing, transport, comparisons, configuration, exports, malformed imports and new planner settings round trips.

## Actual browser check

Installed Microsoft Edge ran the local page headlessly. Verified five native planner options, eight environments, all 40 planner/environment selections, five comparison rows, layer toggling and run/pause. The rendered desktop page was inspected. Evidence: [browser-check.txt](browser-check.txt), [screenshot](browser-smoke.png).

This smoke check does not certify cross-browser behavior, native popup appearance, file pickers/download prompts, interactive mobile layout or exhaustive visual correctness. The previous missing dropdown options were a markup defect, not a cache issue.

## Limits and manual acceptance

No hardware validation or formal continuous collision guarantee is claimed. Straight edges and predicted motion use conservative/sample-based checks. Custom maps and every continuous configuration are not exhaustive. Search time excludes costmap construction, displayed separately. Long missions retain growing telemetry arrays. Comparisons execute synchronously on the fixed small grid.

For manual acceptance, open index.html and verify v1.2, open the native dropdown and see all five choices, resize to mobile, expand robot settings, run both controllers, alter inflation, edit walls, import/export settings, and download CSV/PNG. For GitHub Pages select Actions as the source; the workflow checks syntax, tests and benchmark success before deployment.
