# RoboNav Lab v1.6 architecture

Maintainer: Tanishk Singhal. Runtime remains dependency-free and offline-capable.

- navigation.js: log-odds OccupancyMapper, deterministic grid carts, world composition and dynamic-window command selection.
- core.js: eleven planner choices, eight environments, exact straight-edge geometry, hard/soft costmaps, three controllers, simulation state, metrics and pure comparison functions. CommonJS loads navigation.js; browser script order loads it first.
- app.js: DOM controls, canvas views, telemetry, version-three JSON settings, CSV/PNG exports and experiment-worker lifecycle.
- navigation-worker.js: imports the same engine and executes planner/controller experiments outside rendering. Unavailable workers use the same functions synchronously. Configuration/map changes invalidate stale results.
- index.html and style.css: eleven actual planner options, eight environments, three controller options and responsive navigation controls. Tests check catalog parity and native-style select behavior.

World occupancy, observed occupancy and derived hard/soft costmaps are separate. Sensor planning and DWA receive only the observed navigation map. Ideal simulated LiDAR is the observation boundary. A final simulator-world motion guard prevents physical penetration without contributing hidden occupancy to planning. The display can independently show physical world or observed/unknown cells.

Mapping updates at 5 Hz; free rays and hit endpoints produce bounded log odds. Unknown policy is explicit. Replanning is debounced by 0.5 s. DWA samples 45 acceleration-limited command pairs, scores collision-free rollouts and stops if none are safe. Exact straight segments and conservative arc-sagitta chord envelopes validate circular motion. Global/local calculations stay synchronous on the small fixed grid; only long experiments use workers.

Grid carts are discrete, deterministic, one-cell obstacles on free horizontal tracks, advancing once per second. They reverse at track ends/new walls and yield to the robot envelope. This is a cooperative benchmark model, not independently moving crowd simulation. Moving cart occupancy is never baked into the base scene.

The original transport status protocol is retained; a separate navigationState and reason provide replanning/recovery/failure detail. Waiting/replanning recovery is bounded and all missions have a 600 s simulation limit. Exports save reusable initial settings, not live mapper/pose state. Metrics distinguish body clearance, hard safety margin, geometric length and weighted graph cost.

Defaults preserve known static scenes and the waypoint controller. Legacy imports default new navigation fields accordingly. GitHub Actions gates Pages deployment on syntax, tests and both benchmark suites. Python/websockets are optional development-only browser-check dependencies.

sharing.js owns application version, strict experiment normalization, share-format version 1 and gallery metadata. It bit-packs the fixed occupancy, then encodes bounded UTF-8 JSON as base64url. Imported strings are displayed through textContent; no shared code executes. app.js uses the same normalizer for file imports, gallery loads and shared URLs. Settings schema version 3 remains independent of the application/share-format versions.

The public workflow separates PR validation, main-branch Pages deployment and live verification. It checks native browser selectors, worker results, sharing and an extracted offline ZIP. scripts/package_release.py packages tracked source deterministically and stages only seven runtime assets plus .nojekyll for hosting. Optional browser dependencies never enter runtime delivery. See EXTENDING.md and CONTRIBUTING.md for extension contracts and contribution workflow.

showcase.js owns separate challenge categories, fixed-scene validation, a bounded recorder/view adapter, local-only opt-in counters and canvas result layouts. app.js records live poses/scenes without changing the core physics. Replay renders a snapshot adapter; it does not step the live engine. Snapshot scenes are deduplicated, with at most 6000 frames and corresponding bounded scene/event storage.

Comparison results now include actual planner paths and controller telemetry trajectories. Small controller canvases play independent runs on a shared recorded-time axis over the base static map. Large main replay also captures observed and physical occupancy changes. Report exports reset the visual replay selection before rendering, keeping current live metrics and image consistent.

The guided demo uses the same public run/edit/compare controls with timed steps. Challenge scoring requires completion and the unchanged fixed scene, separate category constraints and a valid fresh-run context. Scores are local and not trusted remote credentials. Usage counters are opt-in, local-only, bounded and clear on opt out.
