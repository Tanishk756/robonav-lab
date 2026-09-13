# Design and implementation record

User-approved scope: a Windows-friendly offline robotics simulator with editable maps, A*/Dijkstra, differential-drive motion, LiDAR visualisation, runtime replanning, metrics, exports, tests and portfolio documentation.

Architecture: classic JavaScript scripts and HTML Canvas. `core.js` exports a pure robotics API plus a Simulation class to both CommonJS and the browser. `app.js` owns UI state and consumes the engine. No dependencies or network requests in the application.

Implementation sequence completed:

1. Define correctness checks for optimal planning, corner constraints, raycasting, drive integration and complete missions.
2. Implement the heap-based planners, four maps, LiDAR, collision guard and simulation; run those checks.
3. Build the editable canvas, live telemetry, controls, repeated comparisons and exports.
4. Check interaction wiring using a DOM test double, and test the minimum/maximum speed settings.
5. Produce actual benchmark CSV, document validation limits, and package the offline application.

Design boundary: fully known occupancy, ground-truth pose and ideal motion/sensing. The interface explicitly distinguishes this from SLAM, physical deployment, and production autonomy.
