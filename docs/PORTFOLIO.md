# Portfolio presentation kit

## Title

RoboNav Lab — Autonomous Mobile Robot Navigation Simulator

## Short description

An offline browser workbench for experimenting with mobile robot navigation. It combines optimal grid planning, differential-drive motion, waypoint control, ideal LiDAR simulation, runtime obstacle insertion, and measured planner comparisons.

## Resume bullet

Developed an interactive mobile robot simulator integrating A*/Dijkstra planning, differential-drive kinematics, 360° simulated LiDAR, and obstacle-triggered replanning, with CSV telemetry and repeatable navigation benchmarks.

Use this wording only when you understand and can defend the implementation. If describing your contribution precisely, say you built and validated it with AI assistance and identify the parts you modified yourself. Do not claim deployment on hardware or an autonomous mapping pipeline.

## README/project-post introduction

RoboNav Lab makes navigation algorithms visible: I can change an environment, compare optimal routes, observe wheel-level motion commands, and insert an obstacle while a mission is running. The project separates the planner and simulator from the browser interface, so the same robotics engine can be tested without the UI.

Its four repeatable scenarios cover open space, warehouse aisles, alternating corridors, and seeded clutter. Exported maps and CSVs make experiments reproducible. This is an idealised educational simulation with known position and map, not a real-robot autonomy system.

## What to show in an interview

1. **Algorithm choice:** explain why A* and Dijkstra return equal optimal costs, and why A* may expand fewer cells.
2. **Motion model:** derive linear/angular velocity from left and right wheel speeds. Explain the coordinate convention.
3. **Control:** explain angular proportional control, speed reduction near waypoints, and why sharp turns are made while stopped.
4. **Sensing:** demonstrate ray-wall intersections and distinguish ground-truth map access from actual perception.
5. **Evaluation:** compare expanded cells, path length, actual driven distance and tracking RMSE. Explain the timing caveats.
6. **Failure:** draw a complete barrier, show the no-route state, erase an opening and recover.

## Questions you should be able to answer

- Why is the octile heuristic admissible for this movement graph?
- Why must a diagonal move check the two adjacent orthogonal cells?
- What does the min-heap change about planner performance?
- Why can two optimal planners yield different physical travel times?
- Is the displayed LiDAR used for planning? (No: the map is known.)
- Is tracking RMSE the same as localisation error? (No: pose is ground truth.)
- What would change for a larger robot? (Footprint-aware collision planning / obstacle inflation.)
- What would be required to move this onto a physical robot? (Sensors, calibration, state estimation, timing, interfaces, dynamics, safety and hardware tests.)

## Useful next contribution

Pick one extension and demonstrate its effect with before/after evidence: add configurable robot footprint inflation, implement a line-of-sight path smoother, or add simulated wheel-odometry noise with a documented estimator. These are future extensions, not included features.
