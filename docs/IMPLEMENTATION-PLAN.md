# RoboNav Lab implementation status and roadmap

## Delivered through v1.5

- Guided demo, four separate challenge categories, route overlays, synchronized controller playback, bounded recorded replay and PNG/HTML result reports.
- Captioned launch assets, editable channel drafts, social preview metadata and actual Edge/Chrome/Firefox checks.
- Opt-in local counters; first-time human and physical-device protocols remain unexecuted follow-up work.
- Account-free shared experiment URLs, custom-map encoding, six-example gallery and versioned report export.
- Contributor/security/community guides, issue/PR templates, deterministic release packaging, PR browser tests and live deployment checks.
- Five global planners and eight deterministic environments with shared hard/soft costmaps.
- Exact straight-segment/occupied-rectangle clearance and curved-step conservative sagitta bounds.
- LiDAR-derived log-odds occupancy mapping, independent ground-truth/observed views and explicit unknown-space policies.
- Acceleration-window Dynamic Window controller, deterministic yielding grid carts, debounced replanning and bounded wait/replan recovery.
- Mission explanation panel and clearance, angular-motion, acceleration, replanning and recovery metrics.
- Worker-based comparisons with offline fallback, reusable JSON experiment settings and version-three import/export.
- Mapping/control/worker regression tests, 120 static benchmark missions, 12 sensor/dynamic benchmark missions and real Edge HTTP/offline checks.

Known-map navigation remains the baseline. Sensor mode receives scan-derived occupancy, not hidden world cells; the simulator retains a separate final physical guard. This is occupancy mapping with ground-truth pose, not SLAM or localization. Carts are discrete and cooperative, not general pedestrian avoidance.

## 1. Broaden sensing and reactive navigation

Add seeded range noise/dropouts, configurable scan rate, observation-age visualization and explicit time-decay options. Add independently moving obstacle trajectories and prediction; evaluate braking and temporal collisions without cart yielding. Improve recovery with bounded rotation/reverse maneuvers and exploration goals for conservative unknown-space mode. Extend scenario seeds and report completion distributions, not just one deterministic matrix.

Acceptance: repeatable sensor faults, no hidden-map access, bounded recovery and documented safety assumptions. Distinguish emergency overrides from normal acceleration limits. Profile per-step DWA and observed-map rebuilding before expanding candidate count.

## 2. Odometry and localization

Separate true, encoder and estimated poses. Add seeded encoder noise and wheel slip, then an EKF using a specified measurement source. Draw uncertainty and export true/estimated trajectories. Define screen/world frame conversion before middleware work.

Acceptance: zero-noise odometry matches truth; noise produces repeatable drift; measurements improve error on fixtures; navigation uses estimated pose when enabled. This is not delivered yet.

## 3. Resolution, footprints and larger environments

Replace fixed dimensions and 30-pixel-per-metre assumptions with world/grid/view transforms, metres per cell, origin, pan/zoom and adaptive rendering. Then add polygonal robot footprints and orientation-aware planning such as Hybrid A*. Do not approximate all rectangular-robot orientations with a single centre-cell occupancy map.

Acceptance: identical physical scenes behave consistently across resolutions; rotated footprints reject impossible openings; JSON preserves units. Move global replanning/local control into workers if profiling larger scenes warrants it. The current worker covers experiments only.

## 4. Experiment management and integrations

Add named in-browser experiment libraries and multi-seed batch runs; bounded replay is now implemented; JSON exports and compact shared URLs already save reusable initial-scene presets. Add success-rate plots, progress tracking and cancellation for long experiments. Broaden browser automation to file pickers, downloads and more viewports. Keep runtime dependency-free.

An optional ROS 2 adapter follows stable frames, units, timestamps and simulated disconnect-to-stop checks. It is separate future work, not implemented connectivity or hardware readiness.

## Release discipline

Keep all selector catalogs covered by native markup tests. Update README, startup guide, design, validation, changelog, benchmark snapshots and file audit together. Preserve attribution/licensing. Distinguish delivered behavior, test evidence and limits; do not mark the remaining roadmap complete just because a release is finished.
