# RoboNav Lab — Tanishk Singhal

## Project summary

A browser-based mobile robotics workbench that connects grid planning to footprint-aware navigation and differential-drive control. It supports repeatable planner/controller experiments, live sensor visualisation, compact share links, six guided examples and versioned experiment reports.

## Resume description

Developed RoboNav Lab, an offline mobile robot simulator integrating five graph planners, configurable hard/soft inflation, LiDAR occupancy mapping, differential-drive kinematics and three controllers including acceleration-window DWA; evaluated navigation with repeatable scenarios, tracking RMSE and CSV telemetry.

## Demonstration

1. Compare all five planners on eight environments. Explain why A* and Dijkstra agree on optimal weighted graph cost, while approximate planners and BFS have different objectives.
2. Increase the robot radius and explain configuration-space occupancy.
3. Compare waypoints, guarded pursuit and DWA using time, RMSE, minimum clearance and acceleration.
4. Switch to sensor mode, show unknown space being observed, enable grid carts and demonstrate replanning.
5. Show an unsolvable map and explain the stop condition.
6. Share a custom-map experiment URL, reload it in a fresh page, and export the versioned report to reproduce the experiment.

## Technical discussion

Be ready to derive the octile heuristic, differential-drive velocities and pursuit curvature. Explain how LiDAR updates observed occupancy while true pose remains known, why the circle/radius model is a simplification, and why simulation results are not hardware validation. Describe your own development contributions accurately and understand the code you present.

## Future work

Wheel-odometry noise with estimation; independently moving obstacle prediction beyond yielding grid carts; configurable map resolution; acceleration limits; ROS2 integration and hardware experiments. These are roadmap items, not implemented capabilities.

The v1.5 demo can be presented using a guided mission, separate navigation challenges, returned-route overlays, synchronized controller playback and recorded event replay. Launch videos explain successful replanning, route-cost tradeoffs and intentional doorway failure. Result cards are simulated outcomes rather than verified competition scores.
