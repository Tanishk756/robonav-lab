# Extending RoboNav Lab

## Global planner

Add a stable ID and label to core.js PLANNERS. Implement its search priority/behavior in plan while retaining safe-neighbor and edge validation; document its optimization objective. Add the matching index.html option. Comparisons, workers, benchmarks and import validation enumerate the shared catalog automatically. The actual-markup test rejects missing options. Test reachability, unsafe corners, cost/length reporting, determinism and the claimed optimality property. Current plan outputs are `{path, cost, length, expanded, ms}`; path coordinates are grid cells.

## Controller

Add a CONTROLLERS entry, implement command selection in Simulation.step and add the matching HTML option. Normal commands are linear m/s and angular rad/s; wheel track is 0.42 m. Preserve the final physical-world guard. Sensor-mode commands may read navigationMap, not hidden world occupancy. Comparisons and worker jobs enumerate CONTROLLERS. Test bounded motion, stalls/failure reasons, route completion and acceleration claims. Do not describe a sampled algorithm as a formal safety guarantee.

## Environment

Add an ENVIRONMENTS entry and deterministic geometry in makeMap, plus its HTML option. Keep dimensions 32 x 24 and protected free start/goal cells. Test default reachability and clearance behavior; define a seed for random generation. The benchmark discovers it automatically.

## Gallery and share formats

Gallery metadata lives in sharing.js EXAMPLES and has a matching HTML selector. Each example uses a map ID and validated settings. Include an expected result, including intentional failures. Shared payload version 1 bit-packs the fixed 768-cell occupancy into 96 bytes, includes endpoints/settings and uses base64url UTF-8 JSON. Tokens are bounded to 6000 characters; the UI caps full links at 4000 and falls back to JSON export. Keep decoding strict and backward compatible, or increment its version. Settings JSON currently uses version 3, separate from application and share-format versions.

See tests/sharing.test.cjs for round trips and malformed inputs. Use textContent for imported strings. Do not add dynamic code execution or remote plugin loading to experiment imports.
