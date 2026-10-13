# Validation - RoboNav Lab v1.5

Date: 2026-10-13. Runtime: Node.js 24.19.0 on Windows.

## Automated results

**55 tests passed; zero failures.** Captured output: [test-output.txt](test-output.txt).

```
node --test tests/core.test.cjs tests/ui.test.cjs tests/navigation.test.cjs tests/sharing.test.cjs tests/showcase.test.cjs
node benchmark.cjs
node benchmark-navigation.cjs
```

JavaScript syntax and Git diff whitespace checks also pass. GitHub Actions validates pull requests, runs all tests and both benchmarks, checks the real browser interface and extracted offline package, then gates main-branch Pages deployment. A final job checks the deployed URL and share reload.

The static benchmark covers eight environments x five planners x three controllers at 1.6 m/s and default hard/soft settings: **120/120 arrived (retained v1.3 engine snapshot; navigation engine is unchanged in v1.5)**. [sample-results.csv](../sample-results.csv) and [planner-results.csv](planner-results.csv) are identical saved results, including body clearance, angular travel, acceleration and recovery diagnostics.

The navigation benchmark covers Open floor, Warehouse and Four rooms x known/sensor map x static/moving carts, with A* + DWA: **12/12 arrived (retained v1.3 navigation snapshot)**. Results: [navigation-results.csv](navigation-results.csv). This is a deterministic cooperative-cart smoke matrix, not evidence of general crowd avoidance.

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

## Sharing and gallery regressions

All eight maps and five planners round-trip through bounded tokens, including Unicode names, custom cells and edited endpoints. Malformed/oversized encodings, unknown versions, invalid planners/speeds and malformed settings are rejected. Six gallery entries validate; intentional doorway and conservative-unknown examples produce the documented blocked outcomes. UI tests check report version, share startup, invalid-link recovery and gallery settings. Actual markup includes catalog parity for the gallery as well as planners/environments/controllers.

## Real browser integration

`python tests/browser_smoke.py` uses installed Edge, a temporary localhost server and CDP. Python's websockets package is an optional development dependency; no Python or packages are needed by the application itself. ROBONAV_BROWSER can select another compatible executable.

Verified five planners, eight environments, three controllers, all 40 native planner/environment selections, asynchronous planner/controller comparisons with viewport frames continuing, sensor/DWA/moving-cart controls with observed-map rendering, all six gallery examples and share encoding. A shared URL is navigated and explicitly reloaded into a fresh document; restored settings are asserted. Direct file opening was separately checked with ROBONAV_FILE_TEST=1. Desktop and mobile screenshots were captured and inspected. ROBONAV_BASE_URL targets a live deployment and ROBONAV_SOURCE_ROOT targets extracted release files; ROBONAV_BROWSER_OUTPUT keeps CI evidence outside tracked source.

Evidence: [browser-check.txt](browser-check.txt), [desktop](browser-smoke.png), [mobile](browser-mobile.png). Native downloads/file-dialog prompts and all browsers/devices are not exhaustively covered.

## Limits

Ground-truth pose and ideal scans remain assumptions. The observation mapper has no automatic unseen-cell time decay; visible free evidence clears stale occupancy. Unknown conservative navigation is not autonomous exploration. Moving grid carts are discrete and cooperative; they do not model independently moving people. DWA checks current estimated occupancy without future cart prediction. The final physical-world guard can stop commands based on simulator truth, separately from sensor-based planning.

Straight-segment geometry is exact to the documented tolerance; curved motion uses a conservative sagitta-expanded chord envelope. This is not a formal safety certificate or hardware validation. Emergency stops may exceed normal DWA acceleration limits; original controllers have instantaneous command changes. Recovery waits/replans, and does not back up. Every mission has a 600 s simulation limit.

Global replanning and DWA still run synchronously on the fixed small grid. Long experiments run in a worker when available; direct-file restrictions can select a blocking fallback. Results are finite deterministic scenario tests, not exhaustive custom-map or parameter guarantees. Timing is hardware-dependent. Long-running trajectory arrays grow in memory.

## Packaging and public deployment

scripts/package_release.py packages tracked source into dist/robonav-lab-1.5.0.zip, writes SHA256SUMS.txt and stages a minimal static site. ZIP timestamps and text line endings are normalized. Local validation checks reproducible hashes and opens the extracted offline page in an actual browser. CI repeats the extracted-package check. The actual public URL is verified after deployment, rather than inferring success from git push.

A release is considered published only after Actions and live verification succeed. The versioned release contains the offline ZIP and checksum; see RELEASE-CHECKLIST.md.

## Interactive experience validation

Guided demo regression verifies automatic obstacle insertion, route comparisons, pause and replay capture. Challenge regressions complete all four categories and reject changed scenes or invalid run contexts. Share tokens preserve a challenge ID. Recorder tests verify live-state isolation, observed snapshots, terminal events and the 6000-frame bound. Counter tests verify default-off, bounded local storage and opt-out clearing. Planner paths and controller traces are the actual engine outputs.

Actual Edge, Chrome and Firefox checks passed on Windows: guided mission, replay/live isolation, native PNG and HTML downloads, challenge share reload, simple view and desktop/emulated-mobile rendering. Evidence: [cross-browser-results.json](cross-browser-results.json), [Firefox desktop](firefox-desktop.png). CI additionally runs Playwright Chromium and Firefox. Physical phones and first-time human studies have not been executed; [the protocol](USER-TESTING.md) records that limitation explicitly.


Usage counters are optional local data, not public analytics or measured reach. Local challenge results are not anti-cheat credentials. Replay stores bounded classified observations/poses rather than a resumable world or an externally executable program. Main replay records dynamic occupancy; small comparison canvases show trajectories over the base static scene.
