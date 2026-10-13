# Changelog

## 1.2.0 - 2026-10-13

- Added continuous obstacle inflation and a visible robot safety envelope.
- Added configurable graded costmap with separate length, weighted cost and build timing.
- Added Weighted A*, Greedy best-first and BFS, and four additional environments.
- Fixed missing planner options in the actual HTML dropdown; tested catalog parity and native select behavior.
- Fixed one-sided obstacle tangency and mobile selector placement.
- Added versioned settings, expanded exports, 80-mission benchmarks and updated documentation.
- Added validation gates before GitHub Pages publication.


## 1.1.0 — 2026-09-13

- Added Tanishk Singhal's name, project attribution, profile link, author metadata and copyright.
- Added adjustable circular robot radius and clearance margin.
- Added configuration-space occupancy and sampled clearance checks along planner edges.
- Added guarded pure pursuit with lookahead visualisation and a fallback counter.
- Added full-mission controller comparison and CSV export.
- Added robot settings, speed and planner to exported maps; preserved legacy map imports.
- Added regression tests for footprint constraints, controllers and configuration imports.
- Prepared static GitHub Pages publishing with `.nojekyll`.

## 1.0.0 — 2026-09-13

Initial release: editable maps, A*/Dijkstra, differential drive, waypoint following, ideal LiDAR, runtime obstacle insertion, metrics and exports.
