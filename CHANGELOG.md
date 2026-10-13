# Changelog

## 1.6.0 - 2026-10-13

- Added bidirectional Dijkstra, bidirectional BFS, Fringe Search and collision-checked Theta*.
- Added Euclidean and Chebyshev A* variants; eleven selectable choices in total.
- Updated real dropdown, colored overlays, shared experiments, objectives and cost-model-labeled exports.
- Added weighted optimality, seeded maps, any-angle safety and footprint/corner regressions.
- Expanded and regenerated the static benchmark to 264 missions; retained sensor/navigation regression coverage.

## 1.5.1 - 2026-10-13

- Removed promotional materials and related website/documentation links.
- Simplified release packaging to simulator source, documentation and checksums.
- Kept the usability testing protocol with technical documentation.

## 1.5.0 - 2026-10-13

- Added first-visit introduction, automatic guided replanning demo and simple view.
- Added four separate challenge categories, validated fixed-scene outcomes and challenge-preserving share links.
- Added returned-route overlays and synchronized recorded controller trajectory playback.
- Added bounded mission replay with observations, poses, route changes and event markers.
- Added 1200x900 PNG result cards, readable self-contained HTML reports and contextual explanations.
- Added opt-in local-only usage counters with explicit export and opt-out clearing.
- Added actual Edge/Chrome/Firefox download/replay/challenge checks and Chromium/Firefox CI.
- Documented human-participant and physical-device testing follow-ups.


## 1.4.0 - 2026-10-13

- Added compact custom-map experiment links, validated URL loading and clipboard/manual-copy sharing.
- Added a six-example gallery with expected outcomes, including intentional failure cases.
- Added versioned experiment report JSON, keyboard skip link and live sharing feedback.
- Added contributor, conduct, security, extension, issue/PR and release documentation.
- Added deterministic offline ZIP/checksum packaging and a minimal static-site build.
- Added versioned runtime asset URLs to avoid mixing release scripts after updates.
- Added PR browser CI, extracted-package checks and verification of the actual Pages deployment.
- Added sharing round trips, input rejection, UI/gallery/startup regressions and real shared-page reload checks.


## 1.3.0 - 2026-10-13

- Added scan-only log-odds mapping, observed/unknown rendering and optimistic/conservative policies.
- Added acceleration-window DWA control, deterministic moving grid carts, bounded recovery and mission explanations.
- Added physical body clearance, angular travel, peak acceleration and navigation diagnostics to telemetry/exports.
- Replaced sampled straight-edge checks with exact segment/rectangle distance and added curved-step sagitta envelopes.
- Moved planner/controller experiments to a worker with stale-result rejection and an offline fallback.
- Added version-three experiment settings, navigation regressions, 120 static and 12 navigation benchmark missions.
- Added reproducible Edge HTTP/offline integration checks and desktop/mobile screenshots.


## 1.2.0 - 2026-10-13

- Added continuous obstacle inflation and a visible robot safety envelope.
- Added configurable graded costmap with separate length, weighted cost and build timing.
- Added Weighted A*, Greedy best-first and BFS, and four additional environments.
- Fixed missing planner options in the actual HTML dropdown; tested catalog parity and native select behavior.
- Fixed one-sided obstacle tangency and mobile selector placement.
- Added versioned settings, expanded exports, 80-mission benchmarks and updated documentation.
- Added validation gates before GitHub Pages publication.


## 1.1.0 â€” 2026-09-13

- Added Tanishk Singhal's name, project attribution, profile link, author metadata and copyright.
- Added adjustable circular robot radius and clearance margin.
- Added configuration-space occupancy and sampled clearance checks along planner edges.
- Added guarded pure pursuit with lookahead visualisation and a fallback counter.
- Added full-mission controller comparison and CSV export.
- Added robot settings, speed and planner to exported maps; preserved legacy map imports.
- Added regression tests for footprint constraints, controllers and configuration imports.
- Prepared static GitHub Pages publishing with `.nojekyll`.

## 1.0.0 â€” 2026-09-13

Initial release: editable maps, A*/Dijkstra, differential drive, waypoint following, ideal LiDAR, runtime obstacle insertion, metrics and exports.
