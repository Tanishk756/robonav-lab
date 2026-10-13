# File audit - RoboNav Lab v1.4

Reviewed 2026-10-13. All 45 source/artifact files reviewed; Git internals, ignored dist/ packages and caches excluded. Navigation engine and its saved 120+12 benchmark snapshots are unchanged from v1.3.

| File | Review result |
| --- | --- |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | Structured reproduction, release/browser and expected/actual behavior fields. |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | Problem, acceptance criteria and alternatives fields. |
| `.github/PULL_REQUEST_TEMPLATE.md` | Focused behavior, validation, UI, schema and attribution checklist. |
| `.github/workflows/static.yml` | PR validation, real browser checks, deterministic packaging, extracted-ZIP test, Pages deployment and post-deploy live verification. |
| `.gitignore` | Generated dist/ release assets and Python caches excluded; existing secret exclusions preserved. |
| `.nojekyll` | Preserved static-host marker. |
| `CHANGELOG.md` | v1.4 sharing, community, packaging and deployment release notes. |
| `CODE_OF_CONDUCT.md` | Community behavior and maintainer enforcement/reporting expectations. |
| `CONTRIBUTING.md` | Setup, checks, contribution expectations and extension links. |
| `LICENSE` | MIT terms and attribution preserved unchanged. |
| `README.md` | Public simulator/download/contribution links, sharing/gallery/report behavior, packaging and honest limits. |
| `RELEASE-CHECKLIST.md` | Local/package/live validation, tags, checksum and release publication requirements. |
| `SECURITY.md` | Private GitHub vulnerability reporting, supported-build policy and untrusted-link scope. |
| `START-HERE.txt` | Seven runtime files, six examples and public/offline sharing instructions. |
| `app.js` | Unified experiment loading, custom-map share URLs, hash loading, manual/clipboard copy, JSON reports and stale-link clearing. |
| `benchmark-navigation.cjs` | Separate 12-case known/sensor/static/dynamic A*+DWA matrix. |
| `benchmark.cjs` | Eight environments x five planners x three controllers; expanded physical/navigation metrics. |
| `core.js` | Observed-map selection, exact edges, curved guards, DWA, bounded recovery, state reasons and metrics. |
| `docs/DESIGN.md` | Share codec, normalizer, CI/package boundaries and retained navigation architecture. |
| `docs/EXTENDING.md` | Planner/controller/environment/gallery contracts and format validation expectations. |
| `docs/FILE-AUDIT.md` | Current complete file-by-file review record. |
| `docs/IMPLEMENTATION-PLAN.md` | Sharing/community release marked delivered; replay, libraries, localization and larger maps remain explicit future work. |
| `docs/PORTFOLIO.md` | Updated public sharing/report demonstration. |
| `docs/RELEASE-1.4.0.md` | Versioned release notes, validation and remaining limitations. |
| `docs/STARTER-ISSUES.md` | Scoped contributor task suggestions with acceptance criteria; no claim of assigned work. |
| `docs/VALIDATION.md` | 49 tests, retained unchanged-engine benchmark snapshots and real/package/live validation scope. |
| `docs/browser-check.txt` | Real Chromium gallery/share/worker checks and fresh shared-page reload evidence. |
| `docs/browser-mobile.png` | Current mobile screenshot, inspected. |
| `docs/browser-smoke.png` | Current desktop screenshot, inspected. |
| `docs/navigation-results.csv` | 12/12 sensor/dynamic benchmark arrivals. |
| `docs/planner-results.csv` | Matching 120-row current static benchmark snapshot. |
| `docs/test-output.txt` | Current captured 49-test passing output. |
| `index.html` | v1.4 gallery, sharing/report controls, keyboard skip link, live feedback and community links. |
| `navigation-worker.js` | Uses the same engine for off-thread experiment comparisons. |
| `navigation.js` | Scan-only log odds, free-space stale clearing, deterministic yielding grid carts and acceleration-window velocity rollouts. |
| `requirements-dev.txt` | Optional bounded websockets development dependency; no runtime package dependency. |
| `sample-results.csv` | 120 passing static benchmark rows, byte-identical to documentation copy. |
| `scripts/package_release.py` | Deterministic tracked-source ZIP/checksum plus seven-asset minimal static site; validated using extracted files. |
| `sharing.js` | Bounded bit-packed share format, validated JSON normalization, app version and six gallery definitions. |
| `style.css` | Gallery/sharing layout and mobile selector positions; actual rendering reviewed. |
| `tests/browser_smoke.py` | Portable Chromium discovery, hosted/package/live targets, gallery/share checks, synchronized fresh-document reload and external CI evidence output. |
| `tests/core.test.cjs` | Original engine and global planner regressions retained and passed. |
| `tests/navigation.test.cjs` | Scan isolation, stale clearing, exact geometry, DWA limits including speed reductions, cart behavior, sensor missions and bounded failure coverage. |
| `tests/sharing.test.cjs` | Compact round trips, custom occupancy, invalid/oversized versions/settings and intended gallery failures. |
| `tests/ui.test.cjs` | Gallery/share/report/startup regressions plus retained navigation/worker/catalog tests. |

Local evidence: 49 passing tests, native gallery and selector checks, worker responsiveness, compact sharing, fresh shared-URL reload and versioned reports. Packaging and live deployment are gated by the release workflow and release checklist. Existing engine benchmark snapshots are labeled as retained evidence. No claim of hardware readiness or exhaustive accessibility/browser certification is made.
