# RoboNav Lab v1.1 design

Maintainer: Tanishk Singhal.

The existing offline simulator is extended without introducing runtime dependencies. The robotics engine remains independent of the browser adapter.

1. Physical occupancy is retained for sensors and footprint collision checks.
2. Configuration-space occupancy is derived from robot radius plus margin.
3. A*/Dijkstra searches valid cell centres and checks clearance on candidate edges.
4. A waypoint controller or guarded pursuit controller produces wheel commands.
5. Exact constant-command integration advances the circular robot at 1/60 s.
6. Metrics and benchmark runs use the same engine. UI exports map and settings together.

Configuration changes reset the mission; map edits trigger replanning. Invalid configuration and maps produce explicit errors. Complete-mission comparisons are bounded to 600 simulation seconds. The default robot radius is 0.24 m with 0.12 m margin and 0.9 m pursuit lookahead.

Publication uses ordinary static GitHub Pages hosting from main/root. No account data, external APIs or secrets are part of the application.
