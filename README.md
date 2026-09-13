# RoboNav Lab

A free, offline mobile robotics workbench: edit a warehouse map, compare A* and Dijkstra, and watch a differential-drive robot follow its route while displaying simulated LiDAR and motion telemetry.

## Run on Windows — no installation

1. Extract **the entire ZIP** into a folder such as `Documents\RoboNav-Lab`.
2. Open `index.html` in Microsoft Edge, Chrome, or Firefox. Keep `core.js`, `app.js`, and `style.css` alongside it.
3. Click **Run mission**. The default warehouse mission takes approximately 38 simulation seconds at 1.6 m/s.

No Python, Node.js, API key, internet connection, GPU, build step, or account is required to use the app. Files are loaded with classic scripts so they can run from a local folder. Do not open the HTML while it is still inside the ZIP. Changes are held in memory: use **Export map** before closing the page if you want to keep them.

If your organisation's browser policy blocks local scripts, use a locally permitted static web server. With Python already installed: `python -m http.server 8000` from this folder, then open `http://localhost:8000`. The default experience needs no server.

## What's implemented

- 32 × 24 metre grid editor, draggable wall painting/erasing, and movable mission endpoints.
- Four repeatable maps: open floor, warehouse, alternating corridors, and seeded clutter (seed 731).
- Optimal 8-connected A* with octile heuristic and Dijkstra with a binary min-heap. Diagonal corner cutting is forbidden.
- Exact differential-drive integration and heading-controlled waypoint following.
- Circular collision checks, radius 0.24 m, wheel track 0.42 m.
- 72 ideal LiDAR rays across 360°, using exact grid boundary intersections, capped at 8 m.
- Live pose, linear/angular velocity, wheel velocities, path error, distance, elapsed simulation time, and replan count.
- Obstacle-triggered replanning after map edits or **Block route ahead**.
- Comparison table with median planning time over 25 measured searches per algorithm.
- JSON map export/import, planner comparison CSV, motion telemetry CSV, and PNG map export.
- Mouse/touch controls and keyboard map editing. Responsive layout and accessible control labels.

## A 90-second portfolio demonstration

1. Open the default warehouse. Explain the walls, start S, goal G, and dashed planned route.
2. Click **Compare planners**. Both algorithms should report the same optimal grid path length. Compare expanded cells, which are more stable than tiny wall-clock timing differences.
3. Click **Run mission**. Point out actual wheel velocities, turns, trajectory, and LiDAR.
4. While the robot travels, click **Block route ahead**. The obstacle appears, the path changes, and the replan counter increases.
5. Pause, export telemetry, and save a PNG. Export the edited map for reproducibility.
6. Change to **Alternating corridors**, run a second comparison, and explain why map structure affects search effort.

Record your screen with a recorder already available on your computer. Include the recording, source code, and your own measured results in your portfolio.

## Controls

| Control | Effect |
|---|---|
| Run / Pause / Resume | Execute or pause the mission |
| Reset (↺) | Return robot to start; retain map and selected planner |
| Plan route | Stop motion and plan from the current robot cell |
| Wall / Erase | Click or drag to change occupancy |
| Start / Goal | Move endpoints while stopped; start a fresh mission |
| Block route ahead | Insert one obstacle ahead and recalculate the route |
| Space / R | Run-pause / reset, outside form controls |
| 1 / 2 / 3 / 4 | Wall / erase / start / goal tools |
| Arrow keys + Enter | Select and edit a cell when the map has keyboard focus |

The boundary wall cannot be edited. Start, goal, and cells touching the robot are protected from wall painting. Drawing temporarily suspends physics until the pointer is released. If a map is unsolvable, the robot stops and reports no route. Erase an obstacle and plan/run again.

## How the robotics works

**Coordinates:** one cell is one metre. X increases to the right; Y increases down the screen. Heading zero points right; positive heading turns clockwise on screen. This differs from the usual ROS world frame and is documented explicitly to avoid silent sign mistakes.

**Planning:** straight neighbours cost 1 m, diagonal neighbours cost √2 m. A* uses `h = max(dx,dy) + (√2−1)min(dx,dy)`. Dijkstra uses zero heuristic. Search cost is optimal on this discrete graph, not the shortest possible continuous-space trajectory. Ties may yield different but equally optimal paths.

**Kinematics:** for left/right wheel linear velocities `vL`, `vR` and track width `b`, `v = (vR + vL)/2` and `ω = (vR − vL)/b`. The simulator integrates the exact circular arc for constant commands over a step, with a straight-line limit as ω approaches zero. The physics timestep is 1/60 s; slow frames can reduce wall-clock playback speed, without enlarging the physics step.

**Controller:** each grid-cell centre is a waypoint. Wrapped heading error drives bounded proportional angular control. Forward speed reduces near a waypoint and becomes zero for large heading errors. This intentionally conservative controller turns before driving through tight corners. It is not MPC or pure pursuit. A collision guard tests the next circular footprint before committing motion; unexpected obstruction stops the robot.

**LiDAR:** grid DDA finds ray/wall intersections. All obstacles are opaque and measurements are noiseless. The polar view is robot-relative, with forward pointing up. Minimum range means minimum sensor-to-wall distance; it does not subtract robot radius.

**Metrics:** planned route is the latest grid path cost; driven distance comes from integrated motion. Tracking RMSE is the square root of the mean squared shortest distance from each simulated pose to the path polyline. After replanning, subsequent samples use the new path while earlier error samples remain in the mission total. It is a tracking metric, not localisation accuracy. Telemetry is sampled approximately every 0.1 simulation seconds.

**Timing:** comparisons use one warm-up and 25 measured searches per planner, reporting the median. Browser timers, CPU scheduling, JIT warm-up and quantisation affect tiny timings. Never claim a universal speedup from one run. Export the map with the CSV; the scenario name alone does not capture your edits.

## Honest limitations

This is an educational simulator and portfolio prototype, not a production autonomy stack or real-robot validation.

- Robot pose is ground truth; there is no odometry noise, state estimator, SLAM, ROS bridge, or sim-to-real work.
- Planning sees the complete occupancy map. LiDAR does not discover obstacles or feed a mapping pipeline. An editor insertion updates ground truth immediately and requests replanning.
- Obstacles can be inserted at runtime, but do not move autonomously and there is no prediction of moving people or vehicles.
- No motor acceleration limits, friction, wheel slip, battery dynamics, or actuator dynamics.
- The collision model is a circle; the robot graphic is a readability-oriented symbol. Planning assumes this fixed sub-cell robot size and blocks diagonal corner cutting, rather than providing a general configurable footprint-inflation planner.
- Metrics can change across equally optimal routes because of planner tie-breaking. Very long runs retain a growing telemetry/trail history.
- Browser rendering was not visually verified during this build because the provided browser could not access local files under its access policy. Automated engine and DOM-adapter checks are included; these do not replace an actual browser check on your machine.

## Code and reproducibility

| File | Responsibility |
|---|---|
| `index.html` | Application structure and quick guide |
| `style.css` | Responsive workbench styling |
| `core.js` | Planners, maps, raycasting, kinematics, collision and simulation |
| `app.js` | Canvas rendering, controls, comparison and exports |
| `tests/core.test.cjs` | Algorithm and full-mission correctness checks |
| `tests/ui.test.cjs` | DOM-adapter interaction checks with a minimal test double |
| `benchmark.cjs` | Repeatable eight-case planner + controller benchmark |
| `sample-results.csv` | Actual benchmark output from this build environment |
| `docs/VALIDATION.md` | Test evidence and validation scope |
| `docs/PORTFOLIO.md` | Resume wording and interview discussion prompts |

Optional development checks require Node.js with its built-in test runner; they do not require npm packages:

```powershell
node --test tests/core.test.cjs tests/ui.test.cjs
node benchmark.cjs
node benchmark.cjs > my-results.csv
```

Use Node 20+ for development. The supplied results were generated with Node 24.19.0 on Linux. Time measurements are from that environment, not your Windows machine.

You can host the four application files on any static host for a shareable demo. No backend is needed. Hosting is not included in this download.

## Portfolio claim

> Built an offline mobile robot simulator with A*/Dijkstra planning, differential-drive kinematics, ideal LiDAR visualisation, obstacle-triggered replanning, and reproducible navigation benchmarks.

This starter was generated with AI assistance. Before claiming the work in interviews, understand the code, reproduce the tests, and add an extension you can explain. Credit assistance where your institution or employer requires it.

MIT licence. See `LICENSE`.
