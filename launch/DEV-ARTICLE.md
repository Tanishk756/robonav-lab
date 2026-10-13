# I built an offline robotics workbench for comparing planning and control

A route on a grid is only one layer of navigation. A robot has a footprint, a controller turns a route into motion, and an observed map can differ from the physical world.

RoboNav Lab makes those layers visible in a small browser application. You can try it without an account at https://tanishk756.github.io/robonav-lab/ . The MIT-licensed source is at https://github.com/Tanishk756/robonav-lab .

## A useful first experiment

Start the guided demo. A robot begins a warehouse mission, an obstacle appears and the route is recomputed. Compared planner paths can be overlaid on the same scene. Scrub the recorded mission to inspect the observations and route changes instead of relying only on the final table.

Then try the doorway challenge. The initial robot is too large for the grid opening. Reducing body radius plus margin changes the configuration-space occupancy and permits a route. This is an intentionally visible failure case, not a hidden exception.

## Keeping measurements meaningful

A* and Dijkstra minimize weighted graph cost. Breadth-first search minimizes graph steps. Weighted A* and greedy search are approximate. The interface reports geometric length and weighted cost separately.

Controllers also answer a different question from planners. Waypoint tracking, guarded pursuit and acceleration-window DWA execute independently from the same initial scene. Their recorded trajectories play on a shared simulation-time timeline. Time, error and minimum body clearance are separate measurements; I avoided combining them into a single unexplained score.

## Architecture

The engine is shared between the browser and Node tests. Long comparisons run in a worker. Physical occupancy, LiDAR-derived log-odds occupancy and derived costmaps remain separate. Sensor navigation receives observed cells rather than hidden physical occupancy. A final simulator-world guard prevents a missed observation from allowing physical penetration.

Straight route edges use exact segment-to-rectangle clearance. Curved constant-command motion uses a conservative chord envelope expanded by the arc sagitta. The grid remains fixed at one metre per cell, and the circular footprint is a simplification.

## Reproduction and limitations

Shared URLs bit-pack the occupancy and validate endpoints and settings. Result cards and HTML reports carry the application version. Challenge results are local simulated outcomes, not server-verified competitive scores.

Sensing is ideal and pose is known. Moving carts advance on a grid and yield to the robot. There is no localization estimator, general pedestrian predictor or hardware integration. Replay is bounded recorded-frame playback, not a physical experiment or arbitrary robot program execution.

The repository includes tests, browser checks, validation evidence and a contribution guide. Helpful contributions include clearer educational examples, accessibility improvements, multi-seed evaluation and larger-map performance work.

If you try it, a reproducible experiment link with an explanation of surprising behavior is more useful than a claim that one algorithm is always best.

Disclosure: this draft was prepared with AI assistance. The maintainer should review the technical claims and add their own development experience before publication.
