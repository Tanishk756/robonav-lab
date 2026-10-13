# File audit - RoboNav Lab v1.3

Reviewed 2026-10-13. All 31 project files inspected; Git internals and ignored bytecode caches excluded.

The previous missing-options defect remains covered by real markup/engine catalog parity tests and native browser checks. This release adds mapping and local navigation without claiming localization, general crowd prediction or hardware readiness.

| File | Review result |
| --- | --- |
| `.github/workflows/static.yml` | Syntax checks, all 43 tests, 120 static missions and 12 navigation missions gate Pages deployment. |
| `.gitignore` | Preserves dependency/secret exclusions and ignores optional Python bytecode caches. |
| `.nojekyll` | Preserved static-host marker. |
| `CHANGELOG.md` | Added v1.3 mapping, DWA, grid-cart, exact-geometry and worker release notes. |
| `LICENSE` | MIT terms and attribution preserved unchanged. |
| `README.md` | Rewritten for v1.3 behavior, controls, configuration schema, metrics, evidence and limits. |
| `START-HERE.txt` | Updated six runtime files and sensor/DWA/cart startup experiment. |
| `app.js` | Navigation controls, observed rendering, diagnostics, CSVs, version-three settings and safe experiment worker handling. |
| `benchmark-navigation.cjs` | Separate 12-case known/sensor/static/dynamic A*+DWA matrix. |
| `benchmark.cjs` | Eight environments x five planners x three controllers; expanded physical/navigation metrics. |
| `core.js` | Observed-map selection, exact edges, curved guards, DWA, bounded recovery, state reasons and metrics. |
| `docs/DESIGN.md` | Updated module boundaries, map separation, worker scope and cooperative-cart assumptions. |
| `docs/FILE-AUDIT.md` | Current file-by-file review record. |
| `docs/IMPLEMENTATION-PLAN.md` | Separates delivered release from noise/prediction, localization, larger maps and ROS future work. |
| `docs/PORTFOLIO.md` | Updated delivered mapping/control capabilities and demonstration. |
| `docs/VALIDATION.md` | 43 tests, 120+12 missions, real browser evidence and explicit limitations. |
| `docs/browser-check.txt` | Current real Edge worker/sensor control smoke evidence. |
| `docs/browser-mobile.png` | Captured mobile viewport and inspected. |
| `docs/browser-smoke.png` | Captured desktop observed-map/DWA/cart view and inspected. |
| `docs/navigation-results.csv` | 12/12 sensor/dynamic benchmark arrivals. |
| `docs/planner-results.csv` | Matching 120-row current static benchmark snapshot. |
| `docs/test-output.txt` | Captured final 43-test passing output. |
| `index.html` | Five planners, eight environments, three controllers, navigation policies, layer controls, v1.3 badge and eight-column controller results. |
| `navigation-worker.js` | Uses the same engine for off-thread experiment comparisons. |
| `navigation.js` | Scan-only log odds, free-space stale clearing, deterministic yielding grid carts and acceleration-window velocity rollouts. |
| `sample-results.csv` | 120 passing static benchmark rows, byte-identical to documentation copy. |
| `style.css` | Responsive styling retained; actual desktop/mobile rendering inspected. |
| `tests/browser_smoke.py` | Reproducible optional Edge/Chromium CDP checks for real native selectors, workers, responsive viewport and new controls; supports direct-file mode. |
| `tests/core.test.cjs` | Original engine and global planner regressions retained and passed. |
| `tests/navigation.test.cjs` | Scan isolation, stale clearing, exact geometry, DWA limits including speed reductions, cart behavior, sensor missions and bounded failure coverage. |
| `tests/ui.test.cjs` | Catalog parity, version-three settings, three-controller results, async/stale worker responses and worker-error fallback. |

Release evidence: 43 passing tests, 120/120 static benchmark arrivals, 12/12 sensor/dynamic arrivals, syntax and whitespace checks, linked local documentation and actual Edge HTTP/offline integration with desktop/mobile rendering. Remaining limitations are documented in VALIDATION.md and IMPLEMENTATION-PLAN.md.
