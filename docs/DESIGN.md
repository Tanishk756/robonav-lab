# RoboNav Lab v1.2 design

Maintainer: Tanishk Singhal. Dependency-free offline runtime; engine and DOM adapter remain separate.

1. core.js owns five planner definitions and eight deterministic environment definitions.
2. index.html supplies the selectable options; tests require exact parity with engine catalogs.
3. Physical occupancy feeds LiDAR and circular collision checks unchanged.
4. Hard occupancy expands obstacles by radius + margin. Soft penalties use distance outside that envelope.
5. Five graph searches share safe neighbours and weighted edge reporting. Only A* and Dijkstra guarantee minimum weighted graph cost. BFS minimizes steps. Weighted A* and greedy are approximate.
6. Waypoints or guarded pursuit generate wheel commands; exact constant-command integration advances the circular robot at 1/60 s.
7. app.js renders layers, compares every planner, and exports settings with version 2. Legacy maps use defaults for missing fields.
8. benchmark.cjs derives its 80 mission combinations from the same catalogs.

Default radius 0.24 m, margin 0.12 m, lookahead 0.9 m, soft band 1.5 m, weight 2, decay 2. Configuration changes reset the mission; edits replan. Costmap rebuilding occurs during reset/planning, outside rendering. Search timing excludes preprocessing. UI comparisons remain synchronous on the small fixed grid.

There is no SLAM, local reactive planner, localization noise or ROS bridge. Straight-edge clearance is conservatively sampled, not an exact swept-body solver. Motion guards check sampled predicted poses.

GitHub Pages uses the Actions workflow, gated by tests and benchmarks. No accounts, secrets or external runtime APIs are required. See VALIDATION.md for test scope and IMPLEMENTATION-PLAN.md for remaining work.
