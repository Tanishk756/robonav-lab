# LinkedIn draft

Attach replan.mp4. Review the upload preview and captions before posting.

I built RoboNav Lab, a free, open-source robotics workbench you can run in your browser.

Change the environment, watch a robot replan around an obstacle, then compare what different planners and controllers do.

The new release adds:
- A guided mission that shows obstacle-triggered replanning.
- Four challenges: fit through a doorway, choose a shortest grid route, beat a simulation-time target, or keep 30 cm clearance.
- Planner overlays, synchronized controller playback and mission replay.
- Shareable experiments and result cards you can reproduce without an account.

It uses five global planners, LiDAR occupancy mapping and three controllers, including Dynamic Window Approach. Pose is known and sensing is ideal; the moving grid carts yield to the robot. I have kept those assumptions visible because this is an educational simulator, not a hardware safety claim.

Try a challenge: https://tanishk756.github.io/robonav-lab/
Source and contribution guide: https://github.com/Tanishk756/robonav-lab

Which tradeoff would you investigate first: travel time, route length or clearance?

#Robotics #OpenSource #PathPlanning

## Follow-up technical post

Attach costs.mp4. Explain that increasing proximity penalties can change the selected route. Report geometric length separately from weighted cost; do not compare weighted values across different weights as if they used the same objective.

## Failure-case post

Attach fit.mp4. Explain that footprint plus margin changes which grid routes are reachable. State the fixed one-metre grid assumption and its discretization limits.
