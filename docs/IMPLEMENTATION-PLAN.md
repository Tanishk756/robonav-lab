# RoboNav Lab implementation plan

## Current baseline and this change

The application is an offline Canvas simulator with an independent CommonJS/browser engine. It has a fixed 32 x 24 grid (1 m cells), five planners across eight environments, circular-footprint collision checking, differential-drive integration, waypoint and guarded pursuit control, ideal LiDAR, map editing, imports/exports, and deterministic mission comparisons. There is no sensor-derived map, localization estimator, velocity-space local planner, or robotics middleware connection.

Inflation now displays continuous amber halos around all occupied cells, including boundary walls and newly painted obstacles. A filled, dashed teal ring displays the robot safety envelope. Both follow the existing layer toggle. Robot configuration reports the effective radius explicitly.

The physical radius is `r`, the extra safety margin is `m`, and obstacle configuration-space inflation is `r + m`. The robot ring also has radius `r + m`. These are two views of the same constraint: do not add both again during collision checking. LiDAR still observes physical walls. Existing map JSON retains `robot.radius` and `robot.margin`, so no migration is needed. Hard clearance and the graded proximity costmap are implemented as separate derived layers.

## 1. Clearance geometry and regression coverage — first priority

Work in core.js, app.js, and tests. Replace sampled straight-edge clearance with exact segment-to-axis-aligned-rectangle distance; define whether tangency counts as collision and use one numerical tolerance. Review the controller motion guard separately: curved swept paths need their own conservative subdivision bound, not just a straight chord. Add a nearest-obstacle distance query shared by diagnostics and later costmap work. Keep physical occupancy immutable while building derived layers.

Acceptance: tests cover tangency, rounded obstacle corners, boundaries, narrow corridors, high curvature, edited obstacles, invalid endpoints, and no double inflation. Every accepted route edge satisfies the chosen continuous clearance rule. UI tests verify layer toggle and effective-radius updates; browser checks cover default/minimum/maximum radius, zero margin, overlapping halos, snapshots, and imported settings.

## 2. Graded inflation costmap — recommended next feature

Implemented in v1.2: independent soft-band, weight, and decay controls; exact cell-centre distance to physical occupied rectangles; endpoint-averaged weighted edges; purple layer; separate length/cost and build/search metrics; versioned settings and CSV fields. Regression tests verify wider-route preference, equal A*/Dijkstra weighted optima, zero-weight baseline equivalence, unchanged hard occupancy/LiDAR, rebuilding after edits, and settings round trips. A pre-existing one-sided tangency bug was also corrected. Straight-edge checking remains conservatively sampled; the exact swept-geometry work in stage 1 is still outstanding. Desktop Edge smoke verification is complete; cross-browser, interactive mobile and download/file-picker QA remain outstanding.

Introduce a separate derived costmap with physical occupancy, lethal footprint exclusion, and a soft proximity band. Retain the current safety margin as the hard constraint; add independent soft-band distance and decay/weight parameters. Compute distance to occupied rectangles or a documented conservative approximation, then map distance outside the hard envelope to a decaying nonnegative penalty. Show hard and soft layers with distinct colors and a legend.

Update A*/Dijkstra edge costs consistently, for example `edgeLength * (1 + weight * averageEndpointPenalty)`, while retaining hard segment validation. Keep the geometric heuristic admissible because traversal cost cannot fall below distance. Separate path length from weighted path cost in UI and CSV. Rebuild layers on map/geometry changes rather than every frame. Version exported settings and default missing fields on legacy import.

Acceptance: A* and Dijkstra return equal optimal weighted costs on deterministic fixtures; the robot prefers a wider route when weight rises; zero weight reproduces baseline planning; soft-band changes do not silently alter physical collision radius. Benchmark costmap construction separately from search.

## 3. Sensor-derived local mapping

Keep ground-truth world occupancy separate from the robot's estimated occupancy. Feed LiDAR readings through free-space ray tracing and occupied endpoints into a log-odds grid. Add configurable range noise, missed returns, update rate, and deterministic seed. Define unknown-space policy explicitly. Render world, observed map, local costmap, and scan independently. Preserve the fully known map mode for teaching comparisons.

Acceptance: an unseen wall only enters the estimated map after observation; free rays clear stale observations under a documented decay policy; noise is reproducible; sensor mapping never reads hidden ground-truth cells directly.

## 4. Reactive local planning and recovery

Add a dynamic-window velocity sampler respecting wheel speed and acceleration limits. Roll out differential-drive trajectories against the local costmap; score progress, heading, obstacle clearance, and speed. Start with a conservative stop policy when no safe command exists. Detect stalls, debounce global replanning, and introduce explicit navigating, replanning, recovering, arrived, and failed states. Add bounded recovery attempts with visible reasons.

Acceptance: deterministic moving-obstacle and blocked-route scenarios stop or reroute without collision; unreachable goals terminate with a reason; acceleration limits hold at every step. Compare against existing controllers using completion rate, minimum clearance, elapsed simulation time, distance, replans, and stalls.

## 5. Localization and realistic odometry

Separate true pose, encoder-derived odometry, and estimated pose. Add seeded encoder noise and wheel slip, then an EKF using a clearly specified measurement source before attempting particle-filter localization. State the screen-to-world frame conversion explicitly. Render pose uncertainty and export both estimated and true trajectories.

Acceptance: zero-noise odometry matches ground truth; noise introduces reproducible drift; measurement updates reduce error on validated fixtures; planner/controller use estimated pose in estimation mode.

## 6. Resolution, footprints, and larger maps

Replace fixed canvas dimensions, 30 pixels per metre, and fixed import dimensions with world/grid/view transforms. Store metres per cell and map origin. Add pan/zoom and adaptive rendering. Only then add polygonal footprints and orientation-aware planning such as Hybrid A*: a noncircular robot cannot be modeled correctly by an orientation-independent centre-cell grid alone.

Acceptance: the same physical scene behaves consistently at multiple resolutions; import/export round trips preserve units; rotated rectangular robots cannot pass invalid openings. Profile large-map search and move expensive planning into a worker if measurements justify it.

## 7. Experiments, packaging, and optional ROS bridge

Expand benchmark fixtures across corridor width, radius, margin, clutter density, speed, controller, and random seed. Record settings, code revision, success/failure reason, minimum clearance, tracking error, search cost, and execution time. Report distributions across seeds and keep machine-dependent timing separate from deterministic outcomes. Add browser automation for editing, imports, inflation rendering, keyboard controls, and exports; retain dependency-free runtime delivery.

An optional ROS 2 adapter should follow stable world frames and configurable resolution. Define a transport boundary for occupancy grids, laser scans, odometry, paths, and velocity commands. Keep simulation mode usable without ROS. Validate timestamps, units, frame IDs, and disconnect-to-stop behavior in simulation before any hardware work.

## Delivery sequence

1. Review inflation visually, then finish clearance geometry and regression fixtures.
2. Maintain the implemented graded costmap, five planners and eight environments with regression coverage.
3. Deliver sensor mapping, followed by reactive local planning and recovery.
4. Add pose estimation, then resolution/footprint generalization.
5. Extend reproducible evaluation throughout; consider ROS only after these contracts stabilize.

Each stage should include a small reproducible demo, documented assumptions, regression results, and exported example settings. Effort estimates should follow the first-stage geometry and browser-test review rather than assume a delivery date.
