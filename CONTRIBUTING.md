# Contributing to RoboNav Lab

Welcome. Small fixes, reproducible failure scenarios, documentation, accessibility work and algorithms are useful contributions.

## Local setup

Clone the repository and open index.html, or serve it with `python -m http.server 8000`. The runtime has no package installation. Node.js 20+ runs the engine tests; CI uses Node 24.

```
node --test tests/core.test.cjs tests/ui.test.cjs tests/navigation.test.cjs tests/sharing.test.cjs tests/showcase.test.cjs
node benchmark.cjs
node benchmark-navigation.cjs
```

Optional browser tests require Python 3.11+, `python -m pip install -r requirements-dev.txt`, and Edge or Chrome. Set ROBONAV_BROWSER to the executable, then run `python tests/browser_smoke.py`. ROBONAV_FILE_TEST=1 checks offline opening; ROBONAV_BASE_URL targets an already deployed site.

## Changes and pull requests

1. Open an issue describing the problem or proposed behavior; check existing issues first.
2. Create a branch and keep the change focused. Include a minimal reproducible experiment for navigation defects.
3. Use explicit units, bounded operations, input validation and the shared engine. Keep world occupancy separate from observations; never supply hidden world cells to sensor planning.
4. Add meaningful regressions for behavior changes. Do not rely solely on the DOM test double for interface changes; run the actual browser test.
5. Update documentation and changelog when behavior or exported schemas change. Preserve legacy imports or document migrations.
6. Run relevant checks and describe validation and remaining limitations in the PR.

No runtime framework is required. Preserve the UMD/CommonJS boundaries, static relative assets, keyboard access and offline fallback. Do not commit secrets or machine-specific profiles. Contributions are distributed under the project's MIT license; preserve existing attribution.

See [extension guide](docs/EXTENDING.md), [architecture](docs/DESIGN.md), [validation](docs/VALIDATION.md), [roadmap](docs/IMPLEMENTATION-PLAN.md) and [code of conduct](CODE_OF_CONDUCT.md).

## Starter issues

See [starter tasks](docs/STARTER-ISSUES.md) for scoped proposals. These are suggested tasks, not claims that someone is assigned or that implementation is complete.

Cross-browser checks: install requirements-browsers.txt, run python -m playwright install chromium firefox, then set ROBONAV_TEST_BROWSERS=chromium,firefox and run python tests/cross_browser.py. The local edge,chrome,firefox option uses installed Windows executables and the Playwright Firefox build.
