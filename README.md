# RoboNav Lab

### Tanishk Singhal · Robotics & Automation

An interactive mobile robotics workbench for studying the relationship between **path planning, robot geometry, and motion control**. Change the map, adjust the robot's footprint, compare planners and controllers, and inspect the resulting trajectory and telemetry.

**v1.1** · JavaScript / HTML Canvas · No runtime dependencies · Offline-capable · MIT

[Source code](https://github.com/Tanishk756/robonav-lab) · [Technical validation](docs/VALIDATION.md) · [Release notes](CHANGELOG.md)

## Why this project

A valid path on a grid is only one part of navigation. A physical footprint must fit through the route, and a controller must turn that route into wheel commands. RoboNav Lab makes these layers visible and measurable in a lightweight browser application.

The project focuses on reproducible experiments, explicit assumptions, and failure cases. It is an educational simulator, not a physical-robot deployment.

## Run locally

Download or clone the repository, then open **index.html** in Edge, Chrome, or Firefox. Keep `app.js`, `core.js`, and `style.css` beside it. Extract ZIP downloads before opening the HTML.

```powershell
git clone https://github.com/Tanishk756/robonav-lab.git
cd robonav-lab
```

No installation, API keys, backend, internet connection, Python, Node.js, or GPU is needed to use the app. If local scripts are restricted by your browser policy, use an approved static server. With Python already installed: `python -m http.server 8000`, then open `http://localhost:8000`.

## Capabilities

| Layer | Implementation |
|---|---|
| Environment | Editable 32 × 24 m occupancy grid; four deterministic maps |
| Planning | A* with octile heuristic and Dijkstra; binary min-heap; 8-connected movement |
| Robot geometry | Configurable circular radius and clearance margin; configuration-space occupancy |
| Transition safety | Segment clearance checks between graph nodes; no diagonal corner cutting |
| Control | Heading-based waypoint follower or guarded pure pursuit |
| Motion | Exact differential-drive integration at a fixed 1/60 s timestep |
| Sensing | 72 ideal LiDAR rays, 360° coverage, 8 m maximum range |
| Runtime edits | Insert obstacles during a mission and request a new route |
| Evaluation | Planner comparison, full-mission controller comparison, tracking RMSE |
| Exports | Map + settings JSON, planner/controller/telemetry CSVs, navigation PNG |

## Try these experiments

1. **Search efficiency:** on Warehouse, click **Compare planners**. Compare optimal path cost and expanded cells. Timings are medians of 25 measured searches and vary by machine.
2. **Control trade-off:** click **Compare controllers**. Compare simulation time, driven distance and tracking RMSE under identical settings. A smoother/faster route may have higher path error.
3. **Footprint constraints:** expand **Robot configuration**, increase the robot radius, and inspect the orange excluded cells. A narrow opening can become unreachable.
4. **Online replanning:** run a mission and click **Block route ahead**. The map and route update; LiDAR observes the inserted obstacle.
5. **Failure recovery:** draw a complete wall across the environment. Observe the stopped/no-route state, erase an opening, and plan again.

Configuration changes reset the current mission. Save your map before closing: edits are kept in memory. Exported maps include robot/controller settings, speed and planner; legacy v1.0 maps still import with default settings.

## Controls

- **Run / Pause / Resume:** control execution. **Reset:** return to start without clearing walls.
- **Plan route:** stop and replan from the current robot cell.
- **Wall / Erase:** click or drag. **Start / Goal:** move endpoints while stopped.
- **Robot configuration:** radius 0.15–0.70 m, margin 0–0.30 m, pursuit lookahead 0.4–1.6 m.
- **Layers:** LiDAR, explored nodes, footprint inflation and driven trajectory.
- **Keyboard:** Space runs/pauses, R resets, 1–4 select editing tools outside form controls. Focus the canvas, use arrows to select a cell, and press Enter to edit it.

The outer boundary and mission endpoints are protected from wall painting. Cells touching the current robot plus margin are protected. Physics pauses during pointer drawing and replans after release.

## Technical model

### Coordinates and planning

One cell is one metre. X increases right, Y increases down, and positive heading rotates clockwise on screen. This is a screen convention, not the ROS world-frame convention.

Orthogonal edges cost 1 m; diagonal edges cost √2 m. A* uses:

`h = max(dx, dy) + (√2 − 1) × min(dx, dy)`

Dijkstra uses zero heuristic. Both search the same graph. Optimality refers to this graph, not the continuous-space shortest path. Equal-cost ties can produce different trajectories.

### Footprint and clearance

The planning clearance is `radius + margin`. A cell centre is excluded if that circular footprint intersects an obstacle rectangle. Each candidate graph edge is also sampled at at most 0.05 m intervals with an additional 0.025 m numerical allowance. This is conservative sampled edge validation; it is not an exact general polygonal configuration-space solver.

Inflation applies to planning only. LiDAR continues to see the original physical obstacle map. The displayed circle represents robot radius and its outer ring represents radius plus margin. At small radii, wheel/direction symbols are visual aids rather than a separate collision footprint.

### Differential drive

For wheel linear velocities `vL`, `vR` and wheel track `b = 0.42 m`:

`v = (vR + vL) / 2` and `ω = (vR − vL) / b`.

Each step integrates the exact constant-command circular arc, or its straight-line limit. The time step is fixed at 1/60 s. A slow browser may run slower than wall-clock time rather than taking larger physics steps.

### Controllers

**Waypoints:** bounded proportional heading control; forward velocity reduces near cell-centre waypoints and becomes zero on sharp turns.

**Guarded pure pursuit:** projects the pose onto upcoming path segments, advances a lookahead distance along the path, and commands `ω = 2v sin(α) / L`, where L is the actual distance to the target. Forward speed reduces with curvature and near the goal. Large heading errors trigger rotation before translation. A 0.4 s constant-command forward check rejects unsafe pursuit arcs and temporarily falls back to waypoint heading control. The guard-fallback counter records entries into that fallback mode. A purple marker shows the current lookahead target.

This is a hybrid pursuit controller with conservative checks, not a formal collision-avoidance guarantee. The final clearance guard checks every candidate motion step and stops on a violation.

### Measurements

- **Planning time:** latest search only; configuration-space construction is excluded. Comparison table uses one warm-up and 25 measured searches per algorithm.
- **Planned route:** latest grid path cost. It changes after a replan.
- **Driven distance:** sum of integrated displacement.
- **Tracking RMSE:** shortest distance to the current path polyline at every physics step. Samples before a replan remain in the mission total.
- **Controller comparison:** independent runs from start, with a 600 simulation-second limit and no runtime insertions. It does not alter the live mission.
- **LiDAR:** exact grid-boundary DDA raycasting. Nearest distance is measured from sensor centre, not robot surface.

Telemetry is sampled approximately every 0.1 simulation seconds. Export the map alongside CSV results so an edited environment can be reproduced.

## Tests and benchmarks

Node.js 20+ is needed only for development checks; no npm packages are required.

```powershell
node --test tests/core.test.cjs tests/ui.test.cjs
node benchmark.cjs
node benchmark.cjs > my-results.csv
```

The release includes **20 passing automated tests**. Checks include shortest paths, inaccessible endpoints, corner constraints, raycasting, drive integration, narrow-passage footprint rejection, control completion, replanning, deterministic benchmarks and UI-adapter interactions.

The pursuit test covers both planners on four maps at 0.4, 1.6 and 3.0 m/s. These are finite scenario tests, not a guarantee for every custom map or configuration. See [validation](docs/VALIDATION.md) for scope and limitations. `sample-results.csv` contains actual benchmark output from this release.

## Structure

```text
index.html           Application and controls
style.css            Responsive workbench styling
core.js              Planning, geometry, sensing, control and simulation
app.js               Canvas rendering, interactions, comparisons and exports
benchmark.cjs        Repeatable planner/controller benchmark
tests/               Engine and DOM-adapter checks
docs/                Design, validation and portfolio notes
```

## Assumptions and limits

Pose is ground truth and the occupancy map is fully known. LiDAR is visualised independently; it does not perform SLAM or discover obstacles for planning. Runtime insertions update the known map immediately. There is no moving-obstacle prediction, motor dynamics, acceleration limiting, friction, slip, localisation noise, ROS interface, or real-robot validation. Robot geometry is circular and the grid resolution is fixed.

Actual browser rendering and file-dialog behaviour still need browser QA; the automated UI tests use a DOM test double with no-op canvas methods. Long sessions retain growing trajectory and telemetry arrays.

## Publish with GitHub Pages

The repository includes `.nojekyll` and relative asset paths. In repository **Settings → Pages**, select **Deploy from a branch**, choose **main** and **/ (root)**, and save. GitHub will show the live URL after deployment succeeds. Future pushes to that source branch update the site. Publishing configuration is separate from pushing source code.

## Maintainer

**Tanishk Singhal** — Robotics & Automation

[GitHub profile](https://github.com/Tanishk756) · [Report an issue](https://github.com/Tanishk756/robonav-lab/issues)

MIT licensed. Copyright © 2026 Tanishk Singhal.
