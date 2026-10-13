# File audit - RoboNav Lab v1.5

Reviewed 2026-10-13. 68 tracked/new source and media files inspected; ignored dist/ tools, browser profiles and generated packages excluded.

| File | Review result |
| --- | --- |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | Structured reproduction, release/browser and expected/actual behavior fields. |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | Problem, acceptance criteria and alternatives fields. |
| `.github/PULL_REQUEST_TEMPLATE.md` | Focused behavior, validation, UI, schema and attribution checklist. |
| `.github/workflows/static.yml` | Pinned Ubuntu/current maintained actions, 55 regressions, Chromium/Firefox acceptance, package and live gates. |
| `.gitignore` | Generated dist/ release assets and Python caches excluded; existing secret exclusions preserved. |
| `.nojekyll` | Preserved static-host marker. |
| `CHANGELOG.md` | v1.5 experience, media, cross-browser and local-counter release notes. |
| `CODE_OF_CONDUCT.md` | Community behavior and maintainer enforcement/reporting expectations. |
| `CONTRIBUTING.md` | Five Node test files and optional cross-browser/video development instructions. |
| `LICENSE` | MIT terms and attribution preserved unchanged. |
| `README.md` | v1.5 guided/challenge/replay instructions, preview GIF, launch links and honest analytics/browser limitations. |
| `RELEASE-CHECKLIST.md` | Local/package/live validation, tags, checksum and release publication requirements. |
| `SECURITY.md` | Local challenge/replay/report/counter trust boundaries and retained private reporting policy. |
| `START-HERE.txt` | Eight runtime assets and the guided-demo/challenge/replay/export workflow. |
| `app.js` | Guided steps, fixed-scene challenge contexts, replay isolation, overlay/comparison playback, PNG/HTML exports and local counters. |
| `benchmark-navigation.cjs` | Separate 12-case known/sensor/static/dynamic A*+DWA matrix. |
| `benchmark.cjs` | Eight environments x five planners x three controllers; expanded physical/navigation metrics. |
| `core.js` | Existing physics retained; comparison results now include actual planner paths and bounded telemetry trajectories. |
| `docs/DESIGN.md` | Showcase/replay/counter boundaries and actual comparison trajectory semantics. |
| `docs/EXTENDING.md` | Planner/controller/environment/gallery contracts and format validation expectations. |
| `docs/FILE-AUDIT.md` | Complete v1.5 source/media review record. |
| `docs/IMPLEMENTATION-PLAN.md` | Delivered experience separated from unexecuted human/mobile checks and future navigation work. |
| `docs/PORTFOLIO.md` | Updated demonstration opportunities and limits. |
| `docs/RELEASE-1.4.0.md` | Versioned release notes, validation and remaining limitations. |
| `docs/RELEASE-1.5.0.md` | Release behavior, evidence and remaining physical/human verification. |
| `docs/STARTER-ISSUES.md` | Scoped contributor task suggestions with acceptance criteria; no claim of assigned work. |
| `docs/VALIDATION.md` | 55 tests, three real browser engines, native exports, bounded replay and media validation scope. |
| `docs/browser-check.txt` | Real Chromium guided/replay/report/share/worker evidence. |
| `docs/browser-mobile.png` | Current emulated mobile rendering. |
| `docs/browser-smoke.png` | Current desktop rendering. |
| `docs/cross-browser-results.json` | Actual Edge/Chrome/Firefox versions and pass scope; human/physical-mobile flags false. |
| `docs/firefox-desktop.png` | Actual Firefox rendering evidence. |
| `docs/navigation-results.csv` | 12/12 sensor/dynamic benchmark arrivals. |
| `docs/planner-results.csv` | Matching 120-row current static benchmark snapshot. |
| `docs/test-output.txt` | Current 55-test passing output. |
| `index.html` | Intro/demo/simple view, challenge catalog, replay/event controls, comparison canvases, report exports, feedback and social metadata. |
| `launch/COMMUNITY-POSTS.md` | Original launch material; checked scope, captions/encoding or platform-specific guidance; not automatically posted. |
| `launch/DEV-ARTICLE.md` | Original launch material; checked scope, captions/encoding or platform-specific guidance; not automatically posted. |
| `launch/LINKEDIN.md` | Original launch material; checked scope, captions/encoding or platform-specific guidance; not automatically posted. |
| `launch/MEASUREMENT.md` | Original launch material; checked scope, captions/encoding or platform-specific guidance; not automatically posted. |
| `launch/README.md` | Original launch material; checked scope, captions/encoding or platform-specific guidance; not automatically posted. |
| `launch/USER-TESTING.md` | Original launch material; checked scope, captions/encoding or platform-specific guidance; not automatically posted. |
| `launch/costs.mp4` | Original launch material; checked scope, captions/encoding or platform-specific guidance; not automatically posted. |
| `launch/costs.srt` | Original launch material; checked scope, captions/encoding or platform-specific guidance; not automatically posted. |
| `launch/demo.gif` | Original launch material; checked scope, captions/encoding or platform-specific guidance; not automatically posted. |
| `launch/fit.mp4` | Original launch material; checked scope, captions/encoding or platform-specific guidance; not automatically posted. |
| `launch/fit.srt` | Original launch material; checked scope, captions/encoding or platform-specific guidance; not automatically posted. |
| `launch/media-validation.json` | Original launch material; checked scope, captions/encoding or platform-specific guidance; not automatically posted. |
| `launch/poster.png` | Original launch material; checked scope, captions/encoding or platform-specific guidance; not automatically posted. |
| `launch/replan.mp4` | Original launch material; checked scope, captions/encoding or platform-specific guidance; not automatically posted. |
| `launch/replan.srt` | Original launch material; checked scope, captions/encoding or platform-specific guidance; not automatically posted. |
| `navigation-worker.js` | Uses the same engine for off-thread experiments, with release-versioned import URLs. |
| `navigation.js` | Scan-only log odds, free-space stale clearing, deterministic yielding grid carts and acceleration-window velocity rollouts. |
| `requirements-browsers.txt` | Pinned optional Playwright cross-browser dependency; no runtime effect. |
| `requirements-dev.txt` | Optional bounded websockets development dependency; no runtime package dependency. |
| `sample-results.csv` | 120 passing static benchmark rows, byte-identical to documentation copy. |
| `scripts/create_launch_assets.py` | Reproducible captioned engine demos and MP4/GIF generation using development tools only. |
| `scripts/package_release.py` | Eight runtime assets, hosted media and deterministic offline/launch-kit ZIPs with SHA-256 checksums. |
| `sharing.js` | v1.5 and optional validated challenge IDs in backward-compatible share payloads. |
| `showcase.js` | Separate challenge objectives, bounded immutable replay scenes, canvas layouts and opt-in counter implementation. |
| `style.css` | Responsive launch experience, sticky guide captions, simple controls and side-by-side comparisons. |
| `tests/browser_smoke.py` | Actual guided/demo/export/comparison checks and live/package target support. |
| `tests/core.test.cjs` | Original engine and global planner regressions retained and passed. |
| `tests/cross_browser.py` | Native Edge/Chrome/Firefox exports, replay and challenge/share checks plus emulated viewports. |
| `tests/navigation.test.cjs` | Scan isolation, stale clearing, exact geometry, DWA limits including speed reductions, cart behavior, sensor missions and bounded failure coverage. |
| `tests/sharing.test.cjs` | Compact round trips, custom occupancy, invalid/oversized versions/settings and intended gallery failures. |
| `tests/showcase.test.cjs` | All challenge categories, invalid contexts, replay bounds/isolation and usage opt-out. |
| `tests/ui.test.cjs` | Guided steps, shareable challenges, replay isolation and export/counter wiring regressions. |

55 regressions pass. Real Edge/Chrome/Firefox acceptance, replay isolation, native PNG/HTML downloads and media metadata are recorded. Existing 120+12 navigation snapshots remain labeled historical physics evidence. Physical mobile and first-time participant checks remain honest external follow-up tasks, and no social posts were sent.
