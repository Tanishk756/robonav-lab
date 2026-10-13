# Validation - RoboNav Lab v1.3

Date: 2026-10-13. Runtime: Node.js 24.19.0 on Windows.

## Automated results

**43 tests passed; zero failures.** Captured output: [test-output.txt](test-output.txt).

```
node --test tests/core.test.cjs tests/ui.test.cjs tests/navigation.test.cjs
node benchmark.cjs
node benchmark-navigation.cjs
```

JavaScript syntax and Git diff whitespace checks also pass. GitHub Actions runs syntax checks, these tests and both benchmark commands before Pages deployment.

The static benchmark covers eight environments x five planners x three controllers at 1.6 m/s and default hard/soft settings: **120/120 arrived**. [sample-results.csv](../sample-results.csv) and [planner-results.csv](planner-results.csv) are identical saved results, including body clearance, angular travel, acceleration and recovery diagnostics.

The navigation benchmark covers Open floor, Warehouse and Four rooms x known/sensor map x static/moving carts, with A* + DWA: **12/12 arrived**. Results: [navigation-results.csv](navigation-results.csv). This is a deterministic cooperative-cart smoke matrix, not evidence of general crowd avoidance.

## Regression coverage

- Optimal A*/Dijkstra weighted cost agreement, approximate planner route validity, BFS edge count, exact clearance, corners, unreachable endpoints and malformed configuration.
- All engine planner/environment combinations; original speed-extreme and pursuit matrices; default new-environment/controller mission completion.
- Scan-only occupancy: unseen obstacles stay unknown, identical scans produce identical estimates despite different hidden maps, observed walls appear and free rays clear stale occupancy.
- Optimistic/conservative unknown policies and clear unreachable-goal explanations.
- DWA normal acceleration-window limits, rejected unsafe rollouts, physical collision-free sensor missions and minimum body clearance at or above the margin in the tested matrix.
- Deterministic grid carts preserve base occupancy and yield rather than step into the robot envelope.
- Exact line-to-rectangle tangency and small-gap/corner cases; conservative curved-step chord envelopes are used by controller and final guards.
- Bounded intentionally stalled recovery and legacy navigation defaults.
- Actual HTML catalogs match all five planners, eight environments and three controllers. Native-style select assignment is modeled by the adapter double.
- Version-three sensor/DWA/cart settings round trips; worker response handling rejects stale results, and worker errors use the same synchronous fallback engine.

## Real browser integration

`python tests/browser_smoke.py` uses installed Edge, a temporary localhost server and CDP. Python's websockets package is an optional development dependency; no Python or packages are needed by the application itself. ROBONAV_BROWSER can select another compatible executable.

Verified five planners, eight environments, three controllers, all 40 native planner/environment selections, asynchronous planner/controller comparisons with viewport frames continuing, and sensor/DWA/moving-cart controls with observed-map rendering. Direct file opening was separately checked with ROBONAV_FILE_TEST=1. Desktop and mobile screenshots were captured and inspected.

Evidence: [browser-check.txt](browser-check.txt), [desktop](browser-smoke.png), [mobile](browser-mobile.png). Native downloads/file-dialog prompts and all browsers/devices are not exhaustively covered.

## Limits

Ground-truth pose and ideal scans remain assumptions. The observation mapper has no automatic unseen-cell time decay; visible free evidence clears stale occupancy. Unknown conservative navigation is not autonomous exploration. Moving grid carts are discrete and cooperative; they do not model independently moving people. DWA checks current estimated occupancy without future cart prediction. The final physical-world guard can stop commands based on simulator truth, separately from sensor-based planning.

Straight-segment geometry is exact to the documented tolerance; curved motion uses a conservative sagitta-expanded chord envelope. This is not a formal safety certificate or hardware validation. Emergency stops may exceed normal DWA acceleration limits; original controllers have instantaneous command changes. Recovery waits/replans, and does not back up. Every mission has a 600 s simulation limit.

Global replanning and DWA still run synchronously on the fixed small grid. Long experiments run in a worker when available; direct-file restrictions can select a blocking fallback. Results are finite deterministic scenario tests, not exhaustive custom-map or parameter guarantees. Timing is hardware-dependent. Long-running trajectory arrays grow in memory.
