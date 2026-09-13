# RoboNav Lab — Tanishk Singhal

## Project summary

A browser-based mobile robotics workbench that connects grid planning to footprint-aware navigation and differential-drive control. It supports repeatable planner/controller experiments, live sensor visualisation and data exports.

## Resume description

Developed RoboNav Lab, an offline mobile robot simulator integrating A*/Dijkstra, configurable footprint inflation, differential-drive kinematics and guarded pure pursuit; evaluated navigation with repeatable scenarios, tracking RMSE and CSV telemetry.

## Demonstration

1. Compare A* and Dijkstra and explain the shared optimal graph cost.
2. Increase the robot radius and explain configuration-space occupancy.
3. Compare waypoint control and guarded pure pursuit using travel time and RMSE.
4. Run a mission, insert an obstacle, and demonstrate replanning.
5. Show an unsolvable map and explain the stop condition.
6. Export the map/settings and results to reproduce the experiment.

## Technical discussion

Be ready to derive the octile heuristic, differential-drive velocities and pursuit curvature. Explain why LiDAR is independent of planning in this known-map simulation, why the circle/radius model is a simplification, and why simulation results are not hardware validation. Describe your own development contributions accurately and understand the code you present.

## Future work

Wheel-odometry noise with estimation; dynamic obstacle prediction; configurable map resolution; acceleration limits; ROS2 integration and hardware experiments. These are roadmap items, not implemented capabilities.
