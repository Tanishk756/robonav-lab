# RoboNav Lab

### Tanishk Singhal - Robotics & Automation

**v1.4** - An offline mobile robotics workbench connecting global planning, robot geometry, LiDAR mapping and reactive motion control. JavaScript/HTML Canvas, no runtime packages or backend, MIT licensed.

[Source](https://github.com/Tanishk756/robonav-lab) | [Validation](docs/VALIDATION.md) | [Release notes](CHANGELOG.md) | [Roadmap](docs/IMPLEMENTATION-PLAN.md)

## Try it and share

[Open the public simulator](https://tanishk756.github.io/robonav-lab/) | [Download the offline release](https://github.com/Tanishk756/robonav-lab/releases/latest) | [Contribute](CONTRIBUTING.md)

Choose an example from the gallery and press **Load example**. Edit the map or settings, then press **Share experiment link**. The link includes the custom occupancy, endpoints and initial settings in a compact URL fragment; recipients do not need an account. Local file/localhost sessions generate links to the public simulator. Other hosted copies use their current address. Copy the link field if clipboard access is unavailable. Reloading a shared URL restores its experiment; changing a share fragment in an open tab also loads it. Invalid links show an error and leave the current/default scene usable.

The URL fragment contains readable experiment data, not a private access token. Links do not save a running mission, observations or telemetry. Occupancy is bit-packed into 96 bytes; bounded decoding validates the full map and settings. The UI falls back to a JSON download if a future experiment exceeds the link-length limit. JSON map export remains the backup/share format. **Export experiment report** downloads application version, initial settings, mission metrics and available comparisons as JSON; use Save PNG separately for a picture.

| Gallery example | Expected behavior |
| --- | --- |
| First mission | Known-map warehouse baseline; run and compare planners |
| Discover the warehouse | Observe unknown space using LiDAR + DWA |
| Moving cart encounter | Sensor navigation around cooperative grid carts |
| Doorway does not fit | Intentional no-route result; reduce radius plus margin below 0.5 m |
| Prefer wider routes | Strong proximity cost highlights route tradeoffs |
| Unknown is blocked | Intentional no-route result under conservative unknown policy |

## Run

Open **index.html** in Edge, Chrome or Firefox after extracting the entire repository. Keep index.html, style.css, navigation.js, core.js, sharing.js, app.js and navigation-worker.js together. No installation or internet is needed to use it. Node.js 20+ is needed only for development checks.

A static server enables worker-based experiments when local-file workers are restricted. With Python installed, run `python -m http.server 8000` and open `http://localhost:8000`. Direct file opening remains supported through a synchronous comparison fallback. Large fallback comparisons can temporarily pause the page.

## Navigation experiment

1. Choose **Warehouse aisles** and A*.
2. Expand **Robot configuration**, choose **Dynamic window (DWA)** and **LiDAR observed map**.
3. Keep **Explore: assume free** selected. Toggle **Observed map / unknown cells** to see what the robot actually knows.
4. Run a mission. The scan reveals walls, the observed map changes and the route replans as needed.
5. Enable **Moving grid carts** and run again. Pink outlines mark carts; the observed view only marks carts at observed occupied locations.
6. Compare all three controllers, inspect clearance/replanning/recovery metrics, and export your map/settings and results.

Configuration changes reset the mission. **Conservative: block unknown** can immediately make a distant unobserved goal unreachable; it is not an autonomous exploration strategy. The mission explanation panel states why navigation stopped.

## Planners, environments and controllers

| Planner | Objective |
| --- | --- |
| A* | Minimum weighted graph cost using an octile heuristic |
| Dijkstra | Minimum weighted graph cost without a heuristic |
| Weighted A* | Cost + 1.8 times heuristic; no optimality guarantee here |
| Greedy best-first | Prioritizes heuristic distance; approximate |
| Breadth-first | Fewest grid edges, not minimum metres or proximity cost |

All five use an eight-connected graph, prevent diagonal corner cutting and check hard clearance along each edge. Compare planners runs one warm-up and 25 measured searches per planner on a snapshot of the current navigation map.

Eight deterministic environments: Warehouse aisles, Alternating corridors, Seeded clutter (731), Open floor, Office suites, Slalom barriers, Four rooms and Loading dock. The fixed grid is 32 x 24 cells at 1 m per cell.

| Controller | Behavior |
| --- | --- |
| Waypoints | Heading-based waypoint tracking; original baseline |
| Guarded pursuit | Lookahead tracking with unsafe-command fallback |
| Dynamic window (DWA) | Samples 45 velocity pairs per step within linear/angular acceleration windows; scores safe rollouts for target progress, heading, speed and clearance |

DWA limits normal linear acceleration to 1 m/s2 and angular acceleration to 3 rad/s2, with angular speed capped at 2.5 rad/s. Rollouts check current navigation occupancy over 1.2 s plus a speed-dependent stopping-distance allowance. No safe candidate produces an emergency stop, which can override acceleration limits. The other two controllers retain their original instantaneous command model. DWA does not predict future cart motion.

## Mapping and obstacle model

**Fully known world** uses current physical occupancy. **LiDAR observed map** starts unknown and updates only from 72 ideal rays, maximum range 8 m, at 5 Hz. Ground-truth pose is used; this is occupancy mapping, not localization or SLAM.

The mapper records seen cells and bounded log odds. Each scan adds +1.2 for occupied endpoints and -1.5 for observed free cells, clamped to [-4, 4]. Occupancy threshold is 0.5. Hit evidence wins within a scan. Repeated free observations clear stale occupancy; unseen cells do not decay automatically. Unknown cells are either assumed free or blocked, according to the selected policy. The mapper never reads hidden obstacle cells to infer occupancy.

Moving obstacles are deterministic **grid carts**, not continuous pedestrians. Up to two one-cell carts follow free horizontal tracks, moving one cell per simulation second. They reverse at track ends and new walls, and yield when the next cell would touch the robot safety envelope. LiDAR sees their physical occupied cells. Base static occupancy is preserved. These deliberately cooperative discrete obstacles are a controlled educational scenario, not a general moving-crowd model.

## Geometry, costmap and physics

Robot hard clearance is `radius + margin`. Defaults: radius 0.24 m, margin 0.12 m, pursuit/lookahead 0.9 m. Amber obstacle halos and the teal robot safety ring show the same constraint; it is applied once.

Straight-edge validation uses exact segment-to-occupied-rectangle distance, including the map exterior. Tangency counts as collision, with a 1e-9 m conservative edge tolerance. Constant-command curved steps are checked using an enclosing chord envelope expanded by the arc sagitta. The final physical-world guard can stop a command even if the sensor-derived map missed an obstacle; this guard is simulator protection, not an extra observation supplied to the planner.

Soft proximity penalties are independent of hard clearance. Defaults: band 1.5 m, weight 2, exponent 2. At distance d from physical occupied rectangles in the selected navigation map:

`penalty = clamp(1 - (d - clearance) / band, 0, 1) ** exponent`

An edge costs `length * (1 + weight * averageEndpointPenalty)`. Purple cells display soft cost. Zero band or weight restores distance-only cost. A* and Dijkstra optimize weighted graph cost; route length is reported separately. The costmap is built during reset/planning, not rendering.

The circular robot uses exact constant-command differential-drive integration, wheel track 0.42 m, fixed UI timestep 1/60 s. X increases right and Y down; positive heading is clockwise on screen. This is not the ROS world-frame convention.

## States, metrics and exports

Navigation states include idle, navigating, replanning, recovering, paused, unreachable, failed and arrived. Replanning is debounced by at least 0.5 simulation seconds. A stalled local command triggers bounded retry logic; changing-occupancy route failures can wait and retry. Persistent stalls fail with a reason; every mission has a 600 simulation-second limit. Recovery currently waits and replans; it does not reverse or perform a separate exploratory maneuver. Replanning is often brief enough that its state is not visible between display updates.

Live metrics include geometric path length, weighted cost, search/build time, tracking RMSE, distance, observed fraction, minimum physical body clearance, integrated absolute angular motion, peak linear acceleration, replans and recovery attempts. Clearance is distance to physical occupancy minus body radius; it is distinct from the safety margin. Comparisons report status, and CSV exports include diagnostic metrics and failure reasons. A benchmark success rate is computed from arrived rows divided by total rows; it is not a safety guarantee.

**Map export** saves the base environment and all experiment settings with settingsVersion 3; it does not save a mid-mission pose or mapper state. Legacy versions 1/2 load with fully known/static defaults for the new settings. Exported JSON provides a reusable experiment preset. Planner comparisons use the current navigation-map snapshot; controller comparisons restart each controller from the same base scene/settings. Runtime manual edits during a comparison are excluded; configured moving carts are included.

Planner/controller comparisons run in a Web Worker when available. Global replans and per-step local control remain synchronous on the fixed small grid. Stale worker responses are discarded after settings/map changes. The offline fallback is tested.

Controls: Run/Pause/Resume, Reset, Plan route, wall/erase/start/goal editing, Block route ahead, layer toggles, map JSON import/export, CSV exports and PNG snapshot. Space controls transport, R resets, 1-4 selects editing tools outside form fields. Focus the canvas and use arrows/Enter for keyboard editing. Physics pauses during pointer drawing. Edits are kept only in memory until exported.

## Development and validation

```
node --test tests/core.test.cjs tests/ui.test.cjs tests/navigation.test.cjs tests/sharing.test.cjs
node benchmark.cjs
node benchmark-navigation.cjs
```

The regression suite has **49 passing tests**. The standard benchmark covers eight environments x five planners x three controllers: **120 missions**. [sample-results.csv](sample-results.csv) and [planner-results.csv](docs/planner-results.csv) are identical saved outputs. A separate **12-mission** [navigation benchmark](docs/navigation-results.csv) covers three environments, known/sensor maps and static/moving carts with A* + DWA. All saved missions arrived. Timing is machine-dependent.

Optional real-browser integration: `python tests/browser_smoke.py` requires Python, the development-only websockets package and installed Edge; set ROBONAV_BROWSER for another compatible Chromium executable. It verifies actual selectors, worker comparisons with a responsive viewport, sensor/DWA/cart controls, and captures desktop/mobile screenshots. Set ROBONAV_FILE_TEST=1 to test direct offline opening. See [validation](docs/VALIDATION.md) for exact test scope and [file audit](docs/FILE-AUDIT.md).

## Limits and next work

No encoder noise, pose estimation, SLAM localization, motor/slip dynamics, configurable resolution, polygonal footprints, ROS connection or hardware validation. Sensor ranges are ideal. Moving carts yield and move discretely; there is no prediction of independently moving humans. Custom maps and every parameter combination are not exhaustively tested. Long missions retain growing telemetry arrays. The roadmap separates delivered navigation work from localization and map/footprint generalization.

GitHub Pages uses the included Actions workflow. Pull requests run validation without publication. Main runs syntax checks, all tests, both benchmarks, real Chromium browser checks and an extracted-offline-package check before deployment. A separate job checks the actual deployed URL, worker responsiveness and share-link reload. Choose GitHub Actions as the Pages source and verify the **v1.4** badge after updates.

## Community and releases

See [CONTRIBUTING.md](CONTRIBUTING.md), [extension guide](docs/EXTENDING.md), [starter tasks](docs/STARTER-ISSUES.md), [security policy](SECURITY.md), [community conduct](CODE_OF_CONDUCT.md) and [release checklist](RELEASE-CHECKLIST.md). Bug/feature issue forms and a PR template are included. All contribution and runtime code remains MIT licensed.

`python scripts/package_release.py` creates a deterministic, versioned offline ZIP, SHA-256 checksum and minimal static site from tracked source in dist/. Build after staging/committing new files. Zip metadata and UTF-8 text line endings are normalized; reproducibility assumes identical source bytes. Release tags identify the tested source. A generated ZIP is tested before publication. Replays, named browser libraries and cloud accounts are not part of this release.

MIT licensed. Copyright 2026 Tanishk Singhal. [GitHub](https://github.com/Tanishk756) | [Issues](https://github.com/Tanishk756/robonav-lab/issues)
