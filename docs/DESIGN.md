# RoboNav Lab v1.3 architecture

Maintainer: Tanishk Singhal. Runtime remains dependency-free and offline-capable.

- navigation.js: log-odds OccupancyMapper, deterministic grid carts, world composition and dynamic-window command selection.
- core.js: five global planners, eight environments, exact straight-edge geometry, hard/soft costmaps, three controllers, simulation state, metrics and pure comparison functions. CommonJS loads navigation.js; browser script order loads it first.
- app.js: DOM controls, canvas views, telemetry, version-three JSON settings, CSV/PNG exports and experiment-worker lifecycle.
- navigation-worker.js: imports the same engine and executes planner/controller experiments outside rendering. Unavailable workers use the same functions synchronously. Configuration/map changes invalidate stale results.
- index.html and style.css: five actual planner options, eight environments, three controller options and responsive navigation controls. Tests check catalog parity and native-style select behavior.

World occupancy, observed occupancy and derived hard/soft costmaps are separate. Sensor planning and DWA receive only the observed navigation map. Ideal simulated LiDAR is the observation boundary. A final simulator-world motion guard prevents physical penetration without contributing hidden occupancy to planning. The display can independently show physical world or observed/unknown cells.

Mapping updates at 5 Hz; free rays and hit endpoints produce bounded log odds. Unknown policy is explicit. Replanning is debounced by 0.5 s. DWA samples 45 acceleration-limited command pairs, scores collision-free rollouts and stops if none are safe. Exact straight segments and conservative arc-sagitta chord envelopes validate circular motion. Global/local calculations stay synchronous on the small fixed grid; only long experiments use workers.

Grid carts are discrete, deterministic, one-cell obstacles on free horizontal tracks, advancing once per second. They reverse at track ends/new walls and yield to the robot envelope. This is a cooperative benchmark model, not independently moving crowd simulation. Moving cart occupancy is never baked into the base scene.

The original transport status protocol is retained; a separate navigationState and reason provide replanning/recovery/failure detail. Waiting/replanning recovery is bounded and all missions have a 600 s simulation limit. Exports save reusable initial settings, not live mapper/pose state. Metrics distinguish body clearance, hard safety margin, geometric length and weighted graph cost.

Defaults preserve known static scenes and the waypoint controller. Legacy imports default new navigation fields accordingly. GitHub Actions gates Pages deployment on syntax, tests and both benchmark suites. Python/websockets are optional development-only browser-check dependencies.
