# File audit - RoboNav Lab v1.2

Reviewed 2026-10-13. All 24 project files were inspected; Git internal files are excluded.

Root cause: the engine and comparisons contained five planners, but the HTML select had only A* and Dijkstra. A prior text substitution failed to match the markup. The adapter test double accepted arbitrary select values, concealing the mismatch. This was corrected in the markup and the test double, with an explicit catalog-parity regression test and a real Edge check.

| File | Review result |
| --- | --- |
| `.github/workflows/static.yml` | Added Node syntax/test/benchmark gates before the existing Pages deployment. |
| `.gitignore` | Read; existing dependency/log/secret exclusions retained. |
| `.nojekyll` | Verified static-host marker retained. |
| `CHANGELOG.md` | Added v1.2 release notes and dropdown correction. |
| `LICENSE` | Read; preserved MIT terms and attribution unchanged. |
| `README.md` | Updated release, counts, planner guarantees, layers, actual workflow and browser validation scope. |
| `START-HERE.txt` | Replaced stale startup instructions with v1.2/five-planner/eight-environment guidance. |
| `app.js` | Reviewed all controls, five-planner comparisons, import validation and CSV exports; retained. |
| `benchmark.cjs` | Reviewed catalog-driven 80-mission matrix and expanded cost fields; retained and rerun. |
| `core.js` | Reviewed five searches, eight map generators, costmap, clearance, sensing and controller code; retained with passing engine tests. |
| `docs/DESIGN.md` | Updated planner/environment catalogs, hard/soft layers, metrics and Actions deployment. |
| `docs/FILE-AUDIT.md` | This complete file-by-file review record. |
| `docs/IMPLEMENTATION-PLAN.md` | Corrected baseline and costmap status; retained unfinished exact geometry, mapping and localization work. |
| `docs/PORTFOLIO.md` | Updated implemented features and comparison demo; retained honest future-work scope. |
| `docs/VALIDATION.md` | Updated OS/runtime, 30 tests, 80 missions, browser evidence and limitations. |
| `docs/browser-check.txt` | Added real Edge smoke result covering native selects, all combinations and basic controls. |
| `docs/browser-smoke.png` | Added and visually inspected desktop rendering after browser smoke check. |
| `docs/planner-results.csv` | Regenerated identical copy of current sample results. |
| `docs/test-output.txt` | Regenerated actual 30-test passing output. |
| `index.html` | Fixed all five native planner options, v1.2 badge and guide text; confirmed in Edge. |
| `sample-results.csv` | Regenerated all 80 current benchmark rows; all arrived. |
| `style.css` | Reviewed desktop/mobile styles; explicitly positioned both mobile selects. |
| `tests/core.test.cjs` | Reviewed engine coverage, optimal/approximate objectives, route clearance and mission matrices; retained. |
| `tests/ui.test.cjs` | Added real-markup catalog parity test and native-style rejection of absent select values. |

Validation: 30 automated tests passed, all 80 benchmark missions arrived, JavaScript syntax checks and diff whitespace checks passed, local Markdown links resolve, and Edge verified five native options and all 40 planner/environment selections. Cross-browser, interactive mobile and file-dialog behavior are not fully certified.
